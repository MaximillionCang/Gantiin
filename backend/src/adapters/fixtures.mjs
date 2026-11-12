import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { digest, invariant, now } from '../domain.mjs';
import { itemRecords } from './sheets-contract.mjs';

export function fixtureCatalog() {
  return JSON.parse(readFileSync(new URL('../../../data/examples/receipts.json', import.meta.url), 'utf8'));
}
export class FixtureSheets {
  constructor(store) { this.store = store; this.failRead = false; this.failSync = false; this.loseWriteResponse = false; }
  async read(event) {
    invariant(!this.failRead, 'Synthetic Sheets read failure.', 503, 'sheets_failed');
    const sheet = this.store.setting('fixture_sheet');
    invariant(sheet && sheet.event_id === event.id, 'Seed the synthetic spreadsheet first.', 503, 'setup_required');
    return {event_id:event.id, funding_sen:sheet.funding_sen, remaining_sen:sheet.funding_sen - sheet.transactions.reduce((s,t)=>s+t.amount_sen,0), transactions:sheet.transactions,items:sheet.items||[], references:[...sheet.planned.filter(r=>r.approved),...sheet.history.filter(r=>r.approved)], synthetic:true};
  }
  async sync(payment) {
    invariant(!this.failSync, 'Synthetic Sheets write failure.', 503, 'sync_pending');
    const sheet = this.store.setting('fixture_sheet');
    const existing = sheet.transactions.find(t=>t.id===payment.id);
    if (!existing) sheet.transactions.push({id:payment.id,claim_id:payment.claim_id,user_id:payment.user_id,amount_sen:payment.amount_sen,currency:'MYR',provider_id:payment.provider_item,confirmed_at:payment.confirmed_at,row:payment.sheet_row,recipient:payment.recipient.id,...(payment.items?{eligible_sen:payment.eligible_sen,unpaid_sen:payment.eligible_sen-payment.amount_sen,policy_version:payment.policy_version,items_digest:payment.items_digest}:{})});
    sheet.items??=[];
    for(const row of itemRecords(payment))if(!sheet.items.some(i=>i.record_id===row.record_id))sheet.items.push(row);
    this.store.set('fixture_sheet', sheet);
    invariant(!this.loseWriteResponse, 'Synthetic response lost after write.', 503, 'sync_pending');
  }
}
export class FixtureAI {
  constructor() { this.fail = false; }
  async extract(bytes) {
    invariant(!this.fail, 'Synthetic AI unavailable.', 503, 'extraction_failed');
    const catalog = fixtureCatalog();
    const fixture = catalog.find(f => digest(readFileSync(resolve('frontend/demo',f.file))) === digest(bytes));
    invariant(fixture, 'Fixture mode only reads the supplied synthetic receipt images. Configure Sandbox AI for other PNG/JPEG receipts.', 422, 'extraction_failed');
    return {...structuredClone(fixture.receipt),confidence:1};
  }
  async assess(receipt, policy, references, context) {
    invariant(!this.fail, 'Synthetic assessment unavailable.', 503, 'assessment_failed');
    return {policy_version:policy.version,items:receipt.items.map(i=>{
      const personal = /personal|headphones/i.test(i.description);
      const category = personal ? 'personal' : /print/i.test(i.description) ? 'printing' : 'registration';
      const rule = policy.rules.find(r=>[category,'*'].includes(r.category) && r.effect===(personal?'deny':'allow'));
      invariant(rule, 'Synthetic fixture policy does not contain the required rule. Use the demo seed or configure real AI.', 422, 'assessment_failed');
      const matching = references.filter(r=>r.category===category && r.description.toLowerCase()===i.description.toLowerCase());
      const availableContext=context||matching.map(r=>r.context).join(' ');
      if(!personal&&!/\b(event|registration|printing)\b/i.test(availableContext))return {item_id:i.id,decision:'rejected',confidence:1,category,reason:'The available evidence does not explain how this item supports the event. Insufficient context is rejected by default.',rule_ids:[rule.id],reference_ids:matching.map(r=>r.id)};
      return {item_id:i.id,decision:personal?'rejected':'accepted',confidence:1,category,reason:personal?`${i.description} is a personal-use purchase with no supported connection to ${policy.name}.`:matching.length?'The receipt item matches an approved requirement for this event.':'The stated event purpose supports this item even though it is not listed in the spreadsheet.',rule_ids:[rule.id],reference_ids:matching.map(r=>r.id)};
    })};
  }
  get model() { return 'synthetic-fixture-v1 (no AI service)'; }
  get models() { return {ocr:'synthetic-ocr-v2 (no AI service)',decider:'synthetic-decider-v2 (no AI service)'}; }
}
export class FixturePayPal {
  constructor(store) { this.store = store; this.outcome='SUCCESS'; this.loseCreateResponse=false; this.creates=0; }
  async create(p) {
    let record = this.store.setting(`fixture_payout_${p.id}`);
    if (!record) {
      this.creates++;
      record={batch:`fixture-batch-${p.id}`,item:`fixture-item-${p.id}`,status:this.outcome,recipient:p.recipient.id,amount_sen:p.amount_sen,currency:'MYR',sender_item_id:p.id};
      this.store.set(`fixture_payout_${p.id}`,record);
    }
    invariant(!this.loseCreateResponse, 'Synthetic provider response lost.', 503, 'payment_unknown');
    return record.batch;
  }
  async details(p) {
    const record=this.store.setting(`fixture_payout_${p.id}`);
    invariant(record && record.batch===p.provider_batch, 'Synthetic payout is awaiting reconciliation.', 503, 'payment_unknown');
    return structuredClone(record);
  }
}
