# Synthetic demo

Run npm run seed:demo on an empty fixture database, then npm start. It prints shared treasurer and separate cmt.one@example.test / cmt.two@example.test credentials with a randomized password. All accounts, policy, references, receipts and balances are explicitly synthetic. No final event is selected.

For an already initialized database, run only npm start. Choose Treasurer and use its existing shared password, without entering the email printed in the private account note. Choose Committee for individual email/password sign-in. Change role clears the active form. The redesign preserves all existing account/password and reimbursement records. Do not reseed/reset them.

Treasurer: inspect Budget, Members, Event Policy. CMT: Submit Receipt, choose the supplied mixed synthetic receipt, enter test purchase context, and submit. Expected RM40 printing + RM20 registration supplies accepted, RM35 personal headphones rejected. Sufficient funds yields fixture RM60; RM30 funds yields RM30 paid and RM30 unpaid. Inspect item reasons, references, provider simulation IDs, sync, and treasurer history. Repeat with second CMT to demonstrate isolation.

Fixture results are local simulation, not actual PayPal/Google/AI evidence. For a real demonstration, configure docs/integrations.md, choose the actual event policy, verify Malaysia/MYR Sandbox accounts, upload the synthetic image, inspect real payout-item success and the dedicated spreadsheet. No manual approval step and no automatic settlement of differences.
