# Menjalankan Gantiin di Windows

Gunakan PowerShell. Node.js yang diperlukan adalah versi 24.16 atau lebih baru dalam seri 24.

## Jalankan versi Sandbox yang sudah dikonfigurasi

```powershell
Set-Location -LiteralPath 'C:\Users\LENOVO\Documents\Maximillion Cang\Programming\Project-Competition\Gantiin'
npm.cmd run start:sandbox
```

Buka alamat yang dicetak terminal. Port bawaan adalah [http://localhost:3000](http://localhost:3000); konfigurasi lokal dapat memakai port berbeda. Biarkan terminal tetap terbuka. Tekan `Ctrl+C` untuk menghentikan server. Jangan jalankan dua server menggunakan database yang sama.

Jika dependensi belum terpasang, jalankan `npm.cmd ci` satu kali sebelum menyalakan server. Pertahankan file `.env` dan `.env.sandbox` yang sudah ada. Jangan menjalankan setup atau seed untuk sekadar membuka aplikasi karena data acara sudah tersedia.

## Jika perlu login PayPal melalui HTTPS

Hentikan server sebelumnya dengan `Ctrl+C`, lalu jalankan:

```powershell
npm.cmd run start:https
```

Perintah ini memerlukan `cloudflared`. Terminal mencetak Website dan PayPal Return URL. Buka Website, lalu sesuaikan Return URL di konfigurasi aplikasi PayPal Sandbox dengan nilai yang dicetak. Alamat tunnel berubah pada setiap proses baru. Terminal dan laptop harus tetap menyala. Tunnel ini hanya untuk pengujian sementara.

Jika muncul pesan port sedang digunakan, hentikan proses Gantiin sebelumnya dari terminalnya sendiri. Jangan menghapus database atau menutup semua proses Node.

## Pemeriksaan kode

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run test:e2e
```

Tes memakai data percobaan terpisah. Jangan memakai akun atau pembayaran sungguhan untuk mencoba tampilan.

## Pemulihan sandi oleh operator

Setelah memverifikasi identitas pemilik akun, operator dapat menjalankan perintah berikut dengan email akun dan alamat HTTPS aplikasi yang benar:

```powershell
node --env-file=.env --env-file=.env.sandbox scripts/password-reset.mjs EMAIL_AKUN --base-url https://ALAMAT-WEBSITE
```

Bagikan tautan hasilnya secara pribadi hanya kepada pemilik akun tersebut. Tautan berlaku 15 menit dan sekali pakai. Tautan baru menggantikan tautan sebelumnya. Tidak ada layanan pengiriman email otomatis. Jangan menyimpan tautan, sandi atau file konfigurasi pribadi di GitHub.
