# AI and backend verification, 12 November 2026

## Changes

- AI errors retain assessment_failed/extraction_failed while distinguishing deadline, provider access/model/request/quota/outage, missing/incomplete completion metadata, invalid JSON and strict-schema failures. Diagnostic logs contain allowlisted categories, HTTP statuses and schema paths, not provider bodies, credentials, prompts or receipt text. Failed calls abort outstanding work.
- Accept supported canonical/legacy LangChain completion metadata; conflicting or non-STOP results still fail closed. Actual installed LangChain core already merges both metadata spellings, so casing was not established as the original incident's cause.
- Pending/reserved payouts reconcile before new receipt processing and between claims. Each payment is checked at most once per worker tick. Authorization remains serialized, with fresh financial reads.
- Expired/lost process ownership blocks further claim authorization, payout submission, spreadsheet writes and stale-state persistence across awaited provider operations. Existing request identities/reconciliation remain necessary for requests already sent before ownership loss.
- No model, confidence threshold, money rule, private environment, database schema or owner financial record was changed by these source edits. Startup still refuses a currently held lease; no lock deletion or bypass was added.

## Local checks

- npm.cmd run check: 69 modules passed syntax checks.
- npm.cmd test: 130/130 tests passed. Includes 14 added tests for real installed LangChain with mocked HTTP, redacted errors, cancellation, malformed/incomplete output, payment scheduling and lease-loss behavior.
- Existing financial, account isolation, session/origin, confidence, idempotency, payout reconciliation and sheet-retry tests remain passing. These tests use isolated fixtures/mocks.

## Actual read-only/provider checks

Against the hosted Sandbox service, the three prepared website identities signed in successfully. Each Committee account's returned claims belonged to that account. Google budget and journal validation returned ready, with RM890 available at check time. The existing RM200 payout was retrieved from PayPal Sandbox, matched to its saved identifiers/recipient/amount/currency and reported SUCCESS.

One diagnostic Gemini Decider request reused the hosted failed RM465 receipt's saved OCR and actual current event/relevant spreadsheet evidence. SDK retries were disabled for that diagnostic. It returned a valid complete assessment in 3,716 ms: bottled water and snack packs accepted, latte rejected. Returned confidence values were model self-assessments, not an accuracy measurement. The diagnostic did not save an assessment, retry the hosted claim, create a payment or write a spreadsheet row. Separate website login/logout checks create/remove only their own short-lived sessions.

## Limits and next hosted check

The earlier two failures were saved only as generic assessment_failed; their underlying causes cannot be recovered from those messages. The single successful diagnostic proves current access and that sample can pass, not that transient failures are eliminated. The new diagnostics are intended to identify any recurrence without raw secret logging.

Changes are local until the owner pushes and Render deploys the commit. After deployment, retry the existing failed claim once through the normal application. Successful OCR can be reused; a valid eligible result can then automatically create the normal Sandbox payout and spreadsheet record. Inspect any newly specific error rather than repeatedly retrying. No additional payout was created by this audit.

PayPal website OAuth consent for each role was not re-executed by this audit. A successful website password login and existing payout lookup do not prove that browser consent works. No new complete hosted upload-to-payment run, production security certification or broad AI-accuracy claim is made.

## Submission and video

Public Devpost story and Built with/link drafts are under docs/hackathon. The brag storyboard is under brag-output/brag-plan.md: 165 seconds, English voice-over and short captions. Required Hyperframes companion skills/runtime and supported authentic browser capture have not been established on this machine; no video has been recorded/rendered. This dependency remains separate from the passing backend checks.
