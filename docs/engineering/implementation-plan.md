# Connected seven-job implementation

Updated 2026-11-08. This ledger governs the connected owner-requested queue. New jobs add to the queue; preserve earlier work, complete dependencies first, and distinguish implemented from verified. Latest owner requirements supersede conflicting historical PRD/ADR text. No external integration authorization is implied by local implementation.

## Shared requirements

Current PRD 2.1 owner steering supersedes conflicting historical details below: name/description-only event entry, no manual rules/template, visible rejection reasons, concise UI without header search, validated spreadsheet shortcut, real Google budget with no fixture fallback, selected Gemini role models, realistic demo package and deletion of proven-unused scaffolds/assets/reports. Data/payment safeguards remain. Current verification: docs/verification/current.md.

1. Preserve Node.js/JavaScript, accounts, password hashes, databases, receipts, secrets, financial records and unrelated uncommitted work.
2. Use actual LangChain Gemini interfaces for separate OCR and item-decider roles.
3. Share one GEMINI_API_KEY; resolve GEMINI_OCR_MODEL and GEMINI_DECIDER_MODEL overrides against GEMINI_MODEL, with no implicit model choice.
4. Independently assess every item: accepted/rejected, category, clear English reason, rule IDs, approved reference IDs and policy version.
5. Current prohibitions override history; absence from RAB/history alone does not disqualify an otherwise supported item.
6. Insufficient business evidence means rejection. Unreadable OCR, unavailable data, provider errors and invalid output mean technical failure.
7. Reimburse accepted goods' actual net cost, distributing scoped shared tax/discount with deterministic integer MYR sen arithmetic.
8. Backend owns verified recipients, calculations, fresh funds, reservations, automatic Sandbox payouts and confirmation. No model payment authority or manual approval.
9. Preserve partial payment, duplicate prevention, reconciliation, durable recovery and retry-safe spreadsheet synchronization.
10. Record confirmed payments and reimbursed-item details in Sheets; transaction records never become approved AI references automatically.
11. One configurable active event with title, description and explicit rules. Optional seminar template requires manual selection and must not overwrite saved settings.
12. Sandbox plan: one treasurer sender, two separate committee recipients.
13. Latest owner revision, PRD 2.0: connect the Healthy-inspired frontend to the completed backend, with palette freedom and flat controls. Keep the original logo/data; supersede Vibrant Sunset/glass and active Waves loading. See DESIGN.md.
14. Preserve committee isolation, authentication, receipt-only submission and separate eligibility/payment/synchronization states.

Never reseed an existing database, reset accounts, enable live payments, initialize the owner's Sheets, or make chargeable/provider calls to finish development. Test with isolated fixtures/mocks. Preserve populated .env values; new AI templates default to unauthorized. Record technical choices in decisions.md.

## Queue and status

| Job | Scope | Status | Verification |
|---|---|---|---|
| 1 | Baseline, code/document review and this ledger | verified | 50/50 Node tests, 24-module syntax and 15/15 browser journeys (37.7s) |
| 2 | Incremental responsibility-based organization | verified | 50/50 Node tests, 33-module syntax and 15/15 browser journeys |
| 3 | LangChain Gemini configuration and OCR contract | verified | 54 Node tests, including actual LangChain request construction with mocked fetch; 40-module syntax |
| 4 | Separate decider, validation and snapshots | verified | 59 Node tests; 43-module syntax; mock contracts, not model accuracy |
| 5 | Net cost, durable payment and item recording | verified | 73 Node tests and 47-module syntax; isolated/mocked financial and recording checks |
| 6 | Connected event/result UI and accessibility | verified | 17 browser journeys; final currency/reflow change rechecked in 2 connected journeys and screenshots |
| 7 | Full regression, fixes, setup and handover | verified | 81 Node tests, 51-module syntax, 18 browser journeys; local scope only, external acceptance pending |
| 8 | Owner-requested Healthy-inspired frontend redesign and backend connection | verified | 85 Node tests, 53-module syntax, 19 browser journeys (58.4s), screenshot review; scope and limits: docs/frontend-redesign-2.0.md |
| 9 | Spreadsheet shortcut, concise UI, description-only event, real budget, demo assets and folder cleanup | verified | 89 Node tests, 53-module syntax, 20 browser journeys plus five affected reruns; read-only provider checks only; current report under docs/verification/current.md |

Allowed statuses: pending, in_progress, implemented, verified, blocked. Verification here means the explicitly recorded local scope, never proof of real providers.

## Job 1 findings

