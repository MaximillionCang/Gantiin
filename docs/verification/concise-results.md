# Concise results, popup and AI verification

10 November 2026, Asia/Makassar. PRD 2.3. Anti Slop during and UI/UX Pro Max applied to the existing Healthy palette, ENERGY 2 / RHYTHM 2 / MOTION 1.

## Delivered

Shared ordinary/demo CMT and Treasurer views now prioritize actual money, items and colored status. Results show exactly Receipt total and Reimbursed, where the latter is confirmed paid, never eligibility or a planned payout. Accepted explanations, per-item gross/discount/payment prose and policy/reference/provider audit panels are deleted from the UI. The actual evidence remains in the protected backend.

Why rejected opens the actual item name/reason in a rounded native dialog outside the table. The table does not resize. Close, Escape and outside click dismiss it; keyboard focus returns to the correct trigger even after background result polling replaces that trigger. Content is set with textContent. Mobile and desktop layouts were inspected. Error details and recovery remain available for actual failures.

History shows submission/date, one reimbursed value and one concise state, with a paid total for currently filtered rows. Search/sorts/account scope remain. Mobile rows remove repeated labels. Selects retain native behavior, left-align text with 14px padding, reserve 44px on the right and put the chevron 18px inside the edge.

## Actual Gemini check

The owner explicitly requested checking OCR/Decider without PayPal. The configured key/model answered a basic generation request with HTTP200. The original application OCR request failed HTTP400. A compact provider-facing JSON schema resolved that failure. The original strict Zod schema and domain validators still enforce bounds, patterns, additional fields, currency, arithmetic, IDs, current policy and citations after generation. Google documents a supported schema subset and potential rejection of complex nested schemas in its [structured output guide](https://ai.google.dev/gemini-api/docs/structured-output).

The corrected actual application extraction/assessment functions were then invoked with real Gemini on 01-printing-and-registration.png, the supplied event description and no spreadsheet references. A diagnostic wrapper recorded provider completion and disabled retries for the check; it did not substitute outputs or use fixture responses. Both stages completed STOP and passed application validation.

| Observed result | Value |
|---|---|
| OCR items | 4 |
| Printed receipt total | RM239.90 |
| Decider | 3 accepted, 1 rejected |
| Rejected | Stainless thermal tumbler 450ml |
| Eligible net goods | RM200.00 |
| Payout / spreadsheet write | None |

The accepted items were programme printing, badge holders and basic lanyards. The actual Decider reason tied the tumbler to the event's explicit exclusion of personal/gift drinkware. This is one successful real sample, not an accuracy benchmark or proof that every future image succeeds.

Main INTEGRATION_MODE/AI_USAGE_AUTHORIZED flags, .env, accounts, journals and the owner's spreadsheet were not changed. The call used authorization scoped to this explicitly requested diagnostic. The website's isolated demo remains deterministic simulation, and its results do not enter the main Treasurer journal. Main automatic reimbursement still needs the ordinary AI/payment/ledger readiness gates.

To repeat from the project folder:

```powershell
npm.cmd run ai:check -- --allow-ai-usage
```

This uses Gemini quota for one supplied receipt, with no PayPal/Sheets calls. Without the explicit flag the command exits before inference. Its own output is .cache/reports/ai-check.json; the separately verified diagnostic is retained at .cache/reports/ai-live-verified.json. No API keys are in either report.

## OCR and Decider audit

- OCR: all visible purchase lines, preserved source/IDs, explicit currency evidence, integer sen, printed final total rather than tender/change, nullable uncertainty, separately scoped discounts/tax/charges. It does not assess eligibility or invent balancing figures/purposes.
- Decider: one unchanged-ID accepted/rejected result per item; event name/description is business scope; approved references support rather than override current prohibitions. Novel items can qualify; missing purpose is rejected with a specific explanation. Price/brand alone is not relevance. Reasons aim for one concise 10-25-word sentence.
- Neither treats instructions embedded in receipt/event/reference content as permission to change role/output/security. Neither receives payment tools or authority. Remaining funds do not decide eligibility. Invalid/incomplete/provider failures remain technical failures.
- Regression validates extra fields, overlong descriptions, more than 60 items, invalid currency/totals, invented/missing/duplicate IDs/citations, policy versions and incomplete finish reasons. The wire compatibility change does not loosen those checks.

## Executed checks

- 95 Node tests passed, 0 failed; syntax/copy check passed 57 modules.
- Final complete browser run: 22 passed, 0 failed, 1.3 minutes.
- Full evidence: 41 scans, 182 control observations; minimum observed text contrast 4.855:1. Six rendered auth role/viewport cases have the same minimum. Pending/partial colors compute to 7.336:1; processing to 6.767:1.
- Desktop/tablet/390/320px, landscape, 200% text, reduced motion and keyboard checks run. Popup Close/Escape/outside dismissal, table width stability and focus restoration during polling are exercised.
- Financial assertions for net RM72, actual paid values, retained evidence/models, separate sync recovery and no duplicate payout remain. Removed UI audit assertions were replaced with backend evidence checks rather than dropping the financial assertions.
- An initial run found three outdated layout/disclosure expectations and a genuine foreground/background interpolation defect when primary controls became enabled again. Expectations now match the requested interface; primary text/background colors switch atomically while border/shadow/press feedback remains. The final full suite verifies the correction.
- The AI command's explicit-usage guard was tested without making an inference request. Real inference evidence is separate from the mocked regression suite.

## Delivery Gate

All checks refer to this recorded scope, not universal accessibility or model-accuracy certification. Previous unchanged-section evidence remains in [the baseline report](current.md).

- Hard Gate PASS: R-02 syntax/copy; R-03 responsive/44px targets; R-17 server-confirmed money and explicit simulation; R-18 no fabricated trust material; R-23 existing assets/no unsolicited image; R-24 real account/history/receipt links; R-25 measured contrast; R-26 actual controls; R-27 loading/empty/error/retry; R-28 no filler FAQ; R-32 native keyboard/focus; R-33 directly authored source; R-34 deliberate light theme; R-35 executed checks/screenshots; R-36 actual test scope separated from accuracy/payment claims; R-37 owner-selected Healthy direction; R-38 demo and actual AI evidence identified; R-39 native semantics/labels/status/zoom; R-40 bounded contained media/no heavy blocking asset or invented performance score.
- Purpose-Gate PASS: R-01 rose amount hierarchy; R-04 relevant existing task symbols; R-06 existing offline readable type; R-07 no grid texture; R-08 actual submit/return directions; R-09 factual status chips; R-10 no glass/blur stack; R-12 popup elevation separates a modal from the table; R-13 no glow; R-14 receipt/history/popup compose for their content; R-19 no looping motion and atomic text/background; R-22 supplied receipt rather than decorative illustration.
- Liveliness PASS: explicit 2/2/1 dials, consistent palette/geometry, money/receipt focal point, structural spacing, rose focus and original Ribbon identity. Design direction precedes edits; fewer paragraphs expose actual items rather than empty placeholders.
- Craftsmanship/Quality Locks PASS: C-1 to C-5 intentional placement, working controls, task-driven content, tested resilience and real evidence; R-05 no marketing template; R-11 differentiated action/field/panel/dialog radii; R-15/16 concise action names/no filler; R-20/21 reimbursement identity and chosen light theme; R-29/30/31 documented semantic colors, owner logo and purposeful composition rather than copied reference content.

Remaining external setup: normal account payment/ledger readiness and owner-controlled ongoing AI activation. No real payment, live deployment, Google initialization, account reset or automatic cancellation was performed. Restart the backend normally to load changed prompts/schema and hard refresh for the new popup/summary.
