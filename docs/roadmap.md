# Roadmap Pembangunan — Monitoring Departemen

Dokumen ini memecah PRD (`prd.md`) menjadi fase-fase kerja yang berurutan, lengkap dengan **prompt siap pakai untuk Claude Code**. Urutannya sengaja dibuat dari fondasi (database, keamanan) ke atas, dan **dashboard dibangun paling akhir** karena ia hanya merangkum data dari fitur-fitur sebelumnya.

Estimasi: ±10 minggu untuk satu pengembang penuh waktu, mulai 19 Oktober 2026 (usulan, bukan komitmen).

## Ringkasan Fase

| Fase | Minggu | Fokus | Hasil akhir |
| --- | --- | --- | --- |
| 0 | 1 | Persiapan proyek | Proyek jalan di Vercel, tema Hijau–Oren terpasang |
| 1 | 2 | Database, RLS, seed | Skema lengkap, tes RLS lulus |
| 2 | 3 | Auth, middleware role, layout, profil | 3 role login dan hanya melihat menu sendiri |
| 3 | 4 | Master data: departemen, ketua, aspek, periode | Super-admin mengelola struktur organisasi |
| 4 | 4–5 | Manajemen anggota | Ketua CRUD anggota departemennya |
| 5 | 5–6 | Form penilaian Likert | Ketua menilai dari HP (draf dan submit) |
| 6 | 6–7 | Rekap, approval, komentar, riwayat | SDM memantau, menyetujui, berkomentar |
| 7 | 8 | Ekspor PDF dan Excel | Ekspor cocok dengan angka rekap |
| 8 | 8–9 | Polesan, dark mode, pengujian | Tes alur utama per role lulus |
| **9** | **9–10** | **Dashboard (interface akhir)** | **Dashboard per role dengan grafik dan KPI** |
| 10 | 10 | Pilot dan rilis | Rilis ke 14 departemen |

## Cara Memakai Roadmap Ini

1. Salin `prd.md` ke repo (misalnya `docs/PRD.md`) supaya Claude Code selalu bisa membacanya.
2. Mulai dari **Fase 0**. Tempel prompt ke Claude Code, tinjau hasilnya, jalankan, baru lanjut.
3. Gunakan **Plan Mode** (`Shift+Tab` dua kali) untuk fase besar (1, 5, 6) agar rencananya bisa Anda setujui dulu.
4. **Commit per fase** (`git commit`) sebelum lanjut, supaya mudah dibatalkan bila ada yang salah.
5. Jalankan `/clear` di antara fase supaya konteks tetap bersih. Aturan global ada di `CLAUDE.md` (dibuat di Fase 0), jadi Claude Code tidak lupa konvensi proyek.
6. Pertanyaan terbuka PRD bagian 14 belum terjawab. Prompt di bawah memakai **asumsi bawaan PRD**; bila jawabannya berbeda, sesuaikan prompt fase terkait.

---

## Fase 0 — Persiapan Proyek (Minggu 1)

**Tujuan:** repo, Supabase, Vercel, shadcn, dan tema visual siap; aturan kerja tertulis di `CLAUDE.md`.

**Tugas**
- Inisialisasi Next.js (App Router, TypeScript strict, Tailwind 4).
- Pasang dependensi sesuai PRD bagian 12.
- Inisialisasi shadcn dan pasang token warna Hijau Emerald & Oren Amber (PRD 10.1).
- Hubungkan Supabase (`@supabase/ssr`) dan siapkan `.env.example`.
- Tulis `CLAUDE.md`.

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md secara menyeluruh, terutama bagian 10 (UI & tema), 12 (tech stack) dan 13 (non-fungsional).

Tugas: siapkan fondasi proyek "Monitoring Departemen".

