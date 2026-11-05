# Kontrak API usulan

Tidak ada endpoint berikut yang sudah dibuat.

| Metode | Rute | Otorisasi |
|---|---|---|
| GET | /me | Pengguna masuk |
| GET | /events | Membership |
| GET | /events/{id}/policy | Anggota acara |
| POST | /events/{id}/policies | Bendahara |
| POST | /events/{id}/claims | Pemohon untuk dirinya sendiri |
| GET | /events/{id}/claims | Bendahara semua; panitia miliknya |
| GET/PATCH | /claims/{id} | Ownership, role, dan status |
| POST | /claims/{id}/receipts | Pemilik; draft/perbaikan |
| POST | /claims/{id}/submit | Pemilik |
| POST | /claims/{id}/assessments | Proses server yang terotorisasi |
| POST | /claims/{id}/decisions | Bendahara, bukan klaim sendiri |
| POST | /events/{id}/payment-batches | Bendahara dan approval sah |
| GET | /payment-batches/{id} | Bendahara; panitia hanya bagiannya |
| GET | /events/{id}/reports.csv | Bendahara |
| POST | /integrations/paypal/webhook | Notifikasi provider terverifikasi |

## Kontrak minimum

Mutation membawa expected_revision. Pembayaran membawa referensi approval, bukan recipient/total bebas dari browser. Server membangun data dari snapshot tersimpan.

Idempotency key dibatasi pengguna/event dan payload. Hasil AI perlu item ID unik, policy version, keputusan, alasan, dan rule IDs yang diketahui. Rancangan berada di packages/contracts/README.md.

Bedakan konflik revisi, tidak berwenang, data kurang, AI gagal, dan status pembayaran belum diketahui. Pesan error memakai correlation ID dan tidak menampilkan secret/data pribadi.
