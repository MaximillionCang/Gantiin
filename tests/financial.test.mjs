import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Store } from '../apps/api/src/db.mjs';
import { Service } from '../apps/api/src/service.mjs';
import { configuration } from '../apps/api/src/config.mjs';
import { adapters } from '../apps/api/src/adapters/index.mjs';
import { validateReceipt } from '../apps/api/src/domain/receipt.mjs';
import { proportional } from '../apps/api/src/domain/allocation.mjs';
import { seed } from '../scripts/setup.mjs';
import { extracted } from './helpers/ai.mjs';

function raw({adjustments=[adjustment()],total=9000}={}) {
  return extracted({total_sen:total,items:[{id:'item-1',description:'Event printing',source_text:'Event printing MYR80',quantity:1,unit_sen:8000,line_sen:8000,line_basis:'gross',discounts:[]},{id:'item-2',description:'Personal headphones',source_text:'Personal headphones MYR20',quantity:1,unit_sen:2000,line_sen:2000,line_basis:'gross',discounts:[]}],adjustments});
}
function adjustment(overrides={}) {return {kind:'discount',description:'Receipt discount',source_text:'Discount -10.00',amount_sen:1000,treatment:'subtract',scope:'receipt',item_ids:[],...overrides};}
function harness(t,{funding=10000,receipt=raw()}={}) {
  const store=new Store();seed(store,{demo:true,password:'Synthetic-only-password42',funding});t.after(()=>store.close());
  const config=configuration({BUDGET_SOURCE:'fixture'});const providers=adapters(store,config);providers.ai.extract=async()=>structuredClone(receipt);
  const service=new Service(store,providers,config);const users=store.users().filter(u=>u.role==='cmt');
  const submit=(file='mixed.png',user=users[0])=>service.createClaim(user,{receipt_base64:readFileSync(`apps/web/demo/${file}`).toString('base64')},crypto.randomUUID());
  return {store,providers,service,users,submit};
}
test('required RM80 accepted + RM20 rejected - shared RM10 yields printed RM90 and eligible RM72',async t=>{
  const h=harness(t);const claim=h.submit();await h.service.tick();const c=h.service.claimView(h.store.claim(claim.id));
  assert.deepEqual(c.receipt.items.map(i=>i.net_sen),[7200,1800]);assert.equal(c.requested_sen,9000);assert.equal(c.eligible_sen,7200);assert.equal(c.paid_sen,7200);
  assert.equal(c.payment.authorization.receipt.items[0].allocated_discount_sen,800);
  const sheet=h.store.setting('fixture_sheet');assert.equal(sheet.items.length,1);assert.equal(sheet.items[0].paid_sen,7200);assert.equal(sheet.items[0].record_id,`${c.payment.id}:item-1`);assert.ok(!sheet.history.some(r=>r.id===c.payment.id));
});
test('item discounts apply once for gross or already-net printed lines; shared tax follows scoped basis',()=>{
  for(const basis of ['gross','net']){
    const r=raw({total:9540,adjustments:[adjustment(),adjustment({kind:'tax',amount_sen:540,treatment:'add',source_text:'Tax 5.40'})]});
    r.items[0].unit_sen=10000;r.items[0].line_sen=basis==='gross'?10000:8000;r.items[0].line_basis=basis;r.items[0].discounts=[{description:'Item discount',source_text:'Item discount -20.00',amount_sen:2000}];
    const c=validateReceipt(r);assert.deepEqual(c.items.map(i=>i.net_sen),[7632,1908]);assert.equal(c.items[0].item_discount_sen,2000);assert.equal(c.items[0].allocated_tax_sen,432);
  }
  const scoped=validateReceipt(raw({total:9900,adjustments:[adjustment({scope:'items',item_ids:['item-1'],amount_sen:100})]}));assert.deepEqual(scoped.items.map(i=>i.net_sen),[7900,2000]);
});
test('included tax is evidence only; nullable absent units are preserved without invented prices',()=>{
  const r=raw({total:10000,adjustments:[adjustment({kind:'tax',amount_sen:600,treatment:'included'})]});r.items[0].quantity=null;r.items[0].unit_sen=null;
  const c=validateReceipt(r);assert.equal(c.items[0].net_sen,8000);assert.equal(c.items[0].quantity,null);assert.equal(c.items[0].unit_sen,null);assert.equal(c.adjustments[0].amount_sen,600);
});
test('largest remainder preserves exact sen, printed-order ties and safe large integer products',()=>{
  assert.deepEqual(proportional(1,[1,1,1]),[1,0,0]);assert.deepEqual(proportional(2,[1,1,1]),[1,1,0]);
  assert.deepEqual(proportional(99999999,[50000000,49999999]),[50000000,49999999]);
  for(let amount=0;amount<100;amount++)for(const weights of [[1,1,1],[3,7,11],[0,2,5]]){
    const shares=proportional(amount,weights);assert.equal(shares.reduce((a,b)=>a+b,0),amount);assert.ok(shares.every(Number.isSafeInteger));
  }
});
test('ambiguous scope, unsupported charges, duplicate scopes, over-discounts and irreconcilable totals fail technically',()=>{
  for(const r of [raw({adjustments:[adjustment({scope:'unknown'})]}),raw({adjustments:[adjustment({kind:'other'})]}),raw({adjustments:[adjustment({scope:'items',item_ids:['item-1','item-1']})]}),raw({adjustments:[adjustment({scope:'items',item_ids:['missing']})]}),raw({total:8999}),raw({adjustments:[adjustment({amount_sen:20000})]}),raw({adjustments:[adjustment({treatment:'unknown'})]})])assert.throws(()=>validateReceipt(r),e=>e.code==='extraction_failed');
});
test('partial net-cost payment records eligible/paid/unpaid per item and never later settles',async t=>{
  const h=harness(t,{funding:3000});const c=h.submit();await h.service.tick();const view=h.service.claimView(h.store.claim(c.id));assert.equal(view.eligible_sen,7200);assert.equal(view.paid_sen,3000);assert.equal(view.unpaid_sen,4200);
  const item=h.store.setting('fixture_sheet').items[0];assert.equal(item.eligible_sen,7200);assert.equal(item.paid_sen,3000);assert.equal(item.unpaid_sen,4200);
  const sheet=h.store.setting('fixture_sheet');sheet.funding_sen=20000;h.store.set('fixture_sheet',sheet);await h.service.tick();assert.equal(h.providers.paypal.creates,1);
});
test('concurrent adjusted claims reserve net amounts without overspending',async t=>{
  const h=harness(t,{funding:8000});h.submit();h.submit('printing.png',h.users[1]);await Promise.all([h.service.tick(),h.service.tick()]);assert.deepEqual(h.store.payments().map(p=>p.amount_sen),[7200,800]);assert.equal((await h.service.budget()).available_sen,0);
});
test('transaction-only synchronization failure repairs item details without a second payout or deduction',async t=>{
  const h=harness(t);const original=h.providers.sheets.sync.bind(h.providers.sheets);let partial=true;
  h.providers.sheets.sync=async p=>{await original(p);if(partial){const s=h.store.setting('fixture_sheet');s.items=[];h.store.set('fixture_sheet',s);}};
  const c=h.submit();await h.service.tick();const p=h.store.payment(h.store.claim(c.id).payment_id);assert.equal(p.sync,'sync_pending');assert.equal((await h.service.budget()).available_sen,2800);
  partial=false;await h.service.tick();await h.service.tick();assert.equal(h.store.payment(p.id).sync,'synced');assert.equal(h.store.setting('fixture_sheet').items.length,1);assert.equal(h.store.setting('fixture_sheet').transactions.length,1);assert.equal(h.providers.paypal.creates,1);
});
test('tampered synchronized item rows halt funds allocation',async t=>{
  const h=harness(t);h.submit();await h.service.tick();const s=h.store.setting('fixture_sheet');s.items[0].paid_sen++;h.store.set('fixture_sheet',s);await assert.rejects(()=>h.service.budget(),/item details/);
});
test('reference or recipient changes during assessment invalidate unfinished authorization',async t=>{
  for(const type of ['reference','recipient'])await t.test(type,async t=>{
    const h=harness(t);const original=h.providers.ai.assess.bind(h.providers.ai);
    h.providers.ai.assess=async(...args)=>{const output=await original(...args);if(type==='reference'){const s=h.store.setting('fixture_sheet');s.planned[0].context+=' changed';h.store.set('fixture_sheet',s);}else{const user=h.store.user(h.users[0].id);h.store.db.prepare('UPDATE users SET recipient=? WHERE id=?').run(JSON.stringify({...JSON.parse(user.recipient),id:'changed'}),user.id);}return output;};
    const c=h.submit();await h.service.tick();assert.equal(h.store.claim(c.id).processing,'processing_failed');assert.equal(h.store.payments().length,0);assert.equal(h.store.claim(c.id).error.code,type==='reference'?'references_changed':'recipient_changed');
  });
});
test('changed net authorization cannot release held funds or mark provider paid',async t=>{
  const h=harness(t);h.providers.paypal.loseCreateResponse=true;const c=h.submit();await h.service.tick();const p=h.store.payment(h.store.claim(c.id).payment_id);p.authorization.receipt.items[0].net_sen=1;h.store.savePayment(p);h.providers.paypal.loseCreateResponse=false;await h.service.tick();assert.equal(h.store.payment(p.id).status,'unknown');assert.equal((await h.service.budget()).reserved_sen,7200);assert.equal(h.providers.paypal.creates,1);
});

