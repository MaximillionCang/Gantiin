# Integration setup and evidence

Current owner state, 11 November 2026: real Gemini OCR/Decider passed one sample; ongoing AI usage is still off. The spreadsheet schema and receipt-demo calculations are now prepared and pass the application read. Two owner-confirmed MY recipients are stored in a separate Sandbox journal with existing website credentials preserved. PayPal Sandbox token authentication passed; payout/MYR-fee acceptance and user-consented login are still unverified. Follow [Sandbox preparation](sandbox-ready.md) for this existing installation. The fresh-install procedures below must not reseed or initialize over these populated resources.


Read-only Sheets access also succeeds. The owner spreadsheet has only Sheet1; sampled A1:E5 is empty and no Event Budget tab exists. Initialization is still deferred. BUDGET_SOURCE=google is now the default, so unavailable/empty sheets display Unavailable rather than fixture funds. Isolated tests alone select fixture explicitly; fixture payouts cannot run with a real Google budget. This verification neither wrote Sheets nor created a payout.

Current connected upgrade: see [handover](handover.md), [extraction](../ai/extraction-contract.md), [assessment](../ai/assessment-contract.md) and [net-cost/Sheets schema](net-cost.md). No external calls/writes/payouts were made during this upgrade. Owner Sheets initialization remains deferred. Existing local configuration and accounts are retained.

No secrets belong in Git, chat, receipt text, spreadsheet cells, browser bundles, or screenshots. Configure secrets in the ignored local .env. Keep Google service-account JSON outside the repository. No paid infrastructure has been created. Real integration trials require authorized accounts and AI usage; supplying an API key alone does not authorize a new charge.

## Local fixture demo

1. Use Node 24.16+ (Node 24), npm ci, and copy .env.example to .env.
2. Leave INTEGRATION_MODE=fixture. Run npm run seed:demo on an empty database.
3. The seed prints separate randomly generated local passwords for treasurer@example.test, cmt.one@example.test, and cmt.two@example.test. They are synthetic identities, with one shared treasurer and two individual CMTs. The CLI saves credentials in the ignored data/runtime/initial-access.txt. Change passwords through Account and remove the note after private distribution.
4. Run npm.cmd start and open http://localhost:3000. Upload a supplied synthetic PNG from apps/web/demo. Submission is receipt-only; no purpose/context field is requested or fabricated. net-cost.png demonstrates a shared RM10 discount and RM72 eligible net printing cost.
5. All balances, extraction, assessments, sheet rows, and payout IDs in this mode are fixture simulations. A different image produces a technical extraction error rather than fabricated OCR.

Entry is role-first. Treasurer asks only for the existing shared password; its stored email is not a login field. Committee retains individual email/password. Both roles support official PayPal login when configured. No new credentials or database reset are needed for the UI revision.

To test a fresh database, set DATABASE_PATH to a new file under data/runtime. Setup refuses to overwrite existing accounts. Never delete a database containing uncertain payments to force a retry.

## Sandbox environment

Stop the fixture server. Copy the template settings into an ignored .env and set INTEGRATION_MODE=sandbox and DATABASE_PATH=data/runtime/sandbox.sqlite. Do not reuse the fixture database. Keep PAYPAL_MODE=sandbox and ENABLE_LIVE_PAYOUTS=false. Use npm run setup to create the shared treasurer and two CMT identities with a random initial password. The event remains unconfigured. Start the website, log into the treasurer account, and configure the chosen event description, allowed/denied rules, categories, and explicit insufficient-context policy. No Convocation or other final event is preselected.

Uploads: PNG/JPEG <=5 MiB, integer MYR sen and visible/null quantities/unit prices. Visible quantities support up to three decimal places. Lines, explicit discounts, scoped shared adjustments and printed total must reconcile using the [allocation contract](net-cost.md). Unknown scopes, line bases, unreadable essential data and unsupported other charges fail technically.

## Google Sheets

