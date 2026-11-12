# Security

Local Sandbox hackathon application, not audited for real financial use. No live transfers. Report issues privately to the repository owner through a known private channel; a dedicated security contact is not yet defined. Never post credentials, real receipts or recipient information in public issues.

Implemented controls include server session/role/event/ownership checks, private receipt BLOB access, bounded upload validation, scrypt credentials, same-origin/CSRF checks, stable payout identities, immutable recipient snapshots, and provider-result reconciliation. These controls are described in docs/security/access-control.md and tested in fixtures; they are not a security certification.

Use TLS outside loopback, a dedicated protected sheet and one app process. Retention, deletion, backups, production monitoring and deployment review remain prerequisites before broader use. Rotate any exposed secret; deleting a file does not remove historical exposure.
