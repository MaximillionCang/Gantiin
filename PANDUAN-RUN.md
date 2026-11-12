# Panduan menjalankan dan mencoba Gantiin

Panduan Inggris untuk juri tersedia di [README](README.md). Kode utama berada di `backend/` dan `frontend/`; semua npm command dijalankan dari folder utama Gantiin.

## Website dan akun juri

Website: https://gantiin.onrender.com/

Website baru dapat memakai akun berikut setelah database Sandbox dipindahkan ke Render. Deployment kode saja tidak memindahkan akun dan riwayat. Jika `/api/session` menampilkan `initialized:false`, selesaikan [pemindahan database](docs/operations/deployment.md), bukan setup/seed ulang.

| Peran | Email website | Password website |
|---|---|---|
| Treasurer | `treasurer@example.test` | `Treasurer` |
| CMT 1 | `cmt.one@example.test` | `CMT1` |
| CMT 2 | `cmt.two@example.test` | `CMT2` |

Treasurer memilih tab Treasurer dan memasukkan password saja. Committee memilih tab Committee, lalu email dan password. Password wajib terisi dan maksimal 128 karakter, tanpa syarat panjang minimum/kompleksitas.

Untuk tombol PayPal, gunakan akun **PayPal Sandbox** berikut pada halaman login resmi PayPal:

| Peran | Email PayPal Sandbox | Password PayPal Sandbox |
|---|---|---|
| Treasurer / Business | `sb-qwvxj53786518@business.example.com` | `8*ZEj).9` |
| CMT 1 | `sb-ncudc53769756@personal.example.com` | `Bbe}K9@a` |
| CMT 2 | `sb-hekyu53769840@personal.example.com` | `K/MaEhX5` |

Pemilik mengizinkan akun uji ini dicantumkan untuk juri. Akun PayPal dan website adalah dua jenis login berbeda. Identitas PayPal harus cocok dengan penerima/pengirim yang terdaftar di database. Consent Treasurer sebelumnya belum terselesaikan; gunakan password website bila alur provider tersebut belum tersedia. API secret dan Google JSON tetap privat.

## Struk sintetis dan langkah demo

[Unduh ZIP empat struk](https://github.com/MaximillionCang/Gantiin/raw/refs/heads/main/demo/campus-career-day/receipts.zip), lalu ekstrak. PNG juga tersedia di [folder receipts](demo/campus-career-day/receipts/). Semua contoh fiktif, bukan pembelian nyata.

1. Login Treasurer, periksa Overview, History, spreadsheet dan Event Policy.
2. Contoh struk memakai kebijakan [Campus Career Day](demo/campus-career-day/EVENT.md). Jangan mengubah kebijakan acara aktif hanya untuk mencoba contoh yang tidak cocok.
3. Login Committee, pilih Submit Receipt dan unggah satu PNG yang belum pernah diajukan.
4. Periksa keputusan per barang, Why rejected, Receipt total dan Reimbursed.
5. History Committee hanya menampilkan pengajuan sendiri; Treasurer melihat semua. Pembayaran yang telah dikonfirmasi dicatat ke Google Sheets.

| Contoh | Total struk | Ekspektasi eligible sesuai kebijakan contoh |
|---|---|---|
| Printing and registration | RM239.90 | RM200.00 |
| Refreshments | RM465.00 | RM440.00 |
| Room preparation | RM184.00 | RM46.00 |
| Committee dinner | RM217.50 | RM0.00 |

Ekspektasi itu label buatan manusia, bukan jaminan akurasi AI. Pembayaran tergantung saldo terbaru dan penerima terverifikasi. File struk yang sama hanya dapat diajukan sekali per acara. Jika sudah ada di History, lihat hasil sebelumnya atau gunakan contoh lain; jangan hapus jurnal agar duplikat bisa dibayar lagi.

## Menjalankan Sandbox lokal di Windows

Pasang Node.js minimal 24.16 dalam seri 24. Buka PowerShell dari folder Gantiin, lalu:

```powershell
npm.cmd ci
npm.cmd run start:sandbox
```

Gunakan `.env`, `.env.sandbox`, database dan Google JSON yang sudah disiapkan. Sesuaikan GOOGLE_APPLICATION_CREDENTIALS dengan lokasi file di laptop yang sedang digunakan. File privat dan node_modules tidak ikut GitHub; dependensi dipasang melalui npm ci. Tidak perlu setup/seed untuk database yang sudah memiliki akun.

Buka alamat yang dicetak terminal, biasanya http://localhost:3000. Biarkan terminal terbuka; Ctrl+C menghentikan server. Jangan menjalankan dua server terhadap database yang sama.

Untuk menguji login PayPal melalui HTTPS, hentikan server sebelumnya lalu:

```powershell
npm.cmd run start:https
```

Cloudflared harus tersedia di PATH atau CLOUDFLARED_PATH. Gunakan Website dan PayPal Return URL yang dicetak. Hostname berubah setiap menjalankan tunnel baru; simpan Return URL baru pada aplikasi PayPal Sandbox yang cocok. Tidak perlu cloudflared pada Render.

## Menjalankan simulasi tanpa API key

Ikuti bagian Isolated local simulation pada [README](README.md). Gunakan database fixture baru yang terpisah, bukan database Sandbox aktif. Setup pertama mencetak password acak untuk fixture tersebut; tabel password di atas berlaku untuk database Sandbox yang sudah disiapkan. Untuk fixture gunakan `frontend/demo/mixed.png`, bukan empat contoh OCR di paket Campus Career Day. Simulasi tidak memanggil Gemini, Google atau PayPal.

## Settings dan pemulihan

Klik Settings untuk membuka/menutup submenu tanpa berpindah halaman. Pilih Account > Change password atau Email. Email read-only; Committee dapat menautkan PayPal dari halaman Email. Personal preferences > Appearance menyediakan Dark/Light; Dark adalah default. Pilihan disimpan di browser jika storage tersedia.

Untuk reset akun biasa, operator memverifikasi identitas lalu membuat tautan:

```powershell
node --env-file=.env --env-file=.env.sandbox scripts/password-reset.mjs EMAIL_AKUN --base-url https://ALAMAT-WEBSITE
```

Tautan berlaku 15 menit dan sekali pakai. Bagikan secara pribadi; tidak ada layanan email otomatis. Jangan masukkan tautan reset, API key, Google JSON, .env atau database ke GitHub.

## Pemeriksaan dan Render

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run test:e2e
```

Tes memakai database sementara dan fixture/mock. Pemeriksaan tidak mengizinkan transaksi nyata. Baca [verifikasi terbaru](docs/verification/current.md).

Pada Render: Root Directory kosong, Build Command `npm ci --omit=dev`, Start Command `APP_BASE_URL="$RENDER_EXTERNAL_URL" npm start`, disk /var/data dan Google Secret File. Return URL saat ini: https://gantiin.onrender.com/api/paypal/callback. Lihat [deployment](docs/operations/deployment.md) untuk konfigurasi dan pemindahan database.

Database antar laptop tidak tersinkron otomatis. Gunakan backup SQLite konsisten; jangan menyalin hanya .sqlite ketika transaksi masih ada di WAL dan jangan menimpa database yang sedang terbuka. Setelah masa akses juri selesai, simpan backup sebelum menghapus layanan/disk berbayar. Mematikan auto-deploy tidak menghentikan biaya server aktif.