Use a dedicated empty test spreadsheet with no other writer. Enable Sheets API in an existing authorized Google project, create a service account, and share the test spreadsheet with its email as editor. Set GOOGLE_APPLICATION_CREDENTIALS to the JSON file's absolute path, and GOOGLE_SPREADSHEET_ID to the spreadsheet ID. No domain-wide delegation is needed.

1. In Google Cloud Console select an existing authorized project and open APIs & Services, Library. Enable Google Sheets API. Do not create billable infrastructure.
2. Open IAM & Admin, Service Accounts, create an account for this test, and open Keys. Create/download a JSON key to a private directory outside the repository.
3. Create an empty Google spreadsheet in the owner's Drive. Open Share and grant Editor to the JSON file's client_email. The service-account email is an identity, not a password.
4. Copy the ID between /spreadsheets/d/ and /edit in its URL into GOOGLE_SPREADSHEET_ID in the root .env. This is a resource ID, not an API key.
5. Paste the absolute local JSON path into GOOGLE_APPLICATION_CREDENTIALS, for example C:/private/gantiin-google.json. This value is a file path; the JSON contains the secret private key. Do not paste JSON into the variable or the browser.
6. Set initial funding and run the explicit initialization command below. Restart the app, then use Refresh budget and the probe to verify access. Permission/schema failures do not fall back to a local balance.

Only after explicit owner approval to initialize a dedicated empty test sheet, set SHEETS_INITIAL_FUNDING_SEN and run npm.cmd run sheets:setup. The command refuses existing data, creates five tabs and protects whole financial tabs. It was not run in this upgrade. Previously initialized populated sheets require the explicit nondestructive version-2 migration described in engineering/net-cost.md; never run empty-sheet initialization over existing data.

| Tab | Columns, starting A1 |
|---|---|
| Event Budget | event_id, currency, funding_sen, remaining_sen, revision |
| Planned Items | id, description, category, purpose, approved, rule_id |
| Approved History | id, description, category, context, approved, eligible_sen, paid_sen, policy_version |
| Transactions | payment_id, claim_id, cmt_id, paid_sen, currency, paypal_item_id, confirmed_at, recipient_id, eligible_sen, unpaid_sen, policy_version, items_digest |
| Reimbursed Items | Stable payment_id:item_id records; exact A:U headers in engineering/net-cost.md and adapters/sheets-contract.mjs |

Event Budget row 2: event-1, MYR, integer funding, `=C2-SUM(Transactions!D2:D)`, revision label. Values are **sen**, not decimal ringgit. Remaining is a protected formula over the ledger. Planned/history rows enter context only when approved is Boolean TRUE or text TRUE. IDs must be unique; sources retain tab and row numbers. History approval is a curated reference flag, distinct from item acceptance and actual paid money. The app automatically writes successful payment transactions; it does not relabel arbitrary history as approved.

One application database and one process own the sheet. Do not change protected financial ranges while processing or while reservations/unknown outcomes exist. To change funding, stop the app, reconcile outstanding payments/sync, update only funding_sen and revision, retain the formula and transaction rows, and restart. Spreadsheet owners can bypass protection; operational discipline is required. Do not connect multiple databases/app instances to this sheet.

Transactions use durable preallocated fixed rows, not append. Retries overwrite the same row and a lost response is checked by reading first. Budget derives from that ledger once, including when a write succeeded but its response was lost. Altered/deleted/unknown ledger rows or a changed formula halt further allocation. The initializer reserves 10,001 transaction-sheet rows; expand deliberately before capacity is exhausted.

## Gemini extraction and assessment

LangChain with Gemini is now the owner's required implementation for two separate roles. Actual model identifiers and chargeable usage remain explicit configuration/approval decisions. New templates leave AI_USAGE_AUTHORIZED=false; existing local values were preserved. Local fixtures/mocks prove no real model accuracy or connectivity.

