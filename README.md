# Gantiin

AI-assisted, item-by-item reimbursements for event committees.

**Status: folder and documentation template only.** No application code, installed dependencies, working integrations, infrastructure, or trained model is included.

## Product concept

Committee members submit receipts and purchase context. AI proposes which items match an event's reimbursement policy. Treasurers review the recommendations, approve an eligible amount, and initiate a PayPal Sandbox reimbursement.

The AI does not certify receipt authenticity and cannot authorize payments.

## Proposed MVP

- One event, one supported currency, and two roles.
- Receipt upload, OCR, and editable extracted items.
- Recommendations per item: eligible, ineligible, or needs_review.
- Reasons linked to versioned event rules.
- Treasurer approval and partial reimbursements.
- PayPal Sandbox payment status and CSV reporting.

This is a hypothesis to validate with event treasurers. No accuracy, time-saving, or user-adoption claims have been measured.

## Start reading

- [Project status](PROJECT_STATUS.md)
- [Documentation index](docs/README.md)
- [Product brief](docs/product/brief.md)
- [MVP and acceptance criteria](docs/product/mvp.md)
- [Backlog](docs/product/backlog.md)
- [Reimbursement policy](docs/policies/reimbursement.md)
- [Proposed architecture](docs/engineering/architecture.md)
- [Instructions for future coding agents](AGENTS.md)

## Structure

```text
apps/web/                 Reserved web source folders
apps/api/                 Reserved API source folders
packages/contracts/       Future shared contracts
ai/prompts/               Prompt draft
ai/evaluation/            Evaluation and labelling templates
data/examples/            Synthetic illustrative data
data/raw/                 Local-only private inputs, ignored by Git
data/processed/           Local-only transformed inputs, ignored by Git
data/models/              Local-only model artifacts, ignored by Git
docs/product/             Brief, MVP, backlog
docs/policies/            Reimbursement and data rules
docs/engineering/         Architecture, data model, APIs, payments
docs/security/            Role and ownership rules
docs/operations/          Hosting and operational planning
docs/hackathon/           Pitch, demo, submission
infra/                    Reserved deployment folder
tests/                    Reserved test folders
scripts/                  Reserved utility folder
.github/                  Issue and pull-request templates
```

Files named .gitkeep preserve empty folders; they are not application code.

## Configuration template

.env.example lists possible setting names. No application reads them yet. No actual credentials are included.

The proposed stack is a web client, a Python API, PostgreSQL, and private receipt storage. Frameworks, versions, providers, and hosting are not final. No package manifest, installation command, server command, or CI workflow is provided.

## Contributions and license

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

[MIT](LICENSE) is the initial license template for this repository. External datasets, dependencies, and model weights retain their own licenses. The owner may change the license before publishing.
