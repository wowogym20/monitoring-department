# PRD — Monitoring Departemen

Tanggal: 13 Oktober 2026

## 1. Ringkasan & Latar Belakang

**Monitoring Departemen** adalah web app internal yang memungkinkan ketua tiap departemen menilai anggotanya dengan skala Likert 1–5, lalu memberi pimpinan dan SDM gambaran kinerja yang terpusat dan bisa diekspor.

Saat ini penilaian anggota tidak terstandar dan tersebar per departemen, sehingga SDM sulit merekap, membandingkan antar departemen, dan memberi umpan balik ke ketua. Aplikasi ini menyatukan proses itu dalam satu sistem dengan hak akses ketat: ketua hanya melihat dan menilai anggota departemennya sendiri.

| Item | Keterangan |
| --- | --- |
| Nama produk | Monitoring Departemen |
| Jenis | Web app internal (responsif, dipakai dari HP dan desktop) |
| Pengguna login | Super-admin (pimpinan), Admin (SDM), User (ketua departemen) |
| Bukan pengguna | Anggota departemen: tidak punya akun dan tidak punya akses |
| Jumlah departemen | 14 |
| Bahasa antarmuka | Bahasa Indonesia |
| Tema visual | Hijau (Emerald/Islamic Green) & Oren (Warm Tangerine/Amber) |


## 2. Tujuan & Metrik Keberhasilan

Tujuan utama: **ketua departemen menilai setiap anggotanya secara terstandar, dan SDM serta pimpinan dapat memantau hasilnya dari satu tempat.**

**Sasaran produk**

- Menyeragamkan aspek dan skala penilaian di seluruh 14 departemen.
- Memastikan isolasi data: ketua hanya mengakses anggota departemennya.
- Mempercepat rekap SDM dari hitungan hari menjadi hitungan menit.
- Memberi SDM jalur umpan balik langsung ke ketua atas penilaian yang dibuat.

**Metrik keberhasilan** (target awal, dapat disesuaikan)

| Metrik | Target |
| --- | --- |
| Ketua departemen yang login dan menilai pada periode pertama | 100% (14 dari 14) |
| Anggota yang sudah dinilai sebelum batas periode | ≥ 90% |
| Waktu mengisi penilaian satu anggota | ≤ 2 menit |
| Waktu SDM membuat rekap dan ekspor satu periode | ≤ 5 menit |
| Kebocoran data lintas departemen (diuji lewat tes RLS) | 0 kasus |
| Skor Lighthouse halaman utama (mobile) | ≥ 85 |

## 3. Ruang Lingkup

Versi 1.0 fokus pada penilaian anggota oleh ketua, rekap oleh SDM, dan administrasi oleh pimpinan.

**Termasuk (In Scope)**

- Login dan halaman profil untuk semua role.
- Manajemen anggota departemen oleh ketua (CRUD, hanya departemennya).
- Form penilaian anggota dengan skala Likert 1–5 per aspek.
- Rekap penilaian, monitoring kelengkapan, approval, dan komentar untuk ketua oleh SDM.
- CRUD departemen, penetapan ketua, dan manajemen akun ketua oleh super-admin.
- Impor massal data anggota dari file Excel/CSV oleh super-admin dan admin (SDM).
- Ekspor penilaian ke PDF dan Excel oleh super-admin dan admin (SDM).
- Riwayat perubahan (audit log) atas penilaian.

**Tidak termasuk (Out of Scope)**

- Akses atau akun untuk anggota departemen.
- Penilaian terhadap ketua oleh pimpinan atau SDM (360 derajat).
- Integrasi dengan sistem payroll, absensi, atau keuangan.
- Notifikasi WhatsApp atau email (kandidat fase berikutnya).
- Aplikasi mobile native.

## 4. Peran Pengguna & Hak Akses

Ada tiga role yang bisa login. Role disimpan di database dan diperiksa di server serta RLS, bukan hanya disembunyikan di UI.

| Role | Pemegang | Peran utama |
| --- | --- | --- |
| `super_admin` | Pimpinan | Akses penuh: kelola departemen, akun ketua, ekspor, dan semua data |
| `admin` | SDM | Memantau rekap, approval, dan memberi komentar ke ketua |
| `user` | Ketua departemen | Mengelola anggota dan menilai anggota departemennya sendiri |

**Matriks hak akses**

| Fitur / Data | Super-admin | Admin (SDM) | User (Ketua) |
| --- | --- | --- | --- |
| Login & halaman profil | Ya | Ya | Ya |
| CRUD departemen | Ya | Lihat | Tidak |
| Pilih / ganti ketua departemen | Ya | Tidak | Tidak |
| Kelola akun ketua departemen | Ya | Tidak | Tidak |
| Manajemen anggota | Semua departemen | Lihat semua | CRUD, departemen sendiri |
| Buat / ubah / hapus penilaian | Ya | Tidak | CRUD, anggota departemen sendiri |
| Lihat penilaian yang sudah di-submit | Semua | Semua | Departemen sendiri |
| Rekap penilaian | Semua | Semua | Departemen sendiri |
| Approval penilaian | Ya | Ya | Tidak |
| Komentar penilaian untuk ketua | Ya | Ya (membuat) | Lihat dan balas |
| Ekspor PDF dan Excel | Ya | Ya | Tidak |
| Impor massal anggota (Excel/CSV) | Ya | Ya | Tidak |

