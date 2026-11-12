# Documentation

| Area | Start here |
|---|---|
| Product | [PRD](product/PRD.md), [scope](product/mvp.md), [status](status.md) |
| Structure | [Folders](engineering/folders.md), [architecture](engineering/architecture.md), [API](engineering/api.md) |
| AI | [Pipeline](ai/pipeline.md), [OCR contract](ai/extraction-contract.md), [Decider contract](ai/assessment-contract.md) |
| Money | [Net cost](engineering/net-cost.md), [payments](engineering/payments.md), [data model](engineering/data-model.md) |
| Setup | [Development](engineering/development.md), [integrations](engineering/integrations.md), [handover](engineering/handover.md) |
| Design | [Direction](../DESIGN.md), [tokens/components](design/system.md) |
| Verification | [Current work](verification/current.md), [backend upgrade](verification/backend-upgrade.md) |
| Demo | [Event](../demo/campus-career-day/EVENT.md), [receipts](../demo/campus-career-day/receipts.zip), [expected results](../demo/campus-career-day/expected-results.csv) |
| Decisions | [ADRs](engineering/decisions.md), [implementation ledger](engineering/implementation-plan.md) |
| Privacy | [Access control](security/access-control.md), [data use](policies/data-use.md), [reimbursement](policies/reimbursement.md) |
| Operations | [Runbook](operations/runbook.md), [deployment](operations/deployment.md) |

Executable LangChain prompts live in backend/src/ai/prompts/; documentation is not the runtime prompt. OCR extracts evidence, Decider returns item decisions/reasons, and the application validates financial authority. Current owner requirements supersede historical descriptions within retained backend records.
