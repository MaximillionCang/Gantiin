# Render deployment

Use one Node Web Service with a paid persistent disk. Root Directory stays blank. Build: `npm ci --omit=dev`. Root package.json handles the backend/frontend split; separate Render services are not needed.

Render Start Command:

```sh
APP_BASE_URL="$RENDER_EXTERNAL_URL" npm start
```

Use Node 24.16+, HOST=0.0.0.0 and Render's PORT. Set INTEGRATION_MODE=sandbox, BUDGET_SOURCE=google, PAYPAL_MODE=sandbox and ENABLE_LIVE_PAYOUTS=false. Mount the disk at /var/data; DATABASE_PATH points to the intended SQLite file on that disk. `/api/session` is a lightweight health check, not proof of provider connectivity or account readiness.

Import private .env.render through Environment Variables. Never commit it. It leaves APP_BASE_URL and PORT to the start command/platform. Add google_sheets.json as a Secret File with GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/google_sheets.json. Do not use the Windows cloudflared path on Render.

## Existing database

The first deploy may create an empty database. `/api/session` with initialized:false means website accounts are absent. Do not seed fresh accounts against the existing event spreadsheet to mask this state.

Create a consistent private SQLite backup of the existing Sandbox journal. Transfer it privately using authorized service shell/SSH access to a **new filename** under /var/data. Never overwrite an open SQLite file. Verify the imported backup, change DATABASE_PATH and restart to switch to it. Retain the original backup. Persistent disks are unavailable during build/pre-deploy commands. Use one active writer against the financial spreadsheet after the switch.

Set the PayPal Sandbox Return URL to the actual Render origin plus /api/paypal/callback. Current service: https://gantiin.onrender.com/api/paypal/callback. A separate Treasurer identity app, if configured, also needs this URL. Verify official provider consent without bypassing role/recipient matching.

## Verification and shutdown

Verify account readiness, Google read/schema access, website login and PayPal consent separately. AI inference and Sandbox payouts consume provider resources; configuration flags do not establish a successful end-to-end flow. Fixture tests do not establish deployed provider access.

After the full judging-access period, back up required data before removing the paid service/disk. Compute and storage have separate charges. Auto-deploy Off does not stop running-service billing. Check remaining resources in Billing. Local source cleanup does not deploy, suspend or delete cloud services.

Official references: [web services](https://render.com/docs/web-services), [disks](https://render.com/docs/disks), [secrets](https://render.com/docs/configure-environment-variables), [billing](https://render.com/docs/faq).
