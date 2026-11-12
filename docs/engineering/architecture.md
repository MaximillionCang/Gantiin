# Architecture

See ADR-008 through ADR-010. Node 24 ES modules serve the API and semantic HTML/browser modules from one origin. SQLite holds accounts, sessions, policies, private receipt BLOBs, claims, payments, durable work, and audit events. There is no public receipt storage.

A single durable worker processes claims, retrieves current sheet context, validates receipt extraction and AI output, calculates sen, reserves funds, sends Sandbox payouts, confirms item results, then synchronizes Sheets. Worker recovery uses persisted states and stable payment identity. One process and one writer per spreadsheet are supported; do not scale horizontally without a distributed transaction/lock design.

Fixture adapters are explicit and synthetic. Sandbox adapters never fall back. google-auth-library handles Sheets auth, LangChain ChatGoogle handles separate structured OCR/decider calls, and native fetch handles Sandbox PayPal. ai/ separates configuration/calls/prompts/schemas; domain/ owns validation and exact net-cost allocation; http/ owns transport/static concerns. A 45-second whole AI-call deadline and one maximum transport retry bound inference. The decider receives evidence, no payment tools, recipient, remaining funds or secrets. Sheets payment/item records use durable fixed ranges and confirmed read-back. See net-cost.md and the AI contracts.

No infrastructure/deployment/training has been provisioned. A laptop-hosted app stops when the process/laptop stops, but its SQLite journal survives restart. Protect and back up the database before external demo use. See integration setup and runbook.
