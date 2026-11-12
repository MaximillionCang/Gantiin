# API and durable worker

src/server.mjs serves authenticated APIs and composes http/transport.mjs and http/static.mjs. domain/ separates general validation, money, receipt and assessment contracts; domain.mjs retains a stable import facade. db.mjs owns SQLite; service.mjs serializes allocations/reconciliation. adapters/ contains fixture and Sandbox implementations. See docs/engineering/implementation-plan.md and docs/integrations.md.

ai/ contains separate LangChain Gemini role configuration, structured runner, extraction/decider modules and prompts/schemas. domain/allocation.mjs owns exact net costs; adapters/sheets-contract.mjs owns stable payment/item records. Node 24.16+ is required; run from repository root. No arbitrary payout, manual approval, report export or live-mode endpoint. One process/database per dedicated sheet. Removed empty src/gantiin markers; migrations remains reserved, not a migration framework. No runtime database reset is part of this upgrade.
