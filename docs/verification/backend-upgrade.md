# Connected upgrade verification

8 November 2026. This is local fixture/mock evidence, not a real integration acceptance report. Current contracts: engineering/implementation-plan.md, engineering/net-cost.md, ai/extraction-contract.md and ai/assessment-contract.md. Historical verification.md/UI reports remain preserved.

## Executed checks

| Check | Actual result |
|---|---|
| Baseline npm.cmd test | 50 passed, 0 failed, 3.45s |
| Baseline syntax/browser | 24 modules; 15 browser journeys passed in 37.7s |
| Job 2 regression | 50 Node tests, 33 modules, 15 browser journeys (39.8s) |
| OCR/decider stages | 54 then 59 Node tests, with mocked LangChain/provider calls |
| Financial stage | 73 Node tests, including exact allocation and item recording |
| Final npm.cmd test | 81 passed, 0 failed (5.74s); isolated fixtures/mocks |
| Final npm.cmd run check | 51 modules syntax checked; authored UI/design/PRD punctuation check passes |
| Full npm.cmd run test:e2e | 18 passed, 0 failed (final artifact run 1.4m; preceding identical application run 53.8s) |
| Targeted final currency/layout fix | 2 connected journeys passed (17.8s); subsequently included in the full 17-journey run |
| npm.cmd ls --depth=0 | Installed dependencies resolve: LangChain Google 0.2.12/core 1.3.5, Zod 4.6.7, google-auth-library 11.3.3, Playwright 1.65.0, axe 4.14.0 |

The initial PowerShell npm.ps1 execution-policy block was resolved by npm.cmd, without weakening system policy. Initial restricted npm registry reads failed EACCES; approved registry/install escalation succeeded. No provider inference, external sheet write or payout was made. Tests explicitly ignore inherited provider environment values and do not load the owner's .env.

The earlier runtime preservation check matched 4/4 file fingerprints. A later final hash recheck was blocked on three active SQLite/database sidecar files; no final hash assertion is made for those locked files and no active owner process was stopped. The initial-access note remained readable. Existing .env content and owner artwork hashes were verified unchanged; only absent role slots were added to .env.

## Coverage and limits

- AI: shared/override/missing/invalid model resolution, shared-key separate actual LangChain request construction, strict schemas, original/scoped extraction evidence, unreadable/malformed/truncated responses, bounded deadline, provider errors, complete unique decisions, current prohibitions, unlisted supported items, insufficient/unexplained-code reasons, invented citations and stale versions. Mock outputs establish contract enforcement, not semantic model accuracy.
- Money: RM80/RM20 less shared RM10 gives RM72 eligible, specific gross/net discounts applied once, subset/shared/included tax, exact largest remainders/printed-order ties, large integer products, nullable absent units, unsupported scope/charges and printed-total mismatches. Zero-cost/zero-budget, proportional partial attribution, concurrency, duplicate submissions and no future settlement remain covered.
- Payments/accounting: fresh protected budget, durable reservations and immutable recipient/net-cost snapshots, unknown create/restart reconciliation, matching payout-item success, rejection of mismatches/empty item identity, single payout, fixed payment/item rows, lost responses and transaction-only item recovery. Tampered financial rows/snapshots stop processing. Sender fee amounts/MYR availability remain unverified.
- HTTP/auth: role/session/origin/CSRF/rate/password/OAuth behavior, private receipt/claim ownership and cross-CMT denial, read-only Treasurer templates, actual net/paid/item API fields and explicit static module allowlisting. Existing accounts are not reset by tests.
- Browser: login/role tabs/eyes/email preference, recovery gates, menus/settings/history/filter/sort, upload picker/drop/remove/validation, active event/rules, manual template draft/save, genuine extracting state, per-item reasons/evidence, confirmed payout with sync failure and sync-only recovery, private receipt link and own-only view. New connected fixture path confirms one payout, one transaction and one item record after recovery. Polling preserves each repeated evidence disclosure independently; unsupported charges retain readable extraction evidence and retry the same claim without payout.

Browser checks run axe WCAG A/AA scans, no-overflow checks at 1440/1024/768/390/320px, landscape, 200% text and reduced motion. Existing suite also covers 820px and short-screen navigation. Whole outcome currency values are asserted after visual review found and fixed a 320px line split. A hidden table caption's responsive width and a history test's asynchronous refresh assertion were corrected during development; final checks pass.

## Visual inspection and interaction evidence

