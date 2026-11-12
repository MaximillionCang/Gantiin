# Interface system

The authoritative visual specification is [DESIGN.md](../../DESIGN.md). Its latest 12 November update uses the owner's cyan/blue/violet Gantiin logo, dark navy/black surfaces and white text. It supersedes the earlier light blue/navy and rose/glass palettes.

Dark is the default appearance. Both roles can choose Light in Settings > Personal preferences. CSS variables supply the complete alternate palette; saved browser preferences apply before initial paint and remain effective on login/recovery pages. Native radio controls preserve keyboard operation and focus. Storage failures affect persistence only. The light logo has a black wordmark and the unchanged coloured symbol, preserving transparency. Cross-tab changes update the current theme without palette fade animations.

Use existing native HTML controls and CSS tokens in frontend/style.css. Preserve the supplied logo's SVG transparency mask, mobile Menu, desktop collapsed rail, nested Settings, visible focus, 44px controls and reduced-motion support. The full stacked logo appears on login/mobile/expanded sidebar; the cropped G symbol appears in the collapsed rail. Financial status must come from backend evidence, including confirmed payment rather than eligibility.

The regression suite checks text contrast, control borders, keyboard/focus paths, responsive overflow, history filters, native dialogs and isolated demo data. Test screenshots are ignored local artefacts, not source assets. See [current verification](../verification/current.md).

Account has a second-level disclosure containing Change password and Email for ordinary Committee and Treasurer accounts. Keep native links/buttons, labelled expanded state and 44px targets. The email field comes from the current authenticated user and is read-only; there is no email update endpoint or save action. Existing Account links redirect to Change password, while existing PayPal callbacks redirect to Email with their query status preserved. Committee identity linking remains available there; the isolated demo Account/reset screen is unchanged.