1. Inisialisasi Next.js 16 (App Router) + TypeScript strict + Tailwind CSS 4 + ESLint. Gunakan struktur folder `src/`.
2. Pasang dependensi: @supabase/ssr, @supabase/supabase-js, @tanstack/react-query, @tanstack/react-table, zustand, react-hook-form, @hookform/resolvers, zod, recharts, sonner, next-themes, lucide-react. Tambahkan vitest dan playwright sebagai devDependencies.
3. Inisialisasi shadcn/ui lalu tambahkan komponen dasar: button, input, label, form, card, badge, table, dialog, sheet, select, tabs, dropdown-menu, avatar, separator, skeleton, sonner, radio-group, textarea, progress, calendar, command, popover, checkbox, switch.
4. Terapkan token warna Hijau Emerald (primary) dan Oren Amber (secondary) dari PRD bagian 10.1 ke globals.css untuk mode light dan dark, termasuk --chart-1..4. Sesuaikan format variabel dengan versi shadcn + Tailwind 4 yang terpasang (boleh dikonversi ke oklch asalkan warnanya setara). Pastikan kontras memenuhi WCAG 2.1 AA.
5. Pasang ThemeProvider (next-themes) dan Toaster (sonner) di root layout. Set lang="id", font yang mendukung tampilan bersih di HP.
6. Buat helper Supabase di src/lib/supabase/: client.ts (browser), server.ts (server components/actions), dan middleware helper untuk refresh sesi. Buat .env.example berisi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (beri komentar: service role HANYA di server).
7. Buat halaman placeholder di "/" yang menampilkan nama aplikasi dan contoh tombol primary, secondary, serta badge status (Draft, Submitted, Revision Requested, Approved) sesuai PRD bagian 9, untuk memverifikasi tema.
8. Buat CLAUDE.md di root berisi aturan proyek: bahasa UI Indonesia; semua UI wajib komponen shadcn (custom hanya komposisi shadcn/Radix); validasi zod di client dan server; otorisasi berlapis (middleware, Server Action, RLS); service role key tidak pernah ke client; zona waktu Asia/Jakarta dan format tanggal "dd MMM yyyy"; mobile-first mulai 360px; tidak menyembunyikan akses hanya lewat UI; jalankan `npm run lint && npx tsc --noEmit` sebelum menyatakan tugas selesai.

Jangan membuat fitur lain. Setelah selesai, jalankan lint dan type-check, lalu ringkas apa yang dibuat dan apa yang perlu saya isi manual (mis. project Supabase, env vars).
```

**Kriteria selesai:** `npm run dev` jalan, halaman placeholder tampil dengan tema benar di light dan dark, lint dan type-check bersih, deploy pertama sukses di Vercel.

---

## Fase 1 — Database, RLS, dan Seed (Minggu 2)

**Tujuan:** seluruh skema (PRD 11) dengan keamanan di level database. Ini fase paling kritis; jangan buru-buru.

**Tugas**
- Migrasi SQL untuk 9 tabel, enum, constraint, dan index.
- Fungsi `SECURITY DEFINER` untuk membaca role dan departemen pengguna.
- Policy RLS sesuai tabel aturan RLS.
- Trigger skor rata-rata dan audit log.
- Seed 14 departemen, 7 aspek, dan satu periode contoh.
- Tes RLS otomatis.

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md bagian 4, 5, 8, 9, 11 dan 13. Gunakan Plan Mode: buat rencana dulu, tunggu persetujuan saya, baru implementasi.

Tugas: buat database Supabase lengkap sebagai file migrasi SQL di supabase/migrations/.

1. Tabel (schema public): profiles, departments, members, assessment_aspects, assessment_periods, assessments, assessment_scores, assessment_comments, audit_logs. Ikuti kolom dan catatan di PRD bagian 11. Tambahkan:
   - enum role (super_admin, admin, user), status penilaian (draft, submitted, revision_requested, approved), status periode (open, closed)
   - UNIQUE departments.ketua_id; UNIQUE (period_id, member_id) pada assessments; UNIQUE (assessment_id, aspect_id) pada assessment_scores; CHECK nilai BETWEEN 1 AND 5
   - foreign key, index pada kolom yang sering difilter (department_id, period_id, status), created_at/updated_at
   - soft delete (deleted_at) pada members dan assessments
2. Fungsi helper SECURITY DEFINER dengan search_path terkunci: current_role() membaca role dari tabel profiles (BUKAN dari JWT metadata), dan current_department_id() mencari departments.ketua_id = auth.uid().
3. Aktifkan RLS di SEMUA tabel dan tulis policy persis sesuai tabel "Aturan RLS" PRD 11. Poin penting: ketua hanya CRUD members/assessments/assessment_scores departemennya sendiri; admin hanya membaca assessments non-draft dan boleh mengubah status; department_id pada assessments harus cocok dengan department_id anggota yang dinilai (validasi lewat trigger atau WITH CHECK); penilaian hanya boleh dibuat/diubah saat periode berstatus open kecuali oleh super_admin.
4. Trigger: (a) hitung skor_rata di assessments dari assessment_scores (rata-rata nilai aspek aktif, 2 desimal); (b) audit_logs otomatis untuk INSERT/UPDATE/DELETE pada assessments dan assessment_scores (aktor, aksi, data_lama, data_baru, waktu); (c) jika assessment berstatus approved lalu diubah oleh ketua, status otomatis kembali ke submitted.
5. Trigger auto-buat baris profiles saat user baru dibuat di auth.users TIDAK diperlukan; profil dibuat oleh server saat super-admin membuat akun.
6. Seed (supabase/seed.sql): 14 departemen dari PRD bagian 5 (beri kode singkat), 7 aspek dari PRD bagian 8, dan satu periode contoh berstatus open.
7. Tes RLS otomatis (pgTAP atau skrip vitest yang memakai beberapa klien dengan JWT berbeda) yang membuktikan: ketua A tidak bisa membaca/menulis members dan assessments departemen B; ketua tidak bisa mengubah role sendiri; admin tidak bisa membuat assessments; ketua tidak bisa menulis ke periode closed; nilai di luar 1-5 ditolak. Tes ini wajib lulus.
8. Generate tipe TypeScript dari skema ke src/types/database.ts dan jelaskan cara menjalankannya di README.

Setelah selesai, tampilkan ringkasan policy per tabel dan hasil tes RLS.
```

