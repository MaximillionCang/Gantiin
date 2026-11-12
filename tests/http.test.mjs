import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Store } from '../apps/api/src/db.mjs';
import { configuration } from '../apps/api/src/config.mjs';
import { adapters } from '../apps/api/src/adapters/index.mjs';
import { createApplication } from '../apps/api/src/server.mjs';
import { seed } from '../scripts/setup.mjs';
import { digest, passwordHash } from '../apps/api/src/domain.mjs';
import { extracted } from './helpers/ai.mjs';

async function harness(t,{oauth=false}={}) {
  const store=new Store();seed(store,{demo:true,password:'Synthetic-only-password42'});
  const config=configuration({BUDGET_SOURCE:'fixture'});const providers=adapters(store,config);
  if(oauth){config.mode='sandbox';config.paypalLogin=true;config.paypalClient='test-client';config.paypalSecret='test-secret';store.set('integration_mode','sandbox');providers.paypal.authorizationUrl=state=>`https://www.sandbox.paypal.com/signin/authorize?state=${state}`;providers.paypal.identity=async()=>({sub:'known-paypal-subject',payer_id:'FIXTUREPAYER000',verified:true});}
  const app=createApplication({store,config,providers,worker:false,lease:false});
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));config.base=`http://127.0.0.1:${app.server.address().port}`;
  t.after(()=>app.close());
  const request=async(path,{method='GET',data,cookie='',csrf='',headers={}}={})=>{
    const res=await fetch(`${config.base}/api${path}`,{method,redirect:'manual',headers:{Origin:config.base,...(data?{'Content-Type':'application/json'}:{}),Cookie:cookie,'X-CSRF-Token':csrf,...headers},body:data?JSON.stringify(data):undefined});
    let value;try{value=await res.clone().json();}catch{value=null;}return {res,value};
  };
  const login=async(address)=>{const treasurer=address==='treasurer@example.test';const result=await request(treasurer?'/login/treasurer':'/login',{method:'POST',data:treasurer?{password:'Synthetic-only-password42'}:{email:address,password:'Synthetic-only-password42'}});assert.equal(result.res.status,200);return {cookie:result.res.headers.get('set-cookie').split(';')[0],csrf:result.value.csrf,user:result.value.user};};
  return {...app,config,providers,request,login};
}
test('AC-01/02/03: role sessions, account creation, direct claim/file ID isolation and no browser role escalation',async t=>{
  const h=await harness(t);const one=await h.login('cmt.one@example.test'),two=await h.login('cmt.two@example.test'),treasurer=await h.login('treasurer@example.test');
  assert.equal(one.user.role,'cmt');assert.equal(treasurer.user.role,'treasurer');
  const receipt=readFileSync('apps/web/demo/mixed.png').toString('base64');
  const created=await h.request('/claims',{method:'POST',...one,headers:{'Idempotency-Key':'test-http-key'},data:{receipt_base64:receipt,context:'Synthetic supplies purchased for event registration and printing.',role:'treasurer',amount_sen:1,recipient:'attacker'}});
  assert.equal(created.res.status,202);const id=created.value.id;
  assert.equal((await h.request(`/claims/${id}`,two)).res.status,404);assert.equal((await h.request(`/claims/${id}/receipt`,two)).res.status,404);
  assert.equal((await h.request(`/claims/${id}/receipt`,one)).res.status,200);assert.equal((await h.request(`/claims/${id}`,treasurer)).res.status,200);
  assert.equal((await h.request('/claims',two)).value.length,0);assert.equal((await h.request('/budget',one)).res.status,403);
  assert.equal((await h.request('/members',{method:'POST',...one,data:{name:'Bad',email:'bad@example.test',password:'Synthetic-only-password42'}})).res.status,403);
  const member=await h.request('/members',{method:'POST',...treasurer,data:{name:'Synthetic CMT Three',email:'three@example.test',password:'Synthetic-only-password42',role:'treasurer'}});
  assert.equal(member.res.status,201);assert.equal(member.value.role,'cmt');assert.equal((await h.login('three@example.test')).user.event_id,one.user.event_id);
  assert.equal((await h.request('/claims',{...treasurer})).value.length,1);
  await h.service.tick();assert.equal(h.service.claimView(h.store.claim(id)).paid_sen,6000);
});
test('Treasurer spreadsheet shortcut uses only the configured Google ID and unavailable budget has no fake funds',async t=>{
  const h=await harness(t),treasurer=await h.login('treasurer@example.test'),committee=await h.login('cmt.one@example.test');
  h.config.spreadsheet='configured_demo_sheet_123';
  const budget=await h.request('/budget',treasurer);assert.equal(budget.value.spreadsheet_url,'https://docs.google.com/spreadsheets/d/configured_demo_sheet_123/edit');
  assert.equal((await h.request('/integrations',treasurer)).value.spreadsheet_url,budget.value.spreadsheet_url);
  assert.equal((await h.request('/integrations',committee)).res.status,403);
  h.config.spreadsheet='https://evil.invalid';assert.equal((await h.request('/budget',treasurer)).value.spreadsheet_url,null);
  h.config.budgetSource='google';h.config.googleKey='';const unavailable=await h.request('/budget',treasurer);
  assert.equal(unavailable.value.budget_status,'unavailable');assert.equal(unavailable.value.available_sen,null);assert.equal(unavailable.value.remaining_sen,null);assert.equal(unavailable.value.budget_source,'google');
});

