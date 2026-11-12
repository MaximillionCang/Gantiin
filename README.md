# Gantiin

Event reimbursements in MYR. OCR reads the receipt; a separate Gemini Decider checks each item against the Treasurer's event name/description and approved spreadsheet evidence. Server validation controls money, recipients and automatic PayPal Sandbox payments.

## Run locally

Use Node 24.16+ in the Node 24 line. From this folder:

```powershell
npm.cmd ci
npm.cmd start
```

Open http://localhost:3000 with your existing credentials. Keep the populated .env; use .env.example only for a new installation. Do not reseed existing accounts. After a backend update, stop the old server normally, start it again and hard refresh the browser.

For the isolated demo, choose Committee, then Try demo below PayPal. Use sample selects a ready-made receipt. Reset demo in History or Account deletes demo submissions and receipt files after confirmation, while retaining the demo account. One regular Treasurer remains; no demo Treasurer is created. The demo uses local simulated providers and its own private database beside the main database at demo/committee.sqlite. It persists until explicitly reset and never changes the main spreadsheet or calls Gemini/PayPal.

The balance reads Google Sheets by default. An empty/unavailable sheet shows Unavailable, never a sample RM100. The owner has now prepared a Sandbox demo spreadsheet with RM1,776 funding and approved receipt references. Its RAB table records RM686 already spent outside Gantiin and RM1,090 available; the protected reimbursement budget uses that remaining allocation. the Demo tab forecasts all three eligible claims fully covered. Its Demo tab previews payments; only real confirmed Sandbox results belong in Transactions. Fixture payouts remain disabled against a Google budget.

For the owner's prepared Sandbox database, stop the existing server normally and use `npm.cmd run start:sandbox`. This reads `.env` first, then the private `.env.sandbox` mode/database overrides. Existing account emails and current password hashes were preserved. It does not authorize AI usage, confirm funding or enable PayPal login. See [Sandbox preparation](docs/engineering/sandbox-ready.md) for the remaining checks.

## Project map

- [Requirements](docs/product/PRD.md), [current status](docs/status.md), [folder map](docs/engineering/folders.md)
- [Setup](docs/engineering/development.md), [integrations](docs/engineering/integrations.md), [verification](docs/verification/current.md)
- [Design](DESIGN.md), [design system](docs/design/system.md), [documentation index](docs/README.md)
- [Demo event](demo/campus-career-day/EVENT.md), [receipt ZIP](demo/campus-career-day/receipts.zip), [expected results](demo/campus-career-day/expected-results.csv)

Executable AI instructions: apps/api/src/ai/prompts/extraction.mjs and decider.mjs. Output schemas live beside them in ai/schemas/. Gemini uses one server-only key and configurable OCR/Decider model slots. Both current slots are gemini-3.5-flash-lite; read-only key/model access is verified, inference remains disabled until authorised. Never paste API keys into model-name fields.

## Checks

OCR and Decider can be tested independently of PayPal/Sheets using one supplied synthetic receipt:

```powershell
npm.cmd run ai:check -- --allow-ai-usage
```

This consumes Gemini quota and writes only .cache/reports/ai-check.json. It does not enable the main app, modify .env, submit a claim or send a payout. Without the explicit flag no inference runs. One real sample is verified: 4 items, RM239.90 total, 3 accepted/1 rejected and RM200.00 eligible. The website's demo remains separate simulation.

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run test:e2e
```

Tests use isolated fixture stores and never load the owner's .env or send real payments. Screenshots, traces and HTML reports live under ignored .cache/reports. Financial report/balance sheet, live payouts, model training and multi-instance deployment are outside the current scope. MIT applies to repository code; supplied assets/dependencies retain their own rights.

For HTTPS testing on this prepared installation, run npm.cmd run start:https. It starts the Sandbox website and cloudflared together in the foreground, uses the generated HTTPS origin for OAuth/cookies, and prints Website and PayPal Return URL. Keep that terminal open; Ctrl+C stops both and releases the database. Each new Quick Tunnel has a new hostname: register the new printed Return URL in PayPal before testing login and use the printed Website URL in the browser. The old temporary URL is expired. npm.cmd run start:sandbox remains local-only at localhost:3000. CLOUDFLARED_PATH in the private profile points to the verified installed CLI; other installations can provide the official CLI on PATH. Never run both server commands at once. No AI, funding or payment flag is enabled by this startup command.
