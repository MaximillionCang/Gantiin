# Kebijakan reimburse

Rancangan perilaku aplikasi; kebijakan aktual ditetapkan bendahara tiap acara.

## Konteks

Aturan berversi memuat kategori boleh/dilarang, batas, tanggal, bukti, dan otoritas approval. Item memuat deskripsi, kuantitas, harga, tujuan, serta persetujuan sebelumnya jika ada. Nama barang/acara saja tidak membuktikan kebutuhan.

## Hasil AI

- eligible: bukti sesuai aturan yang dirujuk.
- ineligible: konteks bertentangan dengan aturan yang disebut.
- needs_review: data atau aturan belum cukup/ambigu/tidak terbaca.

Hasil adalah rekomendasi. AI tidak memastikan struk asli dan tidak memberikan otorisasi payout.

## Jumlah

Bendahara memilih item/kuantitas final; perubahan mempunyai alasan. Server menghitung dari data terverifikasi, bukan hasil hitung LLM.

MVP contoh memakai USD dalam integer sen. Satu acara memakai satu currency. Tolak currency berbeda; jangan konversi otomatis.

Diskon item mengikuti item. Pajak/diskon bersama memerlukan aturan alokasi dan pembulatan yang ditetapkan bendahara. Jika belum jelas, minta tinjauan dan blok pembayaran sampai jelas.

Jumlah reimburse tidak boleh melebihi pengeluaran terverifikasi setelah penyesuaian.

## Revisi dan duplikasi

Kemiripan bon merupakan sinyal untuk tinjauan, bukan bukti fraud. Catat alasan temuan.

Koreksi item/konteks/penerima menaikkan revisi. Perubahan kebijakan relevan membatalkan keputusan yang sudah kedaluwarsa. Approval hanya berlaku pada snapshot yang dicatat. Bekukan revisi setelah payout dimulai hingga rekonsiliasi selesai.

## Dana

Bedakan anggaran tercatat, kewajiban yang disetujui, dan dana tersedia pada provider. Klaim tetap tercatat jika dana belum cukup.

Cek serta reservasi komitmen secara atomik agar dua proses tidak memakai anggaran yang sama. Tandai paid hanya dari keberhasilan provider yang terkonfirmasi.