**Aturan inti**

- Satu departemen punya satu ketua; satu akun ketua memegang satu departemen.
- Anggota tidak punya akun dan tidak bisa melihat penilaiannya.
- Tidak ada pendaftaran mandiri; semua akun dibuat oleh super-admin.

## 5. Daftar Departemen

Empat belas departemen berikut dimuat sebagai data awal (seed). Super-admin dapat menambah, mengubah, menonaktifkan, dan menghapus departemen serta memilih ketuanya.

| No | Departemen |
| --- | --- |
| 1 | Dept. Pendidikan dan Pengajaran |
| 2 | Dept. Penelitian dan Pengembangan Akademik (Majelis Guru) |
| 3 | Dept. Pengasuhan Santri |
| 4 | Dept. Lazis Tazakka |
| 5 | Dept. Wakaf Tazakka |
| 6 | Dept. Pengembangan Amal Usaha |
| 7 | Dept. Pengembangan TI |
| 8 | Dept. SDM |
| 9 | Dept. Kesekretariatan |
| 10 | Dept. Keuangan |
| 11 | Dept. Kehumasan |
| 12 | Dept. Kerjasama Kelembagaan dan Luar Negeri |
| 13 | Dept. Pengembangan Perguruan Tinggi |
| 14 | Dept. Pekerjaan Umum |

**Aturan kepemilikan data**

- Setiap anggota dan penilaian selalu terikat ke satu departemen.
- Departemen yang sudah punya penilaian tidak dihapus permanen; cukup dinonaktifkan agar riwayat tetap utuh.
- Mengganti ketua tidak menghapus data penilaian lama; ketua baru langsung mengelola anggota departemen tersebut.

## 6. User Stories

**Ketua departemen (user)**

| ID | Sebagai ketua, saya ingin… | Agar… |
| --- | --- | --- |
| US-01 | login dan melihat daftar anggota departemen saya | saya tahu siapa yang perlu dinilai |
| US-02 | menambah, mengubah, dan menonaktifkan anggota | data anggota selalu mutakhir |
| US-03 | mengisi penilaian per anggota dengan skala 1–5 untuk tiap aspek | penilaian cepat dan konsisten |
| US-04 | menyimpan penilaian sebagai draf lalu men-submit | saya bisa melanjutkan nanti |
| US-05 | mengubah atau menghapus penilaian yang sudah di-submit | saya dapat mengoreksi kesalahan |
| US-06 | melihat komentar SDM atas penilaian saya | saya bisa memperbaiki dan membalas |
| US-07 | melihat progres siapa yang sudah dan belum dinilai pada periode ini | tidak ada anggota yang terlewat |

**Admin (SDM)**

| ID | Sebagai SDM, saya ingin… | Agar… |
| --- | --- | --- |
| US-08 | melihat rekap penilaian semua departemen | saya bisa memantau kinerja secara menyeluruh |
| US-09 | memfilter rekap per departemen, periode, dan anggota | saya cepat menemukan data yang dicari |
| US-10 | melihat departemen mana yang belum selesai menilai | saya dapat menindaklanjuti ketuanya |
| US-11 | menyetujui penilaian atau meminta revisi | kualitas penilaian terjaga |
| US-12 | memberi komentar ke ketua atas penilaiannya | ada umpan balik yang tercatat |

**Super-admin (pimpinan)**

| ID | Sebagai pimpinan, saya ingin… | Agar… |
| --- | --- | --- |
| US-13 | menambah, mengubah, dan menghapus departemen | struktur organisasi tercermin di sistem |
| US-14 | memilih dan mengganti ketua tiap departemen | hak akses mengikuti kepengurusan |
| US-15 | mengelola akun ketua departemen | akses terkontrol |
| US-16 | mengekspor penilaian ke PDF dan Excel | bisa dilaporkan dan diarsipkan |
| US-17 | mengakses seluruh data dan fitur | saya punya kendali penuh |

## 7. Kebutuhan Fungsional

**FR-1 Autentikasi (semua role)**

- Login dengan email dan password lewat Supabase Auth; tidak ada pendaftaran mandiri.
- Logout, lupa password, dan ganti password.
- Setelah login, pengguna diarahkan ke dashboard sesuai role.
- Rute dan data dilindungi di server (middleware dan RLS), bukan hanya di UI.

**FR-2 Halaman profil (semua role)**

- Melihat dan mengubah nama, nomor HP, dan foto profil.
- Mengganti password.
- Role dan departemen tampil sebagai informasi baca-saja.

**FR-3 Manajemen anggota (ketua & admin)**

