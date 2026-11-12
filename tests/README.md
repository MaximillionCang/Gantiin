# Tests

Current local verification: 95 Node tests, 57-module syntax and 22 browser journeys. A separate owner-authorized real Gemini OCR/Decider sample passed without PayPal or Sheets. See [current evidence and limits](../docs/verification/current.md).

- core/financial: exact MYR/net costs, partial/zero/concurrent funds, idempotency, reservations, stale snapshots and safe retry/recording.
- HTTP: roles, private receipts, CSRF/origin/session/rate/OAuth, safe spreadsheet URL and unavailable Google budget without fallback.
- AI/adapters: separate actual LangChain request construction with mocked transport, structured output, evidence/citation validation and provider failures. No real inference/accuracy claim.
- frontend/browser: actual data projections, transport errors, login/recovery, upload, description-only event save, visible rejection reason, History, new-tab spreadsheet navigation, responsive/focus/contrast and busy-state checks.
- isolated Committee demo: separate account/session/cookie/CSRF/store, one CMT and no Treasurer, all four career receipts, repeat submission after reset, protected primary data, persistent demo data across restart and reset serialized behind an in-flight worker. Browser coverage includes entry below PayPal, sample/receipt popup, confirmation Cancel/Escape/focus, History/Account reset, regular-account exclusion and 320px/200% text.

Use npm.cmd test, npm.cmd run check and npm.cmd run test:e2e. Tests explicitly select BUDGET_SOURCE=fixture and temporary stores; they never load the owner's .env, reset runtime accounts or send real payments. Browser screenshots/JSON are in .cache/reports/browser, traces and HTML in sibling folders. Real provider checks are separate and bounded.
