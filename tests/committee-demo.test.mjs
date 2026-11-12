import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/api/src/db.mjs';
import { createApplication } from '../apps/api/src/server.mjs';
import { configuration } from '../apps/api/src/config.mjs';
import { resetCommitteeDemo } from '../apps/api/src/committee-demo.mjs';
import { seed } from '../scripts/setup.mjs';

async function harness(t,{path=':memory:',mode='fixture',seeded=false,providers}={}) {
  const store=new Store(path);if(!seeded)seed(store,{demo:true,password:'Isolated-test-password42'});
  if(mode==='sandbox')store.set('integration_mode','sandbox');
  const config=configuration({INTEGRATION_MODE:mode,BUDGET_SOURCE:mode==='fixture'?'fixture':'google'});
  const app=createApplication({store,config,providers,worker:false,lease:false});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));config.base=`http://127.0.0.1:${app.server.address().port}`;
  let closed=false;const close=async()=>{if(!closed){closed=true;await app.close();}};t.after(close);
  const request=async(path,{method='GET',data,cookie='',csrf='',origin=config.base,key}={})=>{
    const res=await fetch(`${config.base}/api${path}`,{method,headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf,...(data?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{})},body:data?JSON.stringify(data):undefined});
    let value;try{value=await res.clone().json();}catch{value=null;}return {res,value};
  };
  const identity=result=>({cookie:result.res.headers.get('set-cookie').split(';')[0],csrf:result.value.csrf,user:result.value.user});
  const demoLogin=async()=>{const result=await request('/demo-cmt/login',{method:'POST',data:{}});assert.equal(result.res.status,200);return identity(result);};
  return {...app,get demo(){return app.demo;},config,request,identity,demoLogin,close};
}
const image=()=>readFileSync('demo/campus-career-day/receipts/01-printing-and-registration.png').toString('base64');

test('one-click Committee demo has one CMT, separate cookies, store, receipts and reset authorization',async t=>{
  const h=await harness(t);
  const regularResult=await h.request('/login',{method:'POST',data:{email:'cmt.one@example.test',password:'Isolated-test-password42'}}),regular=h.identity(regularResult);
  const mainClaim=await h.request('/claims',{method:'POST',...regular,key:'main-claim',data:{receipt_base64:readFileSync('apps/web/demo/printing.png').toString('base64')}});assert.equal(mainClaim.res.status,202);await h.service.tick();
  const primary={users:h.store.users(),event:h.store.setting('event'),sheet:h.store.setting('fixture_sheet'),claims:h.store.claims(),payments:h.store.payments()};
  assert.equal((await h.request('/demo-cmt/login',{method:'POST',data:{role:'treasurer'}})).res.status,400);
  assert.equal((await h.request('/demo-cmt/login',{method:'POST',data:{},origin:'https://other.invalid'})).res.status,403);
  const entry=await h.request('/demo-cmt/login',{method:'POST',data:{},cookie:regular.cookie}),demo=h.identity(entry);
  assert.equal(entry.value.demo,true);assert.equal(entry.value.user.role,'cmt');assert.match(entry.res.headers.get('set-cookie'),/^gantiin_demo_session=.*Path=\/api\/demo-cmt/);assert.doesNotMatch(entry.res.headers.get('set-cookie'),/^gantiin_session=/);
  assert.equal(h.demo.store.users().length,1);assert.equal(h.demo.store.users().filter(user=>user.role==='treasurer').length,0);assert.equal(h.store.users().filter(user=>user.role==='treasurer').length,1);
  assert.equal((await h.request('/demo-cmt/login/treasurer',{method:'POST',data:{}})).res.status,403);
  assert.equal((await h.request('/demo-cmt/claims',regular)).res.status,401);assert.equal((await h.request('/claims',demo)).res.status,401);
  assert.equal((await h.request('/reset-demo',{method:'POST',...regular,data:{confirm:true}})).res.status,403);
  assert.equal((await h.request('/demo-cmt/reset-demo',{method:'POST',...demo,csrf:'wrong',data:{confirm:true}})).res.status,403);
  assert.equal((await h.request('/demo-cmt/reset-demo',{method:'POST',...demo,data:{}})).res.status,400);
  const created=await h.request('/demo-cmt/claims',{method:'POST',...demo,key:'demo-first',data:{receipt_base64:image()}});assert.equal(created.res.status,202);await h.demo.service.tick();
  const result=await h.request(`/demo-cmt/claims/${created.value.id}`,demo);assert.equal(result.value.paid_sen,20000);assert.equal(result.value.synthetic,true);assert.equal(result.value.payment.sync,'synced');assert.match(result.value.models.ocr,/simulation/);
  assert.equal((await h.request(`/claims/${created.value.id}/receipt`,regular)).res.status,404);assert.equal((await h.request(`/demo-cmt/claims/${mainClaim.value.id}`,demo)).res.status,404);
  assert.equal((await h.request('/demo-cmt/claims',{method:'POST',...demo,key:'demo-duplicate',data:{receipt_base64:image()}})).res.status,409);
  assert.equal((await h.request('/demo-cmt/reset-demo',{method:'POST',...demo,data:{confirm:true}})).res.status,200);
  assert.deepEqual((await h.request('/demo-cmt/claims',demo)).value,[]);assert.equal(h.demo.store.payments().length,0);assert.equal(h.demo.store.setting('fixture_sheet').funding_sen,100000);assert.equal(h.demo.store.setting('fixture_sheet').transactions.length,0);
  assert.equal(h.demo.store.db.prepare("SELECT count(*) AS total FROM settings WHERE substr(key,1,15)='fixture_payout_'").get().total,0);
  assert.equal((await h.request(`/demo-cmt/claims/${created.value.id}/receipt`,demo)).res.status,404);
  assert.deepEqual({users:h.store.users(),event:h.store.setting('event'),sheet:h.store.setting('fixture_sheet'),claims:h.store.claims(),payments:h.store.payments()},primary);
  const repeated=await h.request('/demo-cmt/claims',{method:'POST',...demo,key:'demo-after-reset',data:{receipt_base64:image()}});assert.equal(repeated.res.status,202);assert.notEqual(repeated.value.id,created.value.id);await h.demo.service.tick();assert.equal(h.demo.store.payments()[0].amount_sen,20000);
  assert.throws(()=>resetCommitteeDemo(h.store,regular.user),/isolated Committee demo/);
  const logout=await h.request('/demo-cmt/logout',{method:'POST',...demo});assert.match(logout.res.headers.get('set-cookie'),/^gantiin_demo_session=.*Max-Age=0/);assert.equal((await h.request('/session',regular)).value.user.id,regular.user.id);
});