- Tabel anggota departemen sendiri dengan pencarian, filter status, dan paginasi.
- Tambah, ubah, nonaktifkan, dan hapus anggota. Anggota yang sudah punya penilaian hanya bisa dinonaktifkan.
- Field: nama lengkap, NIP/ID internal, jabatan, nomor HP (opsional), status aktif.
- **Impor Massal (Excel/CSV)**: Super-admin dan admin (SDM) dapat mengunggah file template Excel/CSV berisi ratusan anggota sekaligus dengan pemetaan kode departemen, NIP, nama, dan jabatan, lengkap dengan validasi data sebelum disimpan.

**FR-4 Form penilaian anggota (ketua)**

- Pilih periode dan anggota, lalu isi nilai 1–5 untuk setiap aspek (lihat bagian 8).
- Tiap aspek memakai pilihan radio berlabel (1 sampai 5) dengan keterangan rubrik singkat.
- Catatan umum opsional per anggota.
- Simpan sebagai **draf** atau **submit**. Semua aspek wajib terisi untuk submit.
- Ketua bisa mengubah dan menghapus penilaian kapan saja, termasuk setelah submit. Setiap perubahan tercatat di riwayat.
- Satu anggota hanya punya satu penilaian per periode.
- Skor rata-rata dihitung otomatis.

**FR-5 Rekap dan monitoring (admin SDM)**

- Tabel rekap lintas departemen: filter departemen, periode, status, dan pencarian nama.
- Ringkasan per departemen: jumlah anggota, jumlah sudah dinilai, rata-rata skor.
- Indikator departemen yang belum selesai menilai.
- Detail penilaian satu anggota, termasuk skor per aspek dan riwayat perubahan.
- Approval: tandai **Disetujui** atau **Perlu revisi**. Jika ketua mengubah penilaian yang sudah disetujui, statusnya kembali ke **Submitted**.

**FR-6 Komentar untuk ketua (admin SDM)**

- Admin menulis komentar pada penilaian tertentu; ketua melihat komentar di penilaian terkait dan dapat membalas.
- Penanda komentar baru yang belum dibaca di dashboard ketua.

**FR-7 Manajemen departemen dan ketua (super-admin)**

- CRUD departemen (nama, kode singkat, status aktif).
- Memilih atau mengganti ketua departemen dari daftar akun ketua.
- Membuat, menonaktifkan, dan mereset password akun ketua.

**FR-8 Periode penilaian (super-admin dan admin)**

- Membuat periode (nama, tanggal mulai dan akhir) dan membuka atau menutup periode.
- Penilaian hanya dapat dibuat pada periode berstatus terbuka.

**FR-9 Ekspor (super-admin dan admin SDM)**

- Ekspor rekap penilaian ke **Excel (.xlsx)** dan **PDF**, dengan filter departemen dan periode.
- Super-admin dan admin (SDM) memiliki hak akses penuh untuk mengunduh laporan.
- Excel memuat ringkasan per departemen dan sheet detail per anggota beserta skor per aspek; PDF memuat rekap per departemen yang siap dicetak.

**FR-10 Dashboard**

- Ketua: progres penilaian periode berjalan (progress bar hijau emerald) dan penanda komentar baru yang belum dibaca (badge aksen oren cerah).
- Admin dan super-admin: grafik rata-rata skor per departemen dan persentase penyelesaian (Recharts) dengan palet visual tematik: grafik batang hijau emerald untuk skor/capaian, dan aksen oren hangat untuk penanda departemen yang belum selesai atau memerlukan revisi.


## 8. Aspek Penilaian & Skala Likert 1–5

Skala Likert 1–5 dipilih karena sederhana bagi ketua, mudah dirata-ratakan, dan cukup membedakan tingkat capaian. Setiap angka punya label yang sama untuk semua aspek agar penilaian konsisten.

**Skala**

| Nilai | Label | Arti singkat |
| --- | --- | --- |
| 1 | Sangat Kurang | Jauh di bawah harapan, perlu pembinaan serius |
| 2 | Kurang | Di bawah harapan, perlu perbaikan nyata |
| 3 | Cukup | Memenuhi standar minimum |
| 4 | Baik | Memenuhi dan sering melampaui harapan |
| 5 | Sangat Baik | Konsisten melampaui harapan, layak jadi teladan |

**Aspek penilaian (Disepakati 7 Aspek Final)**

Tujuh aspek berikut telah disepakati sebagai aspek penilaian resmi dengan bobot sama rata (skor rata-rata dibagi 7). Aspek disimpan di database sehingga urutan dan teks rubrik tetap dapat dikelola secara dinamis.

| No | Aspek | Yang dinilai | Status |
| --- | --- | --- | --- |
| 1 | Kinerja Kerja | Kualitas, ketepatan, dan penyelesaian tugas | Final |
| 2 | Kerajinan | Ketekunan, kehadiran, dan ketepatan waktu | Final |
| 3 | Ibadah | Kedisiplinan dan kesungguhan menjalankan ibadah | Final |
| 4 | Kebersihan | Kebersihan diri dan lingkungan kerja | Final |
| 5 | Kerja Sama Tim | Kolaborasi dan komunikasi dengan rekan | Final |
| 6 | Inisiatif & Tanggung Jawab | Proaktif dan menuntaskan amanah | Final |
| 7 | Akhlak & Adab | Sikap dan etika dalam bekerja | Final |

