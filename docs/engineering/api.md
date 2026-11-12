# API

## Isolated Committee demo

The main session advertises demo_available; only Committee login renders Try demo. POST /api/demo-cmt/login accepts an empty object, checks Origin/rate limits and issues an HttpOnly, SameSite demo cookie scoped to /api/demo-cmt. The resulting session has role cmt and demo=true. Its SQLite database and providers are separate from the main application; credentials are blank and all operations are simulated. No demo Treasurer exists.

All authenticated demo calls use /api/demo-cmt instead of /api, including private receipt images. POST /api/demo-cmt/reset-demo requires the demo session, its CSRF token and exactly {confirm:true}. It serializes behind in-flight work and atomically deletes demo receipt BLOBs, claims, payments, mock payout entries and the simulated ledger, then restores the initial demo event/funds. The account/session remains. The same path on the main API rejects reset, and cookies/tokens from one workspace cannot authorize the other. GET /api/demo-cmt/sample-receipt serves the first supplied receipt to the authenticated demo account. Demo data persists across restarts until explicitly reset.

## Main application

PUT /api/event accepts name, description and expected_version from Treasurer. MYR and insufficient-evidence rejection are server defaults. Stable relevance guardrails are generated on the server; the UI never asks for manual rules. Existing explicit-rule records remain readable. The obsolete /api/event-templates endpoint is removed. Receipt-only POST /api/claims remains current; legacy saved context is optional.

GET /api/budget and /api/integrations expose spreadsheet_url only to Treasurer, derived from a validated configured Google document ID. GET /api/budget includes budget_source and budget_status. A failed/empty/unconfigured Google sheet returns budget_status=unavailable with null money fields, not invented zero/fallback funds. Normal configuration defaults to BUDGET_SOURCE=google. Only isolated tests opt into fixture; Sandbox rejects fixture budgets. Fixture-mode submission/worker cannot create simulated payouts against the real Google budget.

Claim receipt evidence now exposes gross/item-discount/base/allocated-tax/allocated-discount/net sen and scoped source adjustments. item_outcomes separates net/eligible/planned/confirmed paid/unpaid sen for each item. models contains separate ocr/decider identities; policy/reference snapshots and times remain visible only to authorized claim readers. processing_stage records actual extracting/reading_references/assessing/allocating/complete phases. processing, payment.status and payment.sync remain distinct. See net-cost.md and both AI contracts. Provider credentials never enter browser responses. Existing retry resumes the same operation, including item-only Sheets recovery after confirmed payout.

payment.items is the immutable planned attribution snapshot; its paid_sen field is recorded to Sheets only after matching provider success. Clients must use claim.paid_sen and item_outcomes[].paid_sen for confirmed money. Failed financial validation preserves extraction_evidence/model/time for technical recovery, without fabricating item decisions.

All API routes are same-origin under /api. JSON mutations require an authenticated session and X-CSRF-Token, except credential login. Every resource query checks membership and ownership. Receipt routes stream private bytes after the same checks. Error responses contain safe messages, not provider secrets.

| Method/path | Access |
|---|---|
| GET /api/session | Current session or unauthenticated mode metadata |
| POST /api/login/treasurer | Password only; server resolves exactly one existing shared Treasurer, never a browser identity |
| POST /api/login | Committee email/password only; cannot authenticate Treasurer or accept role/identity override fields |
| POST /api/logout | Authenticated session lifecycle |
| GET /api/event | Event member |
| PUT /api/event | Treasurer, expected policy version |
| GET/POST /api/members | Treasurer |
| GET /api/budget | Treasurer, fresh sheet read |
| GET /api/claims | Treasurer all event; CMT own |
| POST /api/claims | CMT self; Idempotency-Key and receipt/context |
| GET /api/claims/:id | Owner or event treasurer |
| GET /api/claims/:id/receipt | Owner or event treasurer |
| POST /api/claims/:id/retry | Technical recovery only, no arbitrary payout |
| GET /api/integrations | Treasurer; configuration presence, never secrets |
| POST /api/password | Own current/new password |
| POST /api/paypal/link | Registered CMT starts official identity consent |
| GET /api/paypal/login | Official login for already linked accounts |
| GET /api/paypal/callback | Expiring browser-bound OAuth state |

No public registration, approval/override endpoint, arbitrary payment endpoint, report export, or live mode.
