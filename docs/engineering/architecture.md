# Arsitektur usulan

Status: rancangan, belum ada aplikasi.

| Komponen | Tugas | Kandidat |
|---|---|---|
| apps/web | Form panitia, tinjauan bendahara, rekap | Next.js/TypeScript |
| apps/api | Otorisasi, klaim, jumlah, integrasi | FastAPI/Python |
| Database | Event, membership, revisi, approval, payment | PostgreSQL |
| Object storage | Bon privat | Belum dipilih |
| OCR | Gambar menjadi teks/item | PaddleOCR |
| LLM | Kecocokan item dengan kebijakan | Ollama; Gemini opsional |
| Pembayaran | Payout dan rekonsiliasi | PayPal Sandbox |

Pilihan belum final; dependency dan versi belum dipasang.

## Alur

API memverifikasi hak akses, menyimpan pengajuan, dan menjadwalkan ekstraksi. Pemohon mengoreksi item. API memasok aturan dipercaya serta data pemohon yang tidak dipercaya ke model.

Hasil model divalidasi. Bendahara meninjau. API menghitung jumlah dari snapshot approval, menjalankan payout, dan merekonsiliasi hasil.

## Batas kepercayaan

Browser tidak memegang secret database/PayPal/model cloud. Model tidak memiliki tool pembayaran. Server memeriksa role, ownership, anggaran, revisi, serta ID aturan.

Teks bon tidak menjadi instruksi sistem. Tugas lama/ulang memiliki ID proses, bukan alasan membuat pembayaran baru.

## Hosting

Model lokal berhenti ketika laptop mati. Untuk demo online mandiri, tempatkan layanan yang diperlukan di luar laptop atau sediakan instruksi lengkap menjalankan proyek sendiri.

AI lokal tidak membuat transaksi PayPal bisa berjalan offline.
