# Panduan Rilis Produksi & Deployment Checklist
**Monitoring Departemen — Pondok Modern Tazakka**  
Versi: 1.0.0 (Produksi)  
Tanggal Dokumen: 14 Oktober 2026  

---

## 1. Daftar Periksa Pra-Deploy (Pre-Flight Checklist)

Pastikan seluruh kriteria di bawah ini terpenuhi sebelum melakukan deployment ke lingkungan produksi:

- [ ] Kode sumber berada di branch `main` dalam status *clean* dan bebas dari konflik git.
- [ ] Pemeriksaan tipe (`npm run type-check`) lulus tanpa kesalahan.
- [ ] Linter kode (`npm run lint`) bersih dari peringatan kritis.
- [ ] Seluruh pengujian unit, validasi Zod, dan tes RLS (`npm run test`) lulus 100%.
- [ ] Pengujian E2E & audit aksesibilitas axe-core WCAG 2.1 AA (`npm run test:e2e`) lulus.
- [ ] Build produksi Next.js (`npm run build`) berhasil dibuat tanpa kegagalan SSR/SSG.
- [ ] Proyek database Supabase produksi telah dibuat dan berada di region yang tepat (Singapore / `ap-southeast-1`).
- [ ] Proyek Vercel produksi telah terhubung ke repositori GitHub.

---

## 2. Variabel Lingkungan Produksi (Environment Variables)

Atur variabel lingkungan berikut pada dasbor penyedia hosting (**Vercel** > *Project Settings* > *Environment Variables*) dan berkas konfigurasi lokal deployment (`.env.local`).

> [!WARNING]
> **JANGAN PERNAH** menyimpan nilai rahasia di dalam repositori git atau mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke sisi browser/klien!

