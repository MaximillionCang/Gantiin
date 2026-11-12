import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createServer } from 'node:net';
import { mkdtempSync,rmSync,realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startHttps } from '../scripts/start-https.mjs';
import { configuration } from '../apps/api/src/config.mjs';
import { createApplication } from '../apps/api/src/server.mjs';
import { Store } from '../apps/api/src/db.mjs';

function harness(t){
  const folder=mkdtempSync(join(tmpdir(),'gantiin-https-'));t.after(()=>{const target=realpathSync(folder);assert.ok(target.startsWith(join(realpathSync(tmpdir()),'gantiin-https-')));rmSync(target,{recursive:true,force:true});});
  return configuration({INTEGRATION_MODE:'sandbox',BUDGET_SOURCE:'google',DATABASE_PATH:join(folder,'isolated.sqlite'),PORT:'0'});
}
function child(){
  const result=new EventEmitter();result.stdout=new PassThrough();result.stderr=new PassThrough();result.killed=false;
  result.kill=()=>{result.killed=true;result.emit('exit',0,'SIGTERM');result.stdout.end();result.stderr.end();};
  return result;
}
const appFactory=options=>createApplication({...options,worker:false});
function releaseCheck(config){const other=new Store(config.dbPath);try{other.acquireLease();}finally{other.close();}}

test('HTTPS runner uses the generated callback origin and releases the real application lease on stop',async t=>{
  const config=harness(t),tunnel=child();
  const started=startHttps({config,createApp:appFactory,launch:()=>{setTimeout(()=>{tunnel.stderr.write('URL https://private-test.');tunnel.stderr.write('trycloudflare.com connected\n');},5);return tunnel;}});
  const running=await started;t.after(()=>running.close());
  assert.equal(running.returnUrl,'https://private-test.trycloudflare.com/api/paypal/callback');
  assert.equal(running.app.service.config.base,running.url);assert.equal(running.app.service.config.aiAuthorized,false);
  assert.equal(config.base,'http://localhost:3000');
  const response=await fetch(`http://127.0.0.1:${running.app.server.address().port}/api/session`);assert.equal(response.status,200);
  const other=new Store(config.dbPath);try{assert.throws(()=>other.acquireLease(),/Another application/);}finally{other.close();}
  await running.close();assert.equal(tunnel.killed,true);releaseCheck(config);
});

test('HTTPS runner refuses an occupied port without starting another tunnel or application',async t=>{
  const config=harness(t),server=createServer();await new Promise(done=>server.listen(0,'127.0.0.1',done));t.after(()=>new Promise(done=>server.close(done)));
  config.port=server.address().port;let launches=0;
  await assert.rejects(startHttps({config,launch:()=>{launches++;return child();},createApp:()=>{throw new Error('Must not create another application.');}}),/already in use/);
  assert.equal(launches,0);assert.equal(server.listening,true);
});

test('HTTPS tunnel failure closes the application and releases its database for a subsequent run',async t=>{
  const config=harness(t),tunnel=child();let finish;
  const failed=new Promise(done=>{finish=done;});
  const running=await startHttps({config,createApp:appFactory,launch:()=>{setTimeout(()=>tunnel.stdout.write('https://failure-test.trycloudflare.com'),5);return tunnel;},onFailure:finish});
  t.after(()=>running.close());tunnel.emit('exit',1);assert.match((await failed).message,/tunnel stopped/);
  assert.equal(running.app.server.listening,false);releaseCheck(config);
});

test('HTTPS startup timeout or cancellation kills only its own tunnel before opening the database',async t=>{
  const config=harness(t),tunnel=child();let applications=0;
  await assert.rejects(startHttps({config,launch:()=>tunnel,timeoutMs:10,createApp:()=>{applications++;}}),/did not provide/);
  assert.equal(tunnel.killed,true);assert.equal(applications,0);
  const controller=new AbortController();controller.abort();
  await assert.rejects(startHttps({config,signal:controller.signal,launch:()=>{throw new Error('Must not launch.');}}),{name:'AbortError'});
});
