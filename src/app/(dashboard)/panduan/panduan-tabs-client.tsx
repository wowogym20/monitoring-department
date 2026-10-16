"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import {
  BookOpen,
  Layers,
  GitBranch,
  HelpCircle,
  FileDown,
  Download,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Users,
  ClipboardCheck,
  BarChart3,
  Calendar,
  Lock,
  Server,
  Code2,
  Cpu,
  Info,
  AlertTriangle,
  FileText,
  BadgeCheck,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ManualRole, MANUAL_CONFIGS } from "@/lib/panduan/manual-pdf-types"
import { cn } from "@/lib/utils"

// 14 Departemen Resmi Pondok Modern Tazakka
const DEPARTEMEN_LIST = [
  { kode: "LITBANG_GURU", nama: "Departemen Penelitian dan Pengembangan Akademik" },
  { kode: "DEPDIKJAR", nama: "Departemen Pendidikan dan Pengajaran" },
  { kode: "PUSAT_DATA", nama: "Departemen Pusat Data & Statistik" },
  { kode: "PENGASUHAN_SANTRI", nama: "Departemen Pengasuhan Santri" },
  { kode: "LAZIS", nama: "Departemen Lazis Tazakka" },
  { kode: "WAKAF", nama: "Departemen Wakaf Tazakka" },
  { kode: "AMAL_USAHA", nama: "Departemen Pengembangan Amal Usaha" },
  { kode: "TI", nama: "Departemen Pengembangan TI" },
  { kode: "SDM", nama: "Departemen SDM" },
  { kode: "SEKPIM", nama: "Departemen Kesekretariatan" },
  { kode: "KEUANGAN", nama: "Departemen Keuangan" },
  { kode: "HUMAS", nama: "Departemen Kehumasan" },
  { kode: "PERGURUAN_TINGGI", nama: "Departemen Pengembangan Perguruan Tinggi" },
  { kode: "DPU", nama: "Departemen Pekerjaan Umum" },
  { kode: "IKAT", nama: "IKAT" },
]

// 7 Aspek Penilaian Terstandar
const ASPEK_PENILAIAN = [
  { nama: "Kinerja Kerja", bobot: "15%", deskripsi: "Ketuntasan amanah, mutu hasil kerja, dan kecepatan penyelesaian tugas.", badge: "Prioritas" },
  { nama: "Kerajinan", bobot: "15%", deskripsi: "Kedisiplinan jam kerja, ketepatan jadwal piket, dan konsistensi kehadiran.", badge: "Disiplin" },
  { nama: "Ibadah", bobot: "15%", deskripsi: "Komitmen shalat berjamaah di masjid, tilawah, dan rutinitas ruhiyah harian.", badge: "Spiritual" },
  { nama: "Kebersihan", bobot: "15%", deskripsi: "Kerapian personal, kebersihan meja kerja, kantor, dan kepedulian lingkungan.", badge: "Adab" },
  { nama: "Kerja Sama Tim", bobot: "15%", deskripsi: "Kolaborasi antar rekan sejawat, komunikasi santun, dan gotong royong.", badge: "Relasi" },
  { nama: "Inisiatif & Tanggung Jawab", bobot: "15%", deskripsi: "Kemampuan mencari jalan keluar atas kendala kerja dan loyalitas amanah.", badge: "Proaktif" },
  { nama: "Akhlak & Adab", bobot: "10%", deskripsi: "Keteladanan sikap sopan santun terhadap pimpinan, rekan guru, santri, dan tamu.", badge: "Karakter" },
]