Once authorized, choose compatible Gemini models supporting the role's structured output and vision for OCR. Set GEMINI_API_KEY privately. Resolve GEMINI_OCR_MODEL and GEMINI_DECIDER_MODEL from overrides or GEMINI_MODEL; neither has an implicit default. One key can serve both calls. Set AI_USAGE_AUTHORIZED=true only after approval of usage/charges. No cloud inference was invoked during local verification. Installed LangChain versions/interfaces and official sources are recorded in ai/extraction-contract.md.

1. Open the authorized Google AI Studio account/project and its API-key page.
2. Create a key using the approved billing/quota configuration. Do not enable billing or paid tiers without permission.
3. Paste the key into GEMINI_API_KEY in the root .env, never source or a website field.
4. Fill GEMINI_MODEL as the shared fallback, or both GEMINI_OCR_MODEL and GEMINI_DECIDER_MODEL. Optionally override only one role when a shared fallback is present. These are model identifiers, not credentials; the server requires valid resolved values and the provider must support them.
5. After approval set AI_USAGE_AUTHORIZED=true, restart, and run the explicit probe. Provider/schema failures remain technical failures.

The server sends the synthetic receipt to OCR, then validated items/current policy/actual approved reference evidence to the decider. Legacy saved context is included only when actually present. No PayPal credentials, recipient, available funds or tools are supplied. Complete coverage, decisions, versions, real citations and arithmetic are server-validated. A valid schema does not establish factual reading/business accuracy; evaluate human-labeled examples before a real demonstration.

The current owner confirmed RM686 of RAB table spending is already paid outside Gantiin. Protected Event Budget C2 is =ROUND((Income!G4-RAB!H23)*100,0), the net opening allocation, not gross sponsorship. D2 retains the exact validated C2 minus Transactions sum formula. RAB G3 includes table spending plus confirmed Gantiin transactions, and K3 is sponsor income minus total spending. Do not put prior cash expenses into Transactions with fabricated PayPal identities.

## PayPal Sandbox, MYR

Prepare a Malaysian Sandbox business sender with Payouts API access and two Malaysian Sandbox recipients. Confirm they can receive MYR, fund the sender sufficiently for reimbursement plus sender fees, and avoid currency conversion. In the Developer Dashboard create/select the Sandbox REST app and set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET. Keep live credentials out. Only after confirming funding and fee coverage set SANDBOX_MYR_FUNDING_CONFIRMED=true. The fee is never deducted silently from the CMT amount; actual provider fee behavior remains to verify.

1. Sign into PayPal Developer Dashboard, open Testing Tools / Sandbox Accounts, and create a Business sender and two separate Personal recipients with country Malaysia. Keep their Sandbox sign-in credentials private; the application never needs their passwords.
2. Inspect each account in Sandbox. Confirm its country and PayPal account/payer ID, MYR receiving/balance settings, and test funding. If the dashboard cannot provide the needed Malaysia/MYR configuration, stop and resolve that with PayPal rather than switching to live or another currency.
3. Under Apps & Credentials choose Sandbox, create/select a REST app bound to the Business sender, and ensure Payouts is enabled/available for it. If access is missing, request the appropriate Sandbox capability. A client-credentials token alone does not prove Payouts permission.
4. Paste the app's Sandbox Client ID into PAYPAL_CLIENT_ID and its Sandbox Secret into PAYPAL_CLIENT_SECRET in the root .env. Both are server configuration; the Secret is sensitive and neither is a recipient ID.
5. Confirm sender test balance covers MYR reimbursements plus fees, then set SANDBOX_MYR_FUNDING_CONFIRMED=true. No live funds or new charges are authorized by this guide.
6. Bind the two recipient account IDs to the two website CMTs with the controlled command below. Restart and submit a synthetic claim only when ready to exercise an automatic Sandbox payout.