Actual screenshots inspected: connected-policy-draft-desktop.png, connected-policy-mobile.png, connected-net-sync-pending-desktop.png, connected-net-result-1440.png, connected-net-result-390.png, connected-net-result-320.png, connected-extraction-recovery.png, submit-desktop.png and budget-desktop.png under test-results/. The final 320/390 screenshots were inspected again after adaptive monetary columns and full-width phone item records. The recovery screenshot was inspected with readable charge evidence and visible keyboard focus. Artifacts are archived under ignored .cache/verification-seven/test-results/ and regenerated by test:e2e; no owner private screenshots. Original supplied logo/Waves artwork is retained. The final full run records 39 material scans and 179 control observations, minimum computed action contrast 5.116:1, and six pixel-sampled role/viewport combinations minimum 5.753:1.

| Controls | Observed behavior |
|---|---|
| Skip link, role tabs, arrows/Home/End, Sign in | Correct focus/form/role; invalid/loading/success states |
| Password eye, Remember email, PayPal alternative | Visibility/pressed state; successful email only/opt-out; gated role-bound identity path, no real consent claim |
| Forgot password/back/reset | Fixture-only mismatch/success, normal login and disabled nonfixture recovery |
| Overview/History/Settings/subsections/sign out | Correct destinations, selected state and pinned/mobile behavior |
| Member/password and Add/Remove/Save policy forms | Validation and persisted changes in temporary stores |
| Reimbursement rules and seminar disclosure | Native disclosure opens/closes by keyboard/click |
| Load seminar draft | Editable values load; saved event is byte-for-byte unchanged until Save policy version |
| Browse/drop/remove/Submit | Real chooser, selected file/preview, validation and receipt-only request |
| Extraction and result refresh | Real fixture worker is held in OCR; UI shows Reading receipt, then independent decisions and exact net costs |
| Printed evidence/allocation/policy/reference/audit disclosures | Actual fixture source text, scoped adjustments, rule/reference IDs and separate model identities |
| Retry spreadsheet synchronization | Confirmed paid stays RM72 during failed recording; retry records once without another payout |
| Private image/Back to history/search/sort/filter/refresh | Correct resources, filtered orders and preserved preferences; other committee denied |
| Network loading/error/technical retry | Visible operational feedback and recovery of the same operation |

## Environment-specific browser restrictions

Interactive CUA browser creation/inventory reported the browser access host unavailable; no interactive CUA result is claimed. Playwright's actual headless Chromium and local screenshots worked. Taste's standalone consistency/layout attempts initially reported CDP socket closed/fetch failed before widths were inspected; zero findings in that incomplete output is not a pass. Retry results are recorded in the implementation ledger. Product-specific browser/accessibility checks above remain independent evidence. Generic Taste marketing hero/section/palette requirements do not override this authenticated owner-directed app.

The authorized standalone consistency retry inspected 1440/1024/768/390px and reported 52 FAIL/7 WARN. Marketing-only findings are 16 container-edge, 18 section-height, 6 one-section, 4 hero-screen and headline/fact/button-copy categories: the owner explicitly requires a compact content-sized authenticated login, existing navigation and light Vibrant Sunset rather than marketing sections. The hash-router link works in actual browser journeys. Eight contrast findings use a busy-artwork heuristic; the separate rendered-background pixel test and computed composites pass in both roles at the checked widths. They are not accepted as measured text-contrast failures. The slow-image finding and transfer warning are genuine inherited limitations of the required unchanged Waves PNG (1,526 KiB), not silently dismissed.

The standalone layout retry produced one 1440px no-.wrap marketing-container finding, then crashed in its stress path with undefined.map; other widths were not verified by that checker. The unmodified performance checker ran at 1440/390px and reported 2 FAIL/6 WARN, with both failures for the original PNG size. No performance-pass claim is made. No user artwork was compressed/replaced to clear a checker, and no kit checks were altered/suppressed. Playwright's product-specific 320-1440px checks, loading/error states and actual source dimensions remain the applicable functional evidence.

## Anti Slop Delivery Gate (current changed scope)