**Kriteria selesai:** migrasi berjalan bersih di Supabase, seed terisi, **semua tes RLS lulus** (target PRD: 0 kebocoran lintas departemen).

---

## Fase 2 — Autentikasi, Middleware Role, Layout, dan Profil (Minggu 3)

**Tujuan:** tiga role bisa login dan hanya melihat menu sendiri. `/dashboard` sementara berupa halaman kerangka (diisi penuh di Fase 9).

**Tugas**
- Login, logout, lupa dan ganti password.
- Middleware: refresh sesi dan tolak rute sesuai role (PRD bagian 10).
- Layout dengan sidebar desktop dan Sheet mobile, menu per role.
- Halaman profil dengan upload foto ke Supabase Storage.

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md bagian 4, 7 (FR-1, FR-2), 10 dan 13. Baca juga CLAUDE.md. Fondasi (Fase 0) dan database + RLS (Fase 1) sudah selesai.

Tugas: autentikasi, proteksi rute per role, layout aplikasi, dan halaman profil.

1. Auth (Supabase Auth, email + password, tanpa pendaftaran mandiri):
   - /login (form react-hook-form + zod, pesan error berbahasa Indonesia, rate limit sederhana di sisi server)
   - logout, lupa password, ganti password
   - setelah login arahkan ke /dashboard
2. middleware.ts: refresh sesi @supabase/ssr; belum login -> /login; cek role dari tabel profiles dan tolak rute yang tidak diizinkan sesuai tabel rute PRD bagian 10 (mis. /ketua dan /aspek hanya super_admin; /penilaian/[anggotaId] tidak untuk admin). Akun is_active=false tidak boleh masuk.
3. Buat helper server `requireRole(...roles)` dan `getCurrentUser()` yang dipakai ulang di semua Server Action dan halaman, supaya otorisasi berlapis (middleware + action + RLS) konsisten.
4. Layout terautentikasi: sidebar di desktop, Sheet di mobile (mobile-first, mulai 360px). Menu hanya yang sesuai role. Active menu pakai gaya PRD 10.1.D (bg emerald-50, border-l-4 emerald-600). Sediakan slot badge counter oren untuk komentar belum dibaca (isi nanti). Tambahkan toggle tema (light/dark/system) dan menu user (profil, keluar).
5. Halaman rute kerangka untuk semua rute di PRD bagian 10 (judul + EmptyState shadcn) supaya navigasi bisa diuji. /dashboard cukup menyapa pengguna dan menampilkan role + departemen; isinya akan dibangun di fase terakhir.
6. /profil (FR-2): ubah nama, no HP, foto profil (Supabase Storage, bucket privat, policy hanya pemilik), ganti password. Role dan departemen tampil baca-saja.
7. Buat 3 akun uji lewat skrip seed terpisah (scripts/seed-dev-users.ts, memakai service role HANYA di skrip server): satu super_admin, satu admin, dan dua ketua yang masing-masing memegang departemen berbeda.
8. Tes Playwright: tiap role login, hanya melihat menu miliknya, dan akses URL terlarang diarahkan/ditolak.

