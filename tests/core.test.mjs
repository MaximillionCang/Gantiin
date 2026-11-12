import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { Store } from '../apps/api/src/db.mjs';
import { Service } from '../apps/api/src/service.mjs';
import { adapters } from '../apps/api/src/adapters/index.mjs';
import { configuration } from '../apps/api/src/config.mjs';
import { seed } from '../scripts/setup.mjs';
import { money, fromDecimal, validateReceipt, validateAssessment, validatePolicy, receiptBytes } from '../apps/api/src/domain.mjs';

function harness(t,{funding=10000,store=new Store()}={}) {
  seed(store,{demo:true,password:'Synthetic-only-password42',funding});
  const config=configuration({BUDGET_SOURCE:'fixture'});const providers=adapters(store,config);const service=new Service(store,providers,config);
  t.after(()=>store.close());
  return {store,providers,service,cmt:store.users().find(u=>u.role==='cmt'),other:store.users().filter(u=>u.role==='cmt')[1],treasurer:store.users().find(u=>u.role==='treasurer')};
}
const input=(file='mixed.png',context='Synthetic event purchases for event printing and registration use.')=>({receipt_base64:readFileSync(`apps/web/demo/${file}`).toString('base64'),context});
const submit=(h,file='mixed.png',user=h.cmt,key=crypto.randomUUID())=>h.service.createClaim(user,input(file),key);

test('money rejects fractions, negatives, unsafe/oversized values; parses exact provider cents',()=>{
  for(const v of [-1,1.1,NaN,Infinity,'4000',Number.MAX_SAFE_INTEGER])assert.throws(()=>money(v));
  assert.equal(fromDecimal('40.01'),4001);assert.throws(()=>fromDecimal('1.999'));assert.throws(()=>fromDecimal('-1.00'));
});
test('owner-confirmed insufficient-context policy defaults to reject',t=>{
  const h=harness(t);const policy={...h.service.event()};delete policy.insufficient_context;assert.equal(validatePolicy(policy,2).insufficient_context,'reject');
});

test('event name and description configure a versioned decider context without manual rules',async t=>{
  const h=harness(t),version=h.service.event().version;
  const event=h.service.savePolicy(h.treasurer,{name:'Campus Career Day 2026',description:'Career talks for university students, with printed participant handouts and registration stationery. Personal purchases are not event expenses.',expected_version:version});
  assert.equal(event.policy_input,'event_description');assert.equal(event.currency,'MYR');assert.equal(event.version,version+1);assert.equal(event.insufficient_context,'reject');assert.deepEqual(event.rules.map(r=>r.id),['EVENT-RELEVANCE','EVENT-UNRELATED']);
  const claim=submit(h);await h.service.tick();const result=h.service.claimView(h.store.claim(claim.id));
  assert.equal(result.paid_sen,6000);const rejected=result.assessment.items.find(i=>i.decision==='rejected');assert.match(rejected.reason,/headphones.*Campus Career Day/);assert.ok(rejected.rule_ids.includes('EVENT-UNRELATED'));
  assert.throws(()=>h.service.savePolicy(h.treasurer,{name:event.name,description:event.description,expected_version:version}),/Policy changed/);
});

