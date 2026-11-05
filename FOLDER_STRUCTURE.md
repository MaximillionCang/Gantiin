# Struktur folder dan berkas

Template saja; source folder hanya berisi .gitkeep.

```text
Gantiin/
|-- .github/
|   |-- ISSUE_TEMPLATE/
|   |   |-- bug_report.yml
|   |   \-- feature_request.yml
|   |-- workflows/
|   |   \-- README.md
|   \-- PULL_REQUEST_TEMPLATE.md
|-- ai/
|   |-- evaluation/
|   |   |-- cases.csv
|   |   \-- README.md
|   |-- prompts/
|   |   \-- item-review.md
|   \-- README.md
|-- apps/
|   |-- api/
|   |   |-- migrations/
|   |   |   \-- .gitkeep
|   |   |-- src/
|   |   |   \-- gantiin/
|   |   |       |-- adapters/
|   |   |       |   \-- .gitkeep
|   |   |       |-- auth/
|   |   |       |   \-- .gitkeep
|   |   |       |-- claims/
|   |   |       |   \-- .gitkeep
|   |   |       |-- events/
|   |   |       |   \-- .gitkeep
|   |   |       |-- payments/
|   |   |       |   \-- .gitkeep
|   |   |       |-- reporting/
|   |   |       |   \-- .gitkeep
|   |   |       \-- review/
|   |   |           \-- .gitkeep
|   |   \-- README.md
|   \-- web/
|       |-- src/
|       |   |-- components/
|       |   |   \-- .gitkeep
|       |   |-- features/
|       |   |   \-- .gitkeep
|       |   \-- lib/
|       |       \-- .gitkeep
|       \-- README.md
|-- data/
|   |-- examples/
|   |   |-- claim.json
|   |   |-- event-policy.json
|   |   \-- expected-assessment.json
|   |-- models/
|   |   \-- .gitkeep
|   |-- processed/
|   |   \-- .gitkeep
|   |-- raw/
|   |   \-- .gitkeep
|   |-- dataset-register.csv
|   \-- README.md
|-- docs/
|   |-- ai/
|   |   |-- pipeline.md
|   |   \-- training.md
|   |-- engineering/
|   |   |-- api.md
|   |   |-- architecture.md
|   |   |-- data-model.md
|   |   |-- decisions.md
|   |   |-- development.md
|   |   \-- payments.md
|   |-- hackathon/
|   |   |-- demo.md
|   |   |-- pitch.md
|   |   \-- submission.md
|   |-- operations/
|   |   |-- deployment.md
|   |   \-- runbook.md
|   |-- policies/
|   |   |-- data-use.md
|   |   \-- reimbursement.md
|   |-- product/
|   |   |-- backlog.md
|   |   |-- brief.md
|   |   \-- mvp.md
|   |-- security/
|   |   \-- access-control.md
|   \-- README.md
|-- infra/
|   \-- README.md
|-- packages/
|   \-- contracts/
|       |-- schemas/
|       |   \-- .gitkeep
|       \-- README.md
|-- scripts/
|   \-- README.md
|-- tests/
|   |-- e2e/
|   |   \-- .gitkeep
|   |-- integration/
|   |   \-- .gitkeep
|   |-- unit/
|   |   \-- .gitkeep
|   \-- README.md
|-- .editorconfig
|-- .env.example
|-- .gitattributes
|-- .gitignore
|-- AGENTS.md
|-- CHANGELOG.md
|-- CONTRIBUTING.md
|-- FOLDER_STRUCTURE.md
|-- LICENSE
|-- PROJECT_STATUS.md
|-- README.md
\-- SECURITY.md
```

Penjelasan fungsi folder ada pada README masing-masing dan [indeks dokumentasi](docs/README.md). Manifest dependency, kode, dan workflow executable sengaja belum dibuat.
