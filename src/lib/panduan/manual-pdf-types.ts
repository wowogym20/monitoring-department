export type ManualRole = "all" | "user" | "admin" | "super_admin"

export interface ManualMetadata {
  role: ManualRole
  title: string
  subtitle: string
  targetAudience: string
  version: string
  institution: string
  filename: string
}

export const MANUAL_CONFIGS: Record<ManualRole, ManualMetadata> = {
  all: {
    role: "all",
    title: "Buku Panduan Komprehensif Sistem",
    subtitle: "Sistem Monitoring & Evaluasi Kinerja Departemen Pondok Modern Tazakka",
    targetAudience: "Seluruh Pengguna (Ketua Departemen, Admin SDM, Pimpinan Lembaga)",
    version: "1.0.0 (Produksi)",
    institution: "Pondok Modern Tazakka — Lembaga & Pengembangan TI",
    filename: "Buku-Panduan-Lengkap-Monitoring-Departemen-Tazakka.pdf",
  },
  user: {
    role: "user",
    title: "Buku Panduan: Ketua Departemen",
    subtitle: "Pedoman Pendataan Anggota & Evaluasi Kinerja 7 Aspek Terstandar",
    targetAudience: "Kepala Departemen (User)",
    version: "1.0.0 (Produksi)",
    institution: "Pondok Modern Tazakka — Bidang Sumber Daya Manusia",
    filename: "Buku-Panduan-Kepala-Departemen-Tazakka.pdf",
  },
  admin: {
    role: "admin",
    title: "Buku Panduan: Admin Koordinator",
    subtitle: "Pedoman Monitoring 14 Departemen, Impor Massal, Verifikasi & Ekspor",
    targetAudience: "Admin / Koordinator",
    version: "1.0.0 (Produksi)",
    institution: "Pondok Modern Tazakka — Bidang Sumber Daya Manusia & Personalia",
    filename: "Buku-Panduan-Admin-Koordinator-Tazakka.pdf",
  },
  super_admin: {
    role: "super_admin",
    title: "Buku Panduan: Pimpinan / Super-Admin",
    subtitle: "Pedoman Tata Kelola Kelembagaan, Rotasi Amanah, Master Periode & Audit",
    targetAudience: "Pimpinan Pondok / Super-Admin",
    version: "1.0.0 (Produksi)",
    institution: "Pondok Modern Tazakka — Pimpinan & Dewan Kelembagaan",
    filename: "Buku-Panduan-SuperAdmin-Pimpinan-Tazakka.pdf",
  },
}