test('session cookies, CSRF, origin, expiry, logout and private response headers',async t=>{
  const h=await harness(t);const login=await h.request('/login',{method:'POST',data:{email:'cmt.one@example.test',password:'Synthetic-only-password42'}});
  const setCookie=login.res.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Lax/);
  const user={cookie:setCookie.split(';')[0],csrf:login.value.csrf};
  assert.equal((await h.request('/logout',{method:'POST',cookie:user.cookie})).res.status,403);
  assert.equal((await h.request('/logout',{method:'POST',...user,headers:{Origin:'https://evil.example'}})).res.status,403);
  const detail=await h.request('/event',user);assert.equal(detail.res.headers.get('cache-control'),'no-store');assert.match(detail.res.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.equal((await h.request('/logout',{method:'POST',...user})).res.status,200);assert.equal((await h.request('/event',user)).res.status,401);
  const again=await h.login('cmt.one@example.test');h.store.db.prepare('UPDATE sessions SET expires=0').run();assert.equal((await h.request('/event',again)).res.status,401);
});
test('receipt-only submission stores no invented note and uses actual approved references',async t=>{
  const h=await harness(t);const one=await h.login('cmt.one@example.test');const receipt=readFileSync('apps/web/demo/mixed.png').toString('base64');
  for(const context of [null,17,'x'.repeat(3001)])assert.equal((await h.request('/claims',{method:'POST',...one,headers:{'Idempotency-Key':'invalid-context-key'},data:{receipt_base64:receipt,context}})).res.status,400);
  let modelContext;const assess=h.providers.ai.assess;h.providers.ai.assess=async(...args)=>{modelContext=args[3];return assess.apply(h.providers.ai,args);};
  const result=await h.request('/claims',{method:'POST',...one,headers:{'Idempotency-Key':'receipt-only-key'},data:{receipt_base64:receipt}});assert.equal(result.res.status,202);assert.equal(result.value.context,'');
  const repeated=await h.request('/claims',{method:'POST',...one,headers:{'Idempotency-Key':'receipt-only-key'},data:{receipt_base64:receipt}});assert.equal(repeated.value.id,result.value.id);
  await h.service.tick();const claim=h.store.claim(result.value.id);assert.equal(modelContext,'');assert.equal(claim.processing,'assessed');assert.equal(claim.assessment.items.filter(item=>item.decision==='accepted').length,1);assert.equal(claim.eligible_sen,4000);assert.equal(h.service.claimView(claim).paid_sen,4000);
  const unknown=claim.assessment.items.find(item=>item.category==='registration');assert.equal(unknown.decision,'rejected');assert.match(unknown.reason,/Insufficient context/);assert.equal(claim.assessment.items.find(item=>item.category==='personal').decision,'rejected');
});