test('demo simulation supports all four career-event receipts and never uses main external providers',async t=>{
  let externalCalls=0;const blocked=()=>{externalCalls++;throw new Error('External provider reached');};
  const h=await harness(t,{mode:'sandbox',providers:{ai:{extract:blocked,assess:blocked},sheets:{read:blocked,sync:blocked},paypal:{create:blocked,details:blocked}}});
  const demo=await h.demoLogin();assert.equal(h.demo.service.config.aiKey,'');assert.equal(h.demo.service.config.paypalClient,'');assert.equal(h.demo.service.config.googleKey,'');assert.equal(h.demo.service.config.budgetSource,'fixture');
  const expected=[['01-printing-and-registration.png',20000],['02-refreshments.png',44000],['03-room-preparation.png',4600],['04-committee-dinner.png',0]];
  for(const [file,eligible] of expected) {
    const created=await h.request('/demo-cmt/claims',{method:'POST',...demo,key:`sample-${file}`,data:{receipt_base64:readFileSync(`demo/campus-career-day/receipts/${file}`).toString('base64')}});assert.equal(created.res.status,202);await h.demo.service.tick();
    const claim=h.demo.store.claim(created.value.id);assert.equal(claim.eligible_sen,eligible);assert.equal(claim.processing,'assessed');assert.equal(claim.synthetic,true);
  }
  const sample=await h.request('/demo-cmt/sample-receipt',demo);assert.equal(sample.res.status,200);assert.deepEqual(Buffer.from(await sample.res.arrayBuffer()),Buffer.from(image(),'base64'));assert.equal(externalCalls,0);assert.equal(h.store.claims().length,0);
});

test('demo claims persist across restarts in their own database until explicitly reset',async t=>{
  const path=join(mkdtempSync(join(tmpdir(),'gantiin-isolated-demo-')),'primary.sqlite');
  const first=await harness(t,{path});const demo=await first.demoLogin(),id=demo.user.id;
  const created=await first.request('/demo-cmt/claims',{method:'POST',...demo,key:'persisted-demo',data:{receipt_base64:image()}});await first.demo.service.tick();
  assert.equal(first.demo.store.path,join(first.store.path,'..','demo','committee.sqlite'));await first.close();
  const second=await harness(t,{path,seeded:true}),again=await second.demoLogin();assert.equal(again.user.id,id);assert.equal((await second.request('/demo-cmt/claims',again)).value[0].id,created.value.id);assert.equal(second.store.claims().length,0);assert.equal(second.store.users().filter(user=>user.role==='treasurer').length,1);
});

test('reset waits for an in-flight demo worker and no deleted receipt or payout returns afterward',async t=>{
  const h=await harness(t),demo=await h.demoLogin();
  const created=await h.request('/demo-cmt/claims',{method:'POST',...demo,key:'reset-race',data:{receipt_base64:image()}});
  const ai=h.demo.service.providers.ai,extract=ai.extract.bind(ai);let release,entered;
  const held=new Promise(resolve=>release=resolve),started=new Promise(resolve=>entered=resolve);
  ai.extract=async(...args)=>{entered();await held;return extract(...args);};
  const processing=h.demo.service.tick();await started;
  let signalQueued;const queued=new Promise(resolve=>signalQueued=resolve),exclusive=h.demo.service.exclusive.bind(h.demo.service);
  h.demo.service.exclusive=operation=>{signalQueued();return exclusive(operation);};
  const reset=h.request('/demo-cmt/reset-demo',{method:'POST',...demo,data:{confirm:true}});
  try{await queued;assert.equal(h.demo.store.claim(created.value.id).processing,'processing');}finally{release();}
  await processing;assert.equal((await reset).res.status,200);await h.demo.service.tick();
  assert.equal(h.demo.store.claims().length,0);assert.equal(h.demo.store.payments().length,0);assert.equal(h.demo.store.setting('fixture_sheet').transactions.length,0);assert.equal((await h.request(`/demo-cmt/claims/${created.value.id}/receipt`,demo)).res.status,404);assert.equal(h.store.claims().length,0);
});
