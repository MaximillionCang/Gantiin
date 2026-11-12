import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Store } from '../backend/src/db.mjs';
import { Service } from '../backend/src/service.mjs';
import { adapters } from '../backend/src/adapters/index.mjs';
import { configuration } from '../backend/src/config.mjs';
import { seed } from '../scripts/setup.mjs';
import { extractionSchema } from '../backend/src/ai/schemas/extraction.mjs';
import { assessmentSchema } from '../backend/src/ai/schemas/assessment.mjs';
import { extracted } from './helpers/ai.mjs';

function harness(t,{ocr=0.98,decider=0.98}={}) {
  const store=new Store();seed(store,{demo:true,password:'Synthetic-only-password42',funding:10000});t.after(()=>store.close());
  const config=configuration({BUDGET_SOURCE:'fixture'}),providers=adapters(store,config),service=new Service(store,providers,config);
  const cmt=store.users().find(user=>user.role==='cmt');
  const claim=service.createClaim(cmt,{receipt_base64:readFileSync('frontend/demo/mixed.png').toString('base64'),context:'Event printing and registration'},crypto.randomUUID());
  const extract=providers.ai.extract.bind(providers.ai),assess=providers.ai.assess.bind(providers.ai);
  const scores={ocr,decider};let extracts=0,assessments=0;
  providers.ai.extract=async(...args)=>{extracts++;return {...await extract(...args),confidence:scores.ocr};};
  providers.ai.assess=async(...args)=>{assessments++;const output=await assess(...args);return {...output,items:output.items.map((item,index)=>({...item,confidence:Array.isArray(scores.decider)?scores.decider[index]:scores.decider}))};};
  // Exercise the real-AI authorization branch with local providers only.
  config.mode='sandbox';config.fundingConfirmed=true;
  const recipient={...JSON.parse(cmt.recipient),mode:'sandbox'};store.db.prepare('UPDATE users SET recipient=? WHERE id=?').run(JSON.stringify(recipient),cmt.id);
  return {store,service,providers,cmt,claim,scores,counts:()=>({extracts,assessments})};
}

test('confidence defaults to 0.90 and configuration rejects invalid thresholds',()=>{
  assert.equal(configuration({}).aiMinConfidence,0.90);
  for(const value of ['', 'NaN','0','-1','1.01'])assert.throws(()=>configuration({AI_MIN_CONFIDENCE:value}),/AI_MIN_CONFIDENCE/);
});
test('structured outputs require finite 0–1 scores without invented defaults',()=>{
  const item={item_id:'item-1',decision:'accepted',confidence:0.95,category:'printing',reason:'Printing supports the event programme.',rule_ids:['rule'],reference_ids:[],policy_version:1};
  for(const confidence of [undefined,null,'0.95',NaN,Infinity,-0.1,1.1]) {
    assert.equal(extractionSchema.safeParse(extracted({confidence})).success,false);
    assert.equal(assessmentSchema.safeParse({policy_version:1,items:[{...item,confidence}]}).success,false);
  }
  assert.equal(extractionSchema.safeParse(extracted({confidence:0.9})).success,true);
});
test('low or missing OCR confidence creates no reservation, payout or ledger write; retry rereads the image',async t=>{
  for(const ocr of [0.899999,undefined,NaN,1.1]) {
    const h=harness(t,{ocr});if(ocr===undefined)h.scores.ocr=undefined;
    await h.service.tick();const result=h.store.claim(h.claim.id);
    assert.equal(result.processing,'processing_failed');assert.equal(result.error.code,'ai_confidence_low');assert.equal(h.counts().assessments,0);
    assert.equal(h.store.payments().length,0);assert.equal(h.providers.paypal.creates,0);assert.equal((await h.service.budget()).transactions.length,0);
    h.scores.ocr=0.95;h.service.retry(h.cmt,h.claim.id);await h.service.tick();assert.equal(h.counts().extracts,2);assert.equal(h.store.payment(h.store.claim(h.claim.id).payment_id).status,'succeeded');
  }
});
test('one uncertain accepted or rejected item holds the entire receipt; retry reassesses without duplicate payment',async t=>{
  for(const decider of [[0.89,0.98,0.98],[0.98,0.89,0.98],[undefined,0.98,0.98]]) {
    const h=harness(t,{decider});await h.service.tick();let claim=h.store.claim(h.claim.id);
    assert.equal(claim.processing,'processing_failed');assert.equal(claim.error.code,'ai_confidence_low');assert.equal(h.store.payments().length,0);assert.equal(h.providers.paypal.creates,0);
    h.scores.decider=0.9;h.service.retry(h.cmt,claim.id);await h.service.tick();claim=h.store.claim(claim.id);
    const payment=h.store.payment(claim.payment_id);assert.equal(payment.status,'succeeded');assert.equal(h.counts().extracts,1);assert.equal(h.counts().assessments,2);
    assert.deepEqual(payment.authorization.confidence_gate,{minimum:0.9,ocr:0.98,decider_min:0.9});await h.service.tick();assert.equal(h.providers.paypal.creates,1);
  }
});
test('the inclusive threshold still preserves partial-budget payout and immutable confidence evidence',async t=>{
  const h=harness(t,{ocr:0.9,decider:0.9});h.store.set('fixture_sheet',{...h.store.setting('fixture_sheet'),funding_sen:3000});
  await h.service.tick();const claim=h.store.claim(h.claim.id),payment=h.store.payment(claim.payment_id);
  assert.equal(payment.amount_sen,3000);assert.equal(payment.status,'succeeded');assert.equal(claim.eligible_sen,6000);assert.equal(payment.authorization.assessment.items[0].confidence,0.9);
});
