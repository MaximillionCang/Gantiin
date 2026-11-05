# Keamanan

Template ini belum memiliki aplikasi dan belum diaudit untuk penggunaan finansial nyata.

## Laporan privat

Kontak keamanan belum ditentukan. Hubungi pemilik repository secara privat lewat saluran yang sudah diketahui. Jangan menaruh kredensial, bon nyata, atau informasi pribadi pada issue publik.

## Ketentuan untuk implementasi mendatang

- Verifikasi identitas, role, event membership, dan kepemilikan resource di server.
- Simpan bon privat dan gunakan akses sementara yang diperiksa.
- Validasi tipe, ukuran, dan isi unggahan.
- Lindungi akses endpoint model lewat backend.
- Simpan secret PayPal/AI di server.
- Verifikasi notifikasi pembayaran, deduplikasi, dan rekonsiliasi.
- Jangan log seluruh OCR/bon atau token.

Lihat [kontrol akses](docs/security/access-control.md), [penggunaan data](docs/policies/data-use.md), dan [pembayaran](docs/engineering/payments.md).

Jika secret pernah dipublikasikan, cabut atau rotasi. Menghapus berkas terbaru tidak menghapus riwayat kebocoran.
