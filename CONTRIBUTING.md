# Contributing

Read PRD.md, DESIGN.md, AGENTS.md and docs/engineering/decisions.md. Use synthetic examples and describe the concrete behavior/acceptance scenario. Update contracts/docs with changes.

Run npm test, npm run check and, for browser changes, npm run test:e2e. Record actual evidence, distinguishing fixture/mocked tests from real Sandbox/Sheets/AI trials. Authentication, money, recipient snapshots, concurrency and recovery changes need relevant behavior tests.

No live transfers, secrets, private receipts, invented accuracy claims, paid infrastructure or new charges without owner authorization. Financial reporting and future settlement remain deferred until defined.
