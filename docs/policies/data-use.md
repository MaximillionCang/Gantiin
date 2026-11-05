# Penggunaan data

## Contoh

Data pada data/examples sepenuhnya sintetis dan dibuat untuk ilustrasi. Expected assessment bukan hasil model yang sudah diuji.

## Dataset eksternal

Catat sumber, versi, lisensi, izin training, izin redistribusi, dan izin penggunaan informasi pribadi. Dapat diakses publik tidak berarti bebas disalin. Gunakan data/dataset-register.csv.

## Penyimpanan

data/raw, data/processed, dan data/models adalah lokal-only dan diabaikan Git. .gitkeep tidak mengizinkan publikasi file privat.

Bon aplikasi nanti memakai private storage. Jangan log seluruh bon, teks OCR, email, token, atau data penerima.

## Provider dan koreksi

Sebelum mengirim bon ke cloud, catat model/provider dan ketentuan penanganan data. Kirim hanya yang diperlukan. Secret pembayaran tidak boleh masuk prompt.

Koreksi tidak otomatis melatih model. Penggunaan data untuk training perlu izin, label, versi dataset, dan pipeline terpisah. Pemohon harus dapat menggunakan alur tanpa menyetujui training.

## Retensi

Durasi bon, OCR, audit, dan backup belum ditentukan. Tetapkan sebelum deployment dan dokumentasikan cara penghapusan serta batasannya.
