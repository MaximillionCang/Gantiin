# Menjalankan Gantiin di Windows

Gunakan PowerShell. Node.js yang diperlukan adalah versi 24.16 atau lebih baru dalam seri 24.

## Jalankan versi Sandbox yang sudah dikonfigurasi

```powershell
Set-Location -LiteralPath 'C:\Users\USER\Downloads\Hackathon\Gantiin'
$env:Path = "$(Join-Path (Get-Location) '.cache\tools\node-v24.22.3-win-x64');$env:Path"
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

## Preferensi tampilan

Preferensi tampilan tersedia untuk Committee dan Treasurer di **Settings > Personal preferences > Appearance**. Pilih Dark atau Light; default tetap Dark. Pilihan disimpan pada browser ini dan berlaku juga di halaman login. Pada Light, tulisan logo menjadi hitam dan simbol G tetap berwarna. Jika penyimpanan browser diblokir, pilihan hanya berlaku selama kunjungan saat ini.

## Pengaturan akun

Di **Settings > Account**, gunakan **Change password** untuk formulir perubahan sandi yang sudah ada. Bagian **Email** hanya menampilkan alamat akun saat ini secara read-only; tidak ada perubahan email atau tombol simpan email. Kontrol PayPal Committee tetap tersedia di halaman Email. Perubahan susunan menu tidak mengubah akun atau sandi yang tersimpan.

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

## Konfigurasi laptop ini

Node 24.22.3 dan npm 11.19.1 terpasang secara portabel di `.cache/tools/node-v24.22.3-win-x64`; cloudflared ada di `.cache/tools/cloudflared/cloudflared.exe`. Folder Node/npm sudah ditambahkan ke PATH pengguna Windows. Tutup dan buka kembali terminal setelah perubahan ini; bila memakai terminal VS Code, mulai ulang VS Code. Baris `$env:Path` di atas juga dapat dipakai untuk terminal lama yang belum menerima PATH baru. Folder `.cache` diabaikan Git; jangan hapus subfolder tools jika masih menggunakan perintah ini.

Gunakan `start:sandbox` atau `start:https` untuk database yang disalin, `data/runtime/sandbox.sqlite`. Perintah `npm.cmd start` hanya memuat `.env`, yang masih merupakan profil fixture terpisah dan menunjuk database lain yang belum ada. Jangan gunakan perintah itu untuk membuka data Sandbox. Tidak perlu setup/seed. Kredensial Google memakai `C:/Users/USER/.gantiin/google_sheets.json`.

Dependensi sudah dipasang dengan `npm.cmd ci`; Chromium untuk pengujian dipasang dengan `npx.cmd playwright install chromium`. Ulangi instalasi dependensi setelah lockfile berubah, saat server berhenti. Tidak perlu menyalin node_modules dari laptop lain.

Untuk PayPal, hentikan server sebelumnya, jalankan `npm.cmd run start:https`, lalu baca baris **Website** dan **PayPal Return URL** di terminal. Pada PayPal Developer Dashboard, buka aplikasi **Sandbox** yang sesuai dengan client ID lokal, aktifkan Login with PayPal bila diperlukan, dan simpan Return URL persis seperti yang dicetak, termasuk `/api/paypal/callback`. Jika akun meminta persetujuan atau login, selesaikan langsung di halaman PayPal dengan akun Sandbox yang sesuai. Pengujian otomatis tidak membuktikan consent berhasil. Tekan Ctrl+C untuk berhenti; jika Windows menanyakan `Terminate batch job (Y/N)?`, jawab Y.

Database lokal tidak tersinkron otomatis dengan laptop anggota tim lain. Sebelum mengganti salinan database, hentikan aplikasi. Gunakan backup SQLite yang konsisten dari sumber yang benar: SQLite backup API / VACUUM INTO ke file baru, atau tutup semua koneksi pada sumber dan pastikan WAL sudah di-checkpoint sebelum menyalin. Menyalin hanya `.sqlite` saat transaksi masih berada di `-wal` dapat kehilangan data; jangan mengganti file database yang sedang terbuka.

Akses Google read-only, skema, proteksi, formula dan rekonsiliasi penuh dengan jurnal lokal berhasil diverifikasi. Pemeriksaan awal sempat menemukan perbedaan `item_id` pada baris 2 tab **Reimbursed Items**; perbedaan tersebut tidak ada pada pembacaan ulang dan validasi penuh berikutnya lulus. Pemeriksaan ini tidak mengubah database maupun spreadsheet, sehingga penyebab perubahan hasil tidak dipastikan. Jika konflik muncul lagi, bandingkan jurnal otoritatif dengan spreadsheet sebelum memproses klaim baru; jangan menimpa data agar pemeriksaan lulus.

Verifikasi laptop, 12 November 2026: syntax/copy check 64 modul lulus, 113/113 tes backend lulus, 25/25 tes browser lulus dalam satu run penuh. Tes memakai database sementara serta fixture/mock terpisah. Startup lokal dan HTTPS diuji dengan homepage serta /api/session HTTP 200. Autentikasi token PayPal Sandbox dan metadata kedua model Gemini berhasil; consent login PayPal, inference berbayar, pembayaran dan penulisan spreadsheet tidak dijalankan. Semua proses pengujian dihentikan. Catatan akun, acara, klaim, pembayaran dan audit tetap sama. Backup konsisten sebelum startup tersimpan lokal di .cache/backups.