| Nama Variabel | Lingkungan | Akses | Deskripsi & Kegunaan |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | Publik (Browser & Server) | URL endpoint REST/GraphQL proyek Supabase produksi (contoh: `https://<project-ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production & Preview | Publik (Browser & Server) | Kunci anonim publik Supabase untuk inisialisasi sesi otentikasi browser dan RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Saja | **Rahasia (Server Saja)** | Kunci istimewa (*service role*) yang mem-bypass RLS. Digunakan oleh Server Actions administratif, integrasi server-to-server, dan skrip seed lokal. |
| `NEXT_PUBLIC_APP_URL` | Production & Preview | Publik (Browser & Server) | Domain kanonikal aplikasi web produksi (contoh: `https://departemen.tazakka.or.id`). |

---

## 3. Urutan Menjalankan Migrasi Database

Seluruh skema database PostgreSQL, ekstensi, fungsi keamanan (*SECURITY DEFINER*), pemicu (*triggers*), dan kebijakan keamanan baris (*Row-Level Security* / RLS) harus dieksekusi secara berurutan.

### Opsi A: Menggunakan Supabase CLI (Direkomendasikan)
Hubungkan Supabase CLI dengan proyek produksi Anda:
```bash
npx supabase login
npx supabase link --project-ref <YOUR_PRODUCTION_PROJECT_REF>
npx supabase db push
```

### Opsi B: Menggunakan SQL Editor pada Dashboard Supabase
Jika mengeksekusi melalui **Supabase Dashboard** > **SQL Editor**, jalankan skrip berkas SQL berikut secara berurutan dari atas ke bawah:

1. **`supabase/migrations/20261013000001_initial_schema.sql`**
   - Membuat tipe ENUM: `user_role`, `assessment_status`, `period_status`.
   - Membuat tabel: `profiles`, `departments`, `members`, `assessment_aspects`, `assessment_periods`, `assessments`, `assessment_scores`.
   - Mengaktifkan Row-Level Security (RLS) pada semua tabel.
   - Mengonfigurasi fungsi `SECURITY DEFINER` untuk pembacaan role tanpa rekursi RLS.
   - Menambahkan pemicu (*trigger*) otomatis untuk perhitungan skor rata-rata instan.

2. **`supabase/migrations/20261013000002_avatars_storage.sql`**
   - Menginisialisasi bucket penyimpanan Supabase Storage bernama `avatars`.
   - Mengonfigurasi kebijakan RLS storage untuk foto profil pengguna (hanya pemilik yang dapat mengunggah/mengubah foto).

3. **`supabase/migrations/20261013000003_members_optimization.sql`**
   - Menambahkan indeks optimasi pada tabel `members` (`department_id`, `is_active`, `nip`).
   - Menambahkan indeks pencarian teks parsial untuk kebutuhan auto-complete form penilaian.

4. **`supabase/migrations/20261013000004_rekap_comments_audit.sql`**
   - Membuat tabel `assessment_comments` untuk thread komunikasi SDM dan Ketua Departemen.
   - Membuat tabel `audit_logs` untuk mencatat setiap perubahan skor dan status penilaian.
   - Menerapkan pemicu keamanan otomatis: jika penilaian yang sudah berstatus *Approved* diubah oleh ketua saat periode masih buka, statusnya otomatis turun kembali menjadi *Submitted* dan dicatat di *audit log*.

5. **`supabase/migrations/20261014000005_dashboard_views.sql`**
   - Mengonfigurasi fungsi analitik dan view agregasi dashboard (FR-10).
   - Menghitung distribusi capaian nilai, rata-rata departemen, dan rasio kelengkapan secara efisien di level database.

6. **`supabase/seed.sql` (Master Data Perdana)**
   - Memuat 14 Departemen resmi Pondok Modern Tazakka sesuai PRD Bagian 5.
   - Memuat 7 Aspek penilaian terstandar (Skala Likert 1–5) sesuai PRD Bagian 8.
   - Menginisialisasi Periode Penilaian perdana dengan status `open`.

---

## 4. Cara Membuat Akun Super-Admin Pertama

Sebagai pemenuhan atas PRD Bagian 14 (Pertanyaan Terbuka #4), akun Super-Admin (Pimpinan) pertama dibuat menggunakan skrip lokal aman berbasis kredensial service role, bukan melalui registrasi mandiri.

### Metode 1: Menggunakan Skrip CLI Lokal (Sangat Direkomendasikan)
Jalankan skrip berikut di terminal lokal Anda (pastikan file `.env.local` telah terhubung ke proyek Supabase produksi):

```bash
npx tsx scripts/create-superadmin.ts <email-pimpinan> "<password-rahasia>" "<Nama Lengkap Pimpinan>"
```

*Contoh Eksekusi:*
```bash
npx tsx scripts/create-superadmin.ts pimpinan@tazakka.or.id "TazakkaSuperAdmin2026!" "KH. Anang Rikza Masyhadi, M.A."
```

Skrip ini akan secara otomatis:
1. Mendaftarkan user ke `auth.users` dengan status `email_confirmed: true`.
2. Melakukan upsert ke tabel `public.profiles` dengan role `super_admin`.

### Metode 2: Pembuatan Manual Melalui Dasbor Supabase
1. Masuk ke **Supabase Dashboard** > **Authentication** > **Users**.
2. Klik tombol **Add User** > **Create User**.
3. Masukkan Email dan Password akun pimpinan, lalu centang **Auto Confirm User?**.
4. Salin User UID (contoh: `a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
5. Buka **SQL Editor** dan jalankan kueri berikut:
```sql
INSERT INTO public.profiles (id, nama, role, is_active)
VALUES ('<USER-UID-HASIL-SALINAN>', 'Pimpinan Lembaga', 'super_admin', TRUE)
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', is_active = TRUE;
```

---

## 5. Cara Impor & Penetapan 14 Ketua Departemen

Untuk mengonfigurasi ke-14 ketua departemen sekaligus, gunakan skrip `scripts/import-ketua.ts`.

### Langkah 1: Siapkan File CSV Calon Ketua
Buat file `data/ketua-14-departemen.csv` dengan header `nama,email,departemen_kode`:
```csv
nama,email,departemen_kode
Ustadz Hakim,ketua.pendidikan@tazakka.or.id,PEND-AJAR
Ustadz Ridwan,ketua.litbang@tazakka.or.id,LITBANG-GURU
Ustadz Subhi,ketua.pengasuhan@tazakka.or.id,ASUH-SANTRI
Ustadz Teguh,ketua.lazis@tazakka.or.id,LAZIS
Ustadz Firdaus,ketua.wakaf@tazakka.or.id,WAKAF
Ustadz Basuki,ketua.amalusaha@tazakka.or.id,AMAL-USAHA
Ustadz Fajar,ketua.ti@tazakka.or.id,TI
Ustadz Haris,ketua.sdm@tazakka.or.id,SDM
Ustadz Syarif,ketua.sekretariat@tazakka.or.id,SEKRETARIAT
Ustadz Mansur,ketua.keuangan@tazakka.or.id,KEUANGAN
Ustadz Bayu,ketua.humas@tazakka.or.id,HUMAS
Ustadz Zulkifli,ketua.kerjasama@tazakka.or.id,KERJASAMA-LN
Ustadz Ilyas,ketua.pt@tazakka.or.id,PT
Ustadz Burhan,ketua.pu@tazakka.or.id,PU
```

### Langkah 2: Uji Validasi dengan Mode `--dry-run`
Jalankan simulasi tanpa mengubah data database untuk memeriksa kesesuaian kode departemen dan format email:
```bash
npx tsx scripts/import-ketua.ts data/ketua-14-departemen.csv --dry-run
```

### Langkah 3: Eksekusi Impor Produksi
Jalankan eksekusi nyata untuk membuat akun auth, profil pengguna, dan menetapkan `departments.ketua_id`:
```bash
npx tsx scripts/import-ketua.ts data/ketua-14-departemen.csv
```

---

## 6. Prosedur Rollback (Emergency Rollback Protocol)

Jika terjadi kendala fatal setelah proses deployment di lingkungan produksi, ikuti protokol rollback berikut:

### 1. Rollback Frontend (Vercel)
Vercel mendukung *Instant Zero-Downtime Rollback*:
1. Buka dashboard Vercel pada proyek **monitoring-departemen**.
2. Masuk ke tab **Deployments**.
3. Temukan deployment stabil sebelumnya yang berstatus *Ready*.
4. Klik tombol menu tiga titik (**...**) di samping deployment tersebut, lalu pilih **Instant Rollback**.
5. Konfirmasi dialog. Lalu lintas produksi seketika dialihkan ke versi sebelumnya (< 5 detik).

### 2. Rollback Perubahan Database
Tergantung pada jenis kegagalan database:

- **Kasus A: Kerusakan Skema Baru Tanpa Kehilangan Data Transaksional**
  Jika baru saja menambahkan migrasi baru yang bermasalah dan belum ada penilaian anggota yang diisi pengguna, terapkan migrasi pembalik (*down-migration*) atau hapus view/kolom baru via SQL Editor.
  
- **Kasus B: Inkonsistensi Data atau Kerusakan Data Penilaian**
  Gunakan fitur **Point-in-Time Recovery (PITR)** atau **Daily Backup** pada Supabase:
  1. Masuk ke **Supabase Dashboard** > **Database** > **Backups**.
  2. Pilih titik waktu pemulihan sesaat sebelum insiden terjadi.
  3. Konfirmasi pemulihan (*Restore*).

### 3. Perlindungan Integritas Data Penilaian Saat Rollback
- Mengingat data penilaian anggota dan audit log bersifat penting, **JANGAN PERNAH** menjalankan perintah destruktif `DROP TABLE assessments`, `DROP TABLE members`, atau `DROP TABLE profiles` di database produksi yang sedang berjalan.
- Seluruh tabel inti telah dilindungi oleh konstrain *FOREIGN KEY RESTRICT*: menghapus departemen atau anggota yang telah memiliki catatan penilaian akan otomatis ditolak oleh database demi menjaga integritas data historis.

### 4. Verifikasi Pasca-Rollback
Lakukan verifikasi cepat (*smoke test*):
1. Buka rute `/login` dan pastikan formulir login dapat diakses.
2. Login sebagai Super-Admin dan Ketua Departemen untuk memastikan sesi auth Supabase tetap valid.
3. Buka halaman `/rekap` dan pastikan data rekap serta ekspor berfungsi normal.