- Inspected root guidance, README, status, PRD, folder inventory, MVP, reimbursement/access policies, integrations, AI pipeline, financial/architecture/data/API/development decisions, source/adapters/scripts/tests and existing design system.
- Initial Git state has 85 modified/untracked entries. Much of the application is already untracked and documentation is modified. Preserve all of it; do not use reset/clean/reseed. Empty historical .gitkeep scaffolds coexist with real flat modules.
- Existing stack: Node 24.16 ES modules, native HTTP, built-in SQLite journal, browser HTML/CSS/modules, google-auth-library, Playwright/axe. Single-process lease and serialized service protect reservations and synchronization.
- Implemented baseline: separate Treasurer/Committee login, session/CSRF/origin/rate controls, fixture-only recovery gate, event policy versions, private receipt BLOBs, per-event exact receipt duplicate checks, per-item assessment validation, approved reference retrieval, partial/zero-budget behavior, durable recipient/payment snapshots, Sandbox-only PayPal, payout-item success checks, unknown-outcome reservations and fixed-row payment synchronization.
- Gaps: Gemini uses direct fetch rather than LangChain, one model only, minimal OCR evidence; receipt validator rejects all shared adjustments; reimbursement sums gross line amounts; Sheets records payment rows but no reimbursed-item details. UI omits allocation evidence/model identities and manual event template. Gemini mocks only cover the old HTTP interface.
- Structure: server.mjs mixes transport/auth/static dispatch; service.mjs mixes orchestration/payment work; domain.mjs mixes general validation and financial/AI contracts; app.mjs mixes API/formatting/components/pages. Existing adapters already have appropriate boundaries. Extract focused reusable modules without a framework migration or wholesale renaming.
- Conflicts to supersede explicitly: unsupported adjustments, optional provider selection/direct Gemini, purchase-context-required integration instructions, and old UI revision claims. Preserve historical decisions as history and add current contract pointers.
- Financial limitations retained: single process/database per sheet; exact-byte duplicate detection is not authenticity/fraud detection; no later settlement of unpaid amounts; sender fee-budget treatment requires explicit configuration; real model accuracy is unmeasured.

## Baseline verification

- 2026-11-08: Node v24.16.0, npm 11.13.0. `npm.cmd test`: 50 passed, 0 failed (3.45s). `npm.cmd run check`: 24 modules pass syntax plus existing UI-copy check.
- PowerShell execution policy blocks npm.ps1. Using npm.cmd succeeds without changing system policy; this is an environment restriction, not an application defect.
- Initial inventory command included nonexistent .agents/.codex directories and reported those missing paths; repository inventory otherwise succeeded. No implementation blocker.
- Browser baseline and subsequent evidence will be added below. All test stores are temporary/in-memory or .cache/tests, never data/runtime.

## Open configuration and external verification

- Owner must select actual Gemini model identifiers and approve usage before AI_USAGE_AUTHORIZED=true. Key presence alone is insufficient. No hardcoded provider model default.
- Active event is not selected for the owner; preserve current event. Seminar template is an optional draft only.
- Google read-access was historically verified; tab initialization is explicitly deferred. No external writes during this queue. Item-recording schema/setup must be documented before a later authorized initialization/migration.
- Sandbox sender/recipients, Payouts permissions, Malaysia/MYR support, fee funding and official OAuth remain unverified here. Never use live mode.
- Dependency installation may require network permission. Record actual restriction and safe resolution if encountered.

## Execution notes

Subsequent sections record changes, checks, limits and the next queued job as each dependency finishes.

### Job 1 completion

Baseline browser: 15 passed in 37.7s with isolated synthetic accounts. Node's NO_COLOR/FORCE_COLOR warning is benign. Added AGENTS pointer and recorded baseline/conflicts. Runtime files were fingerprinted privately without exposing contents; no runtime database was opened for review. Next: Job 2.

### Job 2 completion

Extracted domain/core, money, receipt and assessment modules with a stable domain.mjs re-export; HTTP body/cookie and explicit static-serving modules; frontend API factory, formatting and status component. Existing entrypoints/routes remain. Existing Google/PayPal/fixture adapters, scripts and test directories were already appropriate. Browser module paths are explicitly allowlisted, never a broad static directory. No new AI/UI behavior in this phase. Regression: 50 Node tests, 33-module syntax and 15 browser journeys pass. Next: Job 3.

### Job 3 completion

Installed @langchain/google 0.2.12, @langchain/core 1.3.5 and zod 4.6.7 after checking official docs, installed interfaces and registry compatibility. npm registry access required sandbox network escalation and succeeded. Uses actual ChatGoogle/withStructuredOutput/jsonSchema interfaces; explicit Google AI platform avoids ambient service-account routing. Separate shared/override model resolver, one key, no model default. Ignored .env gained only two missing slots; existing values and authorization are preserved. OCR schema/prompt preserve merchant/date/source text, printed amounts, item discounts and scoped adjustments/other evidence. Integrated through the existing claim path and captured extraction identity/time. 54 Node tests and 40-module syntax passed. No Gemini tokens consumed. Contract: docs/ai/extraction-contract.md. Next: Job 4.

### Job 4 completion

Separate decider module/prompt/strict schema now replaces all direct Gemini HTTP calls. Complete unique item coverage, real citations, reasons, policy version and prohibition/allowance guards precede allocation. Claims preserve policy/reference digests, snapshots, timestamps and both model identities. Added mixed/unlisted/insufficient-code/prohibition/invented-citation/stale/duplicate/provider-failure tests. 59 Node tests and 43-module syntax pass. Mock outputs do not establish real model accuracy. Contract: docs/ai/assessment-contract.md. Next: Job 5.