test('HTTP claim result exposes exact net and item recording fields while obsolete templates are absent',async t=>{
  const h=await harness(t);const one=await h.login('cmt.one@example.test'),treasurer=await h.login('treasurer@example.test');
  assert.equal((await h.request('/event-templates',treasurer)).res.status,404);
  h.providers.ai.extract=async()=>extracted({total_sen:3600,adjustments:[{kind:'discount',description:'Coupon',source_text:'Discount -RM4.00',amount_sen:400,treatment:'subtract',scope:'receipt',item_ids:[]}]});
  const response=await h.request('/claims',{method:'POST',...one,headers:{'Idempotency-Key':'net-http-contract'},data:{receipt_base64:readFileSync('apps/web/demo/mixed.png').toString('base64')}});await h.service.tick();
  const result=(await h.request(`/claims/${response.value.id}`,one)).value;assert.equal(result.eligible_sen,3600);assert.equal(result.paid_sen,3600);assert.equal(result.item_outcomes[0].paid_sen,3600);assert.equal(result.receipt.items[0].allocated_discount_sen,400);assert.equal(result.payment.items[0].net_sen,3600);assert.equal(result.payment.sync,'synced');assert.ok(result.models.ocr);assert.ok(result.models.decider);
  for(const path of ['/src/lib/api.mjs','/src/components/event-brief.mjs','/src/pages/claim-detail.mjs'])assert.equal((await fetch(h.config.base+path)).status,200);
  for(const path of ['/src/../.env','/data/runtime/gantiin.sqlite','/src/../../api/src/config.mjs'])assert.ok([401,404].includes((await fetch(h.config.base+path)).status));
});
test('password change checks current password and invalidates other sessions; policy uses expected version',async t=>{
  const h=await harness(t);const a=await h.login('treasurer@example.test'),b=await h.login('treasurer@example.test');
  assert.equal((await h.request('/password',{method:'POST',...a,data:{current_password:'wrong',new_password:'Changed-synthetic-password42'}})).res.status,400);
  assert.equal((await h.request('/password',{method:'POST',...a,data:{current_password:'Synthetic-only-password42',new_password:'Changed-synthetic-password42'}})).res.status,200);
  assert.equal((await h.request('/event',b)).res.status,401);
  const event=h.service.event();assert.equal((await h.request('/event',{method:'PUT',...a,data:{...event,expected_version:0}})).res.status,409);
  assert.equal((await h.request('/event',{method:'PUT',...a,data:{...event,expected_version:1}})).res.status,200);
});
test('login rejects malformed input, wrong credentials and repeated guessing',async t=>{
  const h=await harness(t);assert.equal((await h.request('/login',{method:'POST',data:{email:'nope',password:'x'}})).res.status,400);
  for(let i=0;i<10;i++)assert.equal((await h.request('/login',{method:'POST',data:{email:'absent@example.test',password:'wrong'}})).res.status,401);
  assert.equal((await h.request('/login',{method:'POST',data:{email:'absent@example.test',password:'wrong'}})).res.status,429);
});
test('AC-19 mocked OAuth: bound state links existing CMT; replay/cross-browser/unknown login denied',async t=>{
  const h=await harness(t,{oauth:true});const one=await h.login('cmt.one@example.test');
  h.store.db.prepare('UPDATE users SET recipient=? WHERE id=?').run(JSON.stringify({id:'FIXTUREPAYER000',mode:'sandbox',verified:true,country:'MY'}),one.user.id);
  const begin=await h.request('/paypal/link',{method:'POST',...one,data:{password:'Synthetic-only-password42'}});
  assert.equal(begin.res.status,200);const state=new URL(begin.value.url).searchParams.get('state');const browser=begin.res.headers.get('set-cookie').split(';')[0];
  const wrong=await h.request(`/paypal/callback?state=${state}&code=stub`,{cookie:one.cookie});assert.match(wrong.res.headers.get('location'),/failed/);
  const good=await h.request(`/paypal/callback?state=${state}&code=stub`,{cookie:`${one.cookie}; ${browser}`});assert.match(good.res.headers.get('location'),/account/);assert.equal(h.store.user(one.user.id).paypal_sub,'known-paypal-subject');
  const replay=await h.request(`/paypal/callback?state=${state}&code=stub`,{cookie:`${one.cookie}; ${browser}`});assert.match(replay.res.headers.get('location'),/failed/);
  const start=await h.request('/paypal/login');const state2=new URL(start.res.headers.get('location')).searchParams.get('state');const browser2=start.res.headers.get('set-cookie').split(';')[0];
  const signed=await h.request(`/paypal/callback?state=${state2}&code=stub`,{cookie:browser2});assert.equal(signed.res.headers.get('location'),'/#/submit');assert.ok(signed.res.headers.get('set-cookie').includes('gantiin_session='));
  h.providers.paypal.identity=async()=>({sub:'unknown-sub',verified:true,payer_id:'UNKNOWN'});
  const unknownStart=await h.request('/paypal/login');const unknownState=new URL(unknownStart.res.headers.get('location')).searchParams.get('state');
  const unknown=await h.request(`/paypal/callback?state=${unknownState}&code=stub`,{cookie:unknownStart.res.headers.get('set-cookie').split(';')[0]});assert.match(unknown.res.headers.get('location'),/failed/);assert.equal(h.store.users().length,3);
});
test('mocked OAuth identity collision, mismatched payer ID and expired state cannot link',async t=>{
  const h=await harness(t,{oauth:true});const one=await h.login('cmt.one@example.test');
  h.store.db.prepare('UPDATE users SET recipient=? WHERE id=?').run(JSON.stringify({id:'OTHERPAYER0000',mode:'sandbox',verified:true,country:'MY'}),one.user.id);
  const begin=await h.request('/paypal/link',{method:'POST',...one,data:{password:'Synthetic-only-password42'}});const state=new URL(begin.value.url).searchParams.get('state');
  const result=await h.request(`/paypal/callback?state=${state}&code=stub`,{cookie:`${one.cookie}; ${begin.res.headers.get('set-cookie').split(';')[0]}`});assert.match(result.res.headers.get('location'),/failed/);assert.equal(h.store.user(one.user.id).paypal_sub,null);
  const start=await h.request('/paypal/login');const s=new URL(start.res.headers.get('location')).searchParams.get('state');h.store.db.prepare('UPDATE oauth SET expires=0 WHERE state=?').run(digest(s));const expired=await h.request(`/paypal/callback?state=${s}&code=stub`,{cookie:start.res.headers.get('set-cookie').split(';')[0]});assert.match(expired.res.headers.get('location'),/failed/);
});
test('unconfigured Sandbox metadata and server guard block submission but retain independent account/policy features',async t=>{
  const h=await harness(t);h.config.mode='sandbox';h.config.googleKey='';h.config.spreadsheet='';h.config.aiKey='';h.config.paypalClient='';h.config.paypalSecret='';
  const one=await h.login('cmt.one@example.test');
  const session=await h.request('/session',one);assert.equal(session.value.mode,'sandbox');assert.deepEqual(session.value.integrations,{sheets:false,ai:false,paypal:false,recipient:false});
  const result=await h.request('/claims',{method:'POST',...one,headers:{'Idempotency-Key':'missing-services-key'},data:{receipt_base64:readFileSync('apps/web/demo/mixed.png').toString('base64'),context:'Synthetic event context for missing integration test.'}});
  assert.equal(result.res.status,503);assert.equal(result.value.code,'integration_not_configured');assert.equal(h.store.claims().length,0);
  const treasurer=await h.login('treasurer@example.test');assert.equal((await h.request('/members',treasurer)).res.status,200);assert.equal((await h.request('/event',treasurer)).res.status,200);
});