Gunakan hanya komponen shadcn. Jalankan lint, type-check, dan tes sebelum selesai.
```

**Kriteria selesai:** tiga role dapat login; akses URL terlarang ditolak; profil bisa diubah; tes Playwright lulus.

---

## Fase 3 — Master Data: Departemen, Ketua, Aspek, Periode (Minggu 4)

**Tujuan:** super-admin dan SDM menyiapkan struktur yang dibutuhkan sebelum penilaian bisa dimulai.

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md bagian 5, 7 (FR-7, FR-8), 8 dan 9. Fase 0-2 sudah selesai.

Tugas: bangun halaman master data.

1. /departemen (super_admin: CRUD; admin: lihat saja). Tabel TanStack Table dengan pencarian, filter status, paginasi sisi server. Dialog tambah/ubah (nama, kode singkat, status aktif). Departemen yang sudah punya penilaian TIDAK boleh dihapus permanen, hanya dinonaktifkan (tolak di server dan tampilkan pesan jelas). Kolom ketua + aksi "Pilih/Ganti ketua" (Command/Select dari daftar akun ketua yang belum memegang departemen). Mengganti ketua tidak menghapus data penilaian lama.
2. /ketua (super_admin saja): daftar akun ketua; buat akun baru (nama, email, password awal, no HP), nonaktifkan/aktifkan, reset password. Pembuatan akun memakai service role key HANYA di Server Action/Route Handler (src/lib/supabase/admin.ts dengan `import "server-only"`), lalu buat baris profiles dengan role user. Validasi zod di server.
3. /aspek (super_admin: CRUD; admin: baca): tambah, ubah, ubah urutan (drag atau tombol naik/turun), aktif/nonaktif. Tampilkan juga skala Likert 1-5 beserta labelnya (PRD bagian 8) sebagai referensi baca-saja.
4. /periode (super_admin dan admin: CRUD): nama, tanggal mulai/akhir, buka/tutup periode. Setelah ditutup, hanya super_admin yang bisa membuka kembali. Tampilkan badge status periode.
5. Semua mutasi lewat Server Action dengan requireRole + validasi zod; pesan sukses/gagal lewat sonner. Tanggal tampil format "dd MMM yyyy" zona Asia/Jakarta.
6. Tes: unit test untuk skema zod; tes Playwright untuk alur super_admin membuat ketua, menetapkannya ke departemen, dan membuat periode.

Hanya komponen shadcn. Jalankan lint, type-check, dan tes.
```

**Kriteria selesai:** super-admin dapat membuat akun ketua, menetapkannya, mengatur aspek, dan membuka periode; admin tidak bisa mengubah hal yang bukan haknya.

---

## Fase 4 — Manajemen Anggota (Minggu 4–5)

**Tujuan:** ketua mengelola anggota departemennya (FR-3, US-01, US-02).

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md bagian 7 (FR-3), 6 (US-01, US-02) dan matriks hak akses di bagian 4. Fase 0-3 sudah selesai.

Tugas: halaman /anggota.

1. Ketua: tabel anggota departemen SENDIRI (pencarian nama/NIP, filter status aktif, paginasi sisi server). Admin: lihat semua departemen (tambahkan filter departemen). Super_admin: CRUD semua departemen (wajib memilih departemen saat menambah).
2. Tambah/ubah lewat Dialog atau Sheet (mobile-friendly): nama lengkap, NIP/ID internal, jabatan, no HP (opsional), status aktif. department_id untuk ketua diambil di SERVER dari akun yang login, tidak pernah dari input client.
3. Impor massal anggota (Excel/CSV): fitur untuk super_admin dan admin (SDM) untuk mengunggah ratusan data anggota sekaligus dengan template Excel/CSV, validasi format/kolom (kode departemen, NIP, nama, jabatan), dan feedback hasil impor.
4. Nonaktifkan dan hapus: anggota yang sudah punya penilaian hanya boleh dinonaktifkan (tolak hapus di server, dan UI menampilkan alasannya). Hapus memakai soft delete (deleted_at). Konfirmasi lewat AlertDialog.
5. Validasi zod di client dan server (NIP unik per departemen, nama wajib).
6. Pastikan query tabel memakai paginasi sisi server dan tetap ≤ 2 detik untuk ±500 anggota (tambahkan index bila perlu).
7. Tes: tes RLS tambahan (ketua A tidak bisa melihat/mengubah anggota departemen B lewat Server Action maupun query langsung) dan tes Playwright alur ketua CRUD anggota dari viewport 360px serta alur admin mengimpor file anggota.