### Job 5 completion

Implemented post-item-discount scoped tax/discount allocation with BigInt largest-remainder arithmetic, original evidence retention and exact printed-total reconciliation. Unsupported charges/ambiguous scope fail technically. Accepted net costs drive eligibility; partial/zero/no-future-settlement behavior stays. Added immutable full authorization/item snapshots, pre-allocation policy/reference/recipient freshness and capacity checks. Sheets records payment plus stable item identities in retry-identical batches/fixed rows; missing item details recover independently of payout. Historical accounting is never promoted to approved AI context. Legacy journal records remain readable.

73 Node tests and 47-module syntax pass, including RM72 example, gross/net item discounts, tax/subset/included evidence, rounding, concurrency, partial payment, transaction-only sync failure, tampered rows and changed unfinished snapshots. Existing unknown-outcome/restart/isolation/auth tests remain passing. Contract/API/setup/fee limits: docs/engineering/net-cost.md. No owner spreadsheet initialization or external call. Next: Job 6.

### Job 6 completion

Implemented active-event title/description/rules on real task screens, manual seminar draft selection with explicit save, actual persisted processing stages, separate eligibility/payment/synchronization feedback, net-cost/item evidence and allocation/source/model snapshots, and specific synchronization recovery copy. Extracted claim-detail page/event component; removed dead prior result renderer and ten enumerated empty source markers. Added one labeled synthetic shared-discount PNG/data fixture without modifying supplied artwork or existing receipt PNGs. DESIGN/MASTER record task composition and unchanged owner material.

All 17 browser journeys passed (1.2m). Visual review of actual screenshots found a split 320px monetary value; adaptive summary columns, unbroken currency and stacked phone item records fixed it. The two connected journeys then passed in 17.8s, with scans at 1440/1024/768/390/320, landscape and 200% text/reduced motion. Screenshots were inspected again. Earlier hidden-caption overflow and a test's asynchronous history-refresh assertion were corrected. Interactive CUA browser access was unavailable (host error); actual headless Chromium interactions, axe scans and screenshot inspection supplied browser evidence instead. No interactive CUA verification is claimed. Next: Job 7 final audit/regression/documentation.

### Job 7 completion (local implementation and verification)

Reviewed actual files/contracts and hardened empty/truncated provider completion, source IDs, confirmed transaction timestamps, empty payout-item identities and immutable snapshots during sync. Preserved original OCR evidence/model/time even when financial validation rejects an unsupported charge. Polling now preserves each repeated item disclosure/focus independently. Tests explicitly ignore inherited external provider configuration.

Final Node: 81 passed, 0 failed (5.74s). Syntax: 51 modules. Browser: 18 passed, 0 failed; final artifact run 1.4m (previous identical application run 53.8s), including retained evidence/retry without payout. The added recovery screenshot was inspected. Material evidence: 39 scans, 179 observations, minimum computed action contrast 5.116:1; six rendered-background role/viewport combinations minimum 5.753:1. Source/diff check and seven current documents' local-link checks pass. Dependencies resolve to the documented versions.

Standalone Taste initially hit restricted CDP/fetch failures; an authorized retry inspected login widths and reported 52 FAIL/7 WARN. Marketing layout/copy/hash-link findings do not apply to the owner-directed authenticated app; contrast heuristics are counterchecked with actual pixel/composite tests. Its layout stress path crashed after one 1440px no-.wrap finding. Perf ran at 1440/390 and reported 2 FAIL/6 WARN for the required original Waves PNG's weight/size. Slow mobile backdrop loading is a genuine retained limitation; no raw checker/performance pass is claimed. Exact dispositions: docs/verification-seven-jobs.md. No checker code changed or check suppressed.

Preservation: the earlier preservation check matched all four private runtime file hashes to their initial fingerprints. A later final recheck could read the initial-access note, but the three SQLite/database sidecar files were in use by another process; their final hashes could not be reverified. No active owner process was stopped to bypass that lock. This work never opened the owner journal through SQLite or reset accounts/data. Existing .env bytes remained an identical prefix; only two absent role slots were appended. Owner Waves SHA-256 and Ribbon version hash match their documented originals. No receipt/financial reset or external integration exercise occurred. Final evidence is retained under ignored .cache/verification-seven/ and is regenerated by test:e2e. The private temporary .env comparison copy was removed after verification.

PRD 1.9, README/structure/setup/API/contracts/ADRs, PROJECT_STATUS and verification now describe the implemented system. Handover: docs/engineering/handover.md. No queued local implementation remains. Ready for fixture demonstration; real Gemini accuracy, deferred Sheets setup/writes, Sandbox MYR/payout/fees/identity and any separate sender-fee budget remain configuration/authorized-verification work. They are not represented as completed integration acceptance.
