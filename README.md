# Gantiin

Gantiin reduces event treasurers' manual reimbursement work. Gemini reads receipt images and assesses each item's event eligibility. The server validates money and available funds, pays eligible expenses through PayPal Sandbox, and records confirmed results in Google Sheets.

## Start here: judges

- Website: [gantiin.onrender.com](https://gantiin.onrender.com/).
- [Download all four synthetic receipts](https://github.com/MaximillionCang/Gantiin/raw/refs/heads/main/demo/campus-career-day/receipts.zip).
- [Browse individual PNG receipts](demo/campus-career-day/receipts/), [event policy](demo/campus-career-day/EVENT.md), [expected item decisions](demo/campus-career-day/expected-results.csv).
- [Windows instructions](PANDUAN-RUN.md), [Render setup/data migration](docs/operations/deployment.md).

**Deployment prerequisite:** the hosted service needs the prepared Sandbox database imported before the accounts below can work. A successful deploy alone does not transfer accounts, receipts or the payment journal. `/api/session` must report `initialized: true`; provider configuration flags alone do not prove connectivity. Treasurer PayPal consent has previously remained unresolved; website password login is available after the database import.

### Gantiin website credentials

| Role | Website email | Website password |
|---|---|---|
| Treasurer | `treasurer@example.test` | `Treasurer` |
| CMT 1 | `cmt.one@example.test` | `CMT1` |
| CMT 2 | `cmt.two@example.test` | `CMT2` |

Choose **Treasurer** and enter its password only. Choose **Committee** and enter the corresponding email and password. These deliberately public judging credentials belong to the prepared Sandbox database. A fresh fixture database generates its own passwords. Passwords must be nonempty, at most 128 characters, with no minimum-length or complexity requirement.

### PayPal Sandbox credentials

Choose the matching role in Gantiin, select PayPal, and enter these credentials only on PayPal's official Sandbox sign-in page:

| Role | PayPal Sandbox email | PayPal Sandbox password |
|---|---|---|
| Treasurer / Business sender | `sb-qwvxj53786518@business.example.com` | `8*ZEj).9` |
| CMT 1 | `sb-ncudc53769756@personal.example.com` | `Bbe}K9@a` |
| CMT 2 | `sb-hekyu53769840@personal.example.com` | `K/MaEhX5` |

These are Sandbox test accounts with simulated funds, provided by the owner for judging. They are separate from website credentials. Login must be enabled and each identity must match its preassigned sender/recipient. The Return URL for the current hosted service is `https://gantiin.onrender.com/api/paypal/callback`. API keys, client secrets and Google credentials are not published.

### Judge walkthrough

1. Download and extract the receipt ZIP. All four images are synthetic, with fictional merchants.
2. Sign in as Treasurer. Inspect **Overview**, the spreadsheet shortcut, **History**, and the saved **Event Policy**. The examples assume the supplied Campus Career Day event description and approved references.
3. Sign out, choose Committee, and sign in as CMT 1 or CMT 2.
4. Open **Submit Receipt**, select an unused PNG, and submit. This starts the configured AI and automatic Sandbox reimbursement flow.
5. On **Receipt result**, inspect item decisions, **Why rejected**, Receipt total and Reimbursed. Reimbursed means confirmed paid, not merely eligible.
6. Open **History**, then sign in as Treasurer to inspect all submissions. Committee members see only their own claims. Confirmed payouts and item records synchronize to Google Sheets.
7. Try **Settings > Account > Change password / Email** and **Personal preferences > Appearance**. Email is read-only. Settings expands without navigating until a submenu is selected. Dark is the default; Light is saved on this browser.

| Receipt | Printed total | Expected eligible under the supplied policy |
|---|---|---|
| `01-printing-and-registration.png` | RM239.90 | RM200.00 |
| `02-refreshments.png` | RM465.00 | RM440.00 |
| `03-room-preparation.png` | RM184.00 | RM46.00 |
| `04-committee-dinner.png` | RM217.50 | RM0.00 |

These are human-authored expected labels, not accuracy claims. Payment depends on the current available budget and verified recipient. An identical receipt file can be submitted only once per event; if a sample is already in History, inspect that record or choose an unused sample. Duplicate protection is intentional. Do not reset financial history just to repeat a demonstration.

## Run locally

Requirements: Node.js 24.16+ within Node 24, npm, and cloudflared only for temporary HTTPS testing. Run commands from the repository root.

```powershell
npm.cmd ci
npm.cmd run start:sandbox
```

This uses the existing private `.env`, `.env.sandbox` and Sandbox SQLite database. It requires the matching Google service-account JSON, spreadsheet access, Gemini configuration and PayPal Sandbox configuration. Do not reseed an existing database. The private files are intentionally absent from GitHub; `.env.example` documents configuration names.

For PayPal login during local testing, stop the server with Ctrl+C, then:

```powershell
npm.cmd run start:https
```

Open the printed Website URL and register the exact printed PayPal Return URL. Each temporary tunnel gets a different hostname. Keep the terminal open. `CLOUDFLARED_PATH` and `GOOGLE_APPLICATION_CREDENTIALS` must point to files on the current computer. Website databases on different laptops do not automatically synchronize; use one active writer against the shared financial spreadsheet.

### Isolated local simulation without private API credentials

On Windows, use a new dedicated fixture database:

```powershell
npm.cmd ci
$env:INTEGRATION_MODE='fixture'
$env:BUDGET_SOURCE='fixture'
$env:DATABASE_PATH='data/runtime/judge-fixture.sqlite'
$env:APP_BASE_URL='http://localhost:3000'
$env:HOST='127.0.0.1'
$env:PORT='3000'
node scripts/setup.mjs --demo
node backend/src/server.mjs
```

Setup runs once on an empty fixture database and prints its randomized credentials. On later runs, use only the final server command with the same environment. Setup refuses to overwrite accounts. Open localhost:3000 and upload `frontend/demo/mixed.png` to exercise simulated processing/payment. This fixture path uses its own synthetic policy and providers; it does not call Gemini, PayPal or Google. Close this terminal before returning to the prepared Sandbox profile so its fixture environment overrides do not carry across.

## Structure

- [backend/](backend/README.md): HTTP API, SQLite, receipt AI, money validation and provider integrations.
- [frontend/](frontend/README.md): browser app, styles, themes and assets.
- `scripts/`, `tests/`: operator commands and isolated verification.
- `docs/`, `demo/`, `data/examples/`: documentation, judge receipts and active fixture inputs.
- `data/runtime/`, `.cache/`: private data and generated evidence, ignored by Git.

The old `apps/api` and `apps/web` layout has been replaced. Root npm commands and public URLs are unchanged. See [folder map](docs/engineering/folders.md) and [current verification](docs/verification/current.md).

## Verification and limitations

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run test:e2e
```

Tests use isolated databases and fixture/mocked providers, never the owner's `.env`, payment journal or real payouts. A separate authorized AI check is available with `npm.cmd run ai:check -- --allow-ai-usage`; it consumes Gemini quota but does not send payouts or write Google transaction rows.

OCR extracts facts; a separate Decider assesses eligibility from event context and approved references. Both return validated structured outputs. Integer-sen arithmetic, fresh budget reads, verified recipients, idempotency and durable authorization control payment. Confidence scores are model self-assessments, not measured accuracy probabilities. Gantiin does not certify receipt authenticity, train a custom model, enable live-money payouts or support multiple active writers.

One actual AI diagnostic read an RM239.90 synthetic receipt and assessed RM200 eligible across three accepted items and one rejection. A prior Sandbox journal records an RM200 confirmed/synchronized payment; it predates the confidence gate. These are limited historical evidence, not proof of every deployed flow. See [status](docs/status.md) and [verification](docs/verification/current.md).

MIT applies to repository code. Supplied assets, PayPal branding and dependencies retain their respective rights.
