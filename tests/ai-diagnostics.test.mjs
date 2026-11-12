import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatGoogle } from '@langchain/google/node';
import { structuredCall } from '../backend/src/ai/structured.mjs';
import { assessmentSchema } from '../backend/src/ai/schemas/assessment.mjs';

const privateMarker='PRIVATE_DO_NOT_LOG_api-key_receipt_provider-body';
const config={aiAuthorized:true,aiKey:privateMarker,aiModel:'gemini-3.5-flash-lite'};
const valid=()=>({policy_version:1,items:[{item_id:'item-1',decision:'rejected',confidence:0.99,category:'personal',reason:'This purchase is outside the defined event purpose.',rule_ids:['EVENT-UNRELATED'],reference_ids:[],policy_version:1}]});
const call=options=>structuredCall({config,role:'decider',schema:assessmentSchema,prompt:privateMarker,content:[{type:'text',text:privateMarker}],...options});
async function wireCase({status=200,finish='STOP',output=valid(),noFinish=false},run) {
  const oldFetch=globalThis.fetch,oldWarn=console.warn,logs=[];let requests=0;
  console.warn=(...parts)=>logs.push(parts.join(' '));
  globalThis.fetch=async request=>{
    requests++;
    const body=JSON.parse(await request.text());
    assert.equal(body.generationConfig.responseMimeType,'application/json');
    assert.equal(body.generationConfig.responseJsonSchema.type,'object');
    return new Response(JSON.stringify(status===200?{candidates:[{content:{role:'model',parts:[{text:typeof output==='string'?output:JSON.stringify(output)}]},...(!noFinish?{finishReason:finish}:{})}],usageMetadata:{promptTokenCount:5,candidatesTokenCount:20,totalTokenCount:25}}:{error:{code:status,message:privateMarker,status:'PRIVATE_PROVIDER_STATUS'}}),{status,headers:{'content-type':'application/json'}});
  };
  try {await run({logs,modelFactory:options=>new ChatGoogle({...options,maxRetries:0})});assert.equal(requests,1);assert(!logs.join('\n').includes(privateMarker));}
  finally {globalThis.fetch=oldFetch;console.warn=oldWarn;}
}
test('real installed LangChain SDK accepts Gemini STOP with its actual metadata and wire schema',async()=>{
  await wireCase({},async({modelFactory,logs})=>{assert.deepEqual(await call({modelFactory}),valid());assert.deepEqual(logs,[]);});
});
test('real LangChain SDK incomplete/missing finish cannot authorize schema-valid decisions',async()=>{
  for(const settings of [{finish:'MAX_TOKENS'},{noFinish:true}])await wireCase(settings,async({modelFactory,logs})=>{
    await assert.rejects(()=>call({modelFactory}),error=>error.code==='assessment_failed'&&/completion status|incomplete/.test(error.message));
    assert.match(logs.join('\n'),/missing_status|incomplete/);
  });
});
test('real LangChain SDK invalid JSON and invalid local schema remain distinct technical failures',async()=>{
  for(const [output,reason] of [['not JSON '+privateMarker,'invalid_json'],[{...valid(),items:[{...valid().items[0],confidence:2}]},'invalid_schema']])await wireCase({output},async({modelFactory,logs})=>{
    await assert.rejects(()=>call({modelFactory}),error=>error.code==='assessment_failed'&&!error.message.includes(privateMarker));
    assert.match(logs.join('\n'),new RegExp(reason));
  });
});
test('provider auth/model/quota/request/outage statuses are actionable without leaking provider bodies',async()=>{
  for(const [status,reason,words] of [[401,'access',/denied/],[403,'access',/denied/],[404,'model',/configured model/],[429,'rate_limit',/rate or quota/],[400,'request',/rejected by Gemini/],[503,'unavailable',/temporarily unavailable/]])await wireCase({status},async({modelFactory,logs})=>{
    await assert.rejects(()=>call({modelFactory}),error=>error.code==='assessment_failed'&&words.test(error.message)&&!error.message.includes(privateMarker));
    assert.match(logs.join('\n'),new RegExp(reason));assert.match(logs.join('\n'),new RegExp(`"http_status":${status}`));
  });
});
test('deadline aborts the in-flight invocation and reports a fixed safe diagnosis',async()=>{
  const oldWarn=console.warn,logs=[];console.warn=(...parts)=>logs.push(parts.join(' '));let aborted=false;
  try {
    await assert.rejects(()=>call({timeoutMs:10,modelFactory:()=>({withStructuredOutput:()=>({invoke:(_messages,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new Error(privateMarker));},{once:true}))})})}),error=>error.code==='assessment_failed'&&/timed out/.test(error.message));
    assert(aborted);assert.match(logs.join('\n'),/deadline/);assert(!logs.join('\n').includes(privateMarker));
  } finally {console.warn=oldWarn;}
});
test('legacy STOP metadata is supported but conflicting statuses and secret finish strings fail closed',async()=>{
  const oldWarn=console.warn,logs=[];console.warn=(...parts)=>logs.push(parts.join(' '));
  const raw=metadata=>({withStructuredOutput:()=>({invoke:async()=>({parsed:valid(),raw:{response_metadata:metadata}})})});
  try {
    assert.deepEqual(await call({modelFactory:()=>raw({finishReason:'STOP'})}),valid());
    assert.deepEqual(await call({modelFactory:()=>raw({finish_reason:'STOP'})}),valid());
    for(const metadata of [{finishReason:'STOP',finish_reason:'MAX_TOKENS'},{finish_reason:privateMarker}])await assert.rejects(()=>call({modelFactory:()=>raw(metadata)}),error=>error.code==='assessment_failed');
    assert(!logs.join('\n').includes(privateMarker));
  } finally {console.warn=oldWarn;}
});