test('Treasurer password-only flow resolves existing identity and preserves account/password records',async t=>{
  const h=await harness(t);const before=h.store.users();
  const result=await h.request('/login/treasurer',{method:'POST',data:{password:'Synthetic-only-password42'}});
  assert.equal(result.res.status,200);assert.equal(result.value.user.role,'treasurer');assert.equal(result.value.user.id,before.find(u=>u.role==='treasurer').id);
  assert.deepEqual(h.store.users(),before);
  h.store.db.prepare("UPDATE users SET email='existing-shared-account@example.test' WHERE role='treasurer'").run();
  const renamed=await h.request('/login/treasurer',{method:'POST',data:{password:'Synthetic-only-password42'}});assert.equal(renamed.res.status,200);assert.equal(renamed.value.user.email,'existing-shared-account@example.test');
});
test('role-form mismatch and browser role/identity fields cannot create a Treasurer session',async t=>{
  const h=await harness(t);
  const committeeTreasurer=await h.request('/login',{method:'POST',data:{email:'treasurer@example.test',password:'Synthetic-only-password42'}});assert.equal(committeeTreasurer.res.status,401);assert.equal(committeeTreasurer.res.headers.get('set-cookie'),null);
  for(const data of [{email:'cmt.one@example.test',password:'Synthetic-only-password42',role:'treasurer'},{password:'Synthetic-only-password42',user_id:h.store.users()[0].id}])assert.equal((await h.request('/login',{method:'POST',data})).res.status,400);
  for(const extra of [{email:'treasurer@example.test'},{role:'treasurer'},{user_id:'spoofed'}])assert.equal((await h.request('/login/treasurer',{method:'POST',data:{password:'Synthetic-only-password42',...extra}})).res.status,400);
  const committee=await h.login('cmt.one@example.test');assert.equal((await h.request('/members',committee)).res.status,403);assert.equal((await h.request('/budget',committee)).res.status,403);
});
test('invalid Treasurer passwords are rate limited; valid login retains origin/session protections',async t=>{
  const h=await harness(t);
  const evil=await h.request('/login/treasurer',{method:'POST',headers:{Origin:'https://evil.example'},data:{password:'Synthetic-only-password42'}});assert.equal(evil.res.status,403);
  for(let i=0;i<10;i++){const invalid=await h.request('/login/treasurer',{method:'POST',data:{password:'invalid-password'}});assert.equal(invalid.res.status,401);assert.equal(invalid.value.error,'Password is incorrect.');assert.equal(invalid.res.headers.get('set-cookie'),null);}
  assert.equal((await h.request('/login/treasurer',{method:'POST',data:{password:'Synthetic-only-password42'}})).res.status,429);
});
test('shared Treasurer ambiguity fails closed without creating or changing accounts',async t=>{
  const h=await harness(t);const before=h.store.users();
  h.store.db.prepare("UPDATE users SET role='treasurer' WHERE email='cmt.one@example.test'").run();
  assert.equal((await h.request('/login/treasurer',{method:'POST',data:{password:'Synthetic-only-password42'}})).res.status,503);
  assert.equal(h.store.users().length,before.length);
});
test('a Committee password cannot authenticate the shared Treasurer or change its authorization',async t=>{
  const h=await harness(t);const cmt=h.store.users().find(u=>u.role==='cmt');
  h.store.db.prepare('UPDATE users SET password=? WHERE id=?').run(passwordHash('Committee-only-secret42'),cmt.id);
  const forged=await h.request('/login/treasurer',{method:'POST',data:{password:'Committee-only-secret42'}});assert.equal(forged.res.status,401);assert.equal(forged.res.headers.get('set-cookie'),null);
  const actual=await h.request('/login',{method:'POST',data:{email:cmt.email,password:'Committee-only-secret42'}});assert.equal(actual.res.status,200);assert.equal(actual.value.user.role,'cmt');
});

