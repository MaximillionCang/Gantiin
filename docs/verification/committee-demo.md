# Committee demo and UI verification

9 November 2026, Asia/Makassar. Owner-approved simulation, PRD 2.2. Anti Slop during and UI/UX Pro Max remain active; the established Healthy pearl/rose direction supplies the design, not a new theme. ENERGY 2 / RHYTHM 2 / MOTION 1.

## Result

Committee login has a full-width Try demo below PayPal. Treasurer has no demo entry, and no second Treasurer is created. The demo has one CMT, a separate SQLite database, scoped HttpOnly/SameSite cookie, CSRF token and API namespace. The regular account/email preference is not replaced by demo identity. Exit demo leaves its cookie only; an existing normal session remains valid.

Demo configuration removes Google, Gemini and PayPal credentials and uses deterministic local simulation providers. Use sample selects the first career-event image; all four supplied career-event PNGs and existing fixture PNGs are recognized. Expected item labels come from the human-authored evaluation CSV. They are explicitly simulated results, not evidence of real OCR/Decider inference. Unknown images do not receive fabricated recognition.

History and Account expose Reset demo only for that demo. A native dialog focuses Cancel, supports Escape and confirms deletion. The server checks the actual marked demo store, role, Origin, scoped session, CSRF token and confirmation. Reset queues behind in-flight processing, atomically deletes receipt BLOBs, claims, payments and mock payout/ledger records, restores demo event/funds and keeps the account/session. Old receipt URLs return 404; the same file can then be submitted again. No physical main-database deletion/reseed, external spreadsheet write, provider payment or refund occurs. Regular CMTs have no reset/cancellation control and their reset requests are rejected.

The demo persists beside the main database at demo/committee.sqlite, normally data/runtime/demo/committee.sqlite. In-memory test journals keep their demos in memory. Closing/restarting the app preserves submissions until an explicit reset. This is one shared demo account, so its reset clears that demo account's submissions across its sessions.

## UI changes and purpose

- Event saved is a fixed four-second toast with a 44px close action, polite live announcement and no focus stealing/layout movement. Hover or keyboard focus pauses dismissal. Validation remains visible at its fields.
- A selected receipt replaces the large empty target with one at-most-640px review panel. Its contained image opens at full size; actual filename/format/size and Change file/Remove file sit below the image. Replacement drag/drop and file chooser remain functional. Submit ends the form at right; on phones it fills the available width. There is no invented upload progress or eligibility status.
- Date/status native selectors center selected text horizontally and vertically for both roles without changing keyboard behavior or available sort/filter values.
- The login background grades existing pearl/rose/mist anchors more visibly at the edges. The opaque form remains quiet. Try demo shares existing button geometry and spans its column. No new asset, photo, logo, heavy illustration, glow or animation was introduced.
- Simulation labeling and Exit demo identify the demo state. Reset dialogs and file metadata use only operational text.

## Executed verification

| Check | Result |
|---|---|
| Node complete suite | 94 passed, 0 failed |
| Syntax/copy | 56 modules; no em dash in current authored UI/design/PRD |
| Browser complete suite | 22 journeys passed, 0 failed, 1.6 minutes |
| Final visual adjustment | Try demo changed to full width after inspecting it; demo entry/reset and rendered auth contrast rechecked, 3 passed in 18.5 seconds |
| Earlier combined UI follow-up | 8 journeys passed after receipt controls moved below the image and selectors were centered |
| Text contrast | Complete-run evidence: 41 scans / 189 control observations, minimum 4.855:1; six rendered authentication role/viewport cases, same minimum |
| Responsive | Recorded desktop/tablet/390/320px, landscape, keyboard, reduced motion and 200% text checks; demo dialog tested at 320px/200% text |
| Isolation | Main store/users/event/claims/payments/ledger stay byte-equivalent at the record level across demo reset; separate cookies reject cross-workspace access |
| Repeatability | Four career-event samples produce expected simulated eligibility; same receipt after reset succeeds; old image URL fails; demo survives restart |
| Worker/reset ordering | Reset is observed queued while extraction is held, then completes after processing; no removed receipt/payment returns on a later tick |
| External services | Main external-provider tripwires remain uncalled; demo credential fields are empty; no real integration call or owner .env mutation |

The scoped UI tests exercise the actual chooser, selection replacement, invalid-file recovery, preview popup, removal, submission, receipt ownership, exact save payload, toast pause/close/timeout, keyboard confirmation, reset and regular-account exclusion. Screenshot inspection covered desktop/mobile login, receipt review with the actions underneath, desktop/mobile toast, centered History fields and the 320px reset dialog. Final copies are retained in the local Codex task outputs; generated workspace evidence remains under .cache/reports/browser.

