import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Store} from '../backend/src/db.mjs';
import {Service} from '../backend/src/service.mjs';
import {adapters} from '../backend/src/adapters/index.mjs';
import {configuration} from '../backend/src/config.mjs';
import {seed} from '../scripts/setup.mjs';

function harness(t,{lease=false}={}) {
  const store=new Store();seed(store,{demo:true,password:'Synthetic-runtime-password',funding:20000});
  if(lease)store.acquireLease();
  const providers=adapters(store,configuration({BUDGET_SOURCE:'fixture'}));
  const service=new Service(store,providers,configuration({BUDGET_SOURCE:'fixture'}));
  t.after(()=>store.close());
  const users=store.users().filter(user=>user.role==='cmt');
  const submit=(file='printing.png',user=users[0])=>service.createClaim(user,{receipt_base64:readFileSync(`frontend/demo/${file}`).toString('base64'),context:'Event printing for the participants.'},crypto.randomUUID());
  const loseLease=()=>store.db.prepare('UPDATE lease SET owner=? WHERE id=1').run('other-synthetic-process');
  return {store,providers,service,users,submit,loseLease};
}

test('reserved payout is reconciled before the next receipt starts OCR',async t=>{
  const h=harness(t),first=h.submit();await h.service.processClaim(first);
  h.submit('printing-two.png',h.users[1]);
  const order=[],extract=h.providers.ai.extract.bind(h.providers.ai),create=h.providers.paypal.create.bind(h.providers.paypal);
  h.providers.ai.extract=async(...args)=>{order.push('ocr');return extract(...args);};
  h.providers.paypal.create=async p=>{order.push(`pay:${p.claim_id}`);return create(p);};
  await h.service.tick();
  assert.equal(order[0],`pay:${first.id}`);assert.equal(order[1],'ocr');
  assert.equal(h.providers.paypal.creates,2);assert.equal(h.store.setting('fixture_sheet').transactions.length,2);
});

test('each new claim pays before OCR for the following claim, without parallel allocations',async t=>{
  const h=harness(t);h.submit();h.submit('printing-two.png',h.users[1]);
  const order=[],extract=h.providers.ai.extract.bind(h.providers.ai),create=h.providers.paypal.create.bind(h.providers.paypal);
  h.providers.ai.extract=async(...args)=>{order.push('ocr');return extract(...args);};
  h.providers.paypal.create=async p=>{order.push('pay');return create(p);};
  await Promise.all([h.service.tick(),h.service.tick()]);
  assert.deepEqual(order,['ocr','pay','ocr','pay']);
  assert.equal(h.providers.paypal.creates,2);assert.equal((await h.service.budget()).available_sen,12000);
});

test('payments-first scheduling checks each pending payment only once per tick',async t=>{
  const h=harness(t);h.providers.paypal.outcome='PENDING';
  const first=h.submit();await h.service.processClaim(first);h.submit('printing-two.png',h.users[1]);
  const counts=new Map(),details=h.providers.paypal.details.bind(h.providers.paypal);
  h.providers.paypal.details=async p=>{counts.set(p.id,(counts.get(p.id)||0)+1);return details(p);};
  await h.service.tick();
  assert.deepEqual([...counts.values()],[1,1]);assert.equal(h.providers.paypal.creates,2);
  assert.equal((await h.service.budget()).reserved_sen,8000);
});

test('an expired lease cannot renew itself or authorize new submissions',t=>{
  const h=harness(t,{lease:true});
  h.store.db.prepare('UPDATE lease SET expires=0 WHERE id=1').run();
  assert.equal(h.store.renewLease(),false);
  assert.throws(()=>h.store.assertLease(),error=>error.code==='lease_lost');
  assert.throws(()=>h.submit(),error=>error.code==='lease_lost');assert.equal(h.store.claims().length,0);
});

test('lost lease blocks a reserved payout without deleting the new owner lease',async t=>{
  const h=harness(t,{lease:true}),claim=h.submit();await h.service.processClaim(claim);
  const payment=h.store.payment(h.store.claim(claim.id).payment_id);h.loseLease();
  await assert.rejects(()=>h.service.processPayment(payment),error=>error.code==='lease_lost');
  assert.equal(h.store.renewLease(),false);assert.equal(h.providers.paypal.creates,0);
  assert.equal(h.store.payment(payment.id).status,'reserved');assert.equal(h.store.setting('fixture_sheet').transactions.length,0);
  assert.equal(h.store.db.prepare('SELECT owner FROM lease').get().owner,'other-synthetic-process');
});

test('lease loss while OCR is in flight does not reserve money or overwrite the claim',async t=>{
  const h=harness(t,{lease:true}),claim=h.submit(),extract=h.providers.ai.extract.bind(h.providers.ai);
  h.providers.ai.extract=async(...args)=>{const result=await extract(...args);h.loseLease();return result;};
  await assert.rejects(()=>h.service.processClaim(claim),error=>error.code==='lease_lost');
  const saved=h.store.claim(claim.id);
  assert.equal(saved.processing_stage,'extracting');assert.equal(saved.receipt,undefined);
  assert.equal(h.store.payments().length,0);assert.equal(h.providers.paypal.creates,0);
});

test('lease loss during provider confirmation cannot mark the claim paid or write Sheets',async t=>{
  const h=harness(t,{lease:true}),claim=h.submit();await h.service.processClaim(claim);
  const payment=h.store.payment(h.store.claim(claim.id).payment_id),details=h.providers.paypal.details.bind(h.providers.paypal);
  h.providers.paypal.details=async p=>{const result=await details(p);h.loseLease();return result;};
  await assert.rejects(()=>h.service.processPayment(payment),error=>error.code==='lease_lost');
  assert.equal(h.providers.paypal.creates,1);assert.equal(h.store.payment(payment.id).status,'pending');
  assert.equal(h.service.claimView(h.store.claim(claim.id)).paid_sen,0);
  assert.equal(h.store.setting('fixture_sheet').transactions.length,0);
});

test('lease loss during pre-sync read prevents the external spreadsheet write',async t=>{
  const h=harness(t,{lease:true}),claim=h.submit();await h.service.processClaim(claim);
  const payment=h.store.payment(h.store.claim(claim.id).payment_id),read=h.providers.sheets.read.bind(h.providers.sheets);
  h.providers.sheets.read=async(...args)=>{const result=await read(...args);h.loseLease();return result;};
  await assert.rejects(()=>h.service.processPayment(payment),error=>error.code==='lease_lost');
  assert.equal(h.store.payment(payment.id).status,'succeeded');
  assert.equal(h.store.payment(payment.id).sync,'sync_pending');assert.equal(h.store.setting('fixture_sheet').transactions.length,0);
});