test('Remember me creates a 30-day session; unchecked login uses a browser-session cookie',async t=>{
  const h=await harness(t);
  const transient=await h.request('/login',{method:'POST',data:{email:'cmt.one@example.test',password:'Synthetic-only-password42',remember:false}});
  assert.equal(transient.res.status,200);assert.doesNotMatch(transient.res.headers.get('set-cookie'),/Max-Age/);
  const persistent=await h.request('/login/treasurer',{method:'POST',data:{password:'Synthetic-only-password42',remember:true}});
  assert.equal(persistent.res.status,200);assert.match(persistent.res.headers.get('set-cookie'),/Max-Age=2592000/);
  const session=h.store.db.prepare('SELECT expires FROM sessions WHERE user_id=?').get(persistent.value.user.id);
  assert.ok(session.expires>Date.now()+29*86400000&&session.expires<=Date.now()+30*86400000);
  assert.equal((await h.request('/login/treasurer',{method:'POST',data:{password:'Synthetic-only-password42',remember:'true'}})).res.status,400);
});

test('local fixture recovery accepts A, revokes sessions, and leaves normal password rules unchanged',async t=>{
  const h=await harness(t);const current=await h.login('cmt.one@example.test');
  assert.throws(()=>passwordHash('A'));
  assert.equal((await h.request('/password',{method:'POST',...current,data:{current_password:'Synthetic-only-password42',new_password:'A'}})).res.status,400);
  assert.equal((await h.request('/session')).value.recovery_mode,'local-demo');
  const reset=await h.request('/demo/reset-password',{method:'POST',data:{role:'committee',email:'cmt.one@example.test',password:'A'}});
  assert.equal(reset.res.status,200);assert.equal(reset.value.password,undefined);
  assert.equal((await h.request('/event',current)).res.status,401);
  assert.equal((await h.request('/login',{method:'POST',data:{email:'cmt.one@example.test',password:'A'}})).res.status,200);
  assert.equal((await h.request('/login',{method:'POST',data:{email:'cmt.one@example.test',password:'Synthetic-only-password42'}})).res.status,401);
  const shared=await h.request('/demo/reset-password',{method:'POST',data:{role:'treasurer',password:'B'}});assert.equal(shared.res.status,200);
  assert.equal((await h.request('/login/treasurer',{method:'POST',data:{password:'B'}})).res.status,200);
});