Full browser evidence was retained before the last three focused checks, because a later filtered run replaces generated trace/report folders. The previous 20-journey baseline is historical, not a new test count. Tests ran against disposable journals and simulated transports, not the owner's running app.

## Delivery Gate

This gate covers the changed surfaces plus the complete recorded regression. The existing [baseline gate](current.md#anti-slop-delivery-gate) remains evidence for unchanged product sections.

### Hard Gate

- R-02 PASS: current UI, DESIGN and PRD copy checked for em dash; module syntax checked.
- R-03 PASS: overflow, 44px native targets, 320px/200% text and keyboard dialog checks executed.
- R-17 PASS: ordinary money stays server-owned/Google-sourced; demo amounts are isolated and labeled Simulation; file sizes come from File metadata.
- R-18 PASS: no invented testimonial, portrait, customer or endorsement.
- R-23 PASS: owner requested demo/reset and UI refinement; existing assets reused, no new brand/image asset created.
- R-24 PASS: actual demo, history, account, blob preview and scoped private receipt destinations exercised; no dead decorative controls.
- R-25 PASS: observed text minimum 4.855:1; actual auth backgrounds sampled; inherited perceivable inputs/focus preserved.
- R-26 PASS: entry, sample, replacement, removal, submit, reset, Cancel, Escape, close/timeout and Exit demo perform actual actions.
- R-27 PASS: empty, invalid, busy, error, success, unavailable integrations and reset-empty states exercised.
- R-28 PASS: no filler FAQ introduced.
- R-32 PASS: no focus stealing on toast; pause/restore, role keyboard, modal Cancel/Escape and return focus tested.
- R-33 PASS: source, CSS and tests authored directly; copy/install helpers do not rewrite application logic.
- R-34 PASS: deliberate Healthy light theme; no deferred or broken toggle.
- R-35 PASS: executed Node/syntax/full browser checks, screenshot inspection and click-through above.
- R-36 PASS: no unmeasured security/performance or real AI/payment completion claim.
- R-37 PASS: existing owner-selected Healthy direction and explicit new placement/context choices precede edits.
- R-38 PASS: demo account, files and predictions identify simulation; no fake real transactions or activity.
- R-39 PASS: visible labels, native forms/dialog/selects/buttons, 44px actions, state feedback, zoom and reduced motion preserved.
- R-40 PASS: receipt media retains dimensions/containment; no blocking asset/script added or invented performance score.

### Purpose-Gate

- R-01 PASS: the existing pastel anchors give requested login edge depth; form opacity protects readability.
- R-04 PASS: existing person/file/send/back icons retain task meaning; no stock decoration or new icon collection.
- R-06 PASS: existing offline Segoe typography and readable mixed case retained.
- R-07 PASS: no decorative grid/dot background added.
- R-08 PASS: Send denotes submit; no universal arrow decoration added.
- R-09 PASS: Simulation is an actual workspace state, not a marketing badge.
- R-10 PASS: flat Healthy surfaces remain; no glass/blur stack.
- R-12 PASS: small toast elevation distinguishes an overlay from the unchanged document flow.
- R-13 PASS: no glow system.
- R-14 PASS: empty upload, selected receipt, History, account and confirmation compose around their actual content.
- R-19 PASS: no new animation loop; inherited reduced-motion behavior and atomic busy colors remain.
- R-22 PASS: no generic illustration; real supplied receipt images support the task.

### Liveliness, craftsmanship and quality locks

- Dials, consistency, focal point, whitespace, accent, identity and Design Read PASS: ENERGY 2 / RHYTHM 2 / MOTION 1; rose/pearl anchors, original Ribbon logo and receipt-first composition stay coherent. Space supports the form, preview or confirmation.
- C-1 to C-5 PASS: placement has a reason, controls work, sections serve actual account/receipt data, responsive/error states are recorded, and simulation is not sold as a real provider result.
- R-05/11 PASS: authenticated task composition, with differentiated action/field/panel/dialog geometry, rather than a marketing template or universal pill.
- R-15/16 PASS: explicit Try demo, Use sample, Change/Remove file, Submit and Reset demo labels; no marketing filler.
- R-20/21 PASS: original reimbursement identity and deliberate light direction retained.
- R-29/30/31 PASS: documented pearl/rose/mist semantics, owner logo and task-specific placements; no copied reference branding or unexplained trend stack.

## Remaining limits

Real Committee reimbursement still requires the configured Google ledger, authorized Gemini inference and PayPal Sandbox readiness. The new demo does not enable them or add money to the real spreadsheet. Main account credentials, receipt/financial journals, original logo and .env are preserved. No deployment, live payout or post-submission cancellation was added. Restart the existing backend normally and hard refresh to load the new API and Committee-only login entry.
