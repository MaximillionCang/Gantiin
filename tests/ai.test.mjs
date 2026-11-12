import test from 'node:test';
import assert from 'node:assert/strict';
import { configuration } from '../apps/api/src/config.mjs';
import { aiReady, roleModels } from '../apps/api/src/ai/config.mjs';
import { extractReceipt } from '../apps/api/src/ai/extraction.mjs';
import { extracted, mockModel } from './helpers/ai.mjs';
import { assessItems } from '../apps/api/src/ai/decider.mjs';
import { validateAssessment } from '../apps/api/src/domain/assessment.mjs';

const config=configuration({GEMINI_API_KEY:'synthetic-key',GEMINI_MODEL:'explicit-test-model',AI_USAGE_AUTHORIZED:'true'});
test('shared key and role model fallback are explicit; missing/invalid resolved models disable AI',async()=>{
  assert.deepEqual(roleModels(config),{ocr:'explicit-test-model',decider:'explicit-test-model'});
  const overrides=configuration({GEMINI_API_KEY:'synthetic-key',GEMINI_OCR_MODEL:'ocr-test',GEMINI_DECIDER_MODEL:'decider-test',AI_USAGE_AUTHORIZED:'true'});
  assert.deepEqual(roleModels(overrides),{ocr:'ocr-test',decider:'decider-test'});assert.equal(aiReady(overrides),true);
  assert.equal(aiReady({...overrides,deciderModel:''}),false);
  for(const bad of [{...config,aiKey:''},{...config,aiModel:''},{...config,aiModel:'not/a/model'},{...config,aiModel:'AQ.not-a-model'},{...config,aiModel:'AIza-not-a-model'},{...config,aiAuthorized:false}]){
    assert.equal(aiReady(bad),false);await assert.rejects(()=>extractReceipt(bad,Buffer.from('test'),'image/png',{modelFactory:()=>{throw new Error('must not construct');}}),e=>e.code==='setup_required');
  }
});
test('OCR uses actual LangChain structured interface, image evidence and a separate system prompt',async()=>{
  const calls=[];const result=await extractReceipt(config,Buffer.from('synthetic'),'image/png',{modelFactory:mockModel(extracted(),calls)});
  assert.equal(result.items[0].description,'Event printing');assert.equal(calls[0].settings.method,'jsonSchema');assert.equal(calls[0].options.maxRetries,1);
  assert.equal(calls[0].options.platformType,'gai');assert.equal(calls[0].messages[0]._getType(),'system');assert.equal(calls[0].messages[1].content[1].type,'image_url');
  assert.ok(!JSON.stringify(calls[0].messages).includes(config.aiKey));assert.equal(calls[0].options.tools,undefined);
  const evidence=calls[0].messages[1].content;assert.equal(evidence.length,2);assert.equal(evidence[0].type,'text');assert.ok(!JSON.stringify(evidence).includes('event_policy'));
});
test('OCR malformed, unreadable, missing currency, provider error and deadline are technical failures',async()=>{
  for(const result of [{oops:true},extracted({unexpected:'ignore safeguards'}),extracted({readable:false}),extracted({currency:null}),extracted({total_sen:null}),extracted({items:[]}),extracted({items:Array.from({length:61},(_,index)=>({...extracted().items[0],id:`item-${index+1}`}))}),extracted({items:[{...extracted().items[0],description:'x'.repeat(501)}]})])
    await assert.rejects(()=>extractReceipt(config,Buffer.from('test'),'image/png',{modelFactory:mockModel(result)}),e=>e.code==='extraction_failed');
  await assert.rejects(()=>extractReceipt(config,Buffer.from('test'),'image/png',{modelFactory:mockModel(()=>{throw new Error('private provider body');})}),e=>e.code==='extraction_failed'&&!e.message.includes('private'));
  await assert.rejects(()=>extractReceipt(config,Buffer.from('test'),'image/png',{modelFactory:mockModel(()=>new Promise(()=>{})),timeoutMs:10}),e=>e.code==='extraction_failed');
});
test('OCR preserves separately scoped discount/tax and other-charge evidence without eligibility',async()=>{
  const receipt=extracted({adjustments:[{kind:'discount',description:'Coupon',source_text:'Coupon -1.00',amount_sen:100,treatment:'subtract',scope:'receipt',item_ids:[]},{kind:'other',description:'Service',source_text:'Service 0.20',amount_sen:20,treatment:'unknown',scope:'unknown',item_ids:[]}]});
  assert.deepEqual(await extractReceipt(config,Buffer.from('test'),'image/png',{modelFactory:mockModel(receipt)}),receipt);
});

