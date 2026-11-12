import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { invariant } from '../domain/core.mjs';

export async function serveStatic(path, method, res) {
      const modules={'/src/components/event-brief.mjs':'src/components/event-brief.mjs','/src/pages/claim-detail.mjs':'src/pages/claim-detail.mjs','/src/pages/overview.mjs':'src/pages/overview.mjs','/demo/net-cost.png':'demo/net-cost.png'};
      const assets={'/src/lib/api.mjs':'src/lib/api.mjs','/src/lib/format.mjs':'src/lib/format.mjs','/src/components/status.mjs':'src/components/status.mjs','/':'index.html','/index.html':'index.html','/app.mjs':'app.mjs','/style.css':'style.css','/assets/gantiin-logo.svg':'assets/gantiin-logo.svg','/demo/mixed.png':'demo/mixed.png','/demo/printing.png':'demo/printing.png','/demo/printing-two.png':'demo/printing-two.png','/demo/personal.png':'demo/personal.png'};
      const files={...assets,...modules,'/assets/login-finance-hd.png':'assets/login-finance-hd.png','/assets/paypal-mark.svg':'assets/paypal-mark.svg'};
      invariant(Object.hasOwn(files,path),'Page not found.',404);
      const file=files[path];const data=await readFile(resolve('apps/web',file));
      const type=file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.mjs')?'text/javascript; charset=utf-8':file.endsWith('.svg')?'image/svg+xml':'image/png';
      res.writeHead(200,{'Content-Type':type,'Content-Length':data.length});res.end(method==='HEAD'?undefined:data);
}
