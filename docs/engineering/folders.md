# Project folders

```text
Gantiin/
  apps/
    api/src/
      ai/{prompts,schemas}/
      adapters/
      domain/
      http/
    web/
      assets/
      demo/
      src/{components,lib,pages}/
  data/
    examples/
    runtime/                 # private, ignored
  demo/campus-career-day/    # event description, receipts and expected results
  docs/
    ai/
    design/
    engineering/
    hackathon/
    operations/
    policies/
    product/
    security/
    verification/
    README.md
    status.md
  scripts/
  tests/{e2e,helpers}/
  .cache/reports/            # generated browser reports/screenshots
  AGENTS.md
  DESIGN.md
  README.md
  package.json
```

The OCR and Decider instructions live in apps/api/src/ai/prompts/extraction.mjs and decider.mjs. Their structured outputs live in ai/schemas/; validation/payment authority stays in domain/ and service.mjs. Runtime configuration stays in the ignored root .env. User databases, receipt BLOBs, transaction records and private credentials are never moved by documentation cleanup.

Native browser pages call the same-origin API. Only explicitly allowlisted assets/modules are served. apps/web/demo and data/examples/receipts.json contain the five old deterministic test fixtures; demo/campus-career-day contains the separate new real-OCR demo package.

apps/api/src/committee-demo.mjs owns the isolated Committee simulation. On first demo entry it creates a separate demo/committee.sqlite beside the main database (normally data/runtime/demo/committee.sqlite), with one CMT and no Treasurer. In-memory test stores keep their demo entirely in memory. Reset clears only this marked demo store; it never deletes or opens the main database for cleanup. The same four career-event PNGs also serve as explicit deterministic inputs in this demo, using the human-authored expected labels rather than real AI inference.

Unused alternate scaffolds, placeholder-only training/infrastructure/package folders, old login backgrounds and obsolete UI revision reports were removed after import/reference inspection. Current verification and financial backend evidence remain under docs/verification. Generated reports live under .cache rather than adding folders at the repository root. No framework migration or dependency reinstall was required.
