# Frontend

Native HTML, CSS and browser ES modules served by the backend at the same origin. Run from the repository root using [PANDUAN-RUN.md](../PANDUAN-RUN.md). There is no separate frontend build/server.

- `app.mjs`: routes, forms, receipt upload, Settings and account interactions.
- `theme.mjs`: dark/light selection before rendering.
- `style.css`: responsive layout, theme tokens and states.
- `assets/`: supplied branding, role-specific login artwork and PayPal mark.
- `src/lib/`: API transport and formatting.
- `src/components/status.mjs`: processing/payment labels.
- `src/pages/`: Overview and receipt results.
- `demo/`: deterministic synthetic receipt images for tests.

Settings is one disclosure button; only submenu selections navigate. Account has Change password and read-only Email. Personal preferences defaults to Dark and can save Light on this browser. Both login roles retain their supplied artwork and quoted two-line slogan. See [DESIGN.md](../DESIGN.md), [design system](../docs/design/system.md) and [verification](../docs/verification/current.md).

API credentials and financial authorization stay on the server. Confirmed paid amounts come from backend evidence. The backend serves only exact allowlisted public files. The unused legacy event-brief component and orphan CSS were removed.