Hanya komponen shadcn. Jalankan lint, type-check, dan tes.
```

**Kriteria selesai:** ketua mengelola anggota dari HP; tes isolasi data lulus.

---

## Fase 5 — Form Penilaian Likert (Minggu 5–6)

**Tujuan:** inti produk: ketua menilai anggota 1–5 per aspek dalam ≤ 2 menit (FR-4, US-03 s.d. US-07).

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md bagian 6, 7 (FR-4), 8, 9 dan 10.1.D. Gunakan Plan Mode dulu. Fase 0-4 sudah selesai.

Tugas: fitur penilaian untuk ketua.

1. /penilaian: daftar anggota departemen + status penilaian pada periode terpilih (selector periode, default periode open). Tampilkan badge status sesuai PRD bagian 9 (Draft, Submitted, Revision Requested, Approved) dengan ikon + label teks, tidak mengandalkan warna saja. Ringkasan progres "X dari Y anggota sudah dinilai" (progress bar emerald). Admin dan super_admin melihat semua departemen dengan filter.
2. /penilaian/[anggotaId] (ketua untuk anggota departemennya, dan super_admin; admin tidak boleh): form penilaian.
   - Satu penilaian per anggota per periode (kalau sudah ada, buka mode ubah).
   - Setiap aspek aktif tampil sebagai RadioGroup nilai 1-5 berlabel (Sangat Kurang ... Sangat Baik) + rubrik singkat. Warna radio sesuai PRD 10.1.D (1-2 oren, 3 slate, 4-5 emerald), plus angka dan label teks.
   - Catatan umum opsional.
   - Tombol "Simpan Draf" (aspek boleh belum lengkap) dan "Kirim Penilaian" (semua aspek wajib terisi). Skor rata-rata dan kategori (PRD bagian 8) tampil real-time sebagai pratinjau, tetapi nilai resmi dihitung trigger database.
   - Mobile-first 360px: target sentuh besar, tombol aksi menempel di bawah layar (sticky), isi cepat ≤ 2 menit.
   - Ketua boleh ubah dan hapus (soft delete, dengan konfirmasi) selama periode open, termasuk setelah submit. Jika status approved lalu diubah, status kembali ke submitted (trigger sudah ada).
   - Periode closed: form read-only untuk ketua.
3. Semua mutasi lewat Server Action: requireRole, validasi zod, pastikan member berada di departemen ketua dan periode berstatus open, simpan assessment + assessment_scores dalam satu transaksi (RPC bila perlu).
4. Buat util `kategoriSkor(skor)` di src/lib/scoring.ts sesuai tabel kategori PRD bagian 8 + komponen <SkorBadge /> (komposisi Badge shadcn). Tulis unit test vitest untuk batas rentang (mis. 4,49 vs 4,50) dan pembulatan 2 desimal.
5. Tes Playwright: alur ketua dari 360px: buka periode -> pilih anggota -> isi -> simpan draf -> lanjutkan -> kirim; dan tes ketua A tidak bisa membuka form anggota departemen B.

Hanya komponen shadcn. Jalankan lint, type-check, dan tes.
```

**Kriteria selesai:** ketua menilai anggotanya dari HP; skor dan kategori tepat; aturan periode dan status berjalan.

---

## Fase 6 — Rekap, Approval, Komentar, dan Riwayat (Minggu 6–7)

**Tujuan:** SDM memantau dan mereview, ketua menerima umpan balik (FR-5, FR-6, US-08 s.d. US-12).

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md bagian 6, 7 (FR-5, FR-6), 9, 10 dan 11. Gunakan Plan Mode dulu. Fase 0-5 sudah selesai.

Tugas: rekap, approval, komentar, dan riwayat perubahan.

