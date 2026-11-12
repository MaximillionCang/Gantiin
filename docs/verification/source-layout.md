# Source reorganization and teammate requirements

12 November 2026. This is the latest local verification; previous reports retain historical revision evidence.

- Application code now lives in backend/ and frontend/. Npm commands, Render start command and API URLs remain stable.
- Updated script/test imports, public file resolution and relative fixture/demo locations.
- Removed unused event-brief module, its static entry, four CSS rules and the empty apps folder. Retained active fixtures, downloadable demo receipts, operator scripts and documentation.
- `npm.cmd run check`: 67 modules pass.
- `npm.cmd test`: 116/116 pass.
- `npm.cmd run test:e2e`: full 32/32 pass, 1.8 minutes, isolated fixture/mock data.
- All 29 backend modules compared with the pre-cleanup backup: only expected path updates and obsolete static-entry removal; no financial/auth algorithm changes.
- Private configuration/Google JSON hashes unchanged. Markdown links/relative module imports: zero broken targets.

## Teammate features retained

| Requirement | Evidence |
|---|---|
| Supplied logo and role-specific login artwork | Incoming assets retained; login and role-switch journeys pass; desktop screenshot inspected |
| Quoted two-line slogan and responsive login | Existing markup/styles retained; desktop login screenshot inspected; responsive/contrast journeys pass |
| Dark default, Light preference and correct logo variants | Preferences tests cover persistence, cross-tab behavior, blocked storage, keyboard/mobile and canvas logo pixels |
| Account > Change password / read-only Email | Account tests pass for both roles; no email mutation requests; mobile screenshot inspected |
| Committee PayPal controls on Email | Linking/error/relink and legacy callback tests pass |
| Settings opens submenu without navigation | Performance regression test verifies unchanged URL until selecting a child |
| Short website passwords | Browser one-character change and backend Account/recovery tests pass; nonempty/maximum bounds retained |
| Performance and payment safeguards | One set of login requests, concurrent loads, ETags/gzip, no-store private APIs, queue-independent display reads and fresh financial authorization checks pass |

## Judge guide and deployment limits

[README](../../README.md) and [Windows guide](../../PANDUAN-RUN.md) include owner-authorized website/PayPal Sandbox credentials, judge steps, ZIP/individual synthetic receipts, expected amounts, duplicate behavior, run commands and a private-config-free fixture path. These are public test credentials only. API keys, .env, Google JSON, SQLite files and access notes stay ignored.

The earlier Render session check returned HTTP200/Sandbox but initialized:false. The hosted database still needs migration before website accounts can sign in. Provider configuration flags do not prove real inference, Google access, PayPal consent or payout acceptance. No paid inference, payout, owner-sheet write, account reseed, deployment, server restart or cloud deletion was performed during source cleanup. Judge-access completion remains blocked on remote database import and deployed provider verification, not on the local passing tests.