**Perhitungan skor**

```latex
Skor\ Akhir = \frac{\sum_{i=1}^{n} nilai_i}{n}
```

Skor akhir adalah rata-rata nilai seluruh aspek aktif (n = jumlah aspek), ditampilkan dengan dua desimal. Pembobotan per aspek tidak dipakai di versi 1.0; semua aspek berbobot sama.

**Kategori skor akhir (usulan)**

| Rentang skor | Kategori | Warna & Badge UI | Representasi Makna |
| --- | --- | --- | --- |
| 4,50 – 5,00 | Sangat Baik | Emerald Solid (`bg-emerald-600 text-white`) | Capaian istimewa, konsisten melampaui standar |
| 3,50 – 4,49 | Baik | Emerald Soft (`bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300`) | Kinerja solid memenuhi ekspektasi |
| 2,50 – 3,49 | Cukup | Netral Slate (`bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`) | Memenuhi kriteria minimum standar |
| 1,50 – 2,49 | Kurang | Oren Amber Soft (`bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300`) | Butuh pembinaan dan peningkatan aktif |
| 1,00 – 1,49 | Sangat Kurang | Oren Pekat / Coral (`bg-orange-600 text-white dark:bg-orange-700`) | Memerlukan intervensi & pendampingan intensif |


## 9. Alur Kerja Utama

Satu siklus penilaian berjalan dari pembukaan periode sampai ekspor laporan.

1. **Persiapan:** super-admin memastikan departemen, akun ketua, dan aspek penilaian sudah benar.
2. **Buka periode:** super-admin atau SDM membuat periode dan membukanya.
3. **Penilaian:** ketua membuka daftar anggota, mengisi nilai 1–5 per aspek, lalu menyimpan sebagai draf atau men-submit.
4. **Monitoring:** SDM melihat progres per departemen dan menindaklanjuti ketua yang belum selesai.
5. **Review:** SDM membuka penilaian, lalu menyetujui, meminta revisi, atau memberi komentar ke ketua.
6. **Revisi:** ketua mengubah penilaian sesuai komentar; status kembali ke Submitted.
7. **Tutup periode:** setelah semua selesai, periode ditutup dan penilaian terkunci.
8. **Laporan:** super-admin mengekspor rekap ke PDF atau Excel.

**Status penilaian**

| Status | Arti | Siapa yang mengubah | Pindah ke | Badge & Indikator UI |
| --- | --- | --- | --- | --- |
| Draft | Disimpan, belum final, hanya terlihat ketua | Ketua | Submitted | Abu-abu Slate (`bg-slate-100 text-slate-700 border-slate-300`) |
| Submitted | Sudah dikirim, terlihat SDM dan pimpinan | Ketua | Approved, Revision Requested, atau diedit ketua (tetap Submitted) | Aksen Amber/Kuning Lembut (`bg-amber-50 text-amber-900 border-amber-300`) |
| Revision Requested | SDM meminta perbaikan | Admin / super-admin | Submitted setelah ketua mengubah | Oren Hangat / Alert (`bg-orange-500 text-white border-orange-600`) |
| Approved | Disetujui SDM | Admin / super-admin | Submitted jika ketua mengubah lagi | Hijau Emerald / Success (`bg-emerald-600 text-white border-emerald-700`) |


**Aturan penting**

- Ketua tetap dapat mengubah atau menghapus penilaian setelah submit selama periode masih terbuka. Setiap ubah dan hapus dicatat di riwayat dengan pelaku dan waktu.
- Setelah periode ditutup, penilaian hanya bisa dibuka kembali oleh super-admin.
- Penghapusan penilaian memakai soft delete agar jejak audit tetap ada.

## 10. Struktur Halaman & Navigasi

Navigasi (sidebar di desktop, sheet di mobile) hanya menampilkan menu yang sesuai role. Rute dilindungi di server.

| Rute | Halaman | Super-admin | Admin | Ketua |
| --- | --- | --- | --- | --- |
| `/login` | Login | Ya | Ya | Ya |
| `/dashboard` | Dashboard sesuai role | Ya | Ya | Ya |
| `/profil` | Halaman profil | Ya | Ya | Ya |
| `/anggota` | Manajemen anggota departemen | Semua | Lihat | Departemen sendiri |
| `/penilaian` | Daftar anggota dan status penilaian | Semua | Semua | Departemen sendiri |
| `/penilaian/[anggotaId]` | Form penilaian anggota | Ya | Tidak | Ya |
| `/rekap` | Rekap penilaian dan filter | Ya | Ya | Departemen sendiri |
| `/rekap/[penilaianId]` | Detail penilaian, riwayat, komentar | Ya | Ya | Ya |
| `/departemen` | CRUD departemen dan penetapan ketua | Ya | Lihat | Tidak |
| `/ketua` | Manajemen akun ketua departemen | Ya | Tidak | Tidak |
| `/periode` | Pengelolaan periode penilaian | Ya | Ya | Tidak |
| `/aspek` | Pengelolaan aspek penilaian | Ya | Tidak | Tidak |
| `/ekspor` | Ekspor PDF dan Excel | Ya | Ya | Tidak |

