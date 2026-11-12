import { esc } from '../lib/format.mjs';

export function eventBrief(event) {
  if(!event.configured)return '<section class="event-brief"><h2>Event not configured</h2><p>Ask the treasurer to save the event and reimbursement rules before submitting a receipt.</p></section>';
  return `<section class="event-brief" aria-label="Active event"><h2>${esc(event.name)}</h2></section>`;
}
