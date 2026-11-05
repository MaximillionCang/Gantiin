# Rancangan pembayaran

Integrasi belum dibuat. Mode awal hanya PayPal Sandbox.

## Sebelum payout

Verifikasi bendahara dan membership. Cocokkan approval dengan revisi, kebijakan, item, nominal, dan penerima terverifikasi. Larang persetujuan klaim sendiri.

Hitung di server. Pastikan penyesuaian jelas dan anggaran tidak dipakai dua proses. Simpan payment record serta ID permintaan stabil sebelum memanggil provider.

AI tidak menyediakan penerima, kredensial, atau jumlah untuk langsung dibayar.

## Hasil dan retry

Accepted/submitted belum paid. Periksa hasil masing-masing payout item.

Timeout menjadi pending/unknown. Rekonsiliasi ID lama sebelum retry; jangan membuat identitas pembayaran baru untuk mengatasi hasil yang belum diketahui.

Verifikasi notifikasi, deduplikasi, dan cocokkan transaksi, penerima, nominal, serta currency. Hanya provider success yang dikonfirmasi mengubah payment menjadi succeeded dan klaim menjadi paid.

## Data dan akses

Akun pada contoh bersifat fiktif, bukan akun Sandbox siap transfer. Buat akun uji resmi nanti dan simpan kredensial di luar Git.

Akses live Payouts memiliki persyaratan tersendiri. Sandbox yang berhasil bukan persetujuan penggunaan live.

## Referensi

- https://developer.paypal.com/payouts/overview
- https://developer.paypal.com/docs/payouts/standard/integrate-api/customize/
