# Sandbox preparation

11 November 2026 receipt processing update: the owner explicitly approved normal Committee receipt processing with Gemini. AI_USAGE_AUTHORIZED=true is now in the private Sandbox profile; its existing key and OCR/Decider model slots are unchanged. One actual Gemini check passed again: 4 items, RM239.90 total, 3 accepted/1 rejected and RM200 eligible. It used no PayPal payment or Google transaction write. Both Committee readiness checks are now complete under the saved profile; the running server needs a restart to load the flag. Committee One also has a provider-linked PayPal subject. Treasurer consent remains unresolved on PayPal; the optional separate identity-client configuration is prepared in [Treasurer login setup](treasurer-paypal-login.md) with two empty private fields. Payout authentication and the working Committee client are preserved. All 105 Node tests pass, including identity-client/payout isolation. No Sandbox payout has yet been proven successful.

Owner funding update, 11 November 2026: the owner confirmed sufficient MYR Sandbox funds and supplied the Business dashboard displaying RM5,000. The private Sandbox profile now sets SANDBOX_MYR_FUNDING_CONFIRMED=true on that owner confirmation. This is not programmatic balance verification or payout acceptance. No payment was submitted. AI usage authorization remains false pending the owner's clarified approval. The application reimbursement limit remains the Google Sheets remaining RM1,090, independent of the larger PayPal wallet.

Updated 11 November 2026, Asia/Makassar. This describes the owner's existing local installation.

## Prepared

- A private data/runtime/sandbox.sqlite contains one Treasurer and the same two website CMT identities, user IDs and password hashes. Recipients use the owner-supplied IDs and owner-confirmed MY country; no provider verification or payout is implied.
- .env now contains the owner's saved Sandbox app credentials and sender ID. Token authentication passed. Never publish the populated file.
- .env.sandbox contains mode/database overrides, with Sandbox-only endpoints and local direct recovery disabled. Current credentials and feature flags are inherited from .env.
- Google Sheets contains RM1,776 sponsor income, RM686 owner-confirmed expenses already paid outside Gantiin and RM1,090 opening reimbursement funds, with 13 approved references. Its financial tabs are protected and the real Google adapter read passes.
- The owner confirmed the RAB expenses have already left event cash. RAB shows RM1,776 income minus RM686 prior spending, leaving RM1,090. Event Budget C2 subtracts RAB H23 from sponsor receipts before converting to sen; D2 then subtracts confirmed Gantiin payouts. RAB G3 adds those payouts to table spending, so each new payment updates both views once. The owner changed sponsor receipts to RM1,000/RM450/RM326; the expected amounts now match. The separate Demo tab forecasts three full eligible reimbursements (RM200, RM440 and RM46), leaving RM1,090. The earlier RM663 half-payment case is superseded by the owner's increased funding.
- The receipt totals include rejected purchases. Full reimbursement here means the eligible items are covered, not the entire mixed receipt. Neither the Demo sheet nor RAB approval creates a confirmed payment record. Actual Transactions/Reimbursed Items remain empty; operational funds before new Gantiin payouts are RM1,090. The Demo tab remains an illustration of the original three receipts against gross sponsorship, not the live available balance or a payment ledger.

## Start the prepared profile

Stop the current server normally before using the same port:

```powershell
npm.cmd run start:sandbox
```

Use the same website emails and current passwords. Do not run seed/setup over the prepared database. The ordinary npm.cmd start retains .env's fixture mode. The isolated Try demo remains a separate simulation; it does not use this bank or spreadsheet.

## Remaining provider checks

1. In the same Sandbox REST app, confirm Payouts availability and the Business sender's MYR balance/fee coverage. The owner may fund its Sandbox wallet above the event budget; the app still caps allocation by the current Sheet balance and reservations. Keep SANDBOX_MYR_FUNDING_CONFIRMED=false until confirmed.
2. To exercise actual Gemini in normal reimbursements, explicitly authorize quota use before setting AI_USAGE_AUTHORIZED=true. The independent AI check does not enable ongoing usage.
3. For PayPal login, enable Log in with PayPal and the required profile/email/account attributes in the Sandbox app. Register exactly APP_BASE_URL/api/paypal/callback as its Return URL, matching the address actually used to visit Gantiin. Then enable PAYPAL_LOGIN_ENABLED and restart. Changes of website address require a matching provider Return URL.
4. Users can start directly with Continue with PayPal. After official PayPal authentication/consent, the server matches a verified provider payer ID to exactly one preassigned CMT recipient or the configured Treasurer sender in the selected role/event, saves the provider subject and opens that existing account. No Gantiin password or preliminary Settings link is needed. Unknown/ambiguous IDs, existing subject conflicts, role changes and browser-supplied account selections are rejected. Settings linking remains optional. An active PayPal session may avoid credential entry; the app cannot promise an account picker or bypass PayPal authentication.
5. Only after readiness is complete, submit the three supplied receipts in order to test real Sandbox payouts. Confirm payout-item SUCCESS, one ledger write per payment, accurate remaining funds and the three full eligible results under the current funding. Never create fake successful provider IDs to make the test appear complete.

Main AI and MYR funding flags remain false. The owner enabled the local PayPal login flag, but the PayPal app-settings save and actual user-consent login have not succeeded yet. No external payout, Google fake transaction or ongoing AI activation was performed during preparation.

For HTTPS testing on this prepared installation, run npm.cmd run start:https. It starts the Sandbox website and cloudflared together in the foreground, uses the generated HTTPS origin for OAuth/cookies, and prints Website and PayPal Return URL. Keep that terminal open; Ctrl+C stops both and releases the database. Each new Quick Tunnel has a new hostname: register the new printed Return URL in PayPal before testing login and use the printed Website URL in the browser. The old temporary URL is expired. npm.cmd run start:sandbox remains local-only at localhost:3000. CLOUDFLARED_PATH in the private profile points to the verified installed CLI; other installations can provide the official CLI on PATH. Never run both server commands at once. No AI, funding or payment flag is enabled by this startup command.