// Tech Stack Showcase
const TECH_STACK_DATA = [
  {
    kategori: "Frontend Core",
    icon: Code2,
    items: [
      { nama: "Next.js 16.4 (App Router)", deskripsi: "Framework React modern dengan Server Components, Route Handlers, dan performa tinggi." },
      { nama: "React 19.3", deskripsi: "Library antarmuka generasi terbaru dengan React Compiler dan hooks mutakhir." },
      { nama: "TypeScript 5", deskripsi: "Tipis ketat (*strict static typing*) untuk meminimalkan bug di runtime." },
      { nama: "Tailwind CSS v4", deskripsi: "Framework utility CSS mutakhir dengan arsitektur tema dinamis dan performa build kilat." },
    ],
  },
  {
    kategori: "Antarmuka & Komponen UI",
    icon: Layers,
    items: [
      { nama: "shadcn/ui & Radix UI", deskripsi: "Komponen aksesibel terstandar tanpa kompromi fleksibilitas (Dialog, Sheet, Tabs, Table)." },
      { nama: "Tema Emerald & Amber", deskripsi: "Palet warna resmi hijau islami (Emerald) dan oranye hangat (Warm Amber)." },
      { nama: "Lucide React", deskripsi: "Ikonografi bersih, ringan, dan konsisten di seluruh antarmuka." },
      { nama: "Sonner Toast & Next-Themes", deskripsi: "Umpan balik notifikasi interaktif serta dukungan mode Gelap/Terang (Dark/Light Mode)." },
    ],
  },
  {
    kategori: "Database & Keamanan",
    icon: Server,
    items: [
      { nama: "Supabase (PostgreSQL 15+)", deskripsi: "Database relasional enterprise dengan performa indeks tinggi dan integritas ACID." },
      { nama: "Row-Level Security (RLS)", deskripsi: "Isolasi data ketat level database; ketua departemen tidak bisa membocorkan/mengintip departemen lain." },
      { nama: "Supabase SSR Auth", deskripsi: "Manajemen sesi aman berbasis cookie HTTP-Only terenkripsi dengan proteksi CSRF." },
      { nama: "Service Role Key Guard", deskripsi: "Kunci master server terisolasi hanya di server-side (`createAdminClient`)." },
    ],
  },
  {
    kategori: "Data State & Dokumen Laporan",
    icon: Cpu,
    items: [
      { nama: "@react-pdf/renderer v4", deskripsi: "Generator dokumen PDF vektor berkualitas cetak tinggi dengan kop resmi lembaga." },
      { nama: "ExcelJS v4", deskripsi: "Penyusunan berkas spreadsheet .xlsx lengkap dengan formula, tata warna, dan rekap otomatis." },
      { nama: "TanStack Table v8 & Query v5", deskripsi: "Manajemen data tabel kompleks (sortir, filter, paginasi) dan caching cerdas." },
      { nama: "Zod Schema Validation", deskripsi: "Validasi data ganda di sisi form peramban dan Server Actions/API endpoint." },
    ],
  },
]