1. /rekap: tabel TanStack Table lintas departemen (super_admin dan admin) atau departemen sendiri (ketua). Filter: departemen, periode, status, pencarian nama. Paginasi dan filter di sisi server. Admin hanya melihat penilaian non-draft (diatur RLS; verifikasi). Kolom: anggota, departemen, skor rata + SkorBadge, status, tanggal submit.
2. Ringkasan per departemen di atas tabel: jumlah anggota, sudah dinilai, rata-rata skor, dan penanda oren untuk departemen yang belum selesai menilai (US-10).
3. /rekap/[penilaianId]: detail penilaian (skor per aspek, catatan, status), tab "Komentar" dan tab "Riwayat".
   - Aksi admin/super_admin: "Setujui" (tombol emerald) dan "Minta Revisi" (tombol oren; wajib disertai komentar). Server Action memvalidasi transisi status sesuai PRD bagian 9.
   - Komentar: admin/super_admin menulis; ketua melihat dan membalas (parent_id untuk balasan). Tandai dibaca (dibaca_at) saat ketua membuka detail.
   - Riwayat: tampilkan audit_logs penilaian itu (siapa, kapan, nilai lama -> baru) dalam timeline yang mudah dibaca, dengan label aspek, bukan ID.
4. Badge counter oren komentar belum dibaca di sidebar ketua (data nyata dari DB, update dengan React Query refetch/invalidation).
5. Tes: tes transisi status (submitted -> approved/revision_requested -> submitted), tes RLS komentar (ketua hanya di penilaian departemennya), dan Playwright alur SDM: filter rekap -> buka detail -> minta revisi -> ketua membalas dan mengubah -> status kembali submitted.

Hanya komponen shadcn. Jalankan lint, type-check, dan tes.
```

**Kriteria selesai:** SDM bisa memantau, menyetujui, meminta revisi, dan berkomentar; riwayat perubahan terlihat.

---

## Fase 7 — Ekspor PDF dan Excel (Minggu 8)

**Tujuan:** rekap per periode bisa diekspor ≤ 10 detik dan angkanya identik dengan halaman rekap (FR-9, US-16).

> **Keputusan Final:** Admin (SDM) dan Super-admin keduanya berhak mengekspor PDF dan Excel (PRD bagian 14).

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md bagian 7 (FR-9), 13 dan 14. Fase 0-6 sudah selesai. Pasang exceljs dan @react-pdf/renderer (sudah disetujui).

Tugas: fitur ekspor.

1. Halaman /ekspor: diakses oleh super_admin dan admin (konstanta izin `EXPORT_ROLES = ["super_admin", "admin"]`). Filter departemen dan periode (atau semua departemen) + tombol "Unduh Excel" dan "Unduh PDF".
2. Excel (.xlsx) via exceljs di Route Handler server: satu sheet ringkasan per departemen dan satu sheet detail per anggota dengan kolom skor tiap aspek, skor rata, kategori, status. Format sel, lebar kolom, header tebal, tanggal "dd MMM yyyy".
3. PDF via @react-pdf/renderer di server: rekap per departemen siap cetak (judul periode, tabel anggota dan skor, rata-rata departemen, tanggal cetak). Tema hijau emerald untuk header.
4. Data ekspor harus berasal dari query/view yang SAMA dengan halaman rekap supaya angkanya konsisten. Refactor ke satu fungsi query bersama bila perlu.
5. Validasi parameter dengan zod, cek role di Route Handler, dan nama file deskriptif (monitoring-departemen_<periode>_<tanggal>.xlsx/pdf).
6. Tes: unit test pembentukan baris ekspor dan test konsistensi (angka ekspor == angka rekap untuk data seed); uji waktu ekspor ≤ 10 detik dengan data ±500 anggota.

Hanya komponen shadcn untuk UI. Jalankan lint, type-check, dan tes.
```

**Kriteria selesai:** file Excel dan PDF terunduh, cocok dengan rekap, dan selesai ≤ 10 detik.

---

## Fase 8 — Polesan, Dark Mode, dan Pengujian (Minggu 8–9)

**Tujuan:** kualitas, aksesibilitas, dan keamanan teruji sebelum dashboard dan pilot.

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md bagian 10, 13 dan kriteria rilis di bagian 15. Fase 0-7 sudah selesai.

Tugas: audit dan polesan menyeluruh (belum membangun dashboard).