test('direct recovery is blocked for Sandbox, non-loopback binding and disabled configuration',async t=>{
  const h=await harness(t);const before=h.store.users().map(u=>u.password);
  h.config.mode='sandbox';assert.equal((await h.request('/demo/reset-password',{method:'POST',data:{role:'treasurer',password:'A'}})).res.status,403);
  h.config.mode='fixture';h.config.host='0.0.0.0';assert.equal((await h.request('/session')).value.recovery_mode,'operator-link');assert.equal((await h.request('/demo/reset-password',{method:'POST',data:{role:'treasurer',password:'A'}})).res.status,403);
  h.config.host='127.0.0.1';h.config.demoPasswordReset=false;assert.equal((await h.request('/demo/reset-password',{method:'POST',data:{role:'treasurer',password:'A'}})).res.status,403);
  assert.deepEqual(h.store.users().map(u=>u.password),before);
});

test('demo recovery has origin/rate controls and matching responses for unknown accounts',async t=>{
  const h=await harness(t);const input={role:'committee',email:'missing@example.test',password:'A'};
  assert.equal((await h.request('/demo/reset-password',{method:'POST',data:input,headers:{Origin:'https://evil.example'}})).res.status,403);
  const absent=await h.request('/demo/reset-password',{method:'POST',data:input});const present=await h.request('/demo/reset-password',{method:'POST',data:{...input,email:'cmt.one@example.test'}});
  assert.deepEqual(absent.value,present.value);
  for(let i=0;i<3;i++)assert.equal((await h.request('/demo/reset-password',{method:'POST',data:input})).res.status,200);
  assert.equal((await h.request('/demo/reset-password',{method:'POST',data:input})).res.status,429);
});

test('Treasurer PayPal linking verifies the configured sender and role-bound OAuth login',async t=>{
  const h=await harness(t,{oauth:true});const treasurer=await h.login('treasurer@example.test');h.config.paypalSenderId='SENDER000';
  h.providers.paypal.identity=async()=>({sub:'treasurer-paypal-sub',payer_id:'SENDER000',verified:true});
  const begin=await h.request('/paypal/link',{method:'POST',...treasurer,data:{password:'Synthetic-only-password42'}});assert.equal(begin.res.status,200);
  const state=new URL(begin.value.url).searchParams.get('state');const browser=begin.res.headers.get('set-cookie').split(';')[0];
  const linked=await h.request(`/paypal/callback?state=${state}&code=stub`,{cookie:`${treasurer.cookie}; ${browser}`});assert.match(linked.res.headers.get('location'),/settings\/account/);assert.equal(h.store.user(treasurer.user.id).paypal_sub,'treasurer-paypal-sub');
  const start=await h.request('/paypal/login?role=treasurer&remember=true');const loginState=new URL(start.res.headers.get('location')).searchParams.get('state');
  const signed=await h.request(`/paypal/callback?state=${loginState}&code=stub`,{cookie:start.res.headers.get('set-cookie').split(';')[0]});assert.equal(signed.res.headers.get('location'),'/#/budget');assert.match(signed.res.headers.get('set-cookie'),/Max-Age=2592000/);
  const wrong=await h.request('/paypal/login');const wrongState=new URL(wrong.res.headers.get('location')).searchParams.get('state');
  const confused=await h.request(`/paypal/callback?state=${wrongState}&code=stub&role=treasurer`,{cookie:wrong.res.headers.get('set-cookie').split(';')[0]});assert.match(confused.res.headers.get('location'),/failed/);
});

