# Local scripts

Run from repository root; package.json provides commands.

| Script | Purpose and effect |
|---|---|
| setup.mjs | Initialize empty local DB; --demo creates labeled fixtures, otherwise unconfigured Sandbox. Prints random initial credentials and saves ignored private note. |
| recipient.mjs | Interactive operator verification/binding of existing CMT Sandbox account. Server must be stopped. |
| sheets-setup.mjs | Only after owner authorization, initialize five tabs in a dedicated EMPTY test spreadsheet and protect financial tabs. Refuses existing data; never a populated-sheet migration. No payouts. |
| probe.mjs | Report missing setup; when authorized, read Sheets, acquire Sandbox token, run one synthetic AI extraction/assessment. No payout or fake ledger writes. |
| generate-receipts.mjs | Recreate labeled synthetic receipt PNG test data with Playwright. --file net-cost.png targets only the shared-discount example, preserving other fixture PNGs. No cloud calls. |
| start-https.mjs | Run the Sandbox server and an owner-authorized temporary HTTPS tunnel together. Prints the matching PayPal callback; Ctrl+C closes both. Does not enable AI usage, funding or payouts. |
| check.mjs | Check JavaScript syntax and authored-copy punctuation. |
| e2e.mjs / e2e-server.mjs | Isolated fixture test server and Playwright runner; no external providers. |

No paid infrastructure, deployment, training or live transfer script. Use docs/integrations.md before external probes.