**Prinsip UI**

- Seluruh UI memakai komponen shadcn (Table, Form, Dialog, Sheet, Select, Tabs, Card, Badge, dll.). Komponen custom hanya komposisi dari primitif shadcn/Radix.
- Mobile-first: ketua kemungkinan besar mengisi penilaian dari HP.
- Tabel admin memakai TanStack Table dengan pencarian, filter, dan paginasi sisi server.
- Mode terang dan gelap lewat next-themes.
- Notifikasi aksi (simpan, hapus, error) memakai Sonner.

### 10.1 Tema Visual & Sistem Warna (Hijau & Oren)

Aplikasi mengusung tema **Hijau (Emerald)** dan **Oren (Warm Tangerine/Amber)** yang memadukan identitas kelembagaan Tazakka yang teduh, amanah, dan bertumbuh dengan energi modern, responsif, dan dinamis.

#### A. Filosofi & Peran Warna
1. **Hijau Emerald (Primary)**:
   - Merepresentasikan amanah kepengurusan, integritas penilaian, profesionalitas, dan nilai-nilai keislaman Tazakka.
   - Digunakan untuk: Brand identity, tombol aksi utama (*Save*, *Submit*, *Approve*), active state navigasi/sidebar, badge status *Approved*, progress bar capaian, dan metrik kinerja positif.
2. **Oren Tangerine/Warm Amber (Secondary / Accent)**:
   - Merepresentasikan antusiasme kerja, kewaspadaan positif, kehangatan interaksi umpan balik, dan aksi yang membutuhkan perhatian.
   - Digunakan untuk: Penanda notifikasi komentar belum dibaca, badge status *Revision Requested*, indikator target tenggat waktu/periode yang mendekati akhir, tombol aksi sekunder, dan aksen visual penting.

#### B. Palet Token Warna (Tailwind CSS v4 & shadcn)

| Token Desain | Nama Warna | Nilai HSL / Hex | Penerapan UI |
| --- | --- | --- | --- |
| `--primary` | Emerald 600 (Light) / 500 (Dark) | `160 84% 39%` (`#059669`) / `158 64% 52%` (`#10b981`) | Tombol utama, active sidebar tab, header brand, progress ring |
| `--primary-foreground` | White / Dark Emerald | `0 0% 100%` (`#ffffff`) / `160 84% 6%` (`#022c22`) | Teks di atas warna primary |
| `--secondary` | Orange 500 (Light) / 400 (Dark) | `25 95% 53%` (`#f97316`) / `27 96% 61%` (`#fb923c`) | Aksen sekunder, badge revisi, chip highlight, warning pill |
| `--secondary-foreground` | White / Dark Amber | `0 0% 100%` (`#ffffff`) / `24 95% 10%` (`#431407`) | Teks di atas warna secondary |
| `--accent` | Emerald 50 (Light) / Emerald 950 (Dark) | `152 76% 96%` (`#ecfdf5`) / `164 76% 12%` (`#064e3b`) | Hover background menu, baris tabel terpilih, subtle card |
| `--accent-foreground` | Emerald 900 (Light) / Emerald 200 (Dark) | `164 76% 16%` (`#064e3b`) / `152 76% 80%` (`#a7f3d0`) | Teks di atas accent background |
| `--warning-accent` | Orange 50 (Light) / Orange 950 (Dark) | `33 100% 96%` (`#fff7ed`) / `24 95% 14%` (`#431407`) | Background banner revisi & komentar baru |
| `--destructive` | Rose 600 | `0 84% 60%` (`#e11d48`) | Aksi hapus, status fatal |
| `--chart-1` | Emerald 600 | `160 84% 39%` (`#059669`) | Rata-rata skor departemen pada Recharts |
| `--chart-2` | Orange 500 | `25 95% 53%` (`#f97316`) | Target perbandingan / indikator revisi |
| `--chart-3` | Teal 500 | `173 80% 40%` (`#14b8a6`) | Kategori kinerja pendukung |
| `--chart-4` | Amber 400 | `38 92% 50%` (`#f59e0b`) | Progres sedang berjalan |
| `--ring` | Emerald 500 / Orange 400 | `158 64% 52%` / `27 96% 61%` | Focus ring aksesibilitas keyboard |

#### C. Konfigurasi CSS Variables (`globals.css`)

