# Net-cost reimbursement and synchronization

The server validates all monetary evidence in integer MYR sen. Original extraction, printed lines, descriptions, item discounts, shared adjustments and their source text are retained. Quantities can be absent (null), or visible decimal quantities with at most three decimal places. Visible unit/quantity products must reconcile to the gross printed line using integer rational arithmetic with nearest-sen half-up rounding. Missing unit/quantity values are never invented; a readable printed line is essential.

1. A gross printed line minus its specific discounts produces base_sen. A printed line explicitly already net of those discounts is not discounted again. Unknown line basis fails technically.
2. Each explicit shared tax/discount uses the relevant items' base_sen after item discounts, before all shared adjustments, as its proportional basis. Scope must be the whole receipt or explicit known item IDs. Included tax is retained as evidence without adding it again. Unsupported other charges, unknown scopes/treatments, negative net costs or a zero allocation basis with a nonzero adjustment fail technically.
3. For each adjustment, use BigInt amount*weight/sum(weights), floor each share, then distribute remaining sen in descending fractional-remainder order. Ties follow printed item order. This avoids floating-point multiplication and preserves the exact adjustment amount. All net item costs must sum exactly to the printed total; no balancing amount is invented.
4. Eligibility is the sum of accepted net_sen. RM80 accepted plus RM20 rejected with RM10 shared discount yields RM90 total and RM72 eligible. Remaining funds never change item decisions.
5. Authorize min(eligible, fresh available funds). A partial payout is attributed proportionally to accepted net costs with the same deterministic rounding rule, solely for recording. Item paid values become confirmed only after matching payout-item SUCCESS. Unpaid differences do not create future settlement jobs. Zero funds creates no payment.

Durable authorization stores policy/reference/assessment/receipt/model/recipient/item snapshots and digests before provider submission. A reference, policy or recipient change during unfinished assessment blocks allocation. Existing in-flight payment identity/recipient/amount stays fixed. Unknown outcomes retain reservations. One process/database owns a sheet; multiple instances are unsupported.

## Sheets contract, version 2

Keep the original eight Transactions columns unchanged. Add I:L: eligible_sen, unpaid_sen, policy_version, items_digest. Remaining budget continues to be exactly =C2-SUM(Transactions!D2:D), so item records do not deduct funds a second time.

Add a protected **Reimbursed Items** tab with A:U headers from apps/api/src/adapters/sheets-contract.mjs:

record_id, payment_id, claim_id, item_id, description, quantity, unit_sen, gross_sen, item_discount_sen, base_sen, allocated_tax_sen, allocated_discount_sen, net_sen, eligible_sen, paid_sen, unpaid_sen, policy_version, category, rule_ids, reference_ids, allocations.

The last three fields are JSON evidence arrays. Monetary columns are integer sen. record_id is payment_id:item_id. Accepted item details, including zero-attributed sen in a partial payout, retain the eligible/unpaid distinction. These rows are accounting records, never approved reference data. Reads still retrieve only explicitly approved Planned Items and Approved History rows for AI.

Payment and item rows are allocated durably before payout. Capacity is checked first. One Sheets batchUpdate writes the transaction and contiguous item rows using fixed updateCells ranges. Retries write the identical rows. Read-back must confirm every expected record. A transaction present without item rows triggers item synchronization recovery, never another payout. The ledger alone controls remaining budget; reservations subtract only unreflected payments. Changed/deleted/unknown financial rows stop further allocation.

The empty-sheet initializer now creates five tabs, with 10,001 rows in each financial ledger and protection of Event Budget, Transactions and Reimbursed Items. It still refuses existing data. **It was not executed against the owner's sheet.** For a previously initialized populated sheet, stop processing, back up/reconcile the existing journal and outstanding operations, then explicitly migrate headers/add and protect the item tab without altering old transaction rows or formulas. Old journal payments without item snapshots remain valid legacy records; they are not fabricated/backfilled as approved history. Owner initialization remains deferred.

Sender fees remain outside committee reimbursement and outside the reimbursement-only Sheets formula. SANDBOX_MYR_FUNDING_CONFIRMED attests sender funding plus fee coverage. Actual fee amounts, MYR availability and whether a separate organizational fee budget is needed remain unverified configuration decisions; no fee is silently deducted from committee money.

## API agreement for Job 6

Existing routes remain. Claim receipt.items now expose gross_sen, item_discount_sen, base_sen, allocated_tax_sen, allocated_discount_sen, net_sen, allocations and original evidence. receipt.adjustments lists scoped source evidence; receipt.allocation_method describes the basis. item_outcomes exposes per-item net/eligible/planned/confirmed paid/unpaid sen, with null eligibility until assessed. Claim requested_sen is the printed total; eligible_sen, paid_sen and unpaid_sen remain separate.

processing and claim.error describe receipt/assessment operations. payment.status describes reservation/provider confirmation; payment.sync describes accounting only. models.ocr/models.decider, extracted_at, assessed_at and policy/reference snapshots are available to the claim owner and event treasurer. Legacy records use safe existing fields. No browser provider credentials or arbitrary payout controls are introduced.
