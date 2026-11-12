# Durable data model

Connected upgrade uses additive JSON fields without resetting or migrating accounts/financial rows. Claims preserve raw extraction and normalized scoped/net costs, separate model identities, extraction/assessment times and snapshot digests. New payments retain immutable policy/reference/assessment/receipt/recipient/item authorization, item digest, eligible amount and durable sheet_item_start alongside the existing payment row. Legacy stored payments without item snapshots remain readable and are never fabricated into new approved references. See net-cost.md for schema/read-back rules.

SQLite schema is maintained in apps/api/src/db.mjs. Currency is MYR; monetary values are bounded integer sen.

Accounts carry role and single-event membership; sessions contain hashed tokens/CSRF/expiry. Event policy retains monotonic version and full rules. Claims retain private receipt bytes/hash, context, revision, extracted items, validated assessment/policy/reference snapshots, and operational state. Unique event/receipt hash prevents exact duplicates. Unique user/idempotency key binds replay to payload.

One payment per claim stores stable IDs, verified recipient snapshot, amount, provider IDs, success/unknown/failed state, reserved funds, assigned sheet row, and synchronization state. Audit records identify the shared treasurer account rather than pretending to know its individual operator. OAuth states expire and are single-use.

No human approval table or general financial report is part of this MVP. Payment/assessment snapshots are the automatic authorization record.
