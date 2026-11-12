# Local runbook

Start with npm start. Durable worker resumes received/processing claims and existing pending payments after restart. Monitor history's separate processing/payment/sync columns. Never remove or edit payment rows to force a retry.

| Failure | Action |
|---|---|
| Extraction/model invalid or unavailable | Technical retry same claim; no fabricated decisions. Unsupported receipt needs a new corrected submission after resolving duplicate safeguards. |
| Sheets read fails | No new allocation; fix access/schema and retry. |
| Payout unknown | Reservation held; reconcile stable provider identity, never create another claim/payment. |
| Payout definitive failure | Record failure and release reservation; no automatic future settlement. |
| Paid, Sheets write fails | Retry sync only to assigned row; no second payout. |
| Sheet ledger/formula changed | Stop allocation; reconcile protected ranges with payment journal before resuming. |
| Secret leaked | Revoke/rotate privately; inspect impact. |

Use one process/writer and a dedicated sheet. Stop process before local database backup; keep private DB and .env together under controlled access. Retention/deletion and production backups remain unresolved before deployment. No claims of tested disaster recovery.
