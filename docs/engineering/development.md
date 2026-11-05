# Panduan development

## Sekarang

Hanya template. Tidak ada package.json, pyproject.toml, migration, dependency terpasang, server aplikasi, atau perintah run/test.

Jangan memulai implementasi tanpa instruksi lanjutan pemilik.

## Ketika mulai diizinkan

1. Konfirmasi stack dan versi.
2. Inisialisasi web/API, manifest, dan lockfile.
3. Tentukan identity provider, database, serta private storage.
4. Salin .env.example menjadi .env dan isi hanya yang dibutuhkan.
5. Buat migration dan seed sintetis.
6. Tambahkan perintah install, run, lint, test, dan build yang sudah dicoba.

Pisahkan development/demo dari data nyata. Uji otorisasi, jumlah, revisi, approval, serta pembayaran. Pertahankan adapter provider agar perubahan model tidak mengubah kebijakan inti.

Jangan menampilkan perintah atau hasil tes seolah-olah sudah tersedia dalam template.
