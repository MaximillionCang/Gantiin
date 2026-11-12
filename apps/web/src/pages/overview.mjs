import { esc, money } from '../lib/format.mjs';

function total(records,key) {
  let value=0;
  for(const record of records){const amount=record[key];if(!Number.isSafeInteger(amount))continue;value+=amount;if(!Number.isSafeInteger(value))return null;}
  return value;
}
export function overviewStats(claims,now=new Date()) {
  const assessed=claims.filter(c=>c.assessment);
  const days=Array.from({length:7},(_,i)=>{const day=new Date(now);day.setHours(0,0,0,0);day.setDate(day.getDate()-6+i);return {start:day.getTime(),label:new Intl.DateTimeFormat('en-MY',{weekday:'short'}).format(day),date:new Intl.DateTimeFormat('en-MY',{day:'numeric',month:'short'}).format(day),count:0};});
  for(const c of claims){const created=new Date(c.created_at).getTime();const index=days.findIndex((d,i)=>created<=now.getTime()&&created>=d.start&&created<(days[i+1]?.start??new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime()));if(index>=0)days[index].count++;}
  return {eligible:total(assessed,'eligible_sen'),paid:total(claims,'paid_sen'),unpaid:total(assessed,'unpaid_sen'),paidCount:claims.filter(c=>c.payment?.status==='succeeded').length,processing:claims.filter(c=>!c.assessment&&c.processing!=='processing_failed').length,syncPending:claims.filter(c=>c.payment?.status==='succeeded'&&c.payment.sync!=='synced').length,days,recent:[...claims].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)||String(a.id).localeCompare(String(b.id))).slice(0,4)};
}
export function spreadsheetAction(url,icon) {
  const content=`${icon('overview')}<span>Open spreadsheet</span>`;
  return /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]+\/edit$/.test(url||'')
    ?`<a class="button" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="Opens in a new tab">${content}</a>`
    :`<button disabled title="Spreadsheet not configured">${content}</button>`;
}
function activity(days) {
  const count=days.reduce((sum,d)=>sum+d.count,0),max=Math.max(1,...days.map(d=>d.count));
  const bars=days.map((d,i)=>{const h=d.count/max*118,x=30+i*100;return `<g><title>${esc(d.date)}: ${d.count} submissions</title><rect x="${x}" y="${146-h}" width="40" height="${h}" rx="7" class="${d.count===max?'chart-bar peak':'chart-bar'}"/></g>`;}).join('');
  return `<section class="panel activity-panel"><div class="panel-heading"><h2>Submission activity</h2><span class="small muted">Last 7 days</span></div><div class="activity-total"><strong>${count}</strong><span class="small muted">${count===1?'receipt submitted':'receipts submitted'}</span></div>${count?`<svg class="activity-chart" viewBox="0 0 700 160" width="700" height="160" preserveAspectRatio="none" role="img" aria-label="Daily submissions, ${esc(days[0].date)} to ${esc(days[6].date)}"><line x1="0" x2="700" y1="146" y2="146" class="chart-grid"/><line x1="0" x2="700" y1="76" y2="76" class="chart-grid"/>${bars}</svg><div class="chart-days" aria-hidden="true">${days.map(d=>`<span>${esc(d.label)}<small>${d.count}</small></span>`).join('')}</div><table class="sr-only"><caption>Daily submission counts</caption><thead><tr><th scope="col">Date</th><th scope="col">Submissions</th></tr></thead><tbody>${days.map(d=>`<tr><th scope="row">${esc(d.date)}</th><td>${d.count}</td></tr>`).join('')}</tbody></table>`:'<div class="chart-empty"><p>No submissions this week</p></div>'}</section>`;
}
export function overviewPage(budget,claims,event,{heading,icon}) {
  const s=overviewStats(claims);
  const reservation=budget.reserved_sen>0?`<div class="meta-row"><dl><dt>Remaining balance</dt><dd class="money">${money(budget.remaining_sen)}</dd></dl><dl><dt>Reserved</dt><dd class="money">${money(budget.reserved_sen)}</dd></dl></div>`:'';
  return `${heading('Overview','',spreadsheetAction(budget.spreadsheet_url,icon))}
    <div class="metric-strip">
      <section class="balance metric-card"><div class="metric-label"><span class="metric-icon">${icon('budget')}</span><h2>Available for reimbursement</h2></div><div class="amount">${budget.budget_status==='unavailable'?'Unavailable':money(budget.available_sen)}</div>${reservation}</section>
      <section class="outcome-panel" aria-label="Event payment outcomes"><article class="metric-card metric-mist"><div class="metric-label"><span class="metric-icon">${icon('submit')}</span><h2>Assessed eligible</h2></div><div class="amount">${money(s.eligible)}</div></article><article class="metric-card metric-pearl"><div class="metric-label"><span class="metric-icon">${icon('send')}</span><h2>Confirmed paid</h2></div><div class="amount">${money(s.paid)}</div></article></section>
    </div>
    <div class="dashboard-grid">${activity(s.days)}<section class="panel payment-overview"><div class="event-context"><span class="section-icon rose-icon">${icon('event')}</span><div><span class="small muted">Current event</span><h2>${event.configured?esc(event.name):'Event not configured'}</h2></div></div><dl><div><dt>Awaiting payment</dt><dd class="money">${money(s.unpaid)}</dd></div><div><dt>Processing</dt><dd>${s.processing}</dd></div><div><dt>Pending sheet updates</dt><dd>${s.syncPending}</dd></div></dl></section></div>`;
}
