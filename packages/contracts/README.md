# Template shared contracts

Belum ada kontrak executable atau schema JSON yang diimplementasikan.

schemas disediakan untuk kontrak berversi ketika pengembangan dimulai.

## Event policy yang direncanakan

schema_version, event_id, policy_version, currency, dan rules. Setiap rule memiliki rule_id, effect, category, dan instruction.

## Item assessment yang direncanakan

schema_version, claim_id, claim_revision, policy_version, dan items. Setiap hasil item memiliki item_id, recommendation, rule_ids, dan reason.

recommendation memakai eligible, ineligible, atau needs_review. Output model tidak membawa otorisasi, penerima, atau nominal payout final.

Server nanti memeriksa bentuk data, ID, versi, referensi aturan, dan satu hasil tepat untuk setiap item.
