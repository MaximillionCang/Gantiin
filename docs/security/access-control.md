# Access control

| Operation | CMT | Shared treasurer |
|---|---|---|
| Read event policy | Joined event | Managed event |
| Submit claim | Self only | No |
| Read claim/receipt/payment | Self only | All in event |
| Create CMT/configure policy | No | Yes |
| Manual approve/override | No | No |
| Set arbitrary payment amount/recipient | No | No |
| Technical recovery | Own existing operation | Existing event operations |

Server sessions bind user, role, and event; queries enforce ownership, including BLOB receipt responses. Browser role/actor/status/recipient inputs cannot authorize operations. Private receipt bytes are never served as static assets. CMT responses never include another CMT's recipient.

Passwords use salted scrypt; session tokens are random and stored as hashes. HttpOnly SameSite=Lax cookies, same-origin mutation checks, and session CSRF tokens protect mutations. Login is rate limited. PayPal OAuth state is single-use, cookie-bound, expiring and purpose-bound; unknown identities cannot auto-register. Use TLS outside loopback.

Role selection chooses a form/endpoint, never authorization. /api/login/treasurer resolves the existing single treasurer server-side and fails closed if missing/ambiguous. /api/login accepts CMT email/password. Browser role/user-ID fields and role mismatches are rejected. Both share IP/account attempt limits and rotate sessions. Revision 1.5 UI requests browser-session cookies with eight-hour server expiry; it no longer sends a session-persistence preference. The backward-compatible backend optional Boolean remember capability still supports a 30-day maximum when explicitly invoked outside this UI. No account/password migration is performed for UI work.

Committee Remember email stores only {enabled,email} under gantiin.committee-email in localStorage, using the server-returned last successful Committee identity. Failed attempts do not replace it; opt-out clears the email; blocked storage is caught without preventing authentication. Treasurer has no checkbox and never replaces a remembered Committee email. This preference grants no session or authorization. No password, session token or CSRF value is written to local/session storage. Browser password-manager behavior is independent of this application preference.

Owner-authorized direct password reset is a synthetic local demo exception, not public recovery. /api/demo/reset-password requires fixture configuration and stored fixture mode, loopback APP_BASE_URL/HOST/remote address, enabled flag and same origin. It accepts a one-character password only after that gate, with five resets per IP per 15 minutes and a generic account-existence response. Matched resets revoke target sessions/pending linking state and audit the event. Sandbox/public-host configurations reject the endpoint. Anyone with access to this local demo can replace a fixture password; do not expose it as a real-account recovery mechanism. Disable DEMO_PASSWORD_RESET_ENABLED for normal use. Normal account creation/change retains the 12-character minimum.

Treasurer PayPal linking requires password confirmation and a verified official identity matching PAYPAL_SENDER_ACCOUNT_ID. CMT linking must match its verified recipient. OAuth state binds purpose, role, browser, expiry and any backend persistence preference; the current UI supplies only the selected role. Committee email preference is applied to the authenticated session identity after return, without extending the session. Callback query input cannot elevate role. Unknown/colliding/wrong sender/recipient identities are rejected. Actual external consent remains unverified.

Recipient setup is an operator-only local command with a verification reference; CMT/LLM cannot replace it. Policy/recipient changes cannot redirect an in-flight payout snapshot. Test cross-CMT IDs, receipt access, treasurer-only routes, malformed roles/amounts, expired sessions, CSRF, OAuth replay, identity collisions, and stale policies.
