# Gantiin interface

Current direction: 12 November 2026, updated for the owner's supplied Gantiin logo and colours. This specification supersedes the earlier light blue/navy, pearl/rose and reflective-glass proposals.

Gantiin helps event committees submit receipts and lets the Treasurer track confirmed reimbursements. The interface prioritises the event, receipt, item decisions and actual paid amount.

Use Segoe UI Variable Text with Segoe UI fallback, 16px body text, at least 13px metadata, visible keyboard focus and 44px controls. Energy 2, rhythm 2, motion 1. Respect reduced motion and support 320px screens and enlarged text.

Dark remains the default. Both roles have Settings > Personal preferences > Appearance with native Dark/Light radio controls. A selection applies immediately, persists in this browser and applies to authentication as well as the workspace. Blocked storage allows a change for the current visit. Read the saved choice before the stylesheet paints, validate it strictly and do not follow the OS theme automatically. Change the palette without transitional low-contrast colour combinations; retain normal hover feedback afterward.

The following table is the default dark palette. Light mode uses canvas #f5f6fb, white surfaces/sidebar, primary text #171b2f, supporting text #505c73, purple links #5130b3 and the same purple action colour. Both palettes must meet the existing text, control and chart contrast thresholds.

| Role | Colour |
|---|---|
| Primary text | #f4f3ff |
| Links/selected labels | #bcacff |
| Action | #5935d5 |
| Action hover | #6844e5 |
| Canvas | #090b14 |
| Surface | #121626 |
| Sidebar | #0d101d |
| Secondary text | #b4bfd4 |
| Control border | #727f9c |
| Chart bars | #32c9f5 |
| Cyan / blue / violet accents | #18c9f4 / #0665f5 / #a36aff |
| Danger | #ffb0be |

The owner supplied Blue Black and White Modern Website Development Presentation.svg as the new logo and palette reference. The full Gantiin logo and symbol preserve that SVG's original raster artwork and transparency mask; the SVG viewBox and intrinsic dimensions are cropped and the original mask extent is explicit so cropping preserves transparency correctly. Do not add an opaque background or regenerate the lettering. Use the symbol alone in the collapsed desktop rail and the full logo elsewhere. Authentication uses role-specific supplied images as a left photo panel and faint page background, with a curved dark surface-colour divider and centred form. Hide the photo panel at 800px and below. Keep the official local PayPal mark on a light PayPal button for legibility. No public demo entry.

Committee sign-in uses the supplied Blue Black and White Modern Website Development Presentation (1).svg, showing a team reviewing documents and charts. Treasurer sign-in uses Blue Black and White Modern Website Development Presentation (2).svg, showing an office meeting. Each is used for both the photo panel and faint page background. Role changes update both images, with the supplied colour treatments unchanged. Recovery retains its existing money/chart background. Both login photo panels stay hidden on narrow screens.

Both login roles show the slogan over the photo as two centred lines: “Snap It. Claim It. on the first line and Gantiin.” on the second, with quotation marks around the whole slogan. The latest adjustment doubles the preceding target font sizes, then responsively limits them to fit the visible photo area beside the curved divider. The text stays centred horizontally and vertically within that picture area. White lettering sits over a dark central fade for contrast. On narrow screens the photo panel remains hidden and the same two-line slogan appears centred below the logo over the faint page background, using the current theme's text colour, with enough space reserved above the login card. Keep the slogan as real accessible text and retain the current logo size.

The dark desktop sidebar has a quiet violet selected tint and optional 80px icon rail. Settings contains role-appropriate nested destinations. Account has its own accessible disclosure with two ordinary-account destinations: Change password and Email. Change password contains the existing validated form; Email displays only the current account address as read-only, with no email-edit/save action. Preserve Committee PayPal linking/status on the Email page and the separate demo Account/reset page. Keep labelled controls/tooltips in the collapsed rail. On mobile use the Menu button, close navigation after choosing a destination, and support Escape with focus return. Sign out has a red hover state.

Light mode uses gantiin-logo-light.svg: the original coloured G symbol is unchanged and only the wordmark is black, with true transparency retained. Default dark mode keeps the white wordmark. The collapsed rail uses the same coloured symbol in both modes. Preserve the current reduced logo sizes.

Results show Receipt total and Reimbursed, where Reimbursed means confirmed paid. Item rejection reasons open in a native dialog supporting Close, Escape, outside click and focus restoration after polling. History has submission/date, paid amount, one status and View, with search, six sorts and status filters. Preserve inputs and focus during refresh.

Treasurer Event Policy has only event name, description and Save event. Overview shows actual backend balances and seven-day activity, without repeating history. The Treasurer spreadsheet link comes from server-validated configuration.

Normal recovery requests a private operator-issued one-use reset link, valid for 15 minutes. It does not promise email delivery. Keep the isolated loopback fixture recovery separate.
