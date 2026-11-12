import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { invariant } from '../domain/core.mjs';
import { createHash } from 'node:crypto';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const compress=promisify(gzip);
const loaded=new Map();
function load(file) {
  if(!loaded.has(file)){
    const pending=readFile(resolve('apps/web',file)).then(async data=>({data,etag:`W/"${createHash('sha256').update(data).digest('base64url')}"`,compressed:/\.(?:html|css|mjs|svg)$/.test(file)&&data.length>512?await compress(data):null}));
    loaded.set(file,pending);
    pending.catch(()=>{if(loaded.get(file)===pending)loaded.delete(file);});
  }
  return loaded.get(file);
}

export async function serveStatic(path, method, res, req) {
      const modules={'/src/components/event-brief.mjs':'src/components/event-brief.mjs','/src/pages/claim-detail.mjs':'src/pages/claim-detail.mjs','/src/pages/overview.mjs':'src/pages/overview.mjs','/demo/net-cost.png':'demo/net-cost.png'};
      const assets={'/src/lib/api.mjs':'src/lib/api.mjs','/src/lib/format.mjs':'src/lib/format.mjs','/src/components/status.mjs':'src/components/status.mjs','/':'index.html','/index.html':'index.html','/app.mjs':'app.mjs','/style.css':'style.css','/assets/gantiin-logo.svg':'assets/gantiin-logo.svg','/demo/mixed.png':'demo/mixed.png','/demo/printing.png':'demo/printing.png','/demo/printing-two.png':'demo/printing-two.png','/demo/personal.png':'demo/personal.png'};
      const files={...assets,...modules,'/theme.mjs':'theme.mjs','/assets/gantiin-logo-light.svg':'assets/gantiin-logo-light.svg','/assets/gantiin-symbol.svg':'assets/gantiin-symbol.svg','/assets/login-committee.svg':'assets/login-committee.svg','/assets/login-treasurer.svg':'assets/login-treasurer.svg','/assets/login-finance-hd.png':'assets/login-finance-hd.png','/assets/paypal-mark.svg':'assets/paypal-mark.svg'};
      invariant(Object.hasOwn(files,path),'Page not found.',404);
      const file=files[path];const asset=await load(file);
      const type=file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.mjs')?'text/javascript; charset=utf-8':file.endsWith('.svg')?'image/svg+xml':'image/png';
      res.setHeader('Cache-Control','public, no-cache');
      res.setHeader('ETag',asset.etag);res.setHeader('Vary','Accept-Encoding');
      if(req?.headers['if-none-match']?.split(',').some(value=>value.trim()===asset.etag||value.trim()==='*')){res.writeHead(304);res.end();return;}
      const acceptsGzip=(req?.headers['accept-encoding']||'').split(',').some(value=>{const [name,...parameters]=value.trim().split(';').map(s=>s.trim());return name==='gzip'&&!parameters.some(p=>/^q=0(?:\.0*)?$/.test(p));});
      const compressed=acceptsGzip&&asset.compressed;
      const data=compressed||asset.data;
      if(compressed)res.setHeader('Content-Encoding','gzip');
      res.writeHead(200,{'Content-Type':type,'Content-Length':data.length});res.end(method==='HEAD'?undefined:data);
}
