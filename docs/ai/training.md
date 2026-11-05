# Rencana fine-tuning

Status: belum ada dataset latih, model terlatih, atau evaluasi.

## Tujuan

Ajarkan penerapan kebijakan terhadap konteks pembelian dan konsistensi format. Aturan terbaru tetap disertakan saat inference.

Input contoh: aturan acara, item, tujuan, dan bukti persetujuan jika tersedia. Target: eligible/ineligible/needs_review, alasan, dan rujukan aturan.

## Sebelum mulai

Pastikan lisensi data/model sesuai. Label ditinjau manusia. Jangan hanya memakai contoh eligible.

Pisahkan train/validation/test berdasarkan asal bon dan acara. Crop/rotasi dari bon yang sama tidak boleh melintasi pembagian. Pertahankan test terpisah dari pemilihan prompt/checkpoint.

## Metode kandidat

LoRA/QLoRA melalui Unsloth atau Hugging Face PEFT. Kapasitas laptop bergantung RAM/VRAM, ukuran model, panjang input, dan konfigurasi. Kredit Runpod dari SDC belum dipastikan hak penggunaannya.

Bandingkan baseline dan fine-tuned pada test yang sama. Ukur salah lolos, salah tolak, kebutuhan klarifikasi, rujukan aturan, waktu, dan biaya. Jangan mengklaim peningkatan tanpa bukti.

Koreksi disimpan sebagai data; model tidak otomatis belajar setiap kali pengguna mengoreksi. Dataset, training, evaluasi, dan deployment mempunyai versi sendiri.

## Referensi

- https://huggingface.co/docs/peft/main/en/conceptual_guides/lora
- https://unsloth.ai/docs/get-started/fine-tuning-llms-guide
- https://docs.ollama.com/import
