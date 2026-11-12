import { randomUUID } from 'node:crypto';
import { aiReady } from './ai/config.mjs';
import { GoogleSheets } from './adapters/google.mjs';
import { reimbursementItems } from './domain/allocation.mjs';
import { selectReferences } from './domain/references.mjs';
import { itemRecords, sameItem, paymentReflected } from './adapters/sheets-contract.mjs';
import { AppError, invariant, text, email, money, sum, digest, now, receiptBytes, validateReceipt, validateAssessment, validatePolicy, passwordHash } from './domain.mjs';

export class Service {
  constructor(store,providers,config) { this.store=store; this.providers=providers; this.config=config; this.queue=Promise.resolve(); this.ticking=false; }
  exclusive(fn) { const task=this.queue.then(fn); this.queue=task.catch(()=>{}); return task; }
  event() { return this.store.setting('event'); }
  readiness(user) {
    const fixture=this.config.mode==='fixture'&&this.config.budgetSource==='fixture';
    const recipient=user?.recipient?JSON.parse(user.recipient):null;
    return {sheets:fixture||this.config.mode==='sandbox'&&!!(this.config.googleKey&&this.config.spreadsheet),ai:fixture||aiReady(this.config),paypal:fixture||this.config.mode==='sandbox'&&!!(this.config.paypalClient&&this.config.paypalSecret&&this.config.fundingConfirmed),recipient:!!(recipient?.verified&&recipient.mode===this.config.mode&&recipient.country==='MY')};
  }
  publicUser(user) {
    const recipient=user.recipient?JSON.parse(user.recipient):null;
    return {id:user.id,name:user.name,email:user.email,role:user.role,event_id:user.event_id,recipient,paypal_linked:!!user.paypal_sub};
  }
  owned(user,id) {
    const c=this.store.claim(id);
    invariant(c && c.event_id===user.event_id && (user.role==='treasurer'||c.user_id===user.id),'Claim not found.',404);
    return c;
  }
  claimView(c) {
    const p=c.payment_id?this.store.payment(c.payment_id):null;
    const planned=p?(p.items||reimbursementItems(c.receipt,c.assessment,p.amount_sen)):[];
    const item_outcomes=c.receipt?.items.map(i=>{const a=c.assessment?.items.find(a=>a.item_id===i.id);const item=planned.find(a=>a.item_id===i.id);const eligible=a?(a.decision==='accepted'?i.net_sen??i.line_sen:0):null;const paid=p?.status==='succeeded'?(item?.paid_sen??0):0;return {item_id:i.id,net_sen:i.net_sen??i.line_sen,eligible_sen:eligible,planned_sen:item?.paid_sen??0,paid_sen:paid,unpaid_sen:eligible===null?null:eligible-paid};})||[];
    return {...c,claimant:this.store.user(c.user_id)?.name,payment:p,item_outcomes,paid_sen:p?.status==='succeeded'?p.amount_sen:0,unpaid_sen:c.assessment?c.eligible_sen-(p?.status==='succeeded'?p.amount_sen:0):null,coverage:p?.status==='succeeded'?(p.amount_sen===c.eligible_sen?'full':'partial'):'none'};
  }
  list(user) { return this.store.claims().filter(c=>c.event_id===user.event_id&&(user.role==='treasurer'||c.user_id===user.id)).map(c=>this.claimView(c)).reverse(); }
  createClaim(user,input,key) {
    this.store.assertLease();
    invariant(user.role==='cmt','Only CMT accounts submit receipts.',403);
    invariant(this.event().configured,'Ask the treasurer to configure the event policy first.',409,'setup_required');
    invariant(Object.values(this.readiness(user)).every(Boolean),'Integration not configured. Receipt submission requires Google Sheets, an authorized receipt AI provider, PayPal Sandbox and your verified recipient account.',503,'integration_not_configured');
    const context=input.context===undefined?'':text(input.context,'Purchase context',3000,0);
    const file=receiptBytes(input);
    const requestKey=text(key,'Idempotency-Key',100,8);
    const payloadHash=digest(JSON.stringify({receipt:file.hash,context}));
    const existing=this.store.db.prepare('SELECT id,payload_hash FROM claims WHERE user_id=? AND request_key=?').get(user.id,requestKey);
    if(existing) { invariant(existing.payload_hash===payloadHash,'This submission key was used with different content.',409); return this.store.claim(existing.id); }
    invariant(!this.store.db.prepare('SELECT id FROM claims WHERE event_id=? AND receipt_hash=?').get(user.event_id,file.hash),'This exact receipt has already been submitted for this event. A second payout is blocked.',409,'duplicate_receipt');
    const c={id:randomUUID(),user_id:user.id,event_id:user.event_id,created_at:now(),context,mime:file.mime,receipt_hash:file.hash,revision:1,processing:'received',allocation_complete:false,synthetic:this.config.mode==='fixture',error:null};
    this.store.transaction(()=>{
      this.store.db.prepare('INSERT INTO claims VALUES(?,?,?,?,?,?,?,?,?)').run(c.id,user.id,user.event_id,file.hash,requestKey,payloadHash,c.created_at,JSON.stringify(c),file.bytes);
      this.store.audit(user.id,'claim_submitted',c.id);
    });
    return c;
  }
  savePolicy(user,input) {
    this.store.assertLease();
    invariant(user.role==='treasurer','Treasurer access required.',403);
    const current=this.event();
    invariant(input.expected_version===current.version,'Policy changed. Reload before saving.',409);
    const policy=validatePolicy({...input,synthetic:this.config.mode==='fixture'},current.version+1);
    const result={...policy,id:current.id};
    this.store.transaction(()=>{this.store.set('event',result);this.store.audit(user.id,'policy_version_created',String(result.version));});
    return result;
  }
  createMember(user,input) {
    this.store.assertLease();
    invariant(user.role==='treasurer','Treasurer access required.',403);
    const member={id:randomUUID(),event_id:user.event_id,role:'cmt',name:text(input.name,'Member name',100),email:email(input.email),password:passwordHash(input.password)};
    invariant(!this.store.db.prepare('SELECT id FROM users WHERE email=?').get(member.email),'An account with that email already exists.',409);
    this.store.transaction(()=>{this.store.addUser(member);this.store.audit(user.id,'cmt_created',member.id);});
    return this.publicUser(member);
  }
  validateLedger(sheet) {
    money(sheet.funding_sen); money(sheet.remaining_sen);
    invariant(sheet.funding_sen-sum(sheet.transactions.map(t=>t.amount_sen))===sheet.remaining_sen,'Sheet budget does not reconcile.',503,'sheet_conflict');
    invariant(new Set(sheet.transactions.map(t=>t.id)).size===sheet.transactions.length,'Duplicate sheet payment IDs.',503,'sheet_conflict');
    const payments=this.store.payments();
    for(const t of sheet.transactions) {
      const p=payments.find(p=>p.id===t.id);
      invariant(p && p.status==='succeeded' && t.amount_sen===p.amount_sen && t.currency==='MYR' && t.claim_id===p.claim_id && t.user_id===p.user_id && t.provider_id===p.provider_item && t.confirmed_at===p.confirmed_at && t.recipient===p.recipient.id && t.row===p.sheet_row,'Spreadsheet transactions differ from the durable payment journal. Reconcile protected ranges before continuing.',503,'sheet_conflict');
      if(p.items)invariant(t.eligible_sen===p.eligible_sen&&t.unpaid_sen===p.eligible_sen-p.amount_sen&&t.policy_version===p.policy_version&&t.items_digest===p.items_digest,'Spreadsheet payment detail metadata differs from authorization.',503,'sheet_conflict');
    }
    invariant(new Set((sheet.items||[]).map(i=>i.record_id)).size===(sheet.items||[]).length,'Duplicate spreadsheet item identities.',503,'sheet_conflict');
    for(const item of sheet.items||[]){const p=payments.find(p=>p.id===item.payment_id);const expected=p&&itemRecords(p).find(i=>i.record_id===item.record_id);invariant(p?.status==='succeeded'&&expected&&sameItem(item,expected),'Spreadsheet item details differ from the durable payment journal.',503,'sheet_conflict');}
    for(const p of payments.filter(p=>p.sync==='synced')) invariant(paymentReflected(p,sheet),'A synchronized sheet payment or item is missing. Allocation has stopped.',503,'sheet_conflict');
    return payments;
  }
  async overviewBudget() {
    // Share concurrent display reads only; authorization always calls budget() afresh.
    if(!this.overviewRequest)this.overviewRequest=this.budget().finally(()=>{this.overviewRequest=null;});
    return this.overviewRequest;
  }
  async budget() {
    if(this.config.mode==='fixture'&&this.config.budgetSource!=='fixture') {
      const sheet=await new GoogleSheets(this.config).read(this.event());
      return {...sheet,reserved_sen:0,available_sen:sheet.remaining_sen};
    }
    const sheet=await this.providers.sheets.read(this.event());
    const payments=this.validateLedger(sheet);
    const reflected=new Set(sheet.transactions.map(t=>t.id));
    const reserved=sum(payments.filter(p=>p.status!=='failed'&&!reflected.has(p.id)).map(p=>p.amount_sen));
    return {...sheet,reserved_sen:reserved,available_sen:Math.max(0,sheet.remaining_sen-reserved)};
  }
  async processClaim(c) {
    this.store.assertLease();
    c.processing='processing'; c.error=null; this.store.saveClaim(c);
    try {
      const policy=this.event();
      const recipientDigest=digest(this.store.user(c.user_id)?.recipient||'');
      invariant(policy.configured,'Configure the event policy first.',503,'setup_required');
      const minimum=this.config.aiMinConfidence??0.90;
      const confidencePass=score=>typeof score==='number'&&Number.isFinite(score)&&score>=minimum&&score<=1;
      const realAI=this.config.mode==='sandbox';
      if(!c.receipt || realAI&&!confidencePass(c.receipt.extraction?.confidence)) {
        c.processing_stage='extracting';this.store.saveClaim(c);
        const row=this.store.db.prepare('SELECT receipt FROM claims WHERE id=?').get(c.id);
        c.extraction_evidence=await this.providers.ai.extract(row.receipt,c.mime);
        this.store.assertLease();
        c.models={ocr:this.providers.ai.models?.ocr||this.providers.ai.model};c.extracted_at=now();this.store.saveClaim(c);
        invariant(!realAI||confidencePass(c.extraction_evidence?.confidence),'Receipt reading is uncertain. Upload a clearer receipt or retry. No payment was created.',422,'ai_confidence_low');
        c.receipt=validateReceipt(c.extraction_evidence);
        c.assessment=null;
        c.requested_sen=c.receipt.total_sen;
        this.store.saveClaim(c);
      }
      c.processing_stage='reading_references';this.store.saveClaim(c);
      const budget=await this.budget();
      this.store.assertLease();
      const references=selectReferences(c.receipt,budget.references);
      if(!c.assessment || realAI&&!c.assessment.items.every(item=>confidencePass(item.confidence)) || c.policy?.version!==policy.version || c.references_digest!==digest(JSON.stringify(references)) || c.recipient_digest!==recipientDigest) {
        c.processing_stage='assessing';this.store.saveClaim(c);
        const output=await this.providers.ai.assess(c.receipt,policy,references,c.context);
        this.store.assertLease();
        c.assessment=validateAssessment(output,c.receipt,policy,references);
        c.policy=structuredClone(policy);c.references=structuredClone(references);c.model=this.providers.ai.model;c.models={...c.models,decider:this.providers.ai.models?.decider||this.providers.ai.model};c.assessed_at=now();
        c.policy_digest=digest(JSON.stringify(c.policy));c.references_digest=digest(JSON.stringify(c.references));
        c.recipient_digest=recipientDigest;
        c.eligible_sen=sum(c.receipt.items.filter(i=>c.assessment.items.find(a=>a.item_id===i.id).decision==='accepted').map(i=>i.net_sen??i.line_sen));
      }
      c.processing='assessed';this.store.saveClaim(c);
      if(realAI) {
        c.confidence_gate={minimum,ocr:c.receipt.extraction.confidence,decider_min:Math.min(...c.assessment.items.map(item=>item.confidence))};this.store.saveClaim(c);
        invariant(c.assessment.items.every(item=>confidencePass(item.confidence)),'An item decision is uncertain. Check the event description and retry. No payment was created.',422,'ai_confidence_low');
      }
      invariant(this.event().version===c.policy.version,'Policy changed during assessment. Retry using the current version.',409,'policy_changed');
      if(c.eligible_sen===0) {c.processing_stage='complete';c.allocation_complete=true;c.no_payment_reason=c.assessment.items.every(i=>i.decision==='rejected')?'All receipt items were rejected.':'Accepted goods have zero net cost. No payout is required.';this.store.saveClaim(c);return;}
      // A second fresh read closes the assessment-to-allocation gap.
      c.processing_stage='allocating';this.store.saveClaim(c);
      const fresh=await this.budget();
      this.store.assertLease();
      invariant(this.event().version===c.policy.version && digest(JSON.stringify(this.event()))===c.policy_digest,'Policy changed before allocation. Retry the current policy.',409,'policy_changed');
      invariant(digest(JSON.stringify(selectReferences(c.receipt,fresh.references)))===c.references_digest,'Approved references changed during assessment. Retry with current evidence.',409,'references_changed');
      invariant(digest(this.store.user(c.user_id)?.recipient||'')===c.recipient_digest,'Recipient verification changed during assessment. Retry before authorization.',409,'recipient_changed');
      const amount_sen=Math.min(c.eligible_sen,fresh.available_sen);
      if(amount_sen===0) {c.processing_stage='complete';c.allocation_complete=true;c.no_payment_reason='The event budget is exhausted. The eligible amount remains recorded without automatic future settlement.';this.store.saveClaim(c);return;}
      const user=this.store.user(c.user_id);
      const recipient=user.recipient?JSON.parse(user.recipient):null;
      invariant(recipient?.verified && recipient.mode===this.config.mode && recipient.country==='MY' && recipient.id,'A verified Malaysian Sandbox recipient must be bound through local account setup before payout.',503,'recipient_required');
      if(this.config.mode==='sandbox') invariant(this.config.fundingConfirmed,'Confirm Malaysian Sandbox MYR funding and sender fee coverage before payouts.',503,'setup_required');
      const lastRow=Math.max(1,...fresh.transactions.map(t=>t.row),...this.store.payments().map(p=>p.sheet_row));
      const p={id:randomUUID(),claim_id:c.id,user_id:c.user_id,event_id:c.event_id,amount_sen,currency:'MYR',recipient:structuredClone(recipient),policy_version:c.policy.version,assessment_digest:digest(JSON.stringify(c.assessment)),receipt_hash:c.receipt_hash,created_at:now(),sheet_row:lastRow+1,status:'reserved',sync:'not_required',error:null,synthetic:this.config.mode==='fixture'};
      p.items=reimbursementItems(c.receipt,c.assessment,amount_sen);p.eligible_sen=c.eligible_sen;p.items_digest=digest(JSON.stringify(p.items));
      p.sheet_item_start=Math.max(1,...this.store.payments().map(p=>p.sheet_item_start?p.sheet_item_start+p.items.length-1:1))+1;
      invariant(p.sheet_row<=(fresh.transaction_capacity??10001) && p.sheet_item_start+p.items.length-1<=(fresh.item_capacity??10001),'Expand the protected financial sheet capacity before authorizing payment.',503,'sheet_capacity');
      p.authorization={policy:structuredClone(c.policy),references:structuredClone(c.references),assessment:structuredClone(c.assessment),receipt:structuredClone(c.receipt),models:structuredClone(c.models||{}),...(realAI?{confidence_gate:structuredClone(c.confidence_gate)}:{}),recipient:structuredClone(recipient),amount_sen,items:structuredClone(p.items)};
      p.authorization_digest=digest(JSON.stringify(p.authorization));
      this.store.transaction(()=>{
        this.store.assertLease();
        invariant(!this.store.payments().some(p=>p.claim_id===c.id),'Claim already has a payment.',409);
        this.store.db.prepare('INSERT INTO payments VALUES(?,?,?,?)').run(p.id,c.id,p.sheet_row,JSON.stringify(p));
        c.payment_id=p.id;c.processing_stage='complete';c.allocation_complete=true;this.store.saveClaim(c);this.store.audit('system','payment_reserved',p.id);
      });
    } catch(error) {
      if(error.code==='lease_lost')throw error;
      this.store.assertLease();
      c.processing='processing_failed';c.error={code:error.code||'processing_failed',message:error instanceof AppError?error.message:'Technical processing failed. Retry this claim after checking setup.'};this.store.saveClaim(c);
    }
  }
  async processPayment(p) {
    this.store.assertLease();
    try {
      if(p.status==='failed') return;
      const c=this.store.claim(p.claim_id);
      invariant(c && c.payment_id===p.id && c.policy.version===p.policy_version && digest(JSON.stringify(c.assessment))===p.assessment_digest && c.receipt_hash===p.receipt_hash,'The saved authorization snapshot changed. Reconciliation is required.',503,'reconciliation_required');
      if(p.authorization)invariant(digest(JSON.stringify(p.authorization))===p.authorization_digest&&digest(JSON.stringify(p.items))===p.items_digest&&JSON.stringify(p.items)===JSON.stringify(p.authorization.items)&&digest(JSON.stringify(c.receipt))===digest(JSON.stringify(p.authorization.receipt))&&JSON.stringify(p.recipient)===JSON.stringify(p.authorization.recipient)&&p.amount_sen===p.authorization.amount_sen,'Immutable net-cost authorization changed. Reservation remains held.',503,'reconciliation_required');
      if(p.status==='succeeded') {await this.syncPayment(p);return;}
      // A persisted unknown state covers process death during provider submission.
      if(!p.provider_batch) {p.status='unknown';this.store.savePayment(p);this.store.assertLease();const batch=await this.providers.paypal.create(p);this.store.assertLease();p.provider_batch=batch;p.status='pending';this.store.savePayment(p);}
      const result=await this.providers.paypal.details(p);
      this.store.assertLease();
      invariant(result.batch===p.provider_batch && result.sender_item_id===p.id && result.recipient===p.recipient.id && result.amount_sen===p.amount_sen && result.currency==='MYR' && typeof result.item==='string' && result.item.length>0,'Provider result does not match the authorized payment. Reservation remains held.',503,'payment_unknown');
      p.provider_item=result.item;p.provider_status=result.status;p.checked_at=now();p.error=null;
      if(result.status==='SUCCESS') {p.status='succeeded';p.confirmed_at=now();p.sync='sync_pending';this.store.savePayment(p);this.store.audit('system','provider_success_confirmed',p.id);await this.syncPayment(p);}
      else if(['FAILED','RETURNED','BLOCKED','DENIED','CANCELED','REFUNDED','REVERSED'].includes(result.status)) {p.status='failed';p.sync='not_required';p.error={code:'provider_failed',message:`PayPal payout ended with ${result.status}. No automatic replacement payment is scheduled.`};this.store.savePayment(p);}
      else {p.status='pending';this.store.savePayment(p);}
    } catch(error) {
      if(error.code==='lease_lost')throw error;
      this.store.assertLease();
      p.error={code:error.code||'payment_unknown',message:error instanceof AppError?error.message:'Provider outcome remains uncertain. Funds are held for reconciliation.'};
      if(p.status==='succeeded') p.sync='sync_pending';
      this.store.savePayment(p);
    }
  }
  async syncPayment(p) {
    this.store.assertLease();
    const sheet=await this.providers.sheets.read(this.event());
    this.store.assertLease();
    this.validateLedger(sheet);
    if(!paymentReflected(p,sheet)) {this.store.assertLease();await this.providers.sheets.sync(p);this.store.assertLease();}
    const confirmed=await this.providers.sheets.read(this.event());
    this.store.assertLease();
    this.validateLedger(confirmed);
    invariant(paymentReflected(p,confirmed),'Spreadsheet has not confirmed payment and reimbursed-item writes.',503,'sync_pending');
    p.sync='synced';p.error=null;this.store.savePayment(p);
  }
  retry(user,id) {
    this.store.assertLease();
    const c=this.owned(user,id);
    const p=c.payment_id?this.store.payment(c.payment_id):null;
    invariant(c.processing==='processing_failed'||p && (['pending','unknown','reserved'].includes(p.status)||p.status==='succeeded'&&p.sync!=='synced'),'There is no recoverable technical operation for this claim. Unpaid differences are not automatically settled.',409);
    if(c.processing==='processing_failed') {c.processing='received';c.error=null;this.store.saveClaim(c);}
    this.store.audit(user.id,'technical_retry_requested',id);
  }
  async tick() {
    if(this.config.mode==='fixture'&&this.config.budgetSource!=='fixture')return;
    if(this.ticking) return;
    this.ticking=true;
    try { await this.exclusive(async()=>{
      this.store.assertLease();
      const checked=new Set();
      const reconcile=async()=>{for(const p of this.store.payments())if(!checked.has(p.id)&&p.status!=='failed'&&(p.status!=='succeeded'||p.sync!=='synced')){checked.add(p.id);await this.processPayment(p);}};
      await reconcile();
      for(const c of this.store.claims()) if(!c.allocation_complete && c.processing!=='processing_failed') {await this.processClaim(c);await reconcile();}
    }); } finally {this.ticking=false;}
  }
  start() { this.timer=setInterval(()=>this.tick().catch(()=>{}),this.config.workerInterval);this.timer.unref();this.tick().catch(()=>{}); }
  stop() { clearInterval(this.timer); }
}
