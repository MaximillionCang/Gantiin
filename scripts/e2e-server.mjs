import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/api/src/db.mjs';
import { seed } from './setup.mjs';
import { configuration } from '../apps/api/src/config.mjs';
import { createApplication } from '../apps/api/src/server.mjs';
export async function startTestServer({port=3100,worker=true}={}) {
  const directory=mkdtempSync(join(tmpdir(),'gantiin-e2e-'));
  const config=configuration({BUDGET_SOURCE:'fixture',APP_BASE_URL:`http://127.0.0.1:${port}`,PORT:String(port),DATABASE_PATH:join(directory,'test.sqlite'),WORKER_INTERVAL_MS:'150'});
  const store=new Store(config.dbPath);seed(store,{demo:true,password:'Synthetic-only-password42'});
  const app=createApplication({store,config,worker});
  await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(port,'127.0.0.1',resolve);});
  return app;
}
