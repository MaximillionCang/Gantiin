import test from 'node:test';
import assert from 'node:assert/strict';
import { GoogleSheets, BUDGET_FORMULA } from '../apps/api/src/adapters/google.mjs';
import { PayPalSandbox } from '../apps/api/src/adapters/paypal.mjs';
import { Gemini } from '../apps/api/src/adapters/gemini.mjs';
import { configuration } from '../apps/api/src/config.mjs';
import { extracted } from './helpers/ai.mjs';
import { TRANSACTION_HEADERS, ITEM_HEADERS, itemRecords, itemValues, parseItemRow } from '../apps/api/src/adapters/sheets-contract.mjs';
import { reimbursementItems } from '../apps/api/src/domain/allocation.mjs';
import { validateReceipt } from '../apps/api/src/domain/receipt.mjs';

test('Google adapter contract: protected formula, integer budget, approved references and fixed-row write',async()=>{
  const sheets=new GoogleSheets(configuration({}));const calls=[];
  sheets.request=async(path,method,body)=>{calls.push({path,method,body});
    if(path.startsWith('?fields=sheets(properties'))return {sheets:['Event Budget','Transactions','Reimbursed Items'].map((title,i)=>({properties:{title,sheetId:101+i,gridProperties:{rowCount:10001}},protectedRanges:[{range:{sheetId:101+i},warningOnly:false}]}))};
    if(path.startsWith('/values:batchGet'))return {valueRanges:[{values:[['event-1','MYR',10000,10000,'v1']]},{values:[['p1','Printing','printing','For event',true,'P-PRINT']]},{values:[['h1','Personal','personal','Old purchase',false,3500,0,0]]},{values:[]},{values:[]},{values:[TRANSACTION_HEADERS]},{values:[ITEM_HEADERS]}]};
    if(path.includes('valueRenderOption=FORMULA'))return {values:[[BUDGET_FORMULA]]};
    if(path==='?fields=sheets.properties')return {sheets:[{properties:{title:'Transactions',sheetId:104,gridProperties:{rowCount:10001}}}]};
    return {};
  };
  const result=await sheets.read({id:'event-1'});assert.equal(result.remaining_sen,10000);assert.deepEqual(result.references.map(r=>r.id),['planned:p1']);
  const p={id:'payment-1',claim_id:'claim-1',user_id:'cmt-1',amount_sen:3000,provider_item:'PPITEM',confirmed_at:'2026-11-06T00:00:00Z',recipient:{id:'PAYER'},sheet_row:7};
  await sheets.sync(p);await sheets.sync(p);
  const writes=calls.filter(c=>c.method==='POST');assert.equal(writes.length,2);assert.deepEqual(writes[0].body,writes[1].body);assert.equal(writes[0].body.requests[0].updateCells.range.startRowIndex,6);assert.ok(!JSON.stringify(writes).includes('appendCells'));
});
test('Google adapter rejects unprotected financial sheets and changed formulas',async()=>{
  const sheets=new GoogleSheets(configuration({}));sheets.request=async()=>({sheets:[]});await assert.rejects(()=>sheets.read({id:'event-1'}),/Protect/);
  sheets.request=async path=>path.startsWith('?fields=')?{sheets:['Event Budget','Transactions','Reimbursed Items'].map((title,i)=>({properties:{title,sheetId:i,gridProperties:{rowCount:10001}},protectedRanges:[{range:{sheetId:i}}]}))}:path.startsWith('/values:batchGet')?{valueRanges:[{values:[['event-1','MYR',10000,10000]]},{},{},{},{},{values:[TRANSACTION_HEADERS]},{values:[ITEM_HEADERS]}]}:{values:[['=1']]};
  await assert.rejects(()=>sheets.read({id:'event-1'}),/formula changed/);
});
const payment={id:'stable-payment-id',created_at:new Date().toISOString(),amount_sen:3000,recipient:{id:'VERIFIEDPAYER'},provider_batch:'BATCH123'};
test('PayPal adapter sends MYR from stable identity and recovers duplicate original batch',async()=>{
  const paypal=new PayPalSandbox({...configuration({}),fundingConfirmed:true});const calls=[];
  paypal.request=async(...args)=>{calls.push(args);return {ok:true,data:{batch_header:{payout_batch_id:'BATCH123'}}};};
  assert.equal(await paypal.create(payment),'BATCH123');const [path,method,body,id]=calls[0];assert.equal(path,'/v1/payments/payouts');assert.equal(method,'POST');assert.equal(id,payment.id);assert.equal(body.sender_batch_header.sender_batch_id,payment.id);assert.deepEqual(body.items[0].amount,{currency:'MYR',value:'30.00'});assert.equal(body.items[0].receiver,payment.recipient.id);
  paypal.request=async()=>({ok:false,data:{name:'DUPLICATE_BATCH_ID',links:[{href:'https://api-m.sandbox.paypal.com/v1/payments/payouts/BATCH123'}]}});assert.equal(await paypal.create(payment),'BATCH123');
  paypal.request=async()=>({ok:false,data:{name:'DUPLICATE_BATCH_ID',links:[{href:'https://evil.example/v1/payments/payouts/BATCH123'}]}});await assert.rejects(()=>paypal.create(payment),/not confirmed/);
});
test('PayPal adapter retrieves individual result, rejects batch-only success and stops aged create retries',async()=>{
  const paypal=new PayPalSandbox({...configuration({}),fundingConfirmed:true});
  paypal.request=async path=>path.includes('payouts-item')?{ok:true,data:{payout_item_id:'ITEM123',payout_batch_id:'BATCH123',transaction_status:'SUCCESS',payout_item:{sender_item_id:payment.id,receiver:'VERIFIEDPAYER',amount:{currency:'MYR',value:'30.00'}}}}:{ok:true,data:{batch_header:{payout_batch_id:'BATCH123'},items:[{payout_item_id:'ITEM123',payout_item:{sender_item_id:payment.id}}]}};
  const result=await paypal.details(payment);assert.equal(result.status,'SUCCESS');assert.equal(result.amount_sen,3000);assert.equal(result.sender_item_id,payment.id);
  paypal.request=async()=>({ok:true,data:{batch_header:{payout_batch_id:'BATCH123',batch_status:'SUCCESS'}}});await assert.rejects(()=>paypal.details(payment),/does not match/);
  await assert.rejects(()=>paypal.create({...payment,created_at:'2020-01-01T00:00:00Z'}),/deduplication window/);
});
test('Gemini adapter contract separates system/evidence, sends schema and no payment tools/secrets',async t=>{
  const requests=[];
  t.mock.method(globalThis,'fetch',async(url,options)=>{if(url instanceof Request){options={body:await url.text()};url=url.url;}requests.push({url:String(url),options,body:JSON.parse(options.body)});return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{role:'model',parts:[{text:JSON.stringify(extracted())}]}}]}),{status:200,headers:{'Content-Type':'application/json'}});});
  const ai=new Gemini({...configuration({}),aiKey:'mock-ai-key',aiModel:'explicit-test-model',aiAuthorized:true});
  await ai.extract(Buffer.from('synthetic-test-bytes'),'image/png');
  assert.ok(requests[0].url.startsWith('https://generativelanguage.googleapis.com/'));assert.equal(requests[0].body.contents[0].parts.find(p=>p.inlineData).inlineData.mimeType,'image/png');assert.equal(requests[0].body.generationConfig.responseMimeType,'application/json');assert.ok(requests[0].body.generationConfig.responseJsonSchema||requests[0].body.generationConfig.responseSchema);assert.equal(requests[0].body.tools,undefined);assert.ok(!JSON.stringify(requests[0].body).includes('mock-ai-key'));
});
test('configuration blocks live mode and AI charges without explicit authorization',async()=>{
  assert.throws(()=>configuration({PAYPAL_MODE:'live'}));assert.throws(()=>configuration({ENABLE_LIVE_PAYOUTS:'true'}));assert.throws(()=>configuration({APP_BASE_URL:'http://external.example'}));
  const ai=new Gemini({...configuration({}),aiKey:'test',aiModel:'test'});await assert.rejects(()=>ai.extract(Buffer.alloc(0),'image/png'),/not authorized/);
});