test('confirmed-payment sync still validates immutable item snapshots and holds unreflected funds',async t=>{
  const h=harness(t);h.providers.sheets.failSync=true;const c=h.submit();await h.service.tick();const p=h.store.payment(h.store.claim(c.id).payment_id);assert.equal(p.status,'succeeded');p.items[0].paid_sen=1;h.store.savePayment(p);h.providers.sheets.failSync=false;await h.service.tick();assert.equal(h.store.payment(p.id).sync,'sync_pending');assert.equal(h.store.setting('fixture_sheet').transactions.length,0);assert.equal((await h.service.budget()).reserved_sen,7200);assert.equal(h.providers.paypal.creates,1);
});
test('empty provider payout-item identity cannot mark paid',async t=>{
  const h=harness(t);const original=h.providers.paypal.details.bind(h.providers.paypal);h.providers.paypal.details=async p=>({...await original(p),item:''});const c=h.submit();await h.service.tick();const view=h.service.claimView(h.store.claim(c.id));assert.equal(view.paid_sen,0);assert.equal((await h.service.budget()).reserved_sen,7200);
});

test('fully discounted accepted goods have zero net eligibility and never create a payout',async t=>{
  const h=harness(t,{receipt:raw({total:0,adjustments:[adjustment({amount_sen:10000})]})});const c=h.submit();await h.service.tick();const view=h.service.claimView(h.store.claim(c.id));assert.equal(view.eligible_sen,0);assert.equal(view.assessment.items[0].decision,'accepted');assert.equal(h.providers.paypal.creates,0);assert.match(view.no_payment_reason,/zero net cost/);
});

test('unsupported adjustment fails technically while retaining original extraction evidence and model identity',async t=>{
  const receipt=raw({adjustments:[adjustment({kind:'other',description:'Unsupported service charge'})]});const h=harness(t,{receipt});const c=h.submit();await h.service.tick();const result=h.store.claim(c.id);assert.equal(result.processing,'processing_failed');assert.deepEqual(result.extraction_evidence,receipt);assert.ok(result.models.ocr);assert.ok(result.extracted_at);assert.equal(result.assessment,undefined);assert.equal(h.providers.paypal.creates,0);
});
