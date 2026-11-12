# Project folders

The two application folders are `backend/` and `frontend/`. Configuration and supporting project material remain at the repository root.

```text
Gantiin/
  backend/
    src/{ai,adapters,domain,http}/
    src/{server,service,db,password-reset}.mjs
    README.md
  frontend/
    assets/
    demo/
    src/{components,lib,pages}/
    app.mjs
    theme.mjs
    index.html
    style.css
    README.md
  scripts/                  # operator commands and test runners
  tests/{e2e,helpers}/      # isolated regression/browser tests
  docs/                     # product, design, integrations, verification
  demo/campus-career-day/   # downloadable AI/demo receipts and expected labels
  data/examples/            # active synthetic fixture catalog
  data/runtime/             # private databases/backups; ignored
  .cache/                   # generated verification evidence; ignored
  package.json
  package-lock.json
  playwright.config.mjs
  README.md
  PANDUAN-RUN.md
```

Run npm commands from the root. `npm start` targets `backend/src/server.mjs`, which serves exact allowlisted files from `frontend/`. API URLs and database locations are unchanged. Scripts, tests and current documentation use the new source paths.

Demo receipts and fixture data are active dependencies, not unused files. The unused event-brief component/static route/CSS were removed after reference checks. Private environment files, runtime data and backups are outside cleanup scope. No framework migration was made.

The isolated Committee demo still uses a separate database beside the owner's journal. It has separate users, cookies and simulated providers; its reset cannot reset the owner database. See [backend](../../backend/README.md), [frontend](../../frontend/README.md) and [verification](../verification/current.md).
