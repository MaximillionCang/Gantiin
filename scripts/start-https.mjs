import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { configuration } from '../backend/src/config.mjs';
import { createApplication } from '../backend/src/server.mjs';

const tunnelOrigin=/https:\/\/[a-z0-9-]+\.trycloudflare\.com\b/;
const launchTunnel=config=>spawn(process.env.CLOUDFLARED_PATH||'cloudflared',[
  '--no-autoupdate','tunnel','--url',`http://127.0.0.1:${config.port}`
],{windowsHide:true,stdio:['ignore','pipe','pipe']});

async function requireFreePort(config){
  const probe=createServer();
  await new Promise((done,reject)=>{
    probe.once('error',()=>reject(new Error(`Port ${config.port} is already in use. Stop the existing Gantiin server with Ctrl+C first.`)));
    probe.listen(config.port,'127.0.0.1',()=>probe.close(done));
  });
}

export async function startHttps({config=configuration(),launch=launchTunnel,createApp=createApplication,timeoutMs=45000,signal,onFailure=()=>{}}={}){
  if(config.mode!=='sandbox')throw new Error('The HTTPS test command requires the Sandbox profile.');
  await requireFreePort(config);
  let tunnel,app,ready=false,closing=false,closed,timer,rejectFailure;
  const failed=new Promise((_,reject)=>{rejectFailure=reject;});
  failed.catch(()=>{});
  const close=()=>{
    if(closed)return closed;
    closing=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);
    closed=(async()=>{if(tunnel&&!tunnel.killed)tunnel.kill();if(app)await app.close();})();
    return closed;
  };
  const fail=error=>{
    if(closing)return;
    rejectFailure(error);
    if(ready)void close().then(()=>onFailure(error));
  };
  const abort=()=>fail(Object.assign(new Error('HTTPS test stopped.'),{name:'AbortError'}));
  signal?.addEventListener('abort',abort,{once:true});
  try{
    if(signal?.aborted)throw Object.assign(new Error('HTTPS test stopped.'),{name:'AbortError'});
    tunnel=launch(config);
    const address=new Promise(done=>{
      let buffer='';
      const read=chunk=>{buffer=(buffer+chunk.toString()).slice(-16384);const match=buffer.match(tunnelOrigin);if(match)done(match[0]);};
      tunnel.stdout?.on('data',read);tunnel.stderr?.on('data',read);
    });
    tunnel.once('error',()=>fail(new Error('Cannot start cloudflared. Check CLOUDFLARED_PATH or install the official cloudflared CLI.')));
    tunnel.once('exit',()=>fail(new Error('The HTTPS tunnel stopped. Restart start:https and update the PayPal Return URL.')));
    timer=setTimeout(()=>fail(new Error('Cloudflare did not provide a test URL. Check the network connection and retry.')),timeoutMs);
    const url=await Promise.race([address,failed]);
    app=createApp({config:{...config,base:url,host:'127.0.0.1'}});
    await Promise.race([new Promise(done=>{app.server.on('error',fail);app.server.listen(config.port,'127.0.0.1',done);}),failed]);
    clearTimeout(timer);ready=true;
    return {url,returnUrl:`${url}/api/paypal/callback`,app,tunnel,close};
  }catch(error){await close();throw error;}
}

if(import.meta.url===pathToFileURL(resolve(process.argv[1]||'')).href){
  const controller=new AbortController();
  const stop=()=>controller.abort();
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
  console.log('Starting Gantiin and a temporary HTTPS address...');
  const failed=error=>{if(error.name!=='AbortError'){console.error(error.message);process.exitCode=1;}};
  try{
    const running=await startHttps({signal:controller.signal,onFailure:failed});
    console.log(`Website: ${running.url}\nPayPal Return URL: ${running.returnUrl}\nKeep this terminal open. Ctrl+C stops both services. A new run creates a new PayPal Return URL.`);
  }catch(error){failed(error);}
}
