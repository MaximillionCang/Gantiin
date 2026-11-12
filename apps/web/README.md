# Browser application

Native HTML/CSS/modules, served beside the same-origin /api. No bundle step, framework migration or browser secrets. Current direction: [DESIGN](../../DESIGN.md), [system](../../docs/design/system.md), [PRD](../../docs/product/PRD.md).

app.mjs owns routes/interactions; src/lib has transport/formatting, src/components has status/event markup, and src/pages has Overview/results. Static paths are explicitly allowlisted. Session/CSRF/idempotency, private CMT scope, validation, loading/error states, keyboard focus, 44px targets, zoom and reduced motion remain.

Overview uses real Google budget data by default and never substitutes sample funds. Open spreadsheet is Treasurer-only. Event Policy contains only name/description; rejected reasons stay visible and technical metadata is collapsible. Upload fills the content width, with the actual event name beneath the heading. History retains search/sorts/status and safe in-place refresh. Explanatory/synthetic paragraphs, header search/date, old backgrounds and the template editor are removed.

Original Ribbon logo stays. Current verification: [report](../../docs/verification/current.md). Restart an existing backend and hard refresh after updates; use existing accounts, no reseed/reset.