- R-02 PASS: source punctuation check covers authored UI/design/PRD; no authored em dash.
- R-03 PASS: responsive no-overflow/whole-money assertions, 320-1440px, 200% text, landscape and screenshots; minimum 44px controls inherited and exercised.
- R-17 PASS: all displayed financial figures come from fixture/server results and are identified as simulation.
- R-18 PASS: no testimonials, profiles or invented customers added.
- R-23 PASS: existing owner logo/Waves/navigation preserved; new receipt is explicitly synthetic acceptance-test data authorized by the test scope.
- R-24 PASS: navigation destinations, legacy redirects and disclosures exercised in browser journeys.
- R-25 PASS: axe scans on changed states plus existing computed/pixel contrast checks; Primary on white 10.36:1, muted on white 6.91:1 from executable contrast tests.
- R-26 PASS: actual control outcomes are recorded in the interaction table; no decorative action added.
- R-27 PASS: empty/loading/disabled/error/recovery/success states exercised, including held OCR and failed recording after paid.
- R-28 PASS: no FAQ or template filler introduced.
- R-32 PASS: native forms/details, tab/arrow/Enter/Escape/focus behavior and menu restoration exercised.
- R-33 PASS: UI features are written directly in source components/pages/CSS; structural extraction/dead-code removal does not add a patch-script runtime.
- R-34 PASS: the owner's light theme is retained; no theme toggle or unverified second theme shipped.
- R-35 PASS: actual application served with isolated databases; 18 recorded browser journeys and screenshot inspection, console-error checks on changed flows.
- R-36 PASS: local/mock/provider evidence distinguished; no accuracy, security or performance metric invented.
- R-37 PASS: existing DESIGN/MASTER and ENERGY 2 / RHYTHM 2 / MOTION 1 recorded before UI implementation; owner glass/placeholder exceptions retained.
- R-38 PASS: actual event/claim evidence displayed; seminar is explicitly optional and fixture results explicitly simulation.
- R-39 PASS: named native controls, labels, focus, textual statuses, landmarks/title/zoom, media alt/dimensions and reduced motion verified in exercised states.
- R-40 PASS: existing eager high-priority dimensioned backdrop and dimensioned receipt/logo, no new blocking third-party scripts; no unmeasured performance claim.
- R-01 PASS: existing balance gradient serves actual monetary hierarchy; new outcome band uses a restrained Secondary edge, documented in DESIGN.
- R-04 PASS: established task-specific icons retained; no new decorative AI icon or asset system.
- R-06 PASS: offline Segoe UI/tabular money and established Georgia Welcome retain their written purposes.
- R-07 PASS: owner Waves only; no generic grid/background added.
- R-08 PASS: existing back/send icons communicate real actions; no scattered decorative arrows.
- R-09 PASS: statuses reflect actual processing/payment/recording, without marketing badges.
- R-10 PASS (owner override): supplied glass material retained; financial surfaces remain opaque.
- R-12 PASS: reference control elevations retained; new data structures stay grounded.
- R-13 PASS: no glow system added.
- R-14 PASS: event brief, upload target, policy split and result/evidence layout serve distinct tasks.
- R-19 PASS: quiet inherited transitions only; reduced motion exercised.
- R-22 PASS: owner artwork retained; no generic illustration created.
- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 are explicit and match warm identity, task variation and quiet motion.
- Focal point PASS: upload, available budget, policy form and eligible net cost lead their task screens in inspected screenshots.
- Whitespace PASS: grouped financial totals/stages/items and aligned task edges distinguish information without repeated cards.
- Accent PASS: Secondary/current actions and plum money remain selective, with four owner palette anchors.
- Identity motif PASS: supplied Ribbon/Waves and reflective controls remain specific to Gantiin.
- Design Read PASS: audience, task, visual language and dials recorded in DESIGN before feature edits.
- C-1 PASS: color/layout/type/material/feedback choices have written task purposes.
- C-2 PASS: interaction table and browser assertions record working controls.
- C-3 PASS: no sales, chart or marketing filler added.
- C-4 PASS: changed responsive/error/keyboard/text/reduced-motion states exercised; standalone tool restrictions disclosed.
- C-5 PASS: no fabricated provider, performance or customer claim.
- R-05 PASS: task-led authenticated composition; marketing templates not imported.
- R-11 PASS: existing varied control/input/panel/status radii retained.
- R-15 PASS: Submit, Save policy version, Load seminar draft and Retry spreadsheet synchronization name their actions.
- R-16 PASS: no AI marketing buzzwords introduced.
- R-20 PASS: owner identity and actual reimbursement evidence retained in screenshots.
- R-21 PASS: light theme follows explicit owner direction.
- R-29 PASS: four owner palette anchors and established readable neutrals, no new core hue.
- R-30 PASS: no copied marketing layout, branding or unrelated data.
- R-31 PASS: major decisions have one-line purposes in DESIGN/MASTER and ADR-022.

## External acceptance still pending

No Gemini call, real OCR/assessment quality evaluation, owner Sheets initialization/write, Sandbox payout, MYR/fee/account capability or official provider OAuth trial was performed. Follow engineering/handover.md only after the corresponding configuration/authorization. Local fixtures are ready; the PRD's real-provider P0 acceptance remains pending.
