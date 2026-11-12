import test from 'node:test';
import assert from 'node:assert/strict';
import { overviewStats, overviewPage, spreadsheetAction } from '../apps/web/src/pages/overview.mjs';
import { createApi } from '../apps/web/src/lib/api.mjs';
import { detailPage } from '../apps/web/src/pages/claim-detail.mjs';
import { reimbursementStatus } from '../apps/web/src/components/status.mjs';

test('concise receipt result keeps approved and actually paid money distinct without audit copy',()=>{
  const claim={id:'receipt-id',claimant:'Committee',processing:'assessed',requested_sen:9500,eligible_sen:6000,paid_sen:0,unpaid_sen:6000,payment:{status:'pending',amount_sen:6000,sync:'not_required'},receipt:{items:[{id:'one',description:'Printing',quantity:1,unit_sen:6000,line_sen:6000,net_sen:6000},{id:'two',description:'Headphones',quantity:1,unit_sen:3500,line_sen:3500,net_sen:3500}]},assessment:{items:[{item_id:'one',decision:'accepted',reason:'Approved printing explanation must not appear.'},{item_id:'two',decision:'rejected',reason:'Headphones are not part of the event.'}]}};
  const html=detailPage(claim,{heading:()=>'<h1>Receipt result</h1>'});
  assert.match(html,/Reimbursed<\/dt><dd>RM0.00/);assert.match(html,/Receipt total<\/dt><dd>RM95.00/);assert.equal((html.match(/<dt>/g)||[]).length,2);assert.ok(!html.includes('Approved printing explanation'));assert.ok(!html.includes('Approved</dt>'));assert.ok(!html.includes('Unpaid</dt>'));
  for(const removed of ['Goods before discounts','confirmed paid','Decision details','Assessment and payment record','Assessed policy snapshot','Spreadsheet reference snapshot'])assert.ok(!html.includes(removed));
  assert.match(html,/data-action="show-rejection"/);assert.match(html,/aria-controls="rejection-dialog"/);assert.match(html,/Headphones are not part of the event/);assert.ok(!html.includes('class="decision-reason"'));
  assert.match(reimbursementStatus({...claim,payment:{status:'succeeded'},paid_sen:3000,unpaid_sen:3000}),/>Partial</);assert.match(reimbursementStatus({...claim,payment:{status:'unknown'}}),/>Unconfirmed</);
});

test('overview projects confirmed backend money, processing and sync independently',()=>{
  const now=new Date('2026-11-08T12:00:00Z');
  const rows=[
    {id:'paid',created_at:'2026-11-08T10:00:00Z',assessment:{},eligible_sen:7200,paid_sen:7200,unpaid_sen:0,payment:{status:'succeeded',amount_sen:7200,sync:'sync_pending'}},
    {id:'pending',created_at:'2026-11-07T10:00:00Z',assessment:{},eligible_sen:4000,paid_sen:0,unpaid_sen:4000,payment:{status:'pending',amount_sen:4000,sync:'not_required'}},
    {id:'received',created_at:'2026-11-06T10:00:00Z',processing:'received',assessment:null,eligible_sen:null,paid_sen:0,unpaid_sen:null},
    {id:'failed',created_at:'2026-11-05T10:00:00Z',processing:'processing_failed',assessment:null,paid_sen:0},
  ];
  const stats=overviewStats(rows,now);
  assert.equal(stats.eligible,11200);assert.equal(stats.paid,7200);assert.equal(stats.unpaid,4000);
  assert.equal(stats.processing,1);assert.equal(stats.syncPending,1);assert.equal(stats.paidCount,1);
  assert.equal(stats.days.reduce((sum,d)=>sum+d.count,0),4);assert.equal(rows[0].id,'paid');
  assert.equal(overviewStats([],now).days.length,7);
  assert.equal(overviewStats([{created_at:'2025-01-01'},{created_at:'2027-01-01'},{created_at:'invalid'}],now).days.reduce((sum,d)=>sum+d.count,0),0);
});
test('overview is honest when empty and escapes API-supplied claimant/event content',()=>{
  const event={configured:true,name:'<script>event</script>',description:'Actual event',version:1,rules:[]};
  const html=overviewPage({available_sen:10000,remaining_sen:10000,reserved_sen:0},[{id:'record',created_at:'2026-11-08T00:00:00Z',claimant:'<script>claimant</script>',assessment:null,processing:'received',paid_sen:0}],event,{heading:()=>'<h1>Overview</h1>',icon:()=>''});
  assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('Pending'));
  const empty=overviewPage({available_sen:0,remaining_sen:0,reserved_sen:0},[],event,{heading:()=>'',icon:()=>''});
  assert.ok(!empty.includes('Recent reimbursements'));assert.ok(!empty.includes('View history'));assert.ok(empty.includes('No submissions this week'));
});
test('spreadsheet shortcut cannot navigate to arbitrary origins or expose malformed configuration',()=>{
  const link=spreadsheetAction('https://docs.google.com/spreadsheets/d/configured_sheet/edit',()=> '');assert.match(link,/target="_blank"/);assert.match(link,/rel="noopener noreferrer"/);
  for(const invalid of [null,'javascript:alert(1)','https://evil.invalid/spreadsheets/d/x/edit','https://docs.google.com/spreadsheets/d/x/edit?key=secret'])assert.match(spreadsheetAction(invalid,()=>''),/<button disabled/);
});

test('browser API retains same-origin CSRF and submission idempotency contract',async()=>{
  let captured;const api=createApi({session:{csrf:'test-csrf'}},{fetcher:async(...args)=>{captured=args;return Response.json({id:'record'},{status:202});}});
  assert.deepEqual(await api('/claims',{method:'POST',data:{receipt_base64:'synthetic'},key:'stable-operation'}),{id:'record'});
  assert.equal(captured[0],'/api/claims');assert.equal(captured[1].credentials,'same-origin');assert.equal(captured[1].headers['X-CSRF-Token'],'test-csrf');assert.equal(captured[1].headers['Idempotency-Key'],'stable-operation');assert.deepEqual(JSON.parse(captured[1].body),{receipt_base64:'synthetic'});
});
test('demo API requests stay in their own namespace with an explicit normal-login override',async()=>{
  const requests=[],state={demo:true,session:{csrf:'demo-form-token'}};
  const api=createApi(state,{fetcher:async(...args)=>{requests.push(args);return Response.json({ok:true});}});
  await api('/claims');await api('/reset-demo',{method:'POST',data:{confirm:true}});await api('/session',{demo:false});
  assert.deepEqual(requests.map(request=>request[0]),['/api/demo-cmt/claims','/api/demo-cmt/reset-demo','/api/session']);assert.equal(requests[1][1].headers['X-CSRF-Token'],'demo-form-token');
});

test('browser API safely surfaces network, malformed and expired-session responses',async()=>{
  let expired=0;
  for(const [response,message] of [[new Response('<html>upstream failed</html>',{status:502}),/unreadable response/],[Response.json(null),/invalid response/],[Response.json({error:'Session expired'},{status:401}),/Session expired/]]){
    const api=createApi({session:{}},{fetcher:async()=>response,onUnauthorized:()=>expired++});await assert.rejects(api('/claims'),message);
  }
  assert.equal(expired,1);
  const api=createApi({},{fetcher:async()=>{throw new Error('private transport detail');}});await assert.rejects(api('/session'),/Connection lost/);
});
