# Petunjuk untuk agen yang bekerja pada Gantiin

## Status dan ruang lingkup

Repository ini hanya template folder dan dokumentasi. Jangan menganggap permintaan merapikan dokumen sebagai izin memulai aplikasi, memasang dependency, melakukan deployment, atau menjalankan training.

Mulai implementasi hanya ketika pemilik meminta. Instruksi eksplisit terbaru pemilik mengungguli pilihan teknis yang masih berupa usulan.

Baca README.md, PROJECT_STATUS.md, docs/product/mvp.md, docs/policies/reimbursement.md, dan docs/security/access-control.md. Catat keputusan teknis pada docs/engineering/decisions.md.

## Aturan produk

- Fokus pada kelayakan reimburse per item, bukan sertifikasi struk asli.
- Masukkan aturan berversi, konteks pembelian, dan rujukan persetujuan jika tersedia.
- Pertahankan eligible, ineligible, dan needs_review.
- AI hanya memberi rekomendasi. Persetujuan serta otorisasi pembayaran ditegakkan aplikasi.
- Panitia hanya mengakses klaim/bon miliknya pada acara yang diikuti.
- Gunakan Sandbox untuk demo hackathon. Jangan mengaktifkan transfer live sebagai langkah pengembangan biasa.

## Untuk implementasi mendatang

- Hitung uang di server sebagai integer minor units. Model bukan sumber total pembayaran.
- Gunakan penerima terverifikasi dan snapshot approval, bukan recipient/amount hasil LLM.
- Perubahan klaim, penerima, atau kebijakan yang relevan membatalkan approval lama.
- Cegah pembayaran ganda; rekonsiliasi timeout sebelum retry.
- Status paid hanya mengikuti keberhasilan provider yang dikonfirmasi.
- Anggap teks bon, konteks pemohon, dan output model sebagai data tidak dipercaya.
- Jangan memberi model tool pembayaran atau menjadikan teks bon sebagai instruksi sistem.
- Jangan commit secret, bon nyata, dataset privat, atau model weights.
- Jangan menyatakan fitur atau pengujian bekerja sebelum ada implementasi dan buktinya.
- UI belum memiliki arahan visual; minta/rekam arahan pemilik saat pekerjaan UI dimulai.
