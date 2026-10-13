# Monitoring Departemen

Web app internal untuk standarisasi penilaian anggota departemen dengan skala Likert 1–5 oleh ketua departemen, serta pemantauan, rekapitulasi, dan ekspor kinerja oleh pimpinan dan SDM.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript Strict Mode
- **Styling & UI:** Tailwind CSS 4 + shadcn/ui (Radix Primitives)
- **Tema Visual:** Hijau Emerald (`--primary`) & Oren Amber (`--secondary`)
- **Backend / Database:** Supabase (PostgreSQL, Auth, RLS)
- **Testing:** Vitest & Playwright

---

## Persiapan Lingkungan & Database

### 1. Salin File Environment
Salin template konfigurasi environment:
```bash
cp .env.example .env.local
```
Lengkapi nilai variabel di `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: URL proyek Supabase Anda.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci anon/public Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Kunci rahasia server (HANYA digunakan di server).

---

### 2. Menjalankan Migrasi Database

File migrasi database Supabase tersimpan di folder `supabase/migrations/`:
- [`supabase/migrations/20261013000001_initial_schema.sql`](supabase/migrations/20261013000001_initial_schema.sql)
- [`supabase/seed.sql`](supabase/seed.sql)

#### Opsi A: Lewat Supabase Dashboard (Cloud)
1. Buka project Anda di [Supabase Dashboard](https://supabase.com/dashboard).
2. Masuk ke menu **SQL Editor**.
3. Buat query baru, salin isi dari `supabase/migrations/20261013000001_initial_schema.sql`, lalu klik **Run**.
4. Buat query baru lagi, salin isi dari `supabase/seed.sql` (untuk memuat 14 departemen, 7 aspek penilaian, dan 1 periode open), lalu klik **Run**.

#### Opsi B: Lewat Supabase CLI (Lokal / Linked Project)
Jika menggunakan Supabase CLI:
```bash
# Untuk proyek lokal:
npx supabase db reset

# Untuk proyek cloud yang terhubung (linked):
npx supabase db push
```

---

### 3. Generate Ulang Tipe TypeScript Database

Jika ada perubahan skema database di kemudian hari, perbarui file [`src/types/database.ts`](src/types/database.ts) menggunakan perintah:
```bash
# Menggunakan Supabase CLI lokal:
npx supabase gen types typescript --local > src/types/database.ts

# Atau dari project Supabase cloud:
npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
```

---

## Verifikasi & Pengujian

Jalankan seluruh pemeriksaan kualitas dan pengujian RLS otomatis:

```bash
# 1. Type-checking TypeScript
npx tsc --noEmit

# 2. Linter ESLint
npm run lint

# 3. Unit test & RLS test suite
npm test

# 4. Build produksi Next.js
npm run build
```

---

## Menjalankan Server Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat halaman pengujian tema dan status penilaian.