test('Treasurer PayPal cannot be linked to an unconfigured or mismatched sender identity',async t=>{
  const h=await harness(t,{oauth:true});const treasurer=await h.login('treasurer@example.test');
  assert.equal((await h.request('/paypal/link',{method:'POST',...treasurer,data:{password:'Synthetic-only-password42'}})).res.status,503);
  h.config.paypalSenderId='EXPECTED-SENDER';const begin=await h.request('/paypal/link',{method:'POST',...treasurer,data:{password:'Synthetic-only-password42'}});
  const state=new URL(begin.value.url).searchParams.get('state');const result=await h.request(`/paypal/callback?state=${state}&code=stub`,{cookie:`${treasurer.cookie}; ${begin.res.headers.get('set-cookie').split(';')[0]}`});assert.match(result.res.headers.get('location'),/failed/);assert.equal(h.store.user(treasurer.user.id).paypal_sub,null);
});


test('PayPal first sign-in resolves each preassigned CMT and Treasurer without a website password',async t=>{
  const h=await harness(t,{oauth:true});
  const members=h.store.users(),one=members.find(u=>u.email==='cmt.one@example.test'),two=members.find(u=>u.email==='cmt.two@example.test'),treasurer=members.find(u=>u.role==='treasurer');
  for(const [user,payer]of [[one,'CMTONEPAYER'],[two,'CMTTWOPAYER']])h.store.db.prepare('UPDATE users SET recipient=? WHERE id=?').run(JSON.stringify({id:payer,mode:'sandbox',verified:true,country:'MY'}),user.id);
  h.config.paypalSenderId='TREASURERPAYER';
  const before=h.store.users().map(({id,email,password,recipient})=>({id,email,password,recipient}));
  for(const [user,payer]of [[one,'CMTONEPAYER'],[two,'CMTTWOPAYER'],[treasurer,'TREASURERPAYER']]){
    h.providers.paypal.identity=async()=>({sub:'subject-'+user.id,payer_id:payer,verified:true});
    const start=await h.request('/paypal/login'+(user.role==='treasurer'?'?role=treasurer':''));
    const state=new URL(start.res.headers.get('location')).searchParams.get('state'),browser=start.res.headers.get('set-cookie').split(';')[0];
    const signed=await h.request('/paypal/callback?state='+state+'&code=provider-code',{cookie:browser});
    assert.equal(signed.res.headers.get('location'),user.role==='treasurer'?'/#/budget':'/#/submit');
    const sessionCookie=signed.res.headers.getSetCookie().find(c=>c.startsWith('gantiin_session=')).split(';')[0];
    assert.equal((await h.request('/session',{cookie:sessionCookie})).value.user.id,user.id);
    assert.equal(h.store.user(user.id).paypal_sub,'subject-'+user.id);
    const replay=await h.request('/paypal/callback?state='+state+'&code=provider-code',{cookie:browser});
    assert.match(replay.res.headers.get('location'),/failed/);
  }
  assert.deepEqual(h.store.users().map(({id,email,password,recipient})=>({id,email,password,recipient})),before);
  assert.equal(h.store.db.prepare("SELECT count(*) AS n FROM audit WHERE action='paypal_identity_linked'").get().n,3);
  assert.equal(h.store.claims().length,0);assert.equal(h.store.payments().length,0);
});