export function PanduanTabsClient() {
  const [downloadingRole, setDownloadingRole] = useState<ManualRole | null>(null)

  // Handler unduh dokumen PDF buku panduan
  const handleDownload = async (role: ManualRole) => {
    const config = MANUAL_CONFIGS[role]

    try {
      setDownloadingRole(role)
      toast.info(`Menyiapkan ${config.title}...`, {
        description: "Dokumen PDF sedang di-generate oleh sistem server.",
      })

      const response = await fetch(`/api/panduan/download?role=${role}`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Gagal mengunduh berkas PDF.")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = config.filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`${config.title} berhasil diunduh!`, {
        description: "Berkas PDF siap dicetak atau dibagikan.",
      })
    } catch (error: unknown) {
      console.error("Kesalahan unduh buku panduan:", error)
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan."
      toast.error(`Gagal mengunduh: ${msg}`)
    } finally {
      setDownloadingRole(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="overview" className="w-full space-y-6">
        {/* Tab Navigation List: Responsif di semua ukuran layar (Mobile scroll horizontal, Desktop rapi) */}
        <div className="w-full overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="inline-flex min-w-full sm:min-w-fit items-center gap-1.5 p-1 bg-muted/80 backdrop-blur-xs rounded-xl border border-border/80 shadow-2xs">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Info className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Tentang Proyek</span>
            </TabsTrigger>

            <TabsTrigger
              value="tech-stack"
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Cpu className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Arsitektur & Teknologi</span>
            </TabsTrigger>

            <TabsTrigger
              value="workflow"
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <GitBranch className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Alur & Proses Sistem</span>
            </TabsTrigger>

            <TabsTrigger
              value="guide"
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <HelpCircle className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Cara Penggunaan</span>
            </TabsTrigger>

            <TabsTrigger
              value="pdf-manuals"
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all shrink-0 bg-primary/10 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-2xs"
            >
              <FileDown className="size-4 shrink-0" />
              <span>Buku Panduan PDF</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-1 hidden sm:inline-flex">
                Download
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: TENTANG PROYEK (OVERVIEW)                                           */}
        {/* ========================================================================= */}
        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
          {/* Hero Banner Latar Belakang */}
          <Card className="border-emerald-500/20 bg-linear-to-br from-emerald-50/50 via-background to-background dark:from-emerald-950/20 dark:via-background dark:to-background overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs">
                  Sistem Resmi Kelembagaan
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Pondok Modern Tazakka
                </Badge>
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
                Sistem Monitoring & Evaluasi Kinerja 14 Departemen
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
                Aplikasi internal berbasis web yang memungkinkan para Kepala Departemen menilai anggotanya secara terstandar menggunakan skala Likert 1–5, serta memberikan Pimpinan dan Bagian Koordinator gambaran kinerja kelembagaan yang transparan, terukur, dan siap ekspor.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-border bg-card/60">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm">
                    <Building2 className="size-4 shrink-0" />
                    <span>15 Departemen</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cakupan seluruh Departemen Pondok Modern Tazakka.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card/60">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm">
                    <ClipboardCheck className="size-4 shrink-0" />
                    <span>7 Aspek Terstandar</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rubrik evaluasi terukur: Kinerja, Kerajinan, Ibadah, Kebersihan, Tim, Inisiatif, Adab.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card/60">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm">
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>Isolasi & Privasi Data</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kadep hanya dapat mengakses departemennya; anggota tidak memiliki akses login.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latar Belakang & Urgensi Transformasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-foreground">
                <AlertTriangle className="size-5 text-amber-500 shrink-0" />
                <h3>Kondisi Sebelumnya (Kendala)</h3>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>Formulir evaluasi tersebar di berbagai format manual kertas atau spreadsheet tanpa standar baku.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>Bagian Koordinator membutuhkan waktu berhari-hari untuk merekap ratusan data staf dan guru.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>Pimpinan kesulitan membandingkan performa rata-rata antar departemen secara objektif.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">•</span>
                  <span>Ketiadaan jejak riwayat revisi dan catatan umpan balik yang terpusat.</span>
                </li>
              </ul>
            </Card>

            <Card className="p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-foreground">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3>Solusi dengan Sistem Monitoring</h3>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Penilaian seragam dengan 7 aspek baku skala Likert 1–5 berpenjelasan rubrik konkrit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Waktu rekapitulasi Koordinator dipersingkat dari hitungan hari menjadi hitungan menit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Dashboard eksekutif real-time dengan diagram radar komparasi 15 departemen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Kolom diskusi interaktif, status approval berlapis, dan jejak audit permanen.</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Daftar 14 Departemen Resmi */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Building2 className="size-5 text-primary shrink-0" />
                Daftar 15 Departemen Resmi Lembaga
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Setiap departemen diketuai oleh satu personel yang bertanggung jawab mengelola dan mengevaluasi anggotanya.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DEPARTEMEN_LIST.map((dept) => (
                  <div
                    key={dept.kode}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/80 bg-muted/30 hover:bg-muted/60 transition-colors"
                  >
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
                      {dept.kode}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                      {dept.nama}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: ARSITEKTUR & TEKNOLOGI (TECH STACK)                                  */}
        {/* ========================================================================= */}
        <TabsContent value="tech-stack" className="space-y-6 focus-visible:outline-none">
          {/* Header Card */}
          <Card className="border-border">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs sm:text-sm">
                <Cpu className="size-4 shrink-0" />
                <span>Modern Web Architecture</span>
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold text-foreground">
                Fondasi Teknologi & Standar Rekayasa Perangkat Lunak
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Aplikasi ini dibangun menggunakan arsitektur modern full-stack TypeScript dengan Next.js App Router dan Supabase PostgreSQL, mengedepankan keamanan berlapis, performa responsif, dan kemudahan pemeliharaan jangka panjang.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Grid Kategori Tech Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {TECH_STACK_DATA.map((cat, idx) => {
              const Icon = cat.icon
              return (
                <Card key={idx} className="flex flex-col">
                  <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-muted/20 flex flex-row items-center gap-2.5 space-y-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                      {cat.kategori}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 space-y-3.5 flex-1">
                    {cat.items.map((item, iIdx) => (
                      <div key={iIdx} className="space-y-0.5">
                        <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{item.nama}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-3.5 leading-relaxed">
                          {item.deskripsi}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Arsitektur Keamanan 3 Lapis (Security Model) */}
          <Card className="border-emerald-500/30 overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-3 bg-emerald-500/5">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Arsitektur Keamanan 3 Lapis (3-Tier Access Control)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Sistem tidak hanya menyembunyikan tombol di antarmuka (dilarang *security through obscurity*), melainkan menerapkan penguncian ketat di seluruh tingkatan stack:
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Lapisan 1: Edge / Network
                  </Badge>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">Next.js Middleware</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pencegatan rute URL sebelum halaman dirender. Memvalidasi token sesi Supabase dan memblokir pengguna non-otoritas langsung di gerbang rute navigasi.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Lapisan 2: Aplikasi
                  </Badge>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">Server Actions & API</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Setiap mutasi data divalidasi ulang dengan Zod dan fungsi `requireRole()`. Identitas aktor dicatat ke audit log untuk setiap perubahan nilai.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Lapisan 3: Database
                  </Badge>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">PostgreSQL RLS</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Kebijakan Row-Level Security di level basis data memastikan akun Ketua Departemen secara fisik tidak bisa membaca baris anggota departemen lain.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: ALUR & PROSES SISTEM (WORKFLOW)                                     */}
        {/* ========================================================================= */}
        <TabsContent value="workflow" className="space-y-6 focus-visible:outline-none">
          {/* Header Alur */}
          <Card className="border-border">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm">
                <GitBranch className="size-4 shrink-0" />
                <span>Business Process Lifecycle</span>
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold text-foreground">
                Alur Kerja Evaluasi Kinerja & Siklus Penilaian
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Gambaran komprehensif alur kerja dari tahap inisiasi kalender penilaian, pendataan guru, evaluasi Likert, verifikasi approval, hingga pembekuan data dan ekspor laporan.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* 7 Langkah Alur Sistem */}
          <div className="space-y-3">
            {[
              {
                step: "01",
                title: "Inisialisasi Periode & Aspek Penilaian",
                actor: "Super Admin / Koordinator",
                desc: "Super Admin atau Koordinator membuka periode penilaian baru (misal: Semester Ganjil 2026/2027), menetapkan batas tanggal evaluasi, serta memastikan 7 aspek terstandar aktif.",
                icon: Calendar,
                badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
              },
              {
                step: "02",
                title: "Pendataan Anggota Departemen",
                actor: "Kepala Departemen & Koordinator",
                desc: "Ketua mendata anggota tim di departemennya. Koordinator juga dapat mempercepat proses dengan mengimpor ratusan data guru sekaligus melalui berkas Excel/CSV.",
                icon: Users,
                badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
              },
              {
                step: "03",
                title: "Pengisian Lembar Penilaian (Skala Likert 1–5)",
                actor: "Kepala Departemen (User)",
                desc: "Ketua mengisi skor 1–5 pada 7 aspek dan memberikan 3 catatan komentar (evaluasi, proker, hasil usaha). Nilai dapat disimpan sebagai Draf (Draft) atau langsung dikirimkan ke Koordinator (Submit).",
                icon: ClipboardCheck,
                badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
              },
              {
                step: "04",
                title: "Verifikasi, Umpan Balik, & Approval",
                actor: "Koordinator (Admin)",
                desc: "Koordinator memantau kelengkapan rekap 15 departemen. Koordinator dapat Menyetujui (Approve) penilaian atau Meminta Revisi (Revision Requested) dengan menyertakan catatan kinerja kerja.",
                icon: BadgeCheck,
                badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
              },
              {
                step: "05",
                title: "Mekanisme Auto-Resubmit (Integritas Data)",
                actor: "Sistem Otomatis",
                desc: "Jika seorang Kadep mengoreksi nilai yang sebelumnya telah Disetujui (Approved), sistem secara otomatis mengembalikan status menjadi Submitted agar diverifikasi ulang oleh Koordinator.",
                icon: AlertTriangle,
                badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
              },
              {
                step: "06",
                title: "Rekapitulasi Lembaga & Ekspor Laporan",
                actor: "Super Admin & Koordinator",
                desc: "Koordinator memantau komparasi radar 15 departemen di dashboard. Laporan resmi dapat diunduh kapan saja dalam format Excel multi-sheet (.xlsx) atau dokumen cetak PDF (.pdf).",
                icon: BarChart3,
                badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
              },
              {
                step: "07",
                title: "Jejak Audit Permanen & Penutupan Periode",
                actor: "Koodinator / Super-Admin",
                desc: "Seluruh riwayat perubahan nilai terekam di audit trail log. Koordinator mengunci periode menjadi Closed sehingga seluruh nilai membeku dan menjadi arsip historis resmi.",
                icon: Lock,
                badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
              },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <Card key={idx} className="p-4 sm:p-5 hover:border-primary/50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                        {item.step}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        <Icon className="size-4 text-primary shrink-0" />
                        <span>{item.title}</span>
                      </h4>
                    </div>
                    <Badge variant="outline" className={cn("text-[11px] font-medium shrink-0", item.badgeColor)}>
                      {item.actor}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground pl-0 sm:pl-10 leading-relaxed">
                    {item.desc}
                  </p>
                </Card>
              )
            })}
          </div>

          {/* Tabel Aspek Penilaian */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <ClipboardCheck className="size-5 text-primary shrink-0" />
                Rincian 7 Aspek Rubrik Penilaian Terstandar
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                Setiap aspek dievaluasi dalam skala 1 (Sangat Kurang), 2 (Kurang), 3 (Cukup), 4 (Baik), hingga 5 (Sangat Baik).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Nama Aspek</th>
                      <th className="py-2.5 px-3">Bobot</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Indikator Deskriptif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ASPEK_PENILAIAN.map((asp, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                          {asp.nama}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          {asp.bobot}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="secondary" className="text-[10px]">
                            {asp.badge}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {asp.deskripsi}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: CARA PENGGUNAAN (USER GUIDE PER MODUL)                               */}
        {/* ========================================================================= */}
        <TabsContent value="guide" className="space-y-6 focus-visible:outline-none">
          <Card className="border-border">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm">
                <HelpCircle className="size-4 shrink-0" />
                <span>Petunjuk Operasional Per Modul</span>
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold text-foreground">
                Panduan Pengoperasian Fitur Utama Aplikasi
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Panduan praktis langkah demi langkah untuk menavigasi dan mengoperasikan setiap menu aplikasi dari perangkat desktop maupun smartphone.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Panduan Modul Anggota */}
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-foreground">
                <Users className="size-4 text-primary shrink-0" />
                <h4>1. Modul Data Anggota (/anggota)</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tempat mengelola seluruh personel di bawah naungan departemen.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pl-4 list-disc">
                <li><strong className="text-foreground">Tambah Anggota:</strong> Klik tombol Tambah Anggota, isi Nama, NIG/ID, Jabatan, dan Kontak.</li>
                <li><strong className="text-foreground">Filter & Pencarian:</strong> Cari anggota dengan cepat lewat kolom pencarian nama/NIG.</li>
                <li><strong className="text-foreground">Nonaktifkan Anggota:</strong> Gunakan opsi nonaktif untuk mutasi tanpa menghapus histori nilai lampau.</li>
              </ul>
            </Card>

            {/* Panduan Modul Penilaian */}
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-foreground">
                <ClipboardCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h4>2. Modul Penilaian (/penilaian)</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lembar evaluasi Likert 1–5 untuk menilai 7 dimensi kualitas anggota.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pl-4 list-disc">
                <li><strong className="text-foreground">Simpan Draf:</strong> Nilai sementara tersimpan di sistem, belum diajukan ke Koordinator.</li>
                <li><strong className="text-foreground">Submit Penilaian:</strong> Skor otomatis dikalkulasi dan status berubah ke Submitted.</li>
                <li><strong className="text-foreground">Catatan Khusus:</strong> Tambahkan apresiasi atau rekomendasi pembinaan personal.</li>
              </ul>
            </Card>

            {/* Panduan Modul Rekap & Diskusi */}
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-foreground">
                <BarChart3 className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <h4>3. Modul Rekapitulasi & Approval (/rekap)</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pusat verifikasi Koordinator dan pemantauan kelengkapan pengisian nilai.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pl-4 list-disc">
                <li><strong className="text-foreground">Tindakan Setujui:</strong> Mengubah status menjadi Approved jika nilai telah objektif.</li>
                <li><strong className="text-foreground">Minta Revisi:</strong> Mengembalikan lembar nilai ke Kepala Departemen dengan status Revision Requested.</li>
                <li><strong className="text-foreground">Fitur Diskusi:</strong> Kolom komentar dua arah antara Koordinator dan Kepala Departemen.</li>
              </ul>
            </Card>

            {/* Panduan Modul Ekspor */}
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-foreground">
                <FileText className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h4>4. Modul Ekspor Laporan (/ekspor)</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Penerbitan rekapitulasi resmi dalam format lembar kerja dan dokumen cetak.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 pl-4 list-disc">
                <li><strong className="text-foreground">Unduh Excel (.xlsx):</strong> Berkas multi-sheet dengan rincian aspek, formula, dan status.</li>
                <li><strong className="text-foreground">Unduh PDF (.pdf):</strong> Laporan cetak resmi bertanda tangan digital siap arsip pimpinan.</li>
                <li><strong className="text-foreground">Filter Lingkup:</strong> Pilih ekspor seluruh 15 departemen atau departemen spesifik.</li>
              </ul>
            </Card>

            {/* Panduan Tata Kelola Super Admin */}
            <Card className="p-4 sm:p-5 space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-foreground">
                <ShieldCheck className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <h4>5. Tata Kelola Khusus Super Admin (Departemen, Kadep, Periode)</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground pt-1">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/80">
                  <span className="font-semibold text-foreground block mb-1">Rotasi Kadep (Kadep)</span>
                  Menetapkan akun Kadep baru untuk departemen tertentu tanpa menghapus data penilaian lama.
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/80">
                  <span className="font-semibold text-foreground block mb-1">Kalender Periode (Periode)</span>
                  Membuka masa evaluasi baru atau menutup (Closed) periode agar data nilai terkunci paten.
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/80">
                  <span className="font-semibold text-foreground block mb-1">Audit Trail Log</span>
                  Mengawasi setiap aktivitas mutasi nilai, nama aktor pengubah, dan waktu kejadian secara presisi.
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: BUKU PANDUAN PDF SIAP DOWNLOAD (ROLE-BASED MANUALS)                 */}
        {/* ========================================================================= */}
        <TabsContent value="pdf-manuals" className="space-y-6 focus-visible:outline-none">
          {/* Header Download */}
          <Card className="border-emerald-500/30 bg-linear-to-r from-emerald-500/10 via-background to-amber-500/10">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs sm:text-sm">
                <FileDown className="size-4 shrink-0" />
                <span>Dokumen Resmi Siap Unduh</span>
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold text-foreground">
                Buku Panduan Penggunaan Sistem (PDF User Manual)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Dokumen buku panduan operasional resmi berkop Pondok Modern Tazakka, diformat khusus dalam ukuran A4 siap cetak atau dibagikan kepada masing-masing peran pemangku kepentingan.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Grid 4 Kartu Buku Panduan per Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* 1. Buku Panduan Lengkap (Semua Role) */}
            <Card className="flex flex-col border-emerald-500/40 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 sm:p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]">
                    Master Edition
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">± 150 KB</span>
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Buku Panduan Lengkap (Semua Role)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Dokumen komprehensif memuat seluruh latar belakang, SOP operasional ketiga peran (Kadep, Koordinator, Pimpinan), rubrik 7 aspek, dan panduan teknis FAQ.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 mt-auto">
                <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1 mb-4">
                  <p><strong className="text-foreground">Peruntukan:</strong> Pimpinan Lembaga, Arsip Koordinator, Tim TI</p>
                  <p><strong className="text-foreground">Format:</strong> PDF Resmi A4 Berkop Tazakka</p>
                </div>
                <Button
                  onClick={() => handleDownload("all")}
                  disabled={downloadingRole !== null}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {downloadingRole === "all" ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Membuat PDF...
                    </>
                  ) : (
                    <>
                      <Download className="size-4 mr-2" />
                      Unduh Buku Panduan Lengkap (.pdf)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 2. Buku Panduan Ketua Departemen (User) */}
            <Card className="flex flex-col border-blue-500/40 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 sm:p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="border-blue-500/60 text-blue-600 dark:text-blue-400 text-[11px]">
                    Role: Kepala Departemen
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">± 85 KB</span>
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  Buku Panduan: Kepala Departemen
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Petunjuk praktis bagi 15 Kepala Departemen: cara input anggota tim, pengisian evaluasi Likert 1–5, simpan draf, submit nilai, respon revisi Koordinator, dan aturan auto-resubmit.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 mt-auto">
                <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1 mb-4">
                  <p><strong className="text-foreground">Peruntukan:</strong> 15 Kepala Departemen Operasional</p>
                  <p><strong className="text-foreground">Format:</strong> PDF Ringkas & Terarah untuk Smartphone/Desktop</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleDownload("user")}
                  disabled={downloadingRole !== null}
                  className="w-full border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer"
                >
                  {downloadingRole === "user" ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Membuat PDF...
                    </>
                  ) : (
                    <>
                      <Download className="size-4 mr-2" />
                      Unduh Panduan Kedep (.pdf)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 3. Buku Panduan Admin SDM (Admin) */}
            <Card className="flex flex-col border-amber-500/40 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 sm:p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="border-amber-500/60 text-amber-600 dark:text-amber-400 text-[11px]">
                    Role: Koordinator
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">± 90 KB</span>
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <ClipboardCheck className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  Buku Panduan: Koordinator
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Petunjuk operasional verifikasi 15 departemen, impor data massal ratusan guru lewat Excel, approval lembar nilai, pemberian umpan balik, dan ekspor laporan resmi.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 mt-auto">
                <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1 mb-4">
                  <p><strong className="text-foreground">Peruntukan:</strong> Pengelola Koordinator, Bagian Personalia, Tata Usaha</p>
                  <p><strong className="text-foreground">Format:</strong> PDF Lengkap Operasional Verifikasi</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleDownload("admin")}
                  disabled={downloadingRole !== null}
                  className="w-full border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold cursor-pointer"
                >
                  {downloadingRole === "admin" ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Membuat PDF...
                    </>
                  ) : (
                    <>
                      <Download className="size-4 mr-2" />
                      Unduh Panduan Koordinator (.pdf)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 4. Buku Panduan Pimpinan / Super-Admin */}
            <Card className="flex flex-col border-purple-500/40 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 sm:p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="border-purple-500/60 text-purple-600 dark:text-purple-400 text-[11px]">
                    Role: Pimpinan / Super-Admin
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">± 95 KB</span>
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  Buku Panduan: Pimpinan / Super-Admin
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Petunjuk eksekutif pimpinan: tata kelola 15 departemen, rotasi amanah Kadep, kalender pembukaan & penguncian periode, kustomisasi aspek, dan pengawasan jejak audit log.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 mt-auto">
                <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1 mb-4">
                  <p><strong className="text-foreground">Peruntukan:</strong> Pimpinan Pondok dan Super Admin</p>
                  <p><strong className="text-foreground">Format:</strong> PDF Tata Kelola Kelembagaan Eksekutif</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleDownload("super_admin")}
                  disabled={downloadingRole !== null}
                  className="w-full border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold cursor-pointer"
                >
                  {downloadingRole === "super_admin" ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Membuat PDF...
                    </>
                  ) : (
                    <>
                      <Download className="size-4 mr-2" />
                      Unduh Panduan Super-Admin (.pdf)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
