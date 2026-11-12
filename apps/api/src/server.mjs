import { cookies, body } from './http/transport.mjs';
import { aiReady } from './ai/config.mjs';
import { serveStatic } from './http/static.mjs';
import { redeemPasswordReset } from './password-reset.mjs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Store } from './db.mjs';
import { Service } from './service.mjs';
import { adapters } from './adapters/index.mjs';
import { configuration } from './config.mjs';
import { committeeDemoConfig, seedCommitteeDemo, committeeDemoUser, resetCommitteeDemo, committeeDemoProviders, committeeDemoSample } from './committee-demo.mjs';
import { AppError, invariant, text, email, digest, secret, passwordMatches, passwordHash } from './domain.mjs';

export function createApplication({config=configuration(),store=new Store(config.dbPath),providers,worker=true,lease=true,isolatedDemo=false}={}) {
  if(lease) store.acquireLease();
  invariant(!store.setting('integration_mode')||store.setting('integration_mode')===config.mode,'Database integration mode differs from configuration. Use a separate database for fixture and Sandbox.');
  const service=new Service(store,providers||adapters(store,config),config);
  let demo;
  const demoApplication=()=>{
    invariant(!isolatedDemo,'Nested demo workspaces are unavailable.',404);
    if(!demo) {
      const demoConfig=committeeDemoConfig(config,store),demoStore=new Store(demoConfig.dbPath);
      try {seedCommitteeDemo(demoStore);demo=createApplication({config:demoConfig,store:demoStore,providers:committeeDemoProviders(demoStore),worker,lease,isolatedDemo:true});}
      catch(error){demoStore.close();throw error;}
    }
    return demo;
  };
  const attempts=new Map(),resetAttempts=new Map();const dummy=passwordHash('Not-a-real-password-000');
  const sessionCookie=isolatedDemo?'gantiin_demo_session':'gantiin_session';
  const cookie=(name,value,age)=>`${name}=${value}; HttpOnly; SameSite=Lax; Path=${isolatedDemo?'/api/demo-cmt':'/'}${age===undefined?'':`; Max-Age=${age}`}${config.base.startsWith('https:')?'; Secure':''}`;
  const loginEnabled=()=>config.mode==='sandbox'&&config.paypalLogin&&!!config.paypalClient&&!!config.paypalSecret;
  const spreadsheetUrl=()=>/^[A-Za-z0-9_-]+$/.test(config.spreadsheet||'')?`https://docs.google.com/spreadsheets/d/${config.spreadsheet}/edit`:null;
  const loopback=value=>['localhost','127.0.0.1','::1','[::1]','::ffff:127.0.0.1'].includes(value);
  const demoResetEnabled=req=>config.mode==='fixture'&&store.setting('integration_mode')==='fixture'&&config.demoPasswordReset&&loopback(new URL(config.base).hostname)&&loopback(config.host)&&loopback(req.socket.remoteAddress);
  const session=req=>{
    const token=cookies(req)[sessionCookie];
    if(!token) return null;
    const r=store.db.prepare('SELECT * FROM sessions WHERE hash=? AND expires>?').get(digest(token),Date.now());
    const user=r?store.user(r.user_id):null;
    return user?{...r,user}:null;
  };
  const createSession=(res,user,remember=false)=>{
    const token=secret(),csrf=secret();
    const lifetime=remember?30*86400:8*3600;
    store.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    store.db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(token),user.id,csrf,Date.now()+lifetime*1000);
    res.setHeader('Set-Cookie',cookie(sessionCookie,token,remember?lifetime:undefined));return csrf;
  };
  const beginOAuth=(res,user,purpose,{role='cmt',remember=false}={})=>{
    invariant(loginEnabled(),'Login with PayPal needs Sandbox identity configuration.',503,'setup_required');
    const state=secret(),browser=secret();
    store.db.prepare('DELETE FROM oauth WHERE expires<?').run(Date.now());
    store.db.prepare('INSERT INTO oauth VALUES(?,?,?,?,?)').run(digest(state),digest(browser),user?.id||null,JSON.stringify({action:purpose,role:user?.role||role,remember}),Date.now()+600000);
    res.setHeader('Set-Cookie',cookie('gantiin_oauth',browser,600));
    return service.providers.paypal.authorizationUrl(state,user?.role||role);
  };
  const configuredPayer=user=>{
    if(user.role==='treasurer')return config.paypalSenderId;
    const recipient=user.recipient?JSON.parse(user.recipient):null;
    return recipient?.mode==='sandbox'&&recipient.verified?recipient.id:null;
  };
  const paypalLoginUser=(identity,role)=>store.transaction(()=>{
    invariant(identity.verified&&typeof identity.sub==='string'&&identity.sub.length>0&&typeof identity.payer_id==='string'&&identity.payer_id.length>0,'PayPal identity was not verified.',403);
    const linked=store.db.prepare('SELECT * FROM users WHERE paypal_sub=?').get(identity.sub);
    if(linked){
      invariant(linked.role===role&&linked.event_id===service.event().id&&configuredPayer(linked)===identity.payer_id,'PayPal account does not match the selected role or configured account.',403);
      return linked;
    }
    const matches=store.users().filter(user=>user.role===role&&user.event_id===service.event().id&&configuredPayer(user)===identity.payer_id);
    invariant(matches.length===1&&!matches[0].paypal_sub,'PayPal account is not uniquely assigned to an available account with the selected role.',403);
    const user=matches[0];
    store.db.prepare('UPDATE users SET paypal_sub=? WHERE id=?').run(identity.sub,user.id);
    store.audit(user.id,'paypal_identity_linked',user.id);
    return store.user(user.id);
  });
  const server=createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
    res.setHeader('Cache-Control','no-store');
    const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
    const redirect=url=>{res.writeHead(303,{Location:url});res.end();};
    try {
      const url=new URL(req.url,config.base);const path=url.pathname;const method=req.method;
      if(path.startsWith('/api/')) {
        if(!['GET','HEAD'].includes(method)) invariant(req.headers.origin===config.base,'Request origin is not allowed.',403);
        if(path.startsWith('/api/demo-cmt/')) {const child=demoApplication();req.url=req.url.replace('/api/demo-cmt/','/api/');child.server.emit('request',req,res);return;}
        let s=session(req);
        if(path==='/api/session'&&method==='GET') return send(200,{user:s?service.publicUser(s.user):null,csrf:s?.csrf,mode:config.mode,demo:isolatedDemo,demo_available:!isolatedDemo,paypal_login:loginEnabled(),paypal_sender_configured:!!config.paypalSenderId,recovery_mode:demoResetEnabled(req)?'local-demo':'operator-link',initialized:store.users().length>0,integrations:service.readiness(s?.user)});
        if(path==='/api/password/reset'&&method==='POST') {
          invariant(!isolatedDemo,'Use the main website reset link.',403);
          const time=Date.now(),key=`link:${req.socket.remoteAddress}`;
          for(const [address,record] of resetAttempts)if(record.until<time)resetAttempts.delete(address);
          invariant(resetAttempts.size<10000||resetAttempts.has(key),'Password reset is temporarily rate limited.',429);
          const record=resetAttempts.get(key)||{count:0,until:time+900000};
          invariant(record.count<5,'Too many reset attempts. Try again in 15 minutes.',429);record.count++;resetAttempts.set(key,record);
          const input=await body(req);invariant(Object.keys(input).length===2&&Object.keys(input).every(key=>['token','password'].includes(key)),'Unexpected reset fields.');
          redeemPasswordReset(store.db,input.token,input.password);
          res.setHeader('Set-Cookie',cookie(sessionCookie,'',0));
          return send(200,{ok:true,message:'Password updated. Sign in with your new password.'});
        }
        if(isolatedDemo&&path==='/api/login'&&method==='POST') {
          const input=await body(req);invariant(Object.keys(input).length===0,'Demo entry accepts no account fields.');
          const key=`demo:${req.socket.remoteAddress}`,time=Date.now(),previous=attempts.get(key);
          const record=previous?.until>time?previous:{count:0,until:time+900000};invariant(record.count<60,'Too many demo entries. Try again in 15 minutes.',429);record.count++;attempts.set(key,record);
          const user=committeeDemoUser(store);if(s)store.db.prepare('DELETE FROM sessions WHERE hash=?').run(s.hash);
          const csrf=createSession(res,user);return send(200,{user:service.publicUser(user),csrf,mode:'fixture',demo:true,demo_available:false,paypal_login:false,paypal_sender_configured:false,recovery_mode:'unconfigured',initialized:true,integrations:service.readiness(user)});
        }
        if(isolatedDemo&&['/api/login/treasurer','/api/demo/reset-password','/api/paypal/login','/api/paypal/callback'].includes(path))throw new AppError('Only Committee demo entry is available here.',403,'demo_only');
        if(path==='/api/demo/reset-password'&&method==='POST') {
          invariant(demoResetEnabled(req),'Direct password reset is available only in the local synthetic demo. Account recovery must be configured for other modes.',403,'demo_only');
          const input=await body(req);invariant(Object.keys(input).every(key=>['role','email','password'].includes(key)),'Unexpected reset fields.');
          invariant(['treasurer','committee'].includes(input.role),'Choose Treasurer or Committee.');
          const time=Date.now(),key=req.socket.remoteAddress;
          for(const [address,record] of resetAttempts)if(record.until<time)resetAttempts.delete(address);
          const record=resetAttempts.get(key)||{count:0,until:time+900000};invariant(record.count<5,'Too many reset attempts. Try again in 15 minutes.',429);record.count++;resetAttempts.set(key,record);
          let target;
          if(input.role==='treasurer') {const shared=store.db.prepare("SELECT * FROM users WHERE role='treasurer' AND event_id=?").all(service.event().id);invariant(shared.length===1,'Shared Treasurer account is unavailable.',503);target=shared[0];}
          else target=store.db.prepare("SELECT * FROM users WHERE email=? AND role='cmt' AND event_id=?").get(email(input.email),service.event().id);
          // One-character passwords are explicitly permitted only after the local fixture gate.
          const hash=passwordHash(input.password,1);
          if(target)store.transaction(()=>{store.db.prepare('UPDATE users SET password=? WHERE id=?').run(hash,target.id);store.db.prepare('DELETE FROM sessions WHERE user_id=?').run(target.id);store.db.prepare('DELETE FROM oauth WHERE user_id=?').run(target.id);store.audit(target.id,'local_demo_password_reset',target.id);});
          res.setHeader('Set-Cookie',cookie(sessionCookie,'',0));
          return send(200,{ok:true,message:'If a matching demo account exists, its password has been updated.'});
        }
        if((path==='/api/login'||path==='/api/login/treasurer')&&method==='POST') {
          const input=await body(req);const treasurerFlow=path==='/api/login/treasurer';
          const allowed=treasurerFlow?['password','remember']:['email','password','remember'];
          invariant(Object.keys(input).every(key=>allowed.includes(key)),treasurerFlow?'Treasurer sign-in accepts a password only.':'Committee sign-in accepts email and password only.',400,'login_flow_mismatch');
          invariant(input.remember===undefined||typeof input.remember==='boolean','Remember me must be true or false.');
          const address=treasurerFlow?'shared-treasurer':email(input.email);
          const key=`${req.socket.remoteAddress}:${treasurerFlow?'treasurer':'committee'}:${address}`;const time=Date.now();
          for(const [oldKey,old] of attempts) if(old.until<time)attempts.delete(oldKey);
          invariant(attempts.size<10000||attempts.has(key),'Login is temporarily rate limited. Try again later.',429);
          const ipKey=`ip:${req.socket.remoteAddress}`;
          const ip=attempts.get(ipKey)||{count:0,until:time+900000};
          invariant(ip.count<60,'Too many login attempts from this address. Try again in 15 minutes.',429);ip.count++;attempts.set(ipKey,ip);
          const record=attempts.get(key)||{count:0,until:time+900000};if(record.until<time){record.count=0;record.until=time+900000;}
          invariant(record.count<10,'Too many login attempts. Try again in 15 minutes.',429);record.count++;attempts.set(key,record);
          let user;
          if(treasurerFlow) {
            const shared=store.db.prepare("SELECT * FROM users WHERE role='treasurer'").all();
            invariant(shared.length===1 && shared[0].event_id===service.event().id,'Shared Treasurer sign-in is unavailable. Ask the operator to check account setup.',503,'treasurer_not_configured');
            user=shared[0];
          } else user=store.db.prepare("SELECT * FROM users WHERE email=? AND role='cmt'").get(address);
          invariant(passwordMatches(input.password,user?.password||dummy)&&user,treasurerFlow?'Password is incorrect.':'Email or password is incorrect.',401);
          attempts.delete(key);if(s) store.db.prepare('DELETE FROM sessions WHERE hash=?').run(s.hash);
          const csrf=createSession(res,user,input.remember===true);return send(200,{user:service.publicUser(user),csrf,integrations:service.readiness(user)});
        }
        if(path==='/api/paypal/login'&&method==='GET') {const role=url.searchParams.get('role')||'committee';invariant(['treasurer','committee'].includes(role),'Unknown sign-in role.');return redirect(beginOAuth(res,null,'login',{role:role==='treasurer'?'treasurer':'cmt',remember:url.searchParams.get('remember')==='true'}));}
        if(path==='/api/paypal/callback'&&method==='GET') {
          try {
            invariant(loginEnabled(),'PayPal identity integration is not configured.',503);
            const state=text(url.searchParams.get('state'),'OAuth state',128);
            const browser=cookies(req).gantiin_oauth||'';
            const saved=store.db.prepare('SELECT * FROM oauth WHERE state=?').get(digest(state));
            invariant(saved&&saved.expires>Date.now()&&saved.cookie_hash===digest(browser),'Identity authorization expired or does not match this browser.',403);
            store.db.prepare('DELETE FROM oauth WHERE state=?').run(digest(state));
            const intent=saved.purpose.startsWith('{')?JSON.parse(saved.purpose):{action:saved.purpose,role:'cmt',remember:false};
            invariant(['link','login'].includes(intent.action)&&['cmt','treasurer'].includes(intent.role),'Invalid identity flow.',403);
            invariant(!url.searchParams.has('error'),'PayPal authorization was canceled.',403);
            const identity=await service.providers.paypal.identity(text(url.searchParams.get('code'),'Authorization code',2000),intent.role);
            let destination='/#/settings/account?paypal=linked';
            if(intent.action==='link') {
              invariant(s?.user.id===saved.user_id&&s.user.role===intent.role&&s.user.event_id===service.event().id,'Sign into the same account before linking.',403);
              const recipient=s.user.recipient?JSON.parse(s.user.recipient):null;
              const payer=intent.role==='treasurer'?config.paypalSenderId:recipient?.mode==='sandbox'&&recipient.verified?recipient.id:null;
              invariant(payer&&identity.verified&&payer===identity.payer_id,'PayPal identity must match the configured sender or verified recipient account.',403);
              const collision=store.db.prepare('SELECT id FROM users WHERE paypal_sub=?').get(identity.sub);
              invariant(!collision||collision.id===s.user.id,'This PayPal identity is already linked.',409);
              store.db.prepare('UPDATE users SET paypal_sub=? WHERE id=?').run(identity.sub,s.user.id);store.audit(s.user.id,'paypal_identity_linked',s.user.id);
            } else {
              const user=paypalLoginUser(identity,intent.role);
              if(s) store.db.prepare('DELETE FROM sessions WHERE hash=?').run(s.hash);createSession(res,user,intent.remember===true);
              destination=user.role==='treasurer'?'/#/budget':'/#/submit';
            }
            res.setHeader('Set-Cookie',intent.action==='login'?[res.getHeader('Set-Cookie'),cookie('gantiin_oauth','',0)]:cookie('gantiin_oauth','',0));
            return redirect(destination);
          } catch {return redirect(s?.user?'/#/settings/account?paypal=failed':'/#/login?paypal=failed');}
        }
        invariant(s,'Sign in to continue.',401);
        invariant(s.user.event_id===service.event().id,'Event membership is not valid.',403);
        if(!['GET','HEAD'].includes(method)) invariant(req.headers['x-csrf-token']===s.csrf,'Session form token is invalid. Reload and try again.',403);
        const user=s.user;
        if(path==='/api/logout'&&method==='POST') {store.db.prepare('DELETE FROM sessions WHERE hash=?').run(s.hash);res.setHeader('Set-Cookie',cookie(sessionCookie,'',0));return send(200,{ok:true});}
        if(path==='/api/reset-demo'&&method==='POST') {
          invariant(isolatedDemo,'Reset is available only in the isolated Committee demo.',403,'demo_only');
          const input=await body(req);invariant(input.confirm===true&&Object.keys(input).length===1,'Confirm the demo reset.');
          await service.exclusive(()=>resetCommitteeDemo(store,user));return send(200,{ok:true});
        }
        if(path==='/api/sample-receipt'&&method==='GET') {
          invariant(isolatedDemo,'Sample receipts are available in the Committee demo.',403,'demo_only');
          const sample=committeeDemoSample();res.writeHead(200,{'Content-Type':sample.mime,'Content-Length':sample.bytes.length,'Content-Disposition':`inline; filename="${sample.name}"`});return res.end(sample.bytes);
        }
        if(path==='/api/password'&&method==='POST') {
          const input=await body(req);invariant(passwordMatches(input.current_password,user.password),'Current password is incorrect.',400);
          store.db.prepare('UPDATE users SET password=? WHERE id=?').run(passwordHash(input.new_password),user.id);
          store.db.prepare('DELETE FROM sessions WHERE user_id=? AND hash<>?').run(user.id,s.hash);store.audit(user.id,'password_changed',user.id);return send(200,{ok:true});
        }
        if(path==='/api/paypal/link'&&method==='POST') {
          const input=await body(req);
          if(user.role==='treasurer')invariant(config.paypalSenderId,'Configure the PayPal Sandbox sender account ID before linking the Treasurer.',503,'setup_required');
          invariant(passwordMatches(input.password,user.password),'Confirm your current website password to link PayPal.',400);
          return send(200,{url:beginOAuth(res,user,'link')});
        }
        if(path==='/api/event') {
          if(method==='GET') return send(200,service.event());
          if(method==='PUT') {const input=await body(req);return send(200,await service.exclusive(()=>service.savePolicy(user,input)));}
        }
        if(path==='/api/members') {
          invariant(user.role==='treasurer','Treasurer access required.',403);
          if(method==='GET') return send(200,store.users().filter(u=>u.role==='cmt'&&u.event_id===user.event_id).map(u=>service.publicUser(u)));
          if(method==='POST') {const input=await body(req);return send(201,service.createMember(user,input));}
        }
        if(path==='/api/budget'&&method==='GET') {
          invariant(user.role==='treasurer','Treasurer access required.',403);
          try{return send(200,{...await service.overviewBudget(),spreadsheet_url:spreadsheetUrl(),budget_status:'ready',budget_source:config.budgetSource});}
          catch{return send(200,{available_sen:null,remaining_sen:null,reserved_sen:null,spreadsheet_url:spreadsheetUrl(),budget_status:'unavailable',budget_source:config.budgetSource});}
        }
        if(path==='/api/integrations'&&method==='GET') {
          invariant(user.role==='treasurer','Treasurer access required.',403);
          return send(200,{mode:config.mode,budget_source:config.budgetSource,google:!!(config.googleKey&&config.spreadsheet),spreadsheet_url:spreadsheetUrl(),ai:aiReady(config),paypal:!!(config.paypalClient&&config.paypalSecret&&config.fundingConfirmed),paypal_login:loginEnabled(),note:'Configuration presence only. Service connectivity is verified separately.'});
        }
        if(path==='/api/claims') {
          if(method==='GET') return send(200,service.list(user));
          if(method==='POST') {const input=await body(req);return send(202,service.claimView(service.createClaim(user,input,req.headers['idempotency-key'])));}
        }
        const match=path.match(/^\/api\/claims\/([a-f0-9-]{36})(?:\/(receipt|retry))?$/);
        if(match) {
          const claim=service.owned(user,match[1]);
          if(!match[2]&&method==='GET') return send(200,service.claimView(claim));
          if(match[2]==='receipt'&&method==='GET') {
            const row=store.db.prepare('SELECT receipt FROM claims WHERE id=?').get(claim.id);
            res.writeHead(200,{'Content-Type':claim.mime,'Content-Length':row.receipt.length,'Content-Disposition':'inline; filename="receipt.png"'});return res.end(Buffer.from(row.receipt));
          }
          if(match[2]==='retry'&&method==='POST') {await service.exclusive(()=>service.retry(user,claim.id));return send(202,{ok:true});}
        }
        throw new AppError('API route not found.',404);
      }
      invariant(method==='GET'||method==='HEAD','Method not allowed.',405);
      if(path==='/favicon.ico'){res.writeHead(204);return res.end();}
      return await serveStatic(path,method,res,req);
    } catch(error) {if(!res.headersSent) send(error.status||500,{error:error instanceof AppError?error.message:'Unexpected server error. The operation remains recorded; retry safely after checking setup.',code:error.code||'server_error'});else res.end();}
  });
  server.requestTimeout=90000;
  if(worker) service.start();
  return {server,service,store,get demo(){return demo;},async close(){service.stop();await new Promise(r=>server.close(r));if(demo)await demo.close();await service.queue;store.close();}};
}
if(import.meta.url===pathToFileURL(resolve(process.argv[1]||'')).href) {
  const config=configuration();const app=createApplication({config});
  app.server.listen(config.port,config.host,()=>console.log(`Gantiin: ${config.base} (${config.mode==='fixture'?'SYNTHETIC FIXTURE SIMULATION':'PAYPAL SANDBOX'}, single process)`));
  let stopping=false;
  const stop=async()=>{if(stopping)return;stopping=true;await app.close();process.exit(0);};
  process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