test('PayPal automatic account matching rejects unverified, ambiguous, conflicting and browser-selected identities',async t=>{
  const h=await harness(t,{oauth:true});
  const one=h.store.users().find(u=>u.email==='cmt.one@example.test'),two=h.store.users().find(u=>u.email==='cmt.two@example.test');
  const recipient={id:'OWNERASSIGNEDPAYER',mode:'sandbox',verified:true,country:'MY'};
  const setRecipient=(user,value)=>h.store.db.prepare('UPDATE users SET recipient=? WHERE id=?').run(JSON.stringify(value),user.id);
  setRecipient(one,recipient);
  const attempt=async(identity,{role='',wrongBrowser=false,extra=''}={})=>{
    h.providers.paypal.identity=async()=>identity;
    const start=await h.request('/paypal/login'+(role?'?role='+role:''));
    const state=new URL(start.res.headers.get('location')).searchParams.get('state');
    const signed=await h.request('/paypal/callback?state='+state+'&code=provider-code'+extra,{cookie:wrongBrowser?'gantiin_oauth=another-browser':start.res.headers.get('set-cookie').split(';')[0]});
    assert.match(signed.res.headers.get('location'),/failed/);
    assert.ok(!signed.res.headers.get('set-cookie')?.includes('gantiin_session='));
  };
  const identity={sub:'new-subject',payer_id:recipient.id,verified:true};
  await attempt({...identity,verified:false});
  await attempt({...identity,payer_id:''});
  await attempt({...identity,sub:''});
  await attempt({...identity,payer_id:'UNASSIGNED'}, {extra:'&user_id='+one.id+'&email='+one.email});
  await attempt(identity,{wrongBrowser:true});
  await attempt(identity,{role:'treasurer'});
  setRecipient(two,recipient);await attempt(identity);setRecipient(two,{...recipient,id:'ANOTHERPAYER'});
  setRecipient(one,{...recipient,verified:false});await attempt(identity);setRecipient(one,recipient);
  setRecipient(one,{...recipient,mode:'fixture'});await attempt(identity);setRecipient(one,recipient);
  h.store.db.prepare('UPDATE users SET paypal_sub=? WHERE id=?').run('prior-subject',one.id);await attempt(identity);
  h.store.db.prepare('UPDATE users SET paypal_sub=NULL WHERE id=?').run(one.id);
  h.store.db.prepare('UPDATE users SET paypal_sub=? WHERE id=?').run(identity.sub,two.id);await attempt(identity);
  assert.equal(h.store.user(one.id).paypal_sub,null);assert.equal(h.store.users().length,3);
  assert.equal(h.store.db.prepare('SELECT count(*) AS n FROM sessions').get().n,0);
});


test('OAuth app selection follows the server-bound role through authorization and code exchange',async t=>{
  const h=await harness(t,{oauth:true}),calls=[];
  h.config.paypalSenderId='SENDERTEST';
  const one=h.store.users().find(u=>u.email==='cmt.one@example.test');h.store.db.prepare('UPDATE users SET recipient=? WHERE id=?').run(JSON.stringify({id:'CMTTEST',mode:'sandbox',verified:true,country:'MY'}),one.id);
  h.providers.paypal.authorizationUrl=(state,role)=>{calls.push(['authorize',role]);return 'https://www.sandbox.paypal.com/signin/authorize?state='+state;};
  h.providers.paypal.identity=async(code,role)=>{calls.push(['exchange',role]);return {sub:'subject-for-'+role,payer_id:role==='treasurer'?'SENDERTEST':'CMTTEST',verified:true};};
  for(const role of ['cmt','treasurer']){
    const start=await h.request('/paypal/login'+(role==='treasurer'?'?role=treasurer':'')),state=new URL(start.res.headers.get('location')).searchParams.get('state');
    const signed=await h.request('/paypal/callback?state='+state+'&code=stub',{cookie:start.res.headers.get('set-cookie').split(';')[0]});
    assert.equal(signed.res.headers.get('location'),role==='treasurer'?'/#/budget':'/#/submit');
  }
  assert.deepEqual(calls,[['authorize','cmt'],['exchange','cmt'],['authorize','treasurer'],['exchange','treasurer']]);
});