```css
@layer base {
  :root {
    --background: 210 20% 98%; /* #f8fafc */
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 160 84% 39%; /* Emerald 600 */
    --primary-foreground: 0 0% 100%;
    --secondary: 25 95% 53%; /* Orange 500 */
    --secondary-foreground: 0 0% 100%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 152 76% 96%; /* Emerald 50 */
    --accent-foreground: 164 76% 16%;
    --warning: 25 95% 53%;
    --warning-foreground: 0 0% 100%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 160 84% 39%;
    --chart-1: 160 84% 39%; /* Hijau Utama */
    --chart-2: 25 95% 53%;  /* Oren Aksen */
    --chart-3: 173 80% 40%;
    --chart-4: 38 92% 50%;
    --radius: 0.625rem;
  }

  .dark {
    --background: 224 71% 4%; /* Deep dark slate */
    --foreground: 210 40% 98%;
    --card: 222 47% 7%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 7%;
    --popover-foreground: 210 40% 98%;
    --primary: 158 64% 52%; /* Emerald 500 */
    --primary-foreground: 160 84% 6%;
    --secondary: 27 96% 61%; /* Orange 400 */
    --secondary-foreground: 24 95% 10%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 164 76% 12%; /* Emerald 950 */
    --accent-foreground: 152 76% 80%;
    --warning: 27 96% 61%;
    --warning-foreground: 24 95% 10%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 158 64% 52%;
    --chart-1: 158 64% 52%;
    --chart-2: 27 96% 61%;
    --chart-3: 173 80% 40%;
    --chart-4: 38 92% 50%;
  }
}
```

#### D. Penerapan pada Komponen Utama
- **Header & Sidebar**:
  - Logo Tazakka berpadu aksen hijau dan oren.
  - Active menu menggunakan latar `bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300` dengan border indikator vertikal di sisi kiri `border-l-4 border-emerald-600`.
  - Badge counter notifikasi komentar baru menggunakan warna oren solid (`bg-orange-500 text-white`).
- **Form Penilaian Likert (1–5)**:
  - Radio item pilihan nilai memakai visual gradasi responsif: nilai 1–2 menggunakan aksen oren lembut/tegas untuk menyorot nilai rendah, nilai 3 netral slate, dan nilai 4–5 menggunakan aksen hijau emerald untuk apresiasi kinerja positif.
- **Card KPI & Ringkasan Progres**:
  - Kartu ringkasan dilengkapi aksen garis tipis atas (top border subtle gradient `from-emerald-500 to-orange-500`).
  - Progress bar penyelesaian penilaian menggunakan warna hijau emerald penuh saat mencapai 100%, atau bar hijau dengan segmen oren bila ada catatan revisi tertunda.
- **Tabel & Modal**:
  - Header tabel memakai aksen muted slate yang bersih.
  - Tombol aksi utama (Simpan Draf, Kirim Penilaian, Setujui) menggunakan hijau emerald (`bg-emerald-600 hover:bg-emerald-700`).
  - Tombol aksi sekunder / minta revisi menggunakan oren hangat (`bg-orange-500 hover:bg-orange-600 text-white` atau `border-orange-500 text-orange-600`).


## 11. Model Data & Keamanan (Supabase)

Semua tabel ada di skema `public` dengan RLS aktif. Nama tabel bersifat usulan.

| Tabel | Kolom utama | Catatan |
| --- | --- | --- |
| `profiles` | id (FK auth.users), nama, no_hp, foto_url, role (`super_admin` / `admin` / `user`), is_active | Satu baris per akun yang bisa login |
| `departments` | id, nama, kode, ketua_id (FK profiles, unik), is_active | Satu ketua per departemen |
| `members` | id, department_id, nama, nip, jabatan, no_hp, is_active, deleted_at | Anggota tidak punya akun |
| `assessment_aspects` | id, nama, deskripsi, urutan, is_active | Aspek bisa dikonfigurasi |
| `assessment_periods` | id, nama, tanggal_mulai, tanggal_akhir, status (`open` / `closed`) | Batas waktu penilaian |
| `assessments` | id, period_id, member_id, department_id, evaluator_id, status, catatan, skor_rata, submitted_at, deleted_at | Unik: (period_id, member_id) |
| `assessment_scores` | id, assessment_id, aspect_id, nilai | `nilai` dibatasi 1–5 (CHECK); unik: (assessment_id, aspect_id) |
| `assessment_comments` | id, assessment_id, author_id, parent_id, isi, dibaca_at | Komentar SDM dan balasan ketua |
| `audit_logs` | id, aktor_id, aksi, tabel, record_id, data_lama, data_baru, waktu | Riwayat ubah dan hapus |

**Aturan RLS**

| Tabel | Super-admin | Admin | Ketua |
| --- | --- | --- | --- |
| `members` | Semua | Baca semua | CRUD jika department_id = departemen miliknya |
| `assessments` dan `assessment_scores` | Semua | Baca yang berstatus selain Draft; ubah status | CRUD jika department_id = departemen miliknya |
| `assessment_comments` | Semua | Buat dan baca | Baca dan balas pada penilaian departemennya |
| `departments`, `profiles` | CRUD | Baca | Baca milik sendiri |
| `assessment_aspects`, `assessment_periods` | CRUD | Periode: CRUD; aspek: baca | Baca |

**Prinsip keamanan data**

