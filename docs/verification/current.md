# Current verification

## Latest performance and judge-access verification

12 November 2026: 65 modules pass syntax checks; 115/115 backend tests and the entire 26/26 browser suite pass. Tests verify public asset revalidation/compression, private API no-store, Overview returning while the processing queue is held, fresh subsequent budget reads, one set of page requests per login, concurrent event/data requests, Settings expansion without navigation, mobile/keyboard operation and short passwords. Desktop/mobile Settings screenshots were inspected.

Public app.mjs transfers shrink from 51,814 to 14,523 bytes with gzip; CSS from 45,502 to 8,830. Login artwork can revalidate with an empty 304 response. These are payload measurements, not a claim about hosted latency or Render cold starts. Financial authorization reads are never served from a display cache. The owner's three Sandbox website passwords were changed as requested after a private consistent backup and verified without altering financial data. README judge-account publication was explicitly authorized. No external payment, paid inference or sheet write was performed. These updates supersede the older counts below; older manual release limitations remain.

12 November 2026. This report supersedes older counts and interface descriptions. Historical provider evidence remains historical.

- `npm.cmd run check`: passed, 64 modules.
- `npm.cmd test`: 113 passed, zero failed/skipped.
- Browser full run after fixture/navigation fixes: 24 passed, one failed due to a test helper opening the mobile menu before the preceding Settings navigation had rendered.
- After waiting for the actual Account destination, the entire affected app.spec.mjs passed: 15/15 in 38.8 seconds. The other ten journeys passed in the preceding full run. All 25 journeys are covered by these two runs; this is not a claim of one final 25/25 invocation.

Browser checks exercise desktop/mobile authentication, account scope, settings, upload, payment/sheet simulation, technical retries, history filters, responsive layouts, keyboard focus, native rejection/reset dialogs, enlarged text, reduced motion, axe accessibility and rendered control contrast. Public Try demo remains absent; isolated demo is entered only through the fixture harness. The harness reloads after changing its demo-mode storage flag.

Measured secondary text contrast is at least 4.92:1 across the tested semantic surfaces, control borders at least 3.45:1, and chart bars 3.82:1 on white. Desktop Treasurer login and mobile upload screenshots were visually inspected: photo/form composition, unchanged logo, readable controls and no horizontal overflow. Additional screenshots are local ignored test reports.

Delivery review: application purpose and concise financial workflow are preserved; energy 2/rhythm 2/motion 1; native controls, keyboard states and mobile layouts pass the automated checks. A comprehensive manual click-through of every screen and browser testing of a newly issued ordinary reset token remain outstanding. Backend one-use/expiry/session-revocation reset tests pass. Do not label the whole release or every design gate complete from these results.

No owner data, account, receipt or journal was reseeded. No real payment, paid AI inference, owner-sheet write or deployment was performed. Treasurer PayPal consent remains unresolved. Earlier single-receipt AI results and prior payment journal evidence do not constitute fresh end-to-end provider verification.

See [startup instructions](../../PANDUAN-RUN.md), [interface specification](../../DESIGN.md) and [checkpoint](../../CHECKPOINT.md). Logs remain in the local Codex working folder and generated reports in ignored .cache/reports.
