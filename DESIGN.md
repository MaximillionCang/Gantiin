# Gantiin interface

Current direction: 12 November 2026. This specification supersedes the earlier pearl/rose and reflective-glass proposals.

Gantiin helps event committees submit receipts and lets the Treasurer track confirmed reimbursements. The interface prioritises the event, receipt, item decisions and actual paid amount.

Use Segoe UI Variable Text with Segoe UI fallback, 16px body text, at least 13px metadata, visible keyboard focus and 44px controls. Energy 2, rhythm 2, motion 1. Respect reduced motion and support 320px screens and enlarged text.

| Role | Colour |
|---|---|
| Primary text | #203548 |
| Action | #174c72 |
| Action hover | #103b5a |
| Canvas | #f4f7fa |
| Surface/sidebar | #ffffff |
| Secondary text | #556575 |
| Control border | #718595 |
| Chart bars | #69869b |
| Danger | #a52a35 |

The original transparent Ribbon logo stays unchanged. Authentication uses the approved blue finance image as a left photo panel and faint page background, with a curved white divider and centred form. Hide the photo panel at 800px and below. Use the official local PayPal mark beside its label. No public demo entry.

The white desktop sidebar has a quiet selected tint and optional 80px icon rail. Settings contains role-appropriate nested destinations. Keep labelled controls/tooltips in the collapsed rail. On mobile use the Menu button, close navigation after choosing a destination, and support Escape with focus return. Sign out has a red hover state.

Results show Receipt total and Reimbursed, where Reimbursed means confirmed paid. Item rejection reasons open in a native dialog supporting Close, Escape, outside click and focus restoration after polling. History has submission/date, paid amount, one status and View, with search, six sorts and status filters. Preserve inputs and focus during refresh.

Treasurer Event Policy has only event name, description and Save event. Overview shows actual backend balances and seven-day activity, without repeating history. The Treasurer spreadsheet link comes from server-validated configuration.

Normal recovery requests a private operator-issued one-use reset link, valid for 15 minutes. It does not promise email delivery. Keep the isolated loopback fixture recovery separate.
