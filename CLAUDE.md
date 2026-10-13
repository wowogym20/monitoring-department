# Aturan Proyek: Monitoring Departemen

Dokumen ini berisi pedoman dan aturan baku untuk pengembangan proyek **Monitoring Departemen**.

---

## 1. Bahasa Antarmuka
- Seluruh antarmuka pengguna (UI), teks tombol, pesan error, label form, notifikasi toast, dan status wajib menggunakan **Bahasa Indonesia**.

## 2. Standar Komponen UI
- Seluruh antarmuka pengguna **wajib** menggunakan komponen **shadcn/ui** (Button, Input, Form, Card, Badge, Table, Dialog, Sheet, Select, Tabs, DropdownMenu, Avatar, Separator, Skeleton, Sonner, RadioGroup, Textarea, Progress, Calendar, Command, Popover, Checkbox, Switch).
- Komponen custom **hanya boleh** dibuat sebagai komposisi dari primitif **shadcn / Radix UI**. Dilarang membuat elemen custom mentah yang mengabaikan sistem tema.
- Tema warna utama: **Hijau Emerald** (Primary) dan **Oren Amber** (Secondary / Accent) sesuai PRD bagian 10.1.

## 3. Validasi Data
- Validasi skema wajib menggunakan **Zod** secara konsisten di dua sisi:
  - **Client-side**: Terintegrasi via `react-hook-form` dan `@hookform/resolvers/zod`.
  - **Server-side**: Validasi ulang di setiap Server Action dan Route Handler sebelum query ke database.

## 4. Keamanan & Otorisasi Berlapis
- Otorisasi wajib diterapkan secara berlapis pada 3 tingkatan:
  1. **Middleware**: Proteksi rute navigasi dan penyegaran sesi Supabase cookie.
  2. **Server Actions / Route Handlers**: Verifikasi role (`super_admin`, `admin`, `user`) dari tabel `profiles` sebelum eksekusi mutasi.
  3. **Row-Level Security (RLS)**: Pembatasan data level database PostgreSQL Supabase.
- **Prinsip Utama:** Tidak boleh menyembunyikan akses hanya lewat UI (security through obscurity dilarang). Seluruh endpoint/data harus terkunci di level server dan RLS.
- **Service Role Key:** Kunci `SUPABASE_SERVICE_ROLE_KEY` bersifat sangat rahasia dan **HANYA** boleh dipakai di server (`createAdminClient`). Kunci ini **TIDAK PERNAH** boleh dikirimkan atau diekspos ke client-side browser.

## 5. Lokalisasi, Format Tanggal, & Waktu
- Zona waktu resmi aplikasi: **Asia/Jakarta** (WIB).
- Format tampilan tanggal: **`dd MMM yyyy`** (misalnya: `13 Okt 2026`), menggunakan `date-fns` dengan locale `id`.

## 6. Responsivitas & Tampilan Mobile
- Pendekatan desain: **Mobile-first**.
- Ketua departemen sering mengakses dan mengisi penilaian langsung dari smartphone. Seluruh form dan tabel harus nyaman dan responsif mulai dari lebar layar HP **360px**.

## 7. Quality Gate & Verifikasi Kode
- Sebelum menyatakan suatu tugas atau fitur selesai, wajib menjalankan:
  ```bash
  npm run lint && npx tsc --noEmit
  ```
  Pastikan kedua perintah tersebut keluar tanpa error (`exit code 0`).
