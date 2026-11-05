# Kontribusi

Status saat ini hanya template. Baca [MVP](docs/product/mvp.md), [arsitektur](docs/engineering/architecture.md), dan [panduan development](docs/engineering/development.md).

## Alur kerja setelah implementasi diminta

1. Pilih satu kebutuhan dan tulis kriteria penerimaannya.
2. Jelaskan perubahan perilaku yang diusulkan.
3. Gunakan contoh sintetis.
4. Perbarui kontrak, dokumen, dan status sesuai perubahan.
5. Uji batas akses, revisi, perhitungan, dan pembayaran jika terkait.
6. Catat pemeriksaan yang benar-benar dijalankan.

Contoh nama branch: feature/item-review, fix/claim-isolation, docs/payment-flow. Tidak ada branch atau remote dibuat oleh template.

## Review

Perubahan otorisasi, kebijakan, penerima, nominal, dan retry pembayaran perlu pemeriksaan khusus terhadap perilaku sebelumnya.

Belum ada perintah install, lint, build, atau test. Jangan membuat hasil tes palsu atau workflow yang selalu hijau tanpa pengujian.