With the server stopped, run npm run recipient:verify for each existing CMT. Enter its website email and the inspected Sandbox PayPal account/payer ID, verify Malaysian country/account ownership and MYR receiving setup in the dashboard, and record a private verification reference. The command requires the explicit VERIFIED-MY-SANDBOX attestation. This is controlled operator verification, not a claim of programmatic account verification. It does not change prior payment snapshots. A new binding clears linked PayPal login so an old identity cannot keep access. Restart the app.

Creation of a payout batch does not mark paid. The worker polls the payout item, checks matching recipient, sender item/batch, MYR amount, and SUCCESS. Unclaimed/pending/unknown holds funds. Definitive failure releases funds and records the unpaid amount without scheduling a replacement. Unknown create response is recovered with the same request/batch identity within the provider's deduplication window. After 29 days, automatic create retries stop for operator reconciliation. Never reset IDs or delete pending records.

## P1 Login with PayPal

After configuring the core Sandbox flow, enable Log in with PayPal on the same Sandbox app in the Developer Dashboard. Register exactly APP_BASE_URL/api/paypal/callback as Return URL. Enable profile/email, account verification and PayPal account ID attributes. Set PAYPAL_LOGIN_ENABLED=true. No live identity endpoint is used.

A registered CMT can select Continue with PayPal directly. After official authentication/consent, a verified provider payer ID must match exactly one preassigned Sandbox recipient in the selected event/role. The server saves the subject on first login and opens the existing account; no preliminary Gantiin login is needed. Treasurer login requires its configured PAYPAL_SENDER_ACCOUNT_ID to match the verified Business payer ID. Unknown or ambiguous mappings and conflicting existing subjects are rejected, with no account creation or destination changes. Optional password-confirmed linking remains in Settings > Account. A sender ID is an account ID, not the REST Client ID or secret. Never infer it from a browser role choice or AI output.

Both login tabs show PayPal, disabled until identity configuration is present. Linking grants no membership and replaces no payout destination. OAuth state binds intended role and Remember me as well as browser/purpose/expiry. Unknown identities, collisions, wrong sender/recipient, replay or canceled consent grant no access. Identity access tokens are transient. Both-role provider consent/login still needs a credentialed test; mocked local tests are insufficient.

## Local demo recovery

Forgot password can directly replace synthetic passwords, including A, only while INTEGRATION_MODE=fixture, stored mode is fixture, APP_BASE_URL/HOST/client address are loopback and DEMO_PASSWORD_RESET_ENABLED is not false. It requires no email service and is visibly labeled Local demo only. The reset revokes account sessions, is rate limited and uses generic existence feedback. This is deliberately inappropriate for real/public accounts; Sandbox/public-host configuration rejects it. Disable the flag to turn it off. Normal creation/password change remains 12+ characters. A real recovery delivery mechanism is unconfigured. See [OWASP recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) before public recovery work.

## Early probes and full acceptance

Run npm run integrations:probe after authorized configuration. It reports missing configuration without printing secrets, reads/validates Sheets, authenticates Sandbox, and runs one authorized synthetic extraction/assessment. Authentication alone does not prove Payouts/MYR support; the probe does not send money or insert a fake transaction.

For write/payout verification, submit one synthetic claim through the normal application. Submission explicitly starts its automatic Sandbox payout. Record actual payout-item ID/status, matching account/MYR amount, one Transactions row, remaining-budget change, and app history. Then exercise PRD AC-01 through AC-19, including concurrency, lost responses, and sync recovery. Redact all external identifiers from public evidence. Current execution evidence is in verification.md.

Primary references checked during implementation: [Google batch update](https://developers.google.com/workspace/sheets/api/guides/batchupdate), [service-account auth](https://developers.google.com/identity/protocols/oauth2/service-account), [PayPal currencies/Malaysia](https://developer.paypal.com/payouts/supported-features/), [Payouts](https://developer.paypal.com/api/payments.payouts-batch/v1), [Login with PayPal](https://developer.paypal.com/log-in/build), [Gemini generateContent](https://ai.google.dev/api/generate-content). Documentation is not integration evidence.