test('Google confirmed payment and item details use one retry-identical batch with stable rows',async()=>{
  const sheets=new GoogleSheets(configuration({}));const writes=[];
  sheets.request=async(path,method,body)=>{if(method==='POST'){writes.push(body);return {};}return {sheets:['Transactions','Reimbursed Items'].map((title,n)=>({properties:{title,sheetId:104+n,gridProperties:{rowCount:10001}}}))};};
  const receipt=validateReceipt(extracted());const assessment={policy_version:1,items:[{item_id:'item-1',decision:'accepted',category:'printing',rule_ids:['P-PRINT'],reference_ids:[]}]};
  const items=reimbursementItems(receipt,assessment,3000);
  const p={id:'stable-payment',claim_id:'stable-claim',user_id:'member',amount_sen:3000,eligible_sen:4000,policy_version:1,items,items_digest:'test-digest',sheet_row:3,sheet_item_start:5,provider_item:'confirmed-item',confirmed_at:'2026-11-08',recipient:{id:'verified'}};
  await sheets.sync(p);await sheets.sync(p);assert.deepEqual(writes[0],writes[1]);assert.equal(writes[0].requests.length,2);assert.equal(writes[0].requests[1].updateCells.range.startRowIndex,4);
  const record=itemRecords(p)[0];assert.deepEqual(parseItemRow(itemValues(record),5),record);assert.equal(record.paid_sen,3000);assert.equal(record.unpaid_sen,1000);
});