test('default Google budget never falls back to synthetic funds and disables fixture payouts',async t=>{
  const h=harness(t);h.service.config.budgetSource=configuration({}).budgetSource;
  assert.equal(h.service.config.budgetSource,'google');assert.equal(h.service.readiness(h.cmt).sheets,false);
  await assert.rejects(()=>h.service.budget(),/Configure Google/);
  assert.throws(()=>submit(h),/Integration not configured/);await h.service.tick();assert.equal(h.providers.paypal.creates,0);
  assert.throws(()=>configuration({INTEGRATION_MODE:'sandbox',BUDGET_SOURCE:'fixture'}),/Google Sheets budget/);
});
test('receipt validator reconciles line/total/currency and blocks unsupported adjustments',()=>{
  const r={currency:'MYR',total_sen:4000,adjustments_sen:0,items:[{description:'Print',quantity:2,unit_sen:2000,line_sen:4000}]};
  assert.equal(validateReceipt(r).total_sen,4000);
  for(const bad of [{...r,currency:'USD'},{...r,total_sen:3999},{...r,adjustments_sen:10},{...r,items:[{...r.items[0],quantity:3}]}])assert.throws(()=>validateReceipt(bad));
  assert.throws(()=>receiptBytes({receipt_base64:Buffer.from('<script>bad</script>').toString('base64')}));
});
test('AC-04/05/06/07: mixed items, actual planned reference, novel item allowed, current ban overrides history',async t=>{
  const h=harness(t);const c=submit(h);await h.service.tick();const result=h.service.claimView(h.store.claim(c.id));
  assert.equal(result.requested_sen,9500);assert.equal(result.eligible_sen,6000);assert.equal(result.paid_sen,6000);assert.equal(result.unpaid_sen,0);
  assert.deepEqual(result.assessment.items.map(i=>i.decision),['accepted','accepted','rejected']);
  assert.deepEqual(result.assessment.items[0].reference_ids,['planned:print-1']);assert.deepEqual(result.assessment.items[1].reference_ids,[]);
  assert.ok(!result.references.some(r=>r.id==='history:unapproved'));assert.equal(result.payment.sync,'synced');
  assert.equal((await h.service.budget()).available_sen,4000);assert.equal(h.store.setting('fixture_sheet').transactions.length,1);
});
test('AC-08: partial payout is capped and accepted items remain accepted',async t=>{
  const h=harness(t,{funding:3000});const c=submit(h);await h.service.tick();const r=h.service.claimView(h.store.claim(c.id));
  assert.equal(r.paid_sen,3000);assert.equal(r.unpaid_sen,3000);assert.equal(r.coverage,'partial');assert.equal(r.assessment.items[0].decision,'accepted');
  assert.deepEqual(r.payment.items.map(i=>i.paid_sen),[2000,1000]);assert.equal(h.store.setting('fixture_sheet').items.reduce((n,i)=>n+i.paid_sen,0),3000);
  const sheet=h.store.setting('fixture_sheet');sheet.funding_sen=10000;h.store.set('fixture_sheet',sheet);await h.service.tick();assert.equal(h.providers.paypal.creates,1);assert.equal(h.store.payment(r.payment.id).amount_sen,3000);
});
test('AC-09: zero funds creates no payout and increasing budget does not settle it later',async t=>{
  const h=harness(t,{funding:0});const c=submit(h);await h.service.tick();assert.equal(h.providers.paypal.creates,0);assert.equal(h.store.payments().length,0);assert.equal(h.store.claim(c.id).eligible_sen,6000);
  const sheet=h.store.setting('fixture_sheet');sheet.funding_sen=10000;h.store.set('fixture_sheet',sheet);await h.service.tick();assert.equal(h.providers.paypal.creates,0);
});
test('AC-10: all rejected means no payment with a reason',async t=>{
  const h=harness(t);const c=submit(h,'personal.png');await h.service.tick();assert.equal(h.store.claim(c.id).eligible_sen,0);assert.equal(h.store.payments().length,0);assert.ok(h.store.claim(c.id).assessment.items[0].reason);
});
test('insufficient purchase context produces explained business rejection, not a technical error',async t=>{
  const h=harness(t);const c=h.service.createClaim(h.cmt,input('mixed.png','I am not sure why I bought these.'),crypto.randomUUID());await h.service.tick();const r=h.store.claim(c.id);assert.equal(r.processing,'assessed');assert.ok(r.assessment.items.every(i=>i.decision==='rejected'));assert.equal(h.store.payments().length,0);assert.match(r.assessment.items[0].reason,/Insufficient context/);
});
test('AC-11: concurrent claims allocate RM40 and RM10 from RM50, never overspend',async t=>{
  const h=harness(t,{funding:5000});submit(h,'printing.png');submit(h,'printing-two.png',h.other);await Promise.all([h.service.tick(),h.service.tick(),h.service.tick()]);
  assert.deepEqual(h.store.payments().map(p=>p.amount_sen),[4000,1000]);assert.equal((await h.service.budget()).available_sen,0);assert.equal(h.providers.paypal.creates,2);
});
test('AC-12/13: payload-bound idempotency and event receipt hash prevent duplicates across accounts',async t=>{
  const h=harness(t);const key=crypto.randomUUID();const c=submit(h,'mixed.png',h.cmt,key);assert.equal(submit(h,'mixed.png',h.cmt,key).id,c.id);
  assert.throws(()=>h.service.createClaim(h.cmt,input('printing.png'),key));assert.throws(()=>submit(h,'mixed.png',h.other));await h.service.tick();await h.service.tick();assert.equal(h.providers.paypal.creates,1);assert.throws(()=>submit(h));
});
test('AC-14: pending batch is not paid and reserves funds until matching item SUCCESS',async t=>{
  const h=harness(t);h.providers.paypal.outcome='PENDING';const c=submit(h);await h.service.tick();let r=h.service.claimView(h.store.claim(c.id));
  assert.equal(r.paid_sen,0);assert.equal(r.payment.status,'pending');assert.equal((await h.service.budget()).reserved_sen,6000);
  const record=h.store.setting(`fixture_payout_${r.payment.id}`);record.status='SUCCESS';h.store.set(`fixture_payout_${r.payment.id}`,record);await h.service.tick();r=h.service.claimView(h.store.claim(c.id));assert.equal(r.paid_sen,6000);assert.equal(h.providers.paypal.creates,1);
});
test('lost create response recovers original stable provider identity without another payout',async t=>{
  const h=harness(t);h.providers.paypal.loseCreateResponse=true;const c=submit(h);await h.service.tick();let r=h.service.claimView(h.store.claim(c.id));assert.equal(r.payment.status,'unknown');assert.equal(r.paid_sen,0);
  h.providers.paypal.loseCreateResponse=false;await h.service.tick();r=h.service.claimView(h.store.claim(c.id));assert.equal(r.paid_sen,6000);assert.equal(h.providers.paypal.creates,1);
});
test('provider amount/recipient mismatch cannot mark paid or release reservations',async t=>{
  const h=harness(t);h.providers.paypal.outcome='PENDING';const c=submit(h);await h.service.tick();const p=h.store.claim(c.id).payment_id;
  const record=h.store.setting(`fixture_payout_${p}`);record.status='SUCCESS';record.recipient='attacker';h.store.set(`fixture_payout_${p}`,record);await h.service.tick();assert.equal(h.service.claimView(h.store.claim(c.id)).paid_sen,0);assert.equal((await h.service.budget()).reserved_sen,6000);
});
test('definitive provider failure releases funds without automatic replacement payment',async t=>{
  const h=harness(t);h.providers.paypal.outcome='FAILED';const c=submit(h);await h.service.tick();assert.equal(h.service.claimView(h.store.claim(c.id)).paid_sen,0);assert.equal((await h.service.budget()).reserved_sen,0);await h.service.tick();assert.equal(h.providers.paypal.creates,1);
});
test('AC-15: paid + failed write retains reservation; retry sync never resends payout',async t=>{
  const h=harness(t);h.providers.sheets.failSync=true;const c=submit(h);await h.service.tick();let r=h.service.claimView(h.store.claim(c.id));assert.equal(r.payment.sync,'sync_pending');assert.equal(r.paid_sen,6000);assert.equal((await h.service.budget()).available_sen,4000);
  h.providers.sheets.failSync=false;await h.service.tick();await h.service.tick();assert.equal(h.store.payment(r.payment.id).sync,'synced');assert.equal(h.store.setting('fixture_sheet').transactions.length,1);assert.equal(h.providers.paypal.creates,1);
});
test('write succeeded but response lost is reconciled before deduction; fixed row recorded once',async t=>{
  const h=harness(t);h.providers.sheets.loseWriteResponse=true;const c=submit(h);await h.service.tick();const r=h.service.claimView(h.store.claim(c.id));assert.equal(r.payment.sync,'sync_pending');assert.equal((await h.service.budget()).available_sen,4000);
  await h.service.tick();assert.equal(h.store.payment(r.payment.id).sync,'synced');assert.equal(h.store.setting('fixture_sheet').transactions.length,1);assert.equal(h.providers.paypal.creates,1);
});
test('AC-16: Sheets read error blocks payout from stale budget; same claim can recover',async t=>{
  const h=harness(t);h.providers.sheets.failRead=true;const c=submit(h);await h.service.tick();assert.equal(h.store.claim(c.id).processing,'processing_failed');assert.equal(h.providers.paypal.creates,0);
  h.providers.sheets.failRead=false;h.service.retry(h.cmt,c.id);await h.service.tick();assert.equal(h.service.claimView(h.store.claim(c.id)).paid_sen,6000);
});
test('AC-17: AI outage has no invented rejection or payout',async t=>{
  const h=harness(t);h.providers.ai.fail=true;const c=submit(h);await h.service.tick();const r=h.store.claim(c.id);assert.equal(r.processing,'processing_failed');assert.equal(r.assessment,undefined);assert.equal(h.store.payments().length,0);
});
test('AI invalid coverage, references, decisions, policy and prohibited acceptance are rejected',async t=>{
  const h=harness(t);const c=submit(h);await h.service.tick();const r=h.store.claim(c.id);const assess=structuredClone(r.assessment);
  for(const mutate of [a=>a.items.pop(),a=>a.items[0].reference_ids=['invented'],a=>a.items[0].decision='needs_review',a=>a.policy_version++,a=>a.items[0].rule_ids=['P-PERSONAL']]){const bad=structuredClone(assess);mutate(bad);assert.throws(()=>validateAssessment(bad,r.receipt,r.policy,r.references));}
});
test('policy changed during assessment blocks stale allocation; explicit retry re-assesses',async t=>{
  const h=harness(t);const real=h.providers.ai.assess.bind(h.providers.ai);let first=true;
  h.providers.ai.assess=async(...args)=>{const out=await real(...args);if(first){first=false;h.service.savePolicy(h.treasurer,{...h.service.event(),expected_version:1});}return out;};
  const c=submit(h);await h.service.tick();assert.equal(h.store.claim(c.id).error.code,'policy_changed');assert.equal(h.store.payments().length,0);h.service.retry(h.cmt,c.id);await h.service.tick();assert.equal(h.store.claim(c.id).policy.version,2);
});
test('recipient mutation cannot redirect an in-flight payment snapshot',async t=>{
  const h=harness(t);h.providers.paypal.outcome='PENDING';const c=submit(h);await h.service.tick();const p=h.store.payment(h.store.claim(c.id).payment_id);const original=p.recipient.id;
  h.store.db.prepare('UPDATE users SET recipient=? WHERE id=?').run(JSON.stringify({...p.recipient,id:'changed-account'}),h.cmt.id);
  const record=h.store.setting(`fixture_payout_${p.id}`);record.status='SUCCESS';h.store.set(`fixture_payout_${p.id}`,record);await h.service.tick();assert.equal(h.store.payment(p.id).recipient.id,original);assert.equal(h.service.claimView(h.store.claim(c.id)).paid_sen,6000);
});
test('deleted or altered synchronized ledger halts new allocations',async t=>{
  const h=harness(t);submit(h);await h.service.tick();const sheet=h.store.setting('fixture_sheet');sheet.transactions=[];h.store.set('fixture_sheet',sheet);await assert.rejects(()=>h.service.budget(),/missing/);submit(h,'printing.png');await h.service.tick();assert.equal(h.providers.paypal.creates,1);
});
test('restart preserves unknown payment identity/reservation and recovers once',async()=>{
  mkdirSync('.cache/tests',{recursive:true});const directory=mkdtempSync(resolve('.cache/tests/restart-'));const file=join(directory,'test.sqlite');
  let store=new Store(file);seed(store,{demo:true,password:'Synthetic-only-password42'});let config=configuration({BUDGET_SOURCE:'fixture'});let providers=adapters(store,config);let service=new Service(store,providers,config);
  const user=store.users().find(u=>u.role==='cmt');const c=service.createClaim(user,input(),crypto.randomUUID());providers.paypal.loseCreateResponse=true;await service.tick();const id=store.claim(c.id).payment_id;store.close();
  store=new Store(file);providers=adapters(store,config);service=new Service(store,providers,config);await service.tick();assert.equal(store.claim(c.id).payment_id,id);assert.equal(store.payment(id).status,'succeeded');assert.equal(store.setting('fixture_sheet').transactions.length,1);assert.equal(providers.paypal.creates,0);store.close();
});
test('database lease refuses a second process/store for the same journal',()=>{
  mkdirSync('.cache/tests',{recursive:true});const file=join(mkdtempSync(resolve('.cache/tests/lease-')),'test.sqlite');const first=new Store(file),second=new Store(file);first.acquireLease();assert.throws(()=>second.acquireLease(),/Another application process/);first.close();second.close();
});