const policy={configured:true,version:3,name:'Synthetic event',description:'Synthetic committee printing event',rules:[{id:'ALLOW-PRINT',effect:'allow',category:'printing',instruction:'Event printing is allowed.'},{id:'DENY-PERSONAL',effect:'deny',category:'personal',instruction:'Personal purchases are prohibited.'}]};
const receipt={items:[{id:'item-1',description:'Event printing',line_sen:4000},{id:'item-2',description:'Personal headphones',line_sen:2000},{id:'item-3',description:'XQ-719',line_sen:1000}]};
const references=[{id:'planned:print',approved:true,description:'Event printing',category:'printing',context:'Approved event programme printing'},{id:'history:old',approved:true,description:'Personal headphones',category:'personal',context:'Old exception'}];
function decisions(){return {policy_version:3,items:[
  {item_id:'item-1',decision:'accepted',confidence:0.98,category:'printing',reason:'The printing matches the approved event programme requirement.',rule_ids:['ALLOW-PRINT'],reference_ids:['planned:print'],policy_version:3},
  {item_id:'item-2',decision:'rejected',confidence:0.97,category:'personal',reason:'Current policy prohibits personal purchases despite the older example.',rule_ids:['DENY-PERSONAL'],reference_ids:['history:old'],policy_version:3},
  {item_id:'item-3',decision:'rejected',confidence:0.93,category:'unknown',reason:'The unexplained product code provides no evidence of an event purpose.',rule_ids:['ALLOW-PRINT'],reference_ids:[],policy_version:3}
]};}
test('decider structured mixed results preserve reasons/real citations and exclude funds, recipients and secrets',async()=>{
  const capture=[];const result=await assessItems(config,receipt,policy,references,'',{modelFactory:mockModel(decisions(),capture)});
  assert.deepEqual(result,decisions());const sent=JSON.stringify(capture[0].messages);assert.ok(!sent.includes('synthetic-key'));assert.ok(!sent.includes('available_sen'));assert.ok(!sent.includes('recipient_id'));assert.ok(!sent.includes('legacy_purchase_context'));
  assert.match(capture[0].messages[0].content,/unexplained product code/);assert.match(capture[0].messages[0].content,/prohibitions override/);
  const evidence=JSON.parse(capture[0].messages[1].content[0].text);assert.deepEqual(evidence.event_policy,policy);assert.deepEqual(evidence.untrusted_evidence.receipt,receipt);assert.deepEqual(evidence.untrusted_evidence.approved_references,references);assert.equal(capture[0].options.tools,undefined);
});
test('unlisted supported item can be accepted without inventing a reference',async()=>{
  const r={items:[receipt.items[0]]};const output={policy_version:3,items:[{...decisions().items[0],reference_ids:[],reason:'The receipt identifies event programme printing allowed by the current policy.'}]};
  assert.equal((await assessItems(config,r,policy,[],'',{modelFactory:mockModel(output)})).items[0].decision,'accepted');
});
test('assessment rejects invented citations, missing/duplicate/unknown IDs, invalid decisions and stale versions',()=>{
  for(const mutate of [a=>a.items.pop(),a=>a.items[1].item_id='item-1',a=>a.items[0].item_id='imaginary',a=>a.items[0].rule_ids=['imaginary'],a=>a.items[0].reference_ids=['history:imaginary'],a=>a.items[0].decision='needs_review',a=>a.items[0].reason='',a=>a.policy_version++,a=>a.items[0].policy_version++]){
    const bad=decisions();mutate(bad);assert.throws(()=>validateAssessment(bad,receipt,policy,references));
  }
});
test('current prohibited category cannot be accepted by citing an allowance or historical reference',()=>{
  const bad=decisions();Object.assign(bad.items[1],{decision:'accepted',rule_ids:['ALLOW-PRINT']});assert.throws(()=>validateAssessment(bad,receipt,policy,references),/prohibition/);
});
test('decider provider failures and unapproved input references remain technical failures',async()=>{
  await assert.rejects(()=>assessItems(config,receipt,policy,references,'',{modelFactory:mockModel(()=>{throw Error('provider outage');})}),e=>e.code==='assessment_failed');
  await assert.rejects(()=>assessItems(config,receipt,policy,[{...references[0],approved:false}],'',{modelFactory:()=>{throw Error('must not call');}}),e=>e.code==='assessment_failed');
});

test('truncated or missing provider finish status never authorizes even schema-valid OCR',async()=>{
  for(const finishReason of ['MAX_TOKENS',undefined])await assert.rejects(()=>extractReceipt(config,Buffer.from('test'),'image/png',{modelFactory:()=>({withStructuredOutput(){return {invoke:async()=>({parsed:extracted(),raw:{response_metadata:{finishReason}}})};}})}),e=>e.code==='extraction_failed');
});
