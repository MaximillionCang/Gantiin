# Reimbursement policy

PRD 1.1 supersedes manual approval and USD. The treasurer configures a versioned event description, allowed/prohibited rules and categories. Insufficient purchase context defaults to rejection with explanation, as confirmed by the owner. No final event is selected by code. Synthetic policy is labeled and available only through explicit fixture seeding.

AI returns accepted/rejected for every valid item, with category, reason, policy and actual reference IDs. Current prohibitions override old history. An item absent from RAB/history can qualify with policy and context. Technical errors do not produce business rejection. There is no manual approval/override or needs_review state.

The server calculates integer MYR sen from validated evidence, never model payment totals. Apply specific discounts once to their actual items; allocate explicitly scoped shared tax/discount proportionally to post-item-discount values, using largest remainders and printed-order ties. Reconcile exactly to the printed total. Included tax is not added again. Unknown scope/basis, unsupported other charges or irreconcilable evidence fail technically. See engineering/net-cost.md. Policy/reference/recipient changes invalidate unfinished assessment; authorized payment snapshots remain immutable.

Application authorization binds claim, policy, assessment, recipient verification, and amount. Pay min(eligible, allocatable budget); never a zero payout. Keep eligible, planned, confirmed paid, and unpaid separate. Differences are recorded only and never automatically settled later. Sender covers fees outside reimbursement; real funding/configuration remains to verify.

Receipt bytes are hashed per event to block exact repeat payments, without claiming general fraud detection. Unknown provider outcomes retain reservations; only definitive failure releases them. Paid requires verified payout-item success. Idempotent fixed-row Sheets synchronization never creates another payout.
