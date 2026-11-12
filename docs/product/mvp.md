# MVP

PRD 1.9 and docs/engineering/implementation-plan.md are current. The connected upgrade adds separate LangChain Gemini OCR/decider roles, exact scoped net costs, payment/item recording and connected event/result screens while retaining the 1.8 light identity and safeguards below. DESIGN.md/MASTER define current UI; docs/verification-seven-jobs.md records local evidence and unverified providers. Historical UI-only restrictions below are superseded by the current task-specific event/rules disclosures.

The functional baseline is retained: content-sized white glass login, Welcome above frameless role choices, internal placeholders and approved PNG backdrop; Password-only Treasurer without Remember, separate CMT email/password with last-successful-email remembering only, and loopback fixture-only recovery. No password/token browser storage or UI-requested session persistence. Core policy/Sheets/AI/automatic MYR payment/history/recovery remains. P1 official PayPal identity supports both existing roles, configuration-gated. Both roles share the transparent logo, narrower white glass sidebar, short History label, relevant icons, Settings after History and pinned Sign out. Purple pill actions follow the supplied reflective glass reference; password eyes and role choices are explicit frameless exceptions. Overview keeps balance/outcomes and adds Welcome, Treasurer, removing Refresh budget/latest/references panels. Both histories share name/ID search, name/date/requested-amount sorting and status filtering without totals panels. Submit Receipt fills the content width with a glass dashed area, real Browse files and Submit/send icon; no white outer panel, totals/policy/preset panel or Purchase context field. Receipt-only requests use actual receipt/event/approved spreadsheet evidence; no purpose is fabricated. Empty Committee history has no Submit CTA. Existing data/money/authorization invariants remain.

## Acceptance mapping

| Legacy ID | Current evidence target |
|---|---|
| MVP-01 | Server identity/role/membership, AC-01/03. |
| MVP-02 | Own-only claims/files, AC-02. |
| MVP-03 | Synthetic receipt-only upload; extraction validation and available event/spreadsheet evidence. |
| MVP-04 | Binary decisions with real policy/sheet references, AC-04/05/06. |
| MVP-05 | Superseded needs_review: operational failure for unreadable/invalid data; explicit policy for ambiguity. |
| MVP-06 | Superseded manual approval: automatic validated calculation, AC-07/08. |
| MVP-07 | Bind policy/recipient/revision snapshot; stale results cannot pay. |
| MVP-08 | Automatic application authorization and verified Sandbox recipient. |
| MVP-09 | Stable payment identity, confirmed provider success, AC-11 through AC-16. |
| MVP-10 | History separates eligible/paid/unpaid and sync; no formal report/CSV. |
| MVP-11 | Technical failures are recoverable, never invented item rejections, AC-17. |

PRD AC-01 through AC-26 are the full scenarios. Real Sandbox and Sheets evidence is needed for P0 completion; fixture tests are insufficient. Google read access was verified separately; required sheet initialization remains deferred. Deferred: live transfers, manual approvals, report/balance sheet, exports, training, automatic later settlement.