test('actual LangChain wire contract uses one shared key and separate configured OCR/decider calls',async t=>{
  const calls=[];const output={policy_version:2,items:[{item_id:'item-1',decision:'accepted',confidence:0.98,category:'printing',reason:'The receipt identifies the event printing required by current policy.',rule_ids:['P-PRINT'],reference_ids:[],policy_version:2}]};
  t.mock.method(globalThis,'fetch',async(url,options)=>{const req=url instanceof Request?url:new Request(url,options);calls.push({url:req.url,key:req.headers.get('x-goog-api-key'),body:JSON.parse(await req.text())});return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{role:'model',parts:[{text:JSON.stringify(calls.length===1?extracted():output)}]}}]}),{headers:{'Content-Type':'application/json'}});});
  const ai=new Gemini(configuration({GEMINI_API_KEY:'shared-synthetic-key',GEMINI_OCR_MODEL:'ocr-test',GEMINI_DECIDER_MODEL:'decider-test',AI_USAGE_AUTHORIZED:'true'}));
  const receipt=validateReceipt(await ai.extract(Buffer.from('synthetic'),'image/png'));
  await ai.assess(receipt,{configured:true,version:2,rules:[{id:'P-PRINT',category:'printing',effect:'allow',instruction:'Allow clearly identified event printing.'}]},[]);
  assert.equal(calls.length,2);assert.ok(calls[0].url.includes('ocr-test'));assert.ok(calls[1].url.includes('decider-test'));assert.deepEqual(calls.map(c=>c.key),['shared-synthetic-key','shared-synthetic-key']);assert.ok(calls.every(c=>!c.body.tools));assert.ok(!JSON.stringify(calls[1].body.contents).includes('recipient'));
  for(const call of calls){const schema=call.body.generationConfig.responseJsonSchema;assert.equal(schema.type,'object');assert.equal(schema.additionalProperties,false);assert.ok(schema.required.includes('items'));for(const key of ['maxItems','minItems','minLength','maxLength','pattern'])assert.ok(!JSON.stringify(schema).includes(`"${key}"`));}
});

test('approved Sheets references require real source IDs; numeric IDs stay traceable',async()=>{
  const sheets=new GoogleSheets(configuration({}));let sourceId='';
  sheets.request=async path=>path.startsWith('?fields=')?{sheets:['Event Budget','Transactions','Reimbursed Items'].map((title,i)=>({properties:{title,sheetId:i,gridProperties:{rowCount:10001}},protectedRanges:[{range:{sheetId:i}}]}))}:path.includes('valueRenderOption=FORMULA')?{values:[[BUDGET_FORMULA]]}:{valueRanges:[{values:[['event-1','MYR',10000,10000]]},{values:[[sourceId,'Event printing','printing','Event programme',true,'P-PRINT']]},{values:[]},{values:[]},{values:[]},{values:[TRANSACTION_HEADERS]},{values:[ITEM_HEADERS]}]};
  for(const missing of ['',undefined,'   ']){sourceId=missing;await assert.rejects(()=>sheets.read({id:'event-1'}),/real source ID/);}
  sourceId=42;assert.equal((await sheets.read({id:'event-1'})).references[0].id,'planned:42');
});


