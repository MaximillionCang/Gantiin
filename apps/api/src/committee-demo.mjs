import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { FixtureAI, FixturePayPal, FixtureSheets } from './adapters/fixtures.mjs';
import { digest, invariant, passwordHash, secret, validatePolicy } from './domain.mjs';

const directory=new URL('../../../demo/campus-career-day/',import.meta.url);
const eventContext=JSON.parse(readFileSync(new URL('event.json',directory),'utf8'));
const samples=new Map();
for(const line of readFileSync(new URL('expected-results.csv',directory),'utf8').trim().split(/\r?\n/).slice(1)) {
  const [file,description,quantity,unit,lineTotal,decision,eligible,reason]=line.slice(1,-1).split('","').map(value=>value.replaceAll('""','"'));
  const sample=samples.get(file)||{file,items:[]};
  sample.items.push({description,quantity:Number(quantity),unit_sen:Number(unit),line_sen:Number(lineTotal),decision,reason});samples.set(file,sample);
}
for(const sample of samples.values()) {
  sample.bytes=readFileSync(new URL(`receipts/${sample.file}`,directory));sample.hash=digest(sample.bytes);
}

export function committeeDemoConfig(config,ownerStore) {
  const dbPath=ownerStore.path===':memory:'?':memory:':join(dirname(ownerStore.path),'demo','committee.sqlite');
  return {...config,dbPath,mode:'fixture',budgetSource:'fixture',workerInterval:250,googleKey:'',spreadsheet:'',aiKey:'',aiModel:'',ocrModel:'',deciderModel:'',aiAuthorized:false,paypalClient:'',paypalSecret:'',paypalLogin:false,paypalSenderId:'',fundingConfirmed:false,demoPasswordReset:false};
}
function initialEvent() {return {...validatePolicy({...eventContext,synthetic:true},1),id:'committee-demo-event'};}
function initialSheet() {
  return {event_id:'committee-demo-event',funding_sen:100000,transactions:[],items:[],history:[],planned:[
    {id:'planned:demo-print',source:'Planned Items',row:2,description:'Event printing',category:'printing',context:'Printing for the event programme.',rule_id:'EVENT-RELEVANCE',approved:true},
    {id:'planned:demo-registration',source:'Planned Items',row:3,description:'Registration supplies',category:'registration',context:'Event registration supplies.',rule_id:'EVENT-RELEVANCE',approved:true}
  ]};
}
export function committeeDemoUser(store) {
  const marker=store.setting('committee_demo'),users=store.users();
  invariant(marker?.version===1&&store.setting('integration_mode')==='fixture'&&users.length===1&&users[0].id===marker.user_id&&users[0].role==='cmt'&&users[0].event_id==='committee-demo-event','This is not an isolated Committee demo store.',403,'demo_only');
  return users[0];
}
export function seedCommitteeDemo(store) {
  if(store.users().length)return committeeDemoUser(store);
  const id=randomUUID();
  store.transaction(()=>{
    store.set('integration_mode','fixture');store.set('committee_demo',{version:1,user_id:id});store.set('event',initialEvent());store.set('fixture_sheet',initialSheet());
    store.addUser({id,email:'demo.committee@example.test',name:'Demo Committee',role:'cmt',event_id:'committee-demo-event',password:passwordHash(secret()),recipient:{id:'demo-committee-recipient',country:'MY',mode:'fixture',verified:true,verified_at:new Date().toISOString(),verification_reference:'Isolated demo simulation'}});
  });
  return committeeDemoUser(store);
}
export function resetCommitteeDemo(store,user) {
  invariant(committeeDemoUser(store).id===user.id,'Committee demo access required.',403);
  store.transaction(()=>{
    store.db.exec('DELETE FROM payments; DELETE FROM claims; DELETE FROM audit; DELETE FROM oauth;');
    store.db.prepare("DELETE FROM settings WHERE substr(key,1,15)='fixture_payout_'").run();
    store.set('event',initialEvent());store.set('fixture_sheet',initialSheet());store.audit(user.id,'demo_reset','committee-demo-event');
  });
}
class CommitteeDemoAI extends FixtureAI {
  async extract(bytes) {
    const sample=[...samples.values()].find(item=>item.hash===digest(bytes));
    if(!sample) {
      try{return await super.extract(bytes);}
      catch{invariant(false,'This demo reads the supplied sample receipts. Choose Use sample or a receipt from the demo package.',422,'extraction_failed');}
    }
    return {currency:'MYR',adjustments_sen:0,total_sen:sample.items.reduce((sum,item)=>sum+item.line_sen,0),items:sample.items.map(({description,quantity,unit_sen,line_sen})=>({description,quantity,unit_sen,line_sen}))};
  }
  async assess(receipt,policy,references,context) {
    const expected=receipt.items.map(item=>[...samples.values()].flatMap(sample=>sample.items).find(sample=>sample.description===item.description));
    if(expected.some(item=>!item))return super.assess(receipt,policy,references,context);
    return {policy_version:policy.version,items:receipt.items.map((item,index)=>({item_id:item.id,decision:expected[index].decision,category:expected[index].decision==='accepted'?'event supplies':'personal',reason:expected[index].reason,rule_ids:[expected[index].decision==='accepted'?'EVENT-RELEVANCE':'EVENT-UNRELATED'],reference_ids:[]}))};
  }
  get model() {return 'committee-demo (simulation)';}
  get models() {return {ocr:'demo-receipt-reader (simulation)',decider:'demo-item-decisions (simulation)'};}
}
export function committeeDemoProviders(store) {return {ai:new CommitteeDemoAI(),paypal:new FixturePayPal(store),sheets:new FixtureSheets(store)};}
export function committeeDemoSample() {const first=samples.values().next().value;return {name:first.file,bytes:first.bytes,mime:'image/png'};}
