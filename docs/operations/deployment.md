# Rencana deployment

Template ini tidak membuat akun, server, layanan berbayar, atau konfigurasi deployment.

## Pilihan

Seluruhnya lokal bergantung laptop. Web/API online dengan model lokal tetap bergantung laptop untuk AI. Model/API cloud atau server GPU dapat bekerja tanpa laptop selama layanannya tersedia.

Serverless dapat mengurangi mesin aktif saat sepi, dengan konsekuensi antrean/waktu mulai. Compute terus aktif memakai biaya walaupun tidak ada pengguna.

## Sebelum menyewa

Uji lokal, ukur kebutuhan, lalu uji sesi server singkat jika diizinkan pemilik. Cek kredit, expiry, produk yang ditanggung, pemilik saldo, dan syarat penggunaan di luar SDC.

Kredit sponsor belum terverifikasi. Jangan menuliskan kredit tersebut sebagai dana proyek yang sudah pasti tersedia.

## Operasi

Lindungi model lewat backend. Bon berada di private storage. Model lokal tidak menghapus kebutuhan koneksi PayPal.

Menutup browser/laptop tidak menghentikan server sewaan. Storage dapat tetap berbiaya saat compute berhenti. Harga harus diperiksa saat menyewa.

Pisahkan database dan bon dari disk container sementara. Tentukan backup, retensi, dan uji pemulihan sebelum penggunaan nyata.

## Juri

Sediakan hosted demo yang dapat dipakai atau petunjuk setup lengkap. Jangan memberikan secret publik demi memudahkan akses.

## Referensi

- https://docs.runpod.io/pods/overview
- https://docs.runpod.io/pods/pricing
- https://docs.runpod.io/serverless/overview
- https://docs.ollama.com/faq
