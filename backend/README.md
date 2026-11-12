# Backend

Native Node.js 24 HTTP server and durable SQLite worker. Start from the repository root using [PANDUAN-RUN.md](../PANDUAN-RUN.md).

- `src/server.mjs`: API, authentication, access control and worker lifecycle.
- `src/http/`: request parsing and frontend allowlist, gzip and ETags.
- `src/service.mjs`: receipt processing, fresh budget validation, reservations, payment reconciliation and spreadsheet synchronization.
- `src/db.mjs`: durable accounts, claims, receipt BLOBs and payment journal.
- `src/ai/`: separate Gemini extraction/eligibility roles, prompts, schemas and structured runner.
- `src/domain/`: validation, integer-sen arithmetic and allocations.
- `src/adapters/`: Google Sheets, PayPal Sandbox, Gemini and isolated fixtures.
- `src/password-reset.mjs`: expiring account-bound one-use reset grants.

Root `scripts/` contains operator/test commands; `tests/` contains regression/browser checks. Existing private runtime data remains at `data/runtime/`. Source relocation does not move or reseed accounts, receipts or payment history.

One process/database owns the dedicated financial spreadsheet. AI has no payment tools or credentials. Display reads never replace fresh payment authorization. See [architecture](../docs/engineering/architecture.md), [integrations](../docs/engineering/integrations.md) and [deployment](../docs/operations/deployment.md).