1. Dark mode: telusuri semua halaman di mode gelap, perbaiki kontras dan komponen yang belum memakai token tema.
2. Aksesibilitas WCAG 2.1 AA: kontras (4.5:1 teks normal, 3:1 teks besar/tombol), focus ring terlihat, label form, urutan tab, status selalu memakai ikon + teks (tidak hanya warna). Jalankan axe (via Playwright @axe-core/playwright) pada halaman utama tiap role dan perbaiki temuan.
3. Responsif: periksa semua halaman di 360px, 768px, dan 1280px; tabel lebar harus bisa scroll horizontal atau berubah ke tampilan kartu di mobile.
4. State: tambahkan loading (Skeleton), empty state, dan error boundary (error.tsx, not-found.tsx) berbahasa Indonesia di semua rute; ganti semua teks Inggris yang tersisa.
5. Keamanan: audit ulang seluruh Server Action dan Route Handler (requireRole + zod di semua), pastikan tidak ada import service role ke client component, cek tidak ada kebocoran data di respons, dan tambahkan security headers di next.config.
6. Pengujian: lengkapi tes RLS (matriks lengkap 3 role x semua tabel), tes alur utama per role (Playwright), dan jalankan semuanya di CI (GitHub Actions: lint, type-check, vitest, playwright).
7. Buat laporan singkat docs/AUDIT.md: daftar temuan, yang diperbaiki, dan yang tersisa.

Jalankan semua tes dan tampilkan hasilnya.
```

**Kriteria selesai:** CI hijau, tes RLS dan tes alur per role lulus, tidak ada temuan axe tingkat serius.

---

## Fase 9 — Dashboard / Interface Akhir (Minggu 9–10)

**Tujuan:** halaman `/dashboard` yang sebenarnya (FR-10). Semua data dan fitur sudah ada, jadi dashboard tinggal merangkumnya dengan visual yang konsisten dengan tema Hijau–Oren.

**Yang dibangun**
- **Ketua:** progres penilaian periode berjalan (progress bar emerald), badge komentar belum dibaca (oren), daftar anggota yang belum dinilai, pintasan ke penilaian.
- **Admin dan super-admin:** KPI (jumlah departemen, anggota, persentase penilaian selesai, rata-rata skor), grafik batang rata-rata skor per departemen, grafik persentase penyelesaian per departemen, daftar departemen yang belum selesai atau perlu revisi (aksen oren), dan aktivitas terbaru.
- **Super-admin tambahan:** pintasan ke ekspor, periode, dan manajemen ketua.

**Prompt untuk Claude Code**

```text
Baca docs/PRD.md bagian 7 (FR-10), 8 (kategori skor), 9, dan 10.1 (tema Hijau & Oren, terutama bagian D). Semua fitur Fase 0-8 sudah selesai dan data nyata sudah ada.

Tugas: bangun interface /dashboard yang sesungguhnya untuk tiap role, menggantikan halaman kerangka.

Aturan umum: hanya komponen shadcn (Card, Badge, Progress, Tabs, Select, Skeleton, Table). Chart pakai Recharts dengan warna dari token --chart-1..4 (hijau emerald untuk skor/capaian, oren untuk yang belum selesai/perlu revisi). Mobile-first 360px, mendukung dark mode, kontras WCAG AA, dan jangan mengandalkan warna saja (sertakan ikon dan label teks, tooltip dan aria-label pada chart). Kartu KPI memakai garis atas gradien tipis emerald->oren (PRD 10.1.D). Semua data diambil di Server Component lewat query yang menghormati RLS; ringkasan dihitung di database (view atau RPC), bukan di client. Tambahkan selector periode (default periode open) di bagian atas.

1. Dashboard KETUA (role user):
   - Kartu progres periode berjalan: "X dari Y anggota sudah dinilai" dengan progress bar emerald (penuh emerald saat 100%).
   - Badge oren jumlah komentar SDM yang belum dibaca + tautan ke penilaian terkait.
   - Daftar anggota yang belum dinilai / berstatus Revision Requested dengan tombol aksi cepat ke /penilaian/[anggotaId].
   - Info periode: tanggal akhir, dan indikator oren bila tenggat mendekat (≤ 3 hari).
2. Dashboard ADMIN (SDM):
   - Baris KPI: total departemen aktif, total anggota, persentase penilaian selesai, rata-rata skor keseluruhan.
   - Grafik batang rata-rata skor per departemen (emerald), urut dari tertinggi.
   - Grafik persentase penyelesaian per departemen (emerald, segmen oren untuk bagian yang belum selesai).
   - Tabel/daftar "Perlu tindak lanjut": departemen yang belum selesai menilai dan penilaian berstatus Submitted yang menunggu review, dengan aksen oren dan tautan ke /rekap yang sudah terfilter.
   - Distribusi kategori skor (Sangat Baik ... Sangat Kurang) memakai warna badge PRD bagian 8.
