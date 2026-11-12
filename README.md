# Gantiin

Event reimbursements in MYR. OCR reads the receipt; a separate Gemini Decider checks each item against the Treasurer's event name/description and approved spreadsheet evidence. Server validation controls money, recipients and automatic PayPal Sandbox payments.

## Judge access: PayPal Sandbox

These are PayPal Sandbox test accounts provided for judging. Choose the matching role on the Gantiin login screen, select PayPal, and enter the Sandbox credentials on PayPal's official Sandbox sign-in page.

| Role | PayPal Sandbox email | Sandbox password |
|---|---|---|
| Treasurer / Business sender | `sb-qwvxj53786518@business.example.com` | `8*ZEj).9` |
| Committee member 1 (CMT 1) | `sb-ncudc53769756@personal.example.com` | `Bbe}K9@a` |
| Committee member 2 (CMT 2) | `sb-hekyu53769840@personal.example.com` | `K/MaEhX5` |

These accounts use simulated Sandbox funds. They are PayPal credentials, not Gantiin email/password sign-in credentials. PayPal sign-in must be enabled, its Return URL must match the current website, and each identity must match the recipient/sender assignment in the application's database. Treasurer PayPal consent has previously remained unresolved; use the operator-provided Gantiin Treasurer password if that provider flow is still unavailable. Do not publish real-account credentials, API secrets, or private configuration files.

### Gantiin website sign-in

| Role | Website email | Website password |
|---|---|---|
| Treasurer | `treasurer@example.test` | `Treasurer` |
| CMT 1 | `cmt.one@example.test` | `CMT1` |
| CMT 2 | `cmt.two@example.test` | `CMT2` |

For Treasurer, choose the Treasurer tab and enter the password only. For Committee, choose Committee and enter the matching website email and password. These accounts belong to the owner's prepared Sandbox database; a fresh database creates its own credentials. Password forms have no minimum-length or complexity requirement; passwords must be nonempty and at most 128 characters. These deliberately public accounts are for judging this Sandbox prototype.

## Local startup

Use Node 24.16+ in the Node 24 line. From this folder:

```powershell
npm.cmd ci
npm.cmd start
```

Open http://localhost:3000 with your existing credentials. Keep the populated .env; use .env.example only for a new installation. Do not reseed existing accounts. After a backend update, stop the old server normally, start it again and hard refresh the browser.

The public login has no Try demo entry. Automated tests retain an isolated Committee demo with local simulated providers and a separate database. Its sample/reset controls never change the main spreadsheet or call Gemini/PayPal.

The balance reads Google Sheets by default. An empty/unavailable sheet shows Unavailable, never a sample RM100. The owner has now prepared a Sandbox demo spreadsheet with RM1,776 funding and approved receipt references. Its RAB table records RM686 already spent outside Gantiin and RM1,090 available; the protected reimbursement budget uses that remaining allocation. the Demo tab forecasts all three eligible claims fully covered. Its Demo tab previews payments; only real confirmed Sandbox results belong in Transactions. Fixture payouts remain disabled against a Google budget.

For the owner's prepared Sandbox database, stop the existing server normally and use `npm.cmd run start:sandbox`. This reads `.env` first, then the private `.env.sandbox` mode/database overrides. Existing account emails and current password hashes were preserved. It does not authorize AI usage, confirm funding or enable PayPal login. See [Sandbox preparation](docs/engineering/sandbox-ready.md) for the remaining checks.

## Project map

- [Requirements](docs/product/PRD.md), [current status](docs/status.md), [folder map](docs/engineering/folders.md)
- [Setup](docs/engineering/development.md), [integrations](docs/engineering/integrations.md), [verification](docs/verification/current.md)
- [Design](DESIGN.md), [design system](docs/design/system.md), [documentation index](docs/README.md)
- [Demo event](demo/campus-career-day/EVENT.md), [receipt ZIP](demo/campus-career-day/receipts.zip), [expected results](demo/campus-career-day/expected-results.csv)

Executable AI instructions: apps/api/src/ai/prompts/extraction.mjs and decider.mjs. Output schemas live beside them in ai/schemas/. Gemini uses one server-only key and configurable OCR/Decider model slots. The owner has authorized receipt processing in the prepared Sandbox profile. Never paste API keys into model-name fields or publish private configuration.

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
