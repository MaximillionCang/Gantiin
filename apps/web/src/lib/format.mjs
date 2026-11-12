export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=value=>value===undefined||value===null?'Pending':`RM${(value/100).toFixed(2)}`;
export const date=value=>new Intl.DateTimeFormat('en-MY',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
export const label=value=>({received:'Received',processing:'Processing',assessed:'Assessed',processing_failed:'Processing failed',reserved:'Funds reserved',pending:'Awaiting provider confirmation',unknown:'Outcome uncertain',succeeded:'Paid',failed:'Payment failed',sync_pending:'Sync pending',synced:'Synchronized',not_required:'Not required',accepted:'Accepted',rejected:'Rejected',full:'Full',partial:'Partial',none:'None'}[value]||value);