test('Treasurer identity app is selected by role while Committee authorization retains its working app',()=>{
  const config=configuration({PAYPAL_CLIENT_ID:'payout-client',PAYPAL_CLIENT_SECRET:'payout-secret',PAYPAL_TREASURER_LOGIN_CLIENT_ID:'identity-client',PAYPAL_TREASURER_LOGIN_CLIENT_SECRET:'identity-secret',APP_BASE_URL:'https://gantiin.example.test'});
  const paypal=new PayPalSandbox(config);
  const committee=new URL(paypal.authorizationUrl('committee-state','cmt')),treasurer=new URL(paypal.authorizationUrl('treasurer-state','treasurer'));
  assert.equal(committee.searchParams.get('client_id'),'payout-client');assert.equal(treasurer.searchParams.get('client_id'),'identity-client');
  for(const url of [committee,treasurer]){assert.equal(url.origin,'https://www.sandbox.paypal.com');assert.equal(url.searchParams.get('redirect_uri'),'https://gantiin.example.test/api/paypal/callback');assert.ok(url.searchParams.get('scope').split(' ').includes('openid'));}
  assert.equal(treasurer.searchParams.get('state'),'treasurer-state');assert.equal(paypal.config.paypalClient,'payout-client');
});

test('Treasurer consent exchanges its own app credentials and payout still authenticates with the original Business app',async t=>{
  const config=configuration({PAYPAL_CLIENT_ID:'payout-client',PAYPAL_CLIENT_SECRET:'payout-secret',PAYPAL_TREASURER_LOGIN_CLIENT_ID:'identity-client',PAYPAL_TREASURER_LOGIN_CLIENT_SECRET:'identity-secret',APP_BASE_URL:'https://gantiin.example.test',SANDBOX_MYR_FUNDING_CONFIRMED:'true'});
  const paypal=new PayPalSandbox(config),authentication=[];
  const encoded=(client,secret)=>'Basic '+Buffer.from(client+':'+secret).toString('base64');
  t.mock.method(globalThis,'fetch',async(url,request)=>{
    assert.equal(new URL(url).origin,'https://api-m.sandbox.paypal.com');
    if(url.endsWith('/v1/oauth2/token')){
      const form=new URLSearchParams(request.body);authentication.push({authorization:request.headers.Authorization,grant:form.get('grant_type')});
      if(form.get('grant_type')==='authorization_code'){assert.equal(request.headers.Authorization,encoded('identity-client','identity-secret'));assert.equal(form.get('redirect_uri'),'https://gantiin.example.test/api/paypal/callback');return Response.json({access_token:'identity-access',expires_in:28800});}
      assert.equal(request.headers.Authorization,encoded('payout-client','payout-secret'));return Response.json({access_token:'payout-access',expires_in:28800});
    }
    if(url.includes('/userinfo?')){assert.equal(request.headers.Authorization,'Bearer identity-access');return Response.json({user_id:'verified-treasurer-subject',payer_id:'SENDERTEST',verified_account:true});}
    assert.ok(url.endsWith('/v1/payments/payouts'));assert.equal(request.headers.Authorization,'Bearer payout-access');
    assert.equal(JSON.parse(request.body).items[0].receiver,'CMTRECIPIENT');return Response.json({batch_header:{payout_batch_id:'STUBBATCH'}});
  });
  const identity=await paypal.identity('stub-code','treasurer');assert.deepEqual(identity,{sub:'verified-treasurer-subject',payer_id:'SENDERTEST',verified:true});
  assert.equal(await paypal.create({id:'isolated-payment',created_at:new Date().toISOString(),amount_sen:3000,recipient:{id:'CMTRECIPIENT'}}),'STUBBATCH');
  assert.deepEqual(authentication.map(a=>a.grant),['authorization_code','client_credentials']);
});

test('partial Treasurer identity configuration rejects that role without changing Committee login',()=>{
  const paypal=new PayPalSandbox(configuration({PAYPAL_CLIENT_ID:'main-client',PAYPAL_CLIENT_SECRET:'main-secret',PAYPAL_TREASURER_LOGIN_CLIENT_ID:'partial-client'}));
  assert.equal(new URL(paypal.authorizationUrl('state','cmt')).searchParams.get('client_id'),'main-client');
  assert.throws(()=>paypal.authorizationUrl('state','treasurer'),/Complete both Treasurer/);
});
