import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../backend/src/db.mjs';
import { createApplication } from '../backend/src/server.mjs';
import { configuration } from '../backend/src/config.mjs';
import { seed } from '../scripts/setup.mjs';
import { issuePasswordReset,redeemPasswordReset } from '../backend/src/password-reset.mjs';
import { passwordHash,passwordMatches } from '../backend/src/domain/core.mjs';

const initial='Synthetic-only-password42',changed='New-private-password93';
const token=url=>new URLSearchParams(new URL(url).hash.split('?')[1]).get('token');
function fixture(t){const store=new Store();seed(store,{demo:true,password:initial});t.after(()=>store.close());return store;}
test('operator grant is private, account bound, one use and revokes only its target sessions',t=>{
  const store=fixture(t),one=store.users()[1],two=store.users()[2];
  store.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run('one-session',one.id,'one-csrf',Date.now()+600000);
  store.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run('two-session',two.id,'two-csrf',Date.now()+600000);
  store.db.prepare('INSERT INTO oauth VALUES(?,?,?,?,?)').run('one-state','browser',one.id,'link',Date.now()+600000);
  const before=JSON.stringify({event:store.setting('event'),claims:store.claims(),payments:store.payments(),sheet:store.setting('fixture_sheet')});
  const link=issuePasswordReset(store.db,one.email,'https://gantiin.example'),value=token(link);
  assert.equal(link.startsWith('https://gantiin.example/#/forgot-password?token='),true);
  const metadata=JSON.stringify(store.db.prepare("SELECT * FROM settings WHERE key LIKE 'password_reset:%'").all());assert.equal(metadata.includes(value),false);
  assert.equal(redeemPasswordReset(store.db,value,changed),one.id);
  assert.equal(passwordMatches(changed,store.user(one.id).password),true);assert.equal(passwordMatches(initial,store.user(two.id).password),true);
  assert.equal(store.db.prepare('SELECT * FROM sessions WHERE user_id=?').all(one.id).length,0);assert.equal(store.db.prepare('SELECT * FROM sessions WHERE user_id=?').all(two.id).length,1);
  assert.equal(store.db.prepare('SELECT * FROM oauth WHERE user_id=?').all(one.id).length,0);
  assert.throws(()=>redeemPasswordReset(store.db,value,initial),/invalid or has expired/);
  assert.equal(JSON.stringify({event:store.setting('event'),claims:store.claims(),payments:store.payments(),sheet:store.setting('fixture_sheet')}),before);
});
test('expired, tampered, superseded and password-stale grants cannot reset an account',t=>{
  const store=fixture(t),one=store.users()[1],now=Date.now();
  const first=token(issuePasswordReset(store.db,one.email,'http://localhost:3000',{now}));
  assert.throws(()=>redeemPasswordReset(store.db,first,changed,{now:now+15*60000}),/invalid or has expired/);
  assert.throws(()=>redeemPasswordReset(store.db,'x'.repeat(64),changed),/invalid or has expired/);
  assert.throws(()=>redeemPasswordReset(store.db,first,'',{now}),/1-128/);
  const second=token(issuePasswordReset(store.db,one.email,'http://localhost:3000',{now}));assert.throws(()=>redeemPasswordReset(store.db,first,changed,{now}),/invalid or has expired/);
  store.db.prepare('UPDATE users SET password=? WHERE id=?').run(passwordHash('Independently-changed94'),one.id);
  assert.throws(()=>redeemPasswordReset(store.db,second,changed,{now}),/invalid or has expired/);
  assert.throws(()=>issuePasswordReset(store.db,'missing@example.test','https://gantiin.example'),/No existing/);
  assert.throws(()=>issuePasswordReset(store.db,one.email,'http://public.example'),/HTTPS/);
});
test('public reset enforces origin, strict fields, rate limits and works without a signed-in session',async t=>{
  const store=new Store();seed(store,{demo:true,password:initial});
  const config=configuration({BUDGET_SOURCE:'fixture',DEMO_PASSWORD_RESET_ENABLED:'false'}),app=createApplication({store,config,worker:false,lease:false});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));config.base=`http://127.0.0.1:${app.server.address().port}`;t.after(()=>app.close());
  const one=store.users()[1],value=token(issuePasswordReset(store.db,one.email,config.base));
  const post=(data,origin=config.base)=>fetch(config.base+'/api/password/reset',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
  assert.equal((await (await fetch(config.base+'/api/session')).json()).recovery_mode,'operator-link');
  assert.equal((await post({token:value,password:changed},'https://wrong.example')).status,403);
  assert.equal((await post({token:value,password:changed,email:store.users()[2].email})).status,400);
  assert.equal((await post({token:value,password:changed})).status,200);assert.equal(passwordMatches(changed,store.user(one.id).password),true);
  for(let i=0;i<3;i++)assert.equal((await post({token:value,password:initial})).status,400);
  assert.equal((await post({token:value,password:initial})).status,429);
});
