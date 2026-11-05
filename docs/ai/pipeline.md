# Pipeline AI usulan

Belum ada OCR, model, inference, atau pengukuran dijalankan.

## Tahapan

Validasi unggahan, OCR, koreksi item oleh panitia, konteks kebijakan, rekomendasi LLM, validasi hasil, tinjauan bendahara, dan perhitungan server.

OCR confidence mengukur keyakinan pembacaan, bukan keaslian bon atau hak reimburse. Skor yang ditulis LLM bukan probabilitas terkalibrasi.

## Kandidat

PaddleOCR lokal dan model teks melalui Ollama. Gemini menjadi pilihan tambahan setelah kuota serta penanganan datanya dipastikan. Benchmark model pada contoh yang relevan sebelum memilihnya.

Ollama digunakan menjalankan model. Pelatihan membutuhkan pipeline dan alat terpisah.

## Input dan output

Berikan trusted policy dari database terpisah dari receipt/context yang tidak dipercaya. Gunakan template [prompt](../../ai/prompts/item-review.md).

Output menyertakan claim ID, revisi, policy version, serta daftar item dengan recommendation, rule_ids, dan reason. Periksa seluruh item muncul tepat sekali, ID dikenal, versi cocok, dan aturan yang dirujuk benar.

Model tidak memiliki tool pembayaran dan tidak menentukan recipient atau jumlah final.

## Kuota dan cache

Kirim konteks secukupnya, kelompokkan item satu bon, dan batasi panjang output. Cache terikat revisi klaim, kebijakan, prompt, dan model; perubahan terkait membatalkan cache.

Jika provider gagal atau kuota habis, simpan menunggu pemeriksaan atau arahkan ke tinjauan manusia. Jangan menyetujui secara otomatis karena model tidak tersedia.