- Role dibaca dari tabel `profiles` lewat fungsi `SECURITY DEFINER`, bukan dari metadata yang bisa diubah pengguna.
- Departemen ketua dicari lewat `departments.ketua_id = auth.uid()`; `department_id` pada penilaian divalidasi terhadap anggota yang dinilai.
- Pembuatan akun ketua memakai service role key hanya di server (Route Handler atau Server Action), tidak pernah dikirim ke client.
- Skor rata-rata dihitung di database (trigger atau view) supaya konsisten dengan ekspor.

## 12. Tech Stack & Arsitektur

Aplikasi memakai Next.js App Router di Vercel dengan Supabase sebagai backend. Data sensitif diproses di server; client hanya menampilkan hasil yang sudah lolos RLS.

**Teknologi utama**

| Kebutuhan | Teknologi |
| --- | --- |
| Framework aplikasi | `next` 16.2.7 (App Router) |
| UI library | `react` 19.2.4, `react-dom` 19.2.4 |
| Bahasa | `typescript` (strict mode) |
| Styling | `tailwindcss` 4 + konvensi desain token shadcn bertema Hijau Emerald & Oren Amber |
| Komponen UI dan ikon | `shadcn`, `radix-ui`, `lucide-react`, `@hugeicons/react` |
| Backend / BaaS | Supabase (PostgreSQL, Auth, Storage, RLS) via `@supabase/ssr` dan `@supabase/supabase-js` |
| Data fetching dan cache (client) | `@tanstack/react-query` |
| Tabel data admin | `@tanstack/react-table` |
| Global state ringan | `zustand` |
| Form dan validasi | `react-hook-form`, `@hookform/resolvers`, `zod` |
| Chart dashboard | `recharts` (tema visual chart hijau-oren) |
| Toast | `sonner` |
| Tema (light/dark) | `next-themes`, `@teispace/next-themes` (persisten, mendukung sistem auto, light, dan dark) |
| Hosting dan deploy | Vercel |

**Aturan UI:** seluruh UI wajib memakai komponen shadcn (Button, Input, Form, Table, Dialog, Sheet, Select, Tabs, Card, Badge, Calendar, Command, dll.). Komponen custom hanya boleh dibangun sebagai komposisi dari primitif shadcn/Radix.

**Tambahan yang diusulkan** (belum ada di daftar stack, perlu persetujuan)

| Kebutuhan | Opsi | Alasan |
| --- | --- | --- |
| Ekspor Excel | `exceljs` | Format sel, lebar kolom, dan beberapa sheet |
| Ekspor PDF | `@react-pdf/renderer` | Tata letak laporan dengan komponen React, berjalan di server |
| Pengujian | `vitest`, `playwright` | Tes logika skor dan alur per role |

**Pembagian tanggung jawab**

- **Server Components dan Server Actions:** baca dan tulis data, validasi zod, pembuatan akun, dan ekspor.
- **Client Components:** form interaktif (React Hook Form), tabel (TanStack Table), dan cache (React Query).
- **Middleware:** menyegarkan sesi Supabase dan menolak rute yang tidak sesuai role.
- **Zustand:** state UI ringan seperti filter dan sidebar, bukan data bisnis.
- **Supabase Storage:** foto profil dengan kebijakan akses per pengguna.

## 13. Kebutuhan Non-Fungsional

Data penilaian pegawai bersifat sensitif, jadi keamanan dan jejak audit menjadi prioritas di atas kecepatan fitur.

| Kategori | Kebutuhan |
| --- | --- |
| Keamanan | Otorisasi berlapis (middleware, Server Action, RLS); password minimal 8 karakter; sesi memakai cookie httpOnly lewat `@supabase/ssr`; rate limit pada login |
| Privasi | Hanya role berwenang yang melihat penilaian; anggota tidak punya akses; foto dan data pribadi hanya untuk pengguna terkait |
| Audit | Setiap tambah, ubah, hapus, dan perubahan status penilaian tercatat (siapa, kapan, nilai lama dan baru) |
| Performa | Halaman daftar dan rekap tampil ≤ 2 detik untuk sekitar 500 anggota; paginasi sisi server; ekspor satu periode selesai ≤ 10 detik |
| Ketersediaan | Mengikuti SLA Vercel dan Supabase; backup database harian dari Supabase |
| Kompatibilitas | Chrome, Safari, Edge, dan Firefox versi terbaru; layar HP mulai 360 px |
| Aksesibilitas | Kontras warna memadai sesuai standar WCAG 2.1 AA (rasio kontras minimal 4.5:1 untuk teks normal, 3:1 untuk tombol dan teks besar); tidak bergantung pada warna saja (selalu menyertakan ikon status dan label teks penjelas untuk pengguna buta warna); focus ring jelas pada mode keyboard navigasi |
| Lokalisasi | Bahasa Indonesia; zona waktu Asia/Jakarta; format tanggal `dd MMM yyyy` |
| Kualitas kode | TypeScript strict, validasi zod di client dan server, lint dan type-check di CI |
| Pengujian | Tes unit untuk perhitungan skor; tes RLS untuk memastikan ketua tidak bisa mengakses departemen lain; tes alur utama per role |
| Skalabilitas | Struktur data mendukung penambahan departemen, aspek, dan periode tanpa perubahan kode |

