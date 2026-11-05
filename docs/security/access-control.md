# Hak akses

| Operasi | Panitia | Bendahara |
|---|---|---|
| Baca kebijakan | Acara yang diikuti | Acara yang dikelola |
| Buat klaim | Untuk diri sendiri | Untuk diri sendiri |
| Baca bon/klaim | Miliknya | Seluruh klaim pada acaranya |
| Ubah draft | Miliknya | Tidak mengubah bukti diam-diam |
| Setujui item | Tidak | Klaim orang lain pada acaranya |
| Payout | Tidak | Dari approval sah |
| Ekspor seluruh rekap | Tidak | Acaranya |
| Ubah role/penerima | Tidak melalui input klaim | Alur admin yang terotorisasi |

Server memverifikasi token, membership, event, role, dan resource ownership. Menu tersembunyi bukan pengamanan.

Storage privat dan tautan berumur terbatas tetap perlu pemeriksaan hak akses. ID valid tidak membuktikan izin.

Pemohon tidak boleh mengisi status approved/paid, actor, role, verified recipient, atau hasil AI tervalidasi dari browser.

Uji akun A terhadap ID klaim B, akses antaracara, endpoint payout oleh panitia, self-approval, penerima berubah setelah approval, token kedaluwarsa, dan akses bon tanpa izin.
