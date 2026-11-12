import { esc, money } from '../lib/format.mjs';
import { status, reimbursementStatus } from '../components/status.mjs';

function itemRows(c) {
  return c.receipt.items.map(item=>{
    const decision=c.assessment?.items.find(result=>result.item_id===item.id);
    return `<tr><td data-label="Item"><div><strong>${esc(item.description)}</strong>${item.quantity!=null&&item.unit_sen!=null?`<p class="small muted">${esc(item.quantity)} × ${money(item.unit_sen)}</p>`:''}</div></td><td data-label="Amount"><div class="money">${money(item.net_sen??item.line_sen)}</div></td><td data-label="Status"><div>${decision?status(decision.decision):status('pending','Checking')}${decision?.decision==='rejected'?`<button type="button" class="rejection-trigger" data-action="show-rejection" data-item-id="${esc(item.id)}" data-item="${esc(item.description)}" data-reason="${esc(decision.reason)}" aria-haspopup="dialog" aria-controls="rejection-dialog">Why rejected</button>`:''}</div></td></tr>`;
  }).join('');
}
export function detailPage(c,{heading,icon=()=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h15"/></svg>',apiPrefix='/api'}) {
  const payment=c.payment,syncPending=payment?.status==='succeeded'&&payment.sync!=='synced';
  const retry=c.processing==='processing_failed'||payment&&(['pending','unknown','reserved'].includes(payment.status)||syncPending);
  const errors=[c.error,payment?.error].filter(Boolean);
  return `<a class="detail-back" href="#/history" aria-label="Back to history" title="Back to history">${icon('back')}</a>${heading('Receipt result',esc(c.claimant),'<button data-action="refresh">Refresh result</button>')}
    <section class="result-outcome" aria-label="Reimbursement outcome"><div class="reimbursement-heading"><div class="receipt-totals"><dl class="receipt-total"><dt>Receipt total</dt><dd>${c.receipt?money(c.requested_sen):'Pending'}</dd></dl><dl class="reimbursed-total"><dt>Reimbursed</dt><dd>${money(c.paid_sen)}</dd></dl></div><div class="result-status">${reimbursementStatus(c)}${syncPending?status('sync_pending'):''}</div></div></section>
    ${errors.length?`<details class="operation-error"><summary>Error details</summary>${errors.map(error=>`<p>${esc(error.message)}</p>`).join('')}</details>`:''}${retry?`<div class="recovery-action"><button data-action="retry-claim" data-id="${c.id}">${syncPending?'Retry sync':'Retry processing'}</button></div>`:''}
    <div class="result-columns"><section class="panel result-items"><h2>Items</h2>${c.receipt?`<table class="data-table"><caption class="sr-only">Receipt items and decisions</caption><thead><tr><th scope="col">Item</th><th scope="col">Amount</th><th scope="col">Status</th></tr></thead><tbody>${itemRows(c)}</tbody></table>`:`<p class="muted" role="status">${c.processing==='processing_failed'?'No items':'Processing...'}</p>`}</section>
    <aside class="receipt-inspector"><h2>Receipt</h2><figure class="receipt-figure"><img class="preview" src="${apiPrefix}/claims/${c.id}/receipt" width="600" height="800" alt="Receipt submitted for this reimbursement"></figure><a class="button" href="${apiPrefix}/claims/${c.id}/receipt" target="_blank" rel="noopener" aria-label="Open receipt image">Open receipt</a></aside></div>`;
}