## 14. Asumsi, Risiko & Pertanyaan Terbuka

**Keputusan yang telah ditetapkan (Final)**

1. **Hak Ekspor:** Super-admin dan Admin (SDM) keduanya berhak mengekspor rekap penilaian ke PDF dan Excel.
2. **Aturan Pasca-Approval:** Jika ketua mengubah penilaian yang berstatus *Approved* (selama periode masih buka), statusnya otomatis turun kembali menjadi *Submitted* agar SDM memvalidasi ulang; setiap perubahan tercatat di *audit log*.
3. **Aspek & Bobot:** 7 aspek penilaian resmi ditetapkan sebagai instrumen final dengan bobot sama rata (skor rata-rata dibagi 7).
4. **Onboarding Data Anggota:** Disediakan fitur Impor Massal (Excel/CSV) oleh Super-admin / Admin SDM untuk mengisi ±500 anggota departemen secara efisien.

**Asumsi yang dipakai**

- Penilaian dilakukan per **periode** (misalnya bulanan atau semesteran), bukan sekali seumur hidup.
- Satu departemen punya satu ketua, dan satu ketua hanya memegang satu departemen.
- Jumlah anggota total sekitar 500 orang atau kurang.

**Pertanyaan terbuka (yang belum ditentukan)**

| No | Pertanyaan | Dampak |
| --- | --- | --- |
| 1 | Berapa frekuensi periode penilaian resmi (bulanan, per semester, atau tahunan)? | Pengaturan default rentang tanggal periode |
| 2 | Apakah anggota perlu memiliki akses melihat hasil penilaiannya di masa depan (misal portal pegawai terpisah)? | Roadmap versi berikutnya |
| 3 | Apakah ketua departemen juga akan dinilai (skema 360 derajat oleh pimpinan/SDM)? | Roadmap versi berikutnya |
| 4 | Siapa yang membuat akun awal pimpinan/super-admin pertama di lingkungan produksi? | Skrip seed deploy perdana |

**Risiko**

| Risiko | Kemungkinan | Dampak | Mitigasi |
| --- | --- | --- | --- |
| Ketua mengisi seragam (semua 5 atau semua 3) sehingga skor kurang membedakan | Sedang | Tinggi | Rubrik jelas per angka; SDM dapat meninjau dan meminta revisi |
| Kebocoran data antar departemen karena kesalahan RLS | Rendah | Tinggi | Tes RLS otomatis; review kebijakan sebelum rilis |
| Ketua mengubah nilai setelah dilihat SDM tanpa jejak | Sedang | Sedang | Audit log wajib; status kembali ke Submitted |
| Ketua kesulitan memakai aplikasi dari HP | Sedang | Sedang | Desain mobile-first; uji langsung dengan beberapa ketua |
| Penilaian bersifat subjektif dan memicu sensitivitas | Sedang | Tinggi | Akses ketat, komunikasi tujuan penilaian, dan rubrik yang jelas |
| Pergantian ketua membingungkan kepemilikan data | Rendah | Sedang | Data terikat ke departemen, bukan ke akun ketua |

## 15. Milestone & Rencana Rilis

Estimasi total sekitar 9 minggu untuk satu pengembang penuh waktu, jika dimulai 19 Oktober 2026 (usulan, bukan komitmen). Fase 1 sampai 3 sudah cukup untuk pilot di beberapa departemen.

| Fase | Minggu | Isi | Kriteria selesai |
| --- | --- | --- | --- |
| 0. Persiapan | 1 | Finalisasi PRD, aspek, dan periode; setup repo, Supabase, Vercel, shadcn | Pertanyaan terbuka bagian 14 terjawab; proyek berjalan di Vercel |
| 1. Fondasi | 2–3 | Skema database, RLS, login, middleware role, halaman profil, layout dan navigasi | Tiga role dapat login dan hanya melihat menu sendiri; tes RLS lulus |
| 2. Inti penilaian | 4–5 | CRUD departemen dan ketua, manajemen anggota, periode, aspek, form penilaian, draf dan submit | Ketua dapat menilai anggota departemennya dari HP |
| 3. Rekap dan review | 6–7 | Rekap SDM, filter, approval, komentar, riwayat perubahan, dashboard | SDM dapat memantau, menyetujui, dan memberi komentar |
| 4. Ekspor dan polesan | 8 | Ekspor PDF dan Excel, mode gelap, perbaikan UX, pengujian lintas perangkat | Ekspor sesuai data rekap; tes alur utama lulus |
| 5. Pilot dan rilis | 9 | Pilot di 2–3 departemen, perbaikan dari masukan, rilis ke 14 departemen | Pilot selesai tanpa masalah akses data; semua ketua punya akun |

**Kriteria rilis**

- Semua user story pada bagian 6 berjalan sesuai matriks hak akses.
- Tes RLS membuktikan ketua tidak dapat membaca atau menulis data departemen lain.
- Ekspor PDF dan Excel cocok dengan angka di halaman rekap.
- Seluruh UI memakai komponen shadcn dan nyaman dipakai di layar 360 px.