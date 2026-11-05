# Entitas usulan

Belum ada database atau migration.

| Entitas | Data minimum |
|---|---|
| users | ID internal dan identity provider |
| events | Nama, tanggal, currency, budget |
| memberships | User, event, role |
| event_policies | Event, versi, aturan |
| claims | Pemohon, event, revisi, tujuan, status |
| receipts | Claim, private storage key, checksum |
| claim_items | Deskripsi asli/koreksi, kuantitas, nilai minor units |
| assessments | Claim/revisi, policy/model/prompt version, hasil tervalidasi |
| approvals | Aktor, revisi, snapshot keputusan item, jumlah |
| payment_batches | ID unik internal/provider, nominal/currency, status |
| payment_items | Claim/revisi/penerima dan status individual |
| recipient_profiles | Penerima terverifikasi dan waktu verifikasi |
| audit_events | Aktor, tindakan, resource, revisi, waktu |

## Invariant

Membership mengikat akses ke acara. Approval mengikat revisi, penerima, keputusan, dan kebijakan. Gunakan transaksi database serta batasan unik untuk menghindari dua payout aktif pada klaim sama.

Simpan uang sebagai integer minor units dengan currency. Contoh USD memakai eksponen 2; jangan menggeneralisasi ke semua mata uang.

Status claim usulan: draft, submitted, needs_review, approved, rejected, payment_pending, paid.

Status payment usulan: queued, submitted, pending, succeeded, failed, unknown. Unknown memerlukan rekonsiliasi. Permintaan diterima belum berarti payout berhasil.
