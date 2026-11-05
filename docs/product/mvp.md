# MVP

Status: rencana. Tidak ada fitur berikut yang sudah dibangun.

## Cakupan

Satu acara contoh, satu mata uang USD, dua role, ekstraksi yang dapat dikoreksi, penilaian per item, tinjauan bendahara, payout Sandbox, rekap, dan CSV.

## Kriteria penerimaan

| ID | Bukti yang diperlukan ketika diimplementasikan |
|---|---|
| MVP-01 | Server memverifikasi identitas, role, dan event membership. |
| MVP-02 | Panitia tidak bisa mengakses klaim/bon orang lain melalui pergantian ID. |
| MVP-03 | Pemohon mengunggah bon, mengoreksi OCR, dan memberi tujuan pembelian. |
| MVP-04 | AI memberi rekomendasi per item dan rujukan aturan yang benar. |
| MVP-05 | Konteks tidak cukup atau pembacaan buram menghasilkan needs_review. |
| MVP-06 | Bendahara menyetujui sebagian item; aplikasi menghitung totalnya. |
| MVP-07 | Perubahan revisi, penerima, atau aturan relevan membatalkan approval lama. |
| MVP-08 | Payout dibangun dari approval sah dan penerima terverifikasi. |
| MVP-09 | Retry/klik ulang tidak membayar dua kali; paid menunggu sukses provider. |
| MVP-10 | Rekap memisahkan dibayar, disetujui-belum-dibayar, dan menunggu tinjauan. |
| MVP-11 | Gangguan AI/PayPal menghasilkan status yang jelas tanpa pembayaran otomatis. |

## Tunda

Training dari nol, fine-tuning sebelum baseline, sertifikasi struk asli, transfer tanpa approval, konversi currency, sinkronisasi spreadsheet dua arah, dan chatbot umum.

Persetujuan kebutuhan sebelum membeli serta ringkasan kelompok pembayaran menjadi pengembangan berikutnya.

## Selesai

Juri dapat menjalankan alur dari pengajuan sampai pembayaran Sandbox dan laporan. Template dan mockup belum membuktikan alur bekerja.
