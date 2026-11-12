import { esc, label } from '../lib/format.mjs';
export const status=(value,text=label(value))=>`<span class="status status-${esc(value)}">${esc(text)}</span>`;
export function reimbursementStatus(claim) {
  const payment=claim.payment;
  if(payment?.status==='succeeded')return status(claim.unpaid_sen>0?'partial':'succeeded');
  if(claim.processing==='processing_failed')return status('processing_failed');
  if(payment?.status==='failed')return status('failed');
  if(payment?.status==='unknown')return status('unknown','Unconfirmed');
  if(payment)return status('pending','Pending');
  if(claim.allocation_complete){
    if(claim.eligible_sen===0)return claim.assessment?.items.every(item=>item.decision==='rejected')?status('rejected'):status('none','No payout');
    return status('none','Unpaid');
  }
  return status('processing',{extracting:'Reading receipt',reading_references:'Checking references',assessing:'Checking items',allocating:'Checking budget'}[claim.processing_stage]||'Processing');
}