3. Dashboard SUPER_ADMIN: semua yang ada di dashboard admin + pintasan ke /ekspor, /periode, /ketua, /departemen, serta ringkasan akun ketua nonaktif atau departemen tanpa ketua.
4. Buat komponen yang bisa dipakai ulang di src/components/dashboard/ (KpiCard, ProgressCard, DeptScoreChart, CompletionChart, AttentionList). Berikan Skeleton saat loading dan EmptyState saat belum ada data/periode.
5. Pastikan dashboard tampil ≤ 2 detik dengan data ±500 anggota dan skor Lighthouse mobile halaman utama ≥ 85; jalankan Lighthouse dan perbaiki bila di bawah target.
6. Tes: unit test fungsi agregasi, tes Playwright per role (tiap role hanya melihat widget miliknya, ketua hanya melihat angka departemennya sendiri), dan pemeriksaan axe pada /dashboard di light dan dark.

Setelah selesai, jalankan lint, type-check, semua tes, dan tampilkan ringkasan hasil serta skor Lighthouse.
```

**Kriteria selesai:** tiap role melihat dashboard yang sesuai, grafik memakai palet hijau–oren, angka cocok dengan halaman rekap, Lighthouse mobile ≥ 85.

---

## Fase 10 — Pilot dan Rilis (Minggu 10)

**Tujuan:** validasi di dunia nyata sebelum 14 departemen memakainya.

**Checklist (dikerjakan manual, dibantu Claude Code bila perlu)**
- [x] Keputusan kunci PRD bagian 14 terjawab: hak ekspor SDM (Ya), aturan edit setelah approved (turun ke Submitted), 7 aspek final bobot rata, dan impor massal anggota Excel/CSV (Ada).
- [ ] Tentukan frekuensi periode resmi (bulanan/semesteran/tahunan).
- [ ] Buat akun super-admin dan admin produksi; buat akun 14 ketua.
- [ ] Pilot di 2–3 departemen; kumpulkan masukan (terutama kemudahan di HP).
- [ ] Perbaiki masukan pilot; ulangi tes RLS di database produksi.
- [ ] Pastikan backup harian Supabase aktif dan env vars produksi di Vercel benar.
- [ ] Rilis ke 14 departemen; pantau hasil pada periode pertama terhadap metrik PRD bagian 2.

**Prompt untuk Claude Code (persiapan rilis)**

```text
Baca docs/PRD.md bagian 2, 14 dan 15. Semua fase pengembangan selesai.

Tugas: siapkan rilis produksi.

1. Buat docs/RILIS.md berisi checklist deploy: env vars produksi (tanpa nilai rahasia), urutan menjalankan migrasi, cara membuat akun super-admin pertama, dan prosedur rollback.
2. Buat skrip scripts/import-ketua.ts (service role, hanya dijalankan lokal) yang membuat 14 akun ketua dari file CSV (nama, email, departemen_kode) dan menetapkannya ke departemen; dukung mode --dry-run.
3. Buat panduan singkat berbahasa Indonesia untuk pengguna (docs/PANDUAN.md): satu bagian per role (ketua, SDM, pimpinan) dengan langkah-langkah utama.
4. Jalankan seluruh tes (unit, RLS, Playwright), Lighthouse, dan axe terhadap build produksi, lalu rangkum hasilnya terhadap "Kriteria rilis" PRD bagian 15 dalam tabel lulus/tidak lulus.
```

---

## Catatan Tambahan

- **Dashboard di akhir:** sampai Fase 8, `/dashboard` hanya halaman kerangka agar alur login tetap utuh. Semua data yang dipakai dashboard sudah ada di Fase 3–6, sehingga Fase 9 murni pekerjaan interface.
- **Jika satu prompt terlalu besar:** pecah per nomor (mis. kerjakan poin 1–2 dulu, uji, lalu poin 3–4). Claude Code bekerja lebih akurat pada tugas yang fokus.
- **Keputusan kode yang sudah final:** hak ekspor SDM aktif, 7 aspek berbobot rata, alur ubah setelah approve kembali ke submitted, dan impor massal anggota masuk ke Fase 4.
- **Jangan lewati tes RLS.** Metrik keberhasilan paling kritis di PRD adalah 0 kebocoran data lintas departemen.