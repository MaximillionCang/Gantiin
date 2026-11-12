# Connected upgrade handover

Current frontend addition, PRD 2.0: the owner selected Healthy-inspired flat controls and palette freedom. DESIGN.md/MASTER define pearl/rose surfaces; [frontend-redesign-2.0.md](../verification/current.md) records current checks and limitations. Overview, authentication, both-role task screens and Settings now use that direction while preserving all seven-job backend contracts. Old visual descriptions below are historical. Restart the backend for the new overview module allowlist, then Ctrl+Shift+R; no reseed, migration, dependency change or password reset.

8 November 2026. Local fixture implementation is ready for demonstration. Real Gemini accuracy, Google recording and PayPal Sandbox acceptance remain unverified and require configuration plus separate authorization. This document does not authorize provider usage, sheet initialization or payouts.

## Changes by job

1. Baseline: inspected guidance/code/Git, documented existing safeguards/gaps/conflicts, ran 50 original Node tests, syntax and 15 browser journeys, and created implementation-plan.md with an AGENTS pointer.
2. Structure: separated domain, transport/static, frontend API/format/components, retained entrypoints/routes and provider boundaries. Later focused result-page/AI/allocation/record modules build on those boundaries. Removed only demonstrably empty source markers and unused result code; preserved original uncommitted work.
3. OCR: installed compatible maintained LangChain Google/core and Zod packages/lockfile. Shared key plus role-specific fallback configuration; actual ChatGoogle structured JSON output, original evidence and readable/null amounts, bounded retries/deadline and technical failure semantics. Added only missing local .env slots.
4. Decider: separate prompt/schema/call, complete unique per-item results, real citations/current policy validation, specific English-reason instructions, no invented business purpose or payment authority. Snapshots retain policy/references, time and model identities.
5. Financial/recording: exact scoped integer-sen net allocation, RM72 example, proportional partial attribution, immutable authorization/item snapshots and fresh evidence checks. Preserved reservations, verified recipients, duplicate prevention and uncertain-outcome recovery. Confirmed payment and reimbursed-item Sheets rows use stable identities/fixed ranges and read-back. No expense auto-promotion to AI references.
6. UI: actual active event/rules, manual seminar draft with explicit save, processing stages, net/eligible/paid/unpaid costs, source/model/policy evidence and separate sync recovery. Light Vibrant Sunset, original artwork/glass, authentication and receipt-only submission remain. Desktop/mobile/text/reduced-motion checks and screenshot inspection performed.
7. Audit: hardened completion-status, payout-item identity, sync snapshot and financial-row checks; test configuration ignores inherited provider environment. Updated PRD 1.9, setup, structure/contracts, ledger/status and verification. No owner runtime reset or external integration exercise.

## Local verification

Current results and limitations: [verification-seven-jobs.md](../verification/backend-upgrade.md). Final Node suite: 81 tests passed, 0 failed; syntax checked 51 modules. Full browser suite: 18 journeys passed (final artifact run 1.4m; previous identical application run 53.8s), including actual fixture extraction state, RM72 result, confirmed payment with failed Sheets recording, independent evidence disclosure preservation, retained unsupported-charge evidence and recovery with exactly one payout/transaction/item. No mocked result is evidence of real model accuracy or provider success.

All stores used by tests are in-memory, temporary or .cache/tests. The owner runtime database was not opened, reseeded or migrated by this work. Existing .env values, authorization flags, accounts/passwords and financial records are preserved. Only two absent Gemini role slots were added to the ignored .env; no values are printed here.

Preservation evidence: all four private runtime fingerprints matched at the earlier check. The later final recheck encountered active locks on SQLite/database sidecar files, so their final hashes are unverified; the initial-access note remained readable. No active owner process was stopped to force a comparison. Owner artwork hashes match their documented originals, and the existing .env content was verified unchanged before its two added slots.

## Environment fields

| Field | What to supply |
|---|---|
| GEMINI_API_KEY | One approved Gemini API key, server-only |
| GEMINI_MODEL | Explicit supported shared model fallback; may be blank only if both overrides resolve |
| GEMINI_OCR_MODEL | Optional OCR override supporting receipt images and structured JSON |
| GEMINI_DECIDER_MODEL | Optional structured item-assessment override |
| AI_USAGE_AUTHORIZED | Keep false until actual inference/charges are approved |
| GOOGLE_APPLICATION_CREDENTIALS | Absolute private service-account JSON path outside the repository |
| GOOGLE_SPREADSHEET_ID | Dedicated test spreadsheet ID with approved access and the required schema |
| PAYPAL_CLIENT_ID | Sandbox REST app client ID bound to the treasurer sender |
| PAYPAL_CLIENT_SECRET | Its private Sandbox secret |
| SANDBOX_MYR_FUNDING_CONFIRMED | Keep false until MYR receiving/funding/Payouts and sender-fee coverage are verified |
| PAYPAL_SENDER_ACCOUNT_ID | Inspected sender account/payer ID, needed for Treasurer PayPal identity |
| PAYPAL_LOGIN_ENABLED | Optional true only after official Sandbox identity setup |
| SHEETS_INITIAL_FUNDING_SEN | Integer initial sen, only for a later explicitly authorized EMPTY-sheet initialization |

Local defaults: INTEGRATION_MODE=fixture, PAYPAL_MODE=sandbox, ENABLE_LIVE_PAYOUTS=false, APP_BASE_URL=http://localhost:3000, HOST=127.0.0.1, PORT=3000, DATABASE_PATH=data/runtime/gantiin.sqlite, WORKER_INTERVAL_MS=2500. Preserve the existing database path/mode for existing accounts. DEMO_PASSWORD_RESET_ENABLED controls the loopback-fixture shortcut; false disables it. Never enable it as real/public recovery.

## Commands

PowerShell, from repository root, Node 24.16+ in the Node 24 line:

```powershell
npm.cmd ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd start
```

Use current accounts at http://localhost:3000. Only for an explicitly new empty fixture database, run `npm.cmd run seed:demo` once before start; do not seed an existing database. npm.cmd avoids this machine's npm.ps1 execution-policy restriction without changing OS policy.

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run test:e2e
```

If Chromium is absent on a new machine: `npx.cmd playwright install chromium`. Existing fixture PNGs are under frontend/demo. `node scripts/generate-receipts.mjs --file net-cost.png` regenerates only the labeled shared-discount test image. It does not modify owner artwork or initialize services.

## Separate real-integration verification

1. Confirm actual provider usage/charge authorization, choose compatible OCR/decider identifiers and review receipt data handling. Keep key private. Evaluate OCR/business accuracy against human-labeled synthetic receipts, including unlisted items, bans, unreadable data and adjustments. Local schema tests alone prove no accuracy.
2. Retain existing fixture accounts/data. For later authorized Sandbox testing, stop the app and use a separate new Sandbox database, never change the mode of an existing fixture journal. Initialize only that empty database with `npm.cmd run setup`, then manually configure the chosen event/rules. The seminar template remains optional.
3. Owner must explicitly authorize Sheets initialization or migration. The current owner's tabs remain deferred. For an approved dedicated EMPTY test sheet only, `npm.cmd run sheets:setup` creates five tabs. For populated sheets, follow the nondestructive header/item-tab migration in net-cost.md after backup/reconciliation; never run empty-sheet setup over them. Validate service-account access, protected tabs/formula, stable IDs and capacity.
4. Prepare one Malaysian Sandbox treasurer sender plus two separate Malaysian committee recipients. Confirm MYR/Payouts capability, test funding, sender fees and intended accounting treatment. With the app stopped, `npm.cmd run recipient:verify` binds each existing Sandbox CMT to its inspected account ID and verification reference. No browser/model recipient replacement is allowed.
5. Only after all dependent configuration and usage are authorized, `npm.cmd run integrations:probe` performs Sheets reads, Sandbox authentication and one synthetic OCR/decider pair. It does not verify payout/recording or real accuracy and does not send money/write transactions. Do not run it merely for local setup.
6. A separately authorized synthetic receipt submission through the normal Sandbox app automatically initiates payout and financial recording. Check exact MYR/recipient/payout-item SUCCESS, one Transactions row, stable Reimbursed Items rows and one budget deduction. Test partial/zero funds, two recipients, concurrent claims, unknown outcomes, restart and sync-only recovery. Keep evidence private/redacted. Official PayPal linking/login requires a separate role-bound consent trial.

## Remaining limits and readiness

- Ready: local fixture demonstration and local automated contract/regression checks.
- Not yet ready for an end-to-end real Sandbox demonstration: owner Sheets setup/schema, actual model identifiers/usage authorization, Sandbox accounts/capabilities/funding/fees/verified recipients and provider trials remain prerequisites. Required local implementation is present; external acceptance is still pending.
- No claim of real OCR/eligibility accuracy, receipt authenticity or general fraud prevention. Exact-byte duplicates only. Unsupported/ambiguous charges intentionally fail technically. Reference retrieval is bounded to 1,000 planned and 1,000 historical rows, then up to 40 relevant approved rows.
- Single process/database per dedicated sheet. No distributed deployment, live payments, automatic future settlement or full fee accounting/reporting. Any separate organizational sender-fee budget remains an owner configuration decision.
- Interactive browser host was unavailable; actual headless Chromium interactions, axe scans and inspected screenshots provide local browser evidence. Taste's standalone checker restrictions are recorded separately in verification; no missing check is presented as a pass.
- The owner-required original Waves PNG is approximately 1.5 MiB. Standalone Taste checks flag its transfer weight and delayed backdrop on a throttled mobile connection. The original artwork is deliberately preserved; the functional forms have a light background fallback. This performance limitation remains disclosed, not represented as a passing performance audit.
