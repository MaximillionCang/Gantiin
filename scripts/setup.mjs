import { randomBytes, randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Store } from '../apps/api/src/db.mjs';
import { configuration } from '../apps/api/src/config.mjs';
import { passwordHash, validatePolicy } from '../apps/api/src/domain.mjs';

export function seed(store,{demo=false,password,funding=10000}={}) {
  if(store.users().length) throw new Error('Database already has accounts. Setup refuses to overwrite them.');
  const mode=demo?'fixture':'sandbox';
  const event=store.setting('event');
  const accounts=[['treasurer@example.test','Shared treasurer','treasurer'],['cmt.one@example.test','Synthetic CMT One','cmt'],['cmt.two@example.test','Synthetic CMT Two','cmt']];
  const credentials=[];
  store.transaction(()=>{
    store.set('integration_mode',mode);
    for(const [email,name,role] of accounts) {
      const initialPassword=password||randomBytes(18).toString('base64url');
      store.addUser({id:randomUUID(),email,name,role,event_id:event.id,password:passwordHash(initialPassword),recipient:demo&&role==='cmt'?{id:`fixture-${email.split('@')[0]}`,country:'MY',mode:'fixture',verified:true,verified_at:new Date().toISOString(),verification_reference:'Synthetic fixture only'}:null});
      credentials.push({email,password:initialPassword});
    }
    if(demo) {
      const policy=validatePolicy({name:'Synthetic test event',description:'Synthetic policy for reimbursement acceptance tests. This is not the selected real event.',currency:'MYR',insufficient_context:'reject',synthetic:true,rules:[{id:'P-PRINT',effect:'allow',category:'printing',instruction:'Allow printing for the stated event purpose with clear purchase context.'},{id:'P-REG',effect:'allow',category:'registration',instruction:'Allow registration supplies for the stated event purpose, including unlisted supplies with clear context.'},{id:'P-PERSONAL',effect:'deny',category:'personal',instruction:'Reject personal purchases, including personal headphones.'}]},1);
      store.set('event',{...policy,id:event.id});
      store.set('fixture_sheet',{event_id:event.id,funding_sen:funding,transactions:[],planned:[{id:'planned:print-1',source:'Planned Items',row:2,description:'Event printing',category:'printing',context:'Printing for event use',rule_id:'P-PRINT',approved:true}],history:[{id:'history:old-personal',source:'Approved History',row:2,description:'Personal headphones',category:'personal',context:'Synthetic historical example, current prohibition takes precedence',eligible_sen:3500,paid_sen:0,approved:true,policy_version:0},{id:'history:unapproved',source:'Approved History',row:3,description:'Unapproved expense',category:'other',context:'Must not enter AI references',approved:false}]});
    }
  });
  return {accounts:accounts.map(a=>a[0]),credentials};
}
if(process.argv[1]?.endsWith('setup.mjs')) {
  const config=configuration();
  const demo=process.argv.includes('--demo');
  if((demo?'fixture':'sandbox')!==config.mode) throw new Error(`Set INTEGRATION_MODE=${demo?'fixture':'sandbox'} before setup.`);
  const store=new Store(config.dbPath);store.acquireLease();
  try {
    const result=seed(store,{demo});
    const accessFile=join(dirname(config.dbPath),'initial-access.txt');
    const entries=result.credentials.map(c=>`${c.email}\nInitial password: ${c.password}`).join('\n\n');
    writeFileSync(accessFile,`${demo?'SYNTHETIC FIXTURE':'SANDBOX INITIAL'} LOCAL ACCESS\n${entries}\n\nChange passwords from Account. Delete this private note after distributing credentials.\n`,{mode:0o600});
    console.log(`${demo?'SYNTHETIC LOCAL FIXTURE':'UNCONFIGURED SANDBOX'} accounts created.\n${entries}\nPrivate credential note: ${accessFile}\nKeep this local. Change passwords from Account. No external services were called.`);
  } finally {store.close();}
}
