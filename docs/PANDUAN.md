# Panduan Pengguna (User Guide)
**Sistem Monitoring Departemen — Pondok Modern Tazakka**  
Versi: 1.0.0 (Produksi)  

Buku panduan ini disusun sebagai acuan praktis pengoperasian aplikasi web **Monitoring Departemen** bagi tiga peran pengguna (*role*): **Ketua Departemen**, **Admin SDM**, dan **Pimpinan (Super-Admin)**.

---

## 🌟 Daftar Isi
1. [Petunjuk Umum & Akses Sistem](#1-petunjuk-umum--akses-sistem)
2. [Panduan Role: Ketua Departemen (User)](#2-panduan-role-ketua-departemen-user)
3. [Panduan Role: Admin SDM (Admin)](#3-panduan-role-admin-sdm-admin)
4. [Panduan Role: Pimpinan / Super-Admin](#4-panduan-role-pimpinan--super-admin)
5. [Tanya Jawab & Bantuan Teknis (FAQ)](#5-tanya-jawab--bantuan-teknis-faq)

---

## 1. Petunjuk Umum & Akses Sistem

1. **Akses URL:** Buka peramban (*browser*) di komputer atau ponsel pintar (Chrome, Safari, Edge, Firefox) dan akses tautan resmi:  
   👉 `https://departemen.tazakka.or.id` (atau alamat URL yang disediakan administrator).
2. **Kredensial Login:** Masukkan alamat email resmi dan kata sandi yang telah didaftarkan oleh Pimpinan/SDM. Tidak tersedia pendaftaran mandiri demi keamanan data.
3. **Tampilan Responsif & Mode Tema:**
   - Aplikasi dapat digunakan secara optimal di layar desktop maupun layar HP (mulai lebar 360 px).
   - Pengguna dapat mengganti tampilan ke **Mode Terang (Light)** atau **Mode Gelap (Dark)** melalui ikon tema di pojok navigasi.
4. **Keamanan Akun:** Ganti kata sandi secara berkala melalui menu **Profil** di pojok kanan atas setelah login perdana.

---

## 2. Panduan Role: Ketua Departemen (User)

Sebagai Ketua Departemen, tugas utama Anda adalah mendata anggota tim di departemen Anda dan melakukan evaluasi kinerja secara objektif pada setiap periode penilaian yang dibuka.

### A. Orientasi Dasbor Ketua
- Setelah login, Anda langsung diarahkan ke **Dashboard Departemen** Anda sendiri.
- Anda dapat melihat ringkasan:
  - Jumlah total anggota tim di departemen Anda.
  - Progres pengisian penilaian periode aktif (berapa anggota belum dinilai, tersimpan sebagai draf, diajukan, atau telah disetujui SDM).
  - Rata-rata skor departemen dan radar capaian 7 aspek penilaian.

### B. Mengelola Anggota Departemen (`/anggota`)
Sebelum menilai, pastikan seluruh anggota di departemen Anda sudah terdaftar:
1. Klik menu **Anggota** pada navigasi.
2. **Menambah Anggota Baru:**
   - Klik tombol **+ Tambah Anggota**.
   - Masukkan Nama Lengkap, NIP/ID Internal, Jabatan/Amanah, dan Nomor WhatsApp/HP (opsional).
   - Klik **Simpan Anggota**.
3. **Mengubah / Memperbarui Data Anggota:**
   - Klik ikon **Edit** (pensil) pada baris anggota yang ingin diperbarui, sesuaikan datanya, lalu simpan.
4. **Menonaktifkan Anggota:**
   - Jika ada anggota yang mutasi atau berhenti bertugas, nonaktifkan melalui opsi status **Nonaktif**. Data riwayat penilaian terdahulu akan tetap aman dan utuh di sistem.

### C. Mengisi Lembar Penilaian Anggota (`/penilaian`)
1. Klik menu **Penilaian** pada navigasi.
2. Pilih **Periode Penilaian Aktif** dan pilih **Nama Anggota** yang akan dinilai.
3. Isi nilai **Skala Likert 1–5** untuk masing-masing dari **7 Aspek Terstandar**:
   - `1` : Sangat Kurang
   - `2` : Kurang
   - `3` : Cukup / Standar
   - `4` : Baik
   - `5` : Sangat Baik / Istimewa
   *(Baca rubrik penjelasan singkat di bawah tiap angka untuk menjaga objektivitas).*
4. **Catatan Evaluasi (Opsional):** Tuliskan apresiasi, saran pengembangan, atau catatan khusus bagi anggota bersangkutan.
5. **Menyimpan Penilaian:**
   - **Simpan sebagai Draf:** Klik tombol ini jika Anda ingin menyimpan sementara dan melanjutkannya nanti. Status penilaian akan menjadi *Draft*.
   - **Submit Penilaian:** Klik tombol ini jika seluruh aspek sudah dinilai dan Anda siap mengirimkan penilaian ke SDM. Skor rata-rata dihitung otomatis oleh sistem.

### D. Mengoreksi Penilaian & Merespons Masukan SDM
- Anda tetap dapat memperbaiki penilaian yang telah di-submit jika terdapat kekeliruan atau saat SDM meminta revisi (*Revision Requested*).
- **Aturan Approval Otomatis:** Apabila Anda mengubah penilaian yang statusnya telah *Disetujui (Approved)* oleh SDM, sistem akan secara otomatis mengembalikan statusnya menjadi *Submitted* agar diverifikasi ulang oleh SDM, dan catatan perubahannya tercatat di riwayat audit.
- Buka tab/bagian **Komentar & Diskusi** pada detail penilaian untuk membaca catatan dari SDM dan mengirimkan balasan konfirmasi.

---

## 3. Panduan Role: Admin SDM (Admin)

Sebagai Admin SDM, peran utama Anda adalah memantau kelengkapan evaluasi di seluruh 14 departemen, melakukan rekapitulasi, memvalidasi kualitas penilaian, memberikan umpan balik, dan menerbitkan laporan resmi.

### A. Memantau Kelengkapan Rekapitulasi (`/rekap`)
1. Buka menu **Rekap Penilaian**.
2. Perhatikan kartu ringkasan status di bagian atas:
   - Persentase total anggota terkelola yang telah dinilai.
   - Daftar departemen yang **Belum Selesai Menilai** (*Pending*) untuk ditindaklanjuti.
3. Gunakan filter pencarian:
   - **Filter Departemen:** Pilih salah satu dari 14 departemen atau tampilkan semua.
   - **Filter Periode:** Pilih periode penilaian berjalan.
   - **Filter Status:** Saring berdasarkan *Draft*, *Submitted*, *Revision Requested*, atau *Approved*.
   - **Kolom Pencarian:** Cari nama anggota atau NIP secara cepat.

### B. Impor Massal Data Anggota (Excel/CSV)
Untuk mempermudah pendataan ratusan anggota sekaligus di awal periode:
1. Buka menu **Anggota** atau **Master Data** > pilih fitur **Impor Massal**.
2. Unduh template CSV/Excel yang telah disediakan sistem.
3. Isi data anggota lengkap dengan kolom: `kode_departemen`, `nama`, `nip`, `jabatan`, `no_hp`.
4. Unggah berkas ke sistem. Sistem akan memvalidasi kesesuaian format dan kode departemen sebelum menyimpannya ke database.

### C. Approval & Pemberian Umpan Balik Penilaian
1. Pada tabel rekap, klik nama anggota untuk melihat **Detail Penilaian**.
2. Periksa distribusi skor pada 7 aspek dan catatan dari ketua departemen.
3. Ambil tindakan evaluasi:
   - **Setujui (Approve):** Klik tombol **Setujui** jika penilaian dinilai telah objektif dan wajar.
   - **Minta Revisi (Request Revision):** Klik **Minta Revisi** jika terdapat ketidaksesuaian (misal: pemberian nilai ekstrem tanpa alasan).
4. **Memberikan Komentar:** Ketik pesan umpan balik pada kolom komentar di bagian bawah lembar penilaian agar ketua departemen dapat membaca dan menindaklanjutinya.

### D. Ekspor Laporan Rekapitulasi (`/ekspor`)
1. Klik menu **Ekspor Laporan**.
2. Pilih periode yang hendak dilaporkan.
3. Pilih format berkas yang diinginkan:
   - **Unduh Excel (.xlsx):** Menghasilkan lembar kerja lengkap dengan rincian nilai per aspek, catatan, status approval, dan formula rata-rata per departemen.
   - **Unduh PDF (.pdf):** Menghasilkan dokumen cetak laporan resmi bertanda tangan digital dengan tata letak profesional siap arsip.

---

## 4. Panduan Role: Pimpinan / Super-Admin

Sebagai Pimpinan Lembaga (Super-Admin), Anda memegang kendali penuh atas tata kelola sistem, struktur organisasi, penetapan amanah ketua departemen, dan pengawasan audit kelembagaan.

### A. Eksekutif Dashboard Lembaga (`/dashboard`)
- Memantau metrik performa terpusat 14 departemen:
  - Grafik distribusi predikat kinerja seluruh pegawai.
  - Diagram radar komparasi 7 aspek nilai antar departemen.
  - Kartu indikator kelengkapan penilaian per departemen secara *real-time*.

### B. Mengelola Struktur Departemen (`/departemen`)
1. Buka menu **Departemen**.
2. Tinjau 14 departemen resmi:
   - Anda dapat menambah departemen baru, mengedit nama lembaga, atau menonaktifkan departemen.
   - **Menetapkan / Mengganti Ketua:** Klik tombol aksi pada departemen yang diinginkan, pilih akun ketua yang bertugas dari daftar pengguna, lalu simpan. Perubahan ketua tidak akan menghapus data penilaian lama anggota departemen tersebut.

### C. Mengelola Akun Pengguna (`/ketua` atau `/pengguna`)
1. Buka menu **Kelola Akun**.
2. Buat akun baru untuk ketua departemen yang baru dilantik dengan mengisikan nama lengkap dan email resmi lembaga.
3. Reset kata sandi atau nonaktifkan akses bagi personel yang telah purnatugas.

### D. Mengelola Periode & Aspek Penilaian (`/periode` & `/aspek`)
1. **Periode Penilaian:**
   - Buat periode baru (misalnya *Semester Ganjil 2026/2027*).
   - Tentukan tanggal mulai dan batas akhir penilaian.
   - Ubah status periode menjadi **Closed** apabila masa penilaian telah berakhir agar data terkunci dari modifikasi lanjutan.
2. **Aspek Penilaian:**
   - Meninjau 7 aspek rubrik terstandar (Kinerja Kerja, Kerajinan, Ibadah, Kebersihan, Kerja Sama Tim, Inisiatif & Tanggung Jawab, Akhlak & Adab).

### E. Jejak Audit & Pengawasan (`/audit`)
- Setiap aktivitas penambahan anggota, modifikasi skor penilaian, pergantian status persetujuan, dan penghapusan data tercatat secara permanen di tabel audit log (mencatat identitas aktor, waktu pencatatan, nilai lama, dan nilai baru).

---

## 5. Tanya Jawab & Bantuan Teknis (FAQ)

**Q: Apakah anggota tim biasa dapat melihat skor penilaian mereka?**  
*A:* Tidak. Berdasarkan kebijakan privasi PRD Bagian 4, anggota tim tidak memiliki akun login dan tidak dapat mengakses sistem. Data penilaian bersifat rahasia dan hanya dapat diakses oleh Ketua Departemen bersangkutan, SDM, dan Pimpinan.

**Q: Bagaimana jika seorang ketua departemen keliru memberi nilai dan penilaian sudah disubmit?**  
*A:* Ketua departemen dapat membuka kembali halaman penilaian anggota tersebut dan mengedit skor kapan saja selama periode penilaian masih berstatus `open`. Jika sebelumnya sudah disetujui SDM, statusnya akan otomatis kembali ke `submitted` untuk ditinjau ulang oleh SDM.

**Q: Apakah data penilaian akan hilang jika terjadi pergantian ketua departemen?**  
*A:* Tidak. Seluruh data anggota dan catatan penilaian terikat pada entitas Departemen, bukan akun pribadi ketua. Saat pimpinan menetapkan ketua baru, ketua baru dapat langsung melihat dan mengelola data departemen tersebut.

**Q: Ke mana saya dapat menghubungi jika lupa password atau mengalami kendala sistem?**  
*A:* Silakan hubungi Departemen Pengembangan TI atau Admin SDM Pondok Modern Tazakka melalui email `admin.sdm@tazakka.or.id` atau `ti@tazakka.or.id`.
