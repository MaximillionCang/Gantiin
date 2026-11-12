# Payments

Current net-cost and recording contract: [net-cost.md](net-cost.md). Eligible money sums accepted net item costs, with deterministic item-specific/shared adjustments. Successful payment and item rows use durable fixed identities/ranges; synchronization must confirm both. Missing item rows recover without another payout or deduction. Full authorization/item snapshots are validated even after payout success before recording. The original payment protections below remain.

Sandbox only. Persist one payment identity per claim before provider submission, with immutable recipient, MYR amount, claim/policy/assessment snapshots and creation time. Model output never supplies recipient or final payout money.

Serialize budget allocation and Sheets synchronization. Read current protected sheet budget/ledger; subtract only reservations not already present in the ledger. Reserve min(eligible, available) in a database transaction. Zero and partial differences do not form later payment jobs.

PayPal batch creation is not success. Poll payout-item details and match sender item/batch, recipient, amount and MYR before accepting SUCCESS. Pending/unknown retains reservation. Definitive failure releases it and remains recorded, without automatic new payments. If create response is lost, recover original batch using the same sender_batch_id and supported duplicate response link within the 30-day deduplication window. Past the window require operator reconciliation and keep funds held.

Successful payments synchronize to a preallocated fixed Sheets transaction row. Repeated writes target the same row; a lost response is recovered by reading it. Protected remaining-budget formula deducts the ledger once. Keep reservation until reflected. Never resend a payout to fix Sheets.

No unauthenticated webhook endpoint is shipped. Polling is the sole payment source; browser callbacks cannot mark paid. Real MYR/Malaysia account access, sender funding/fees and Payouts availability require an actual Sandbox trial. See docs/integrations.md and verification evidence.
