import { Metadata } from "next"
import { requireRole } from "@/lib/auth"
import { BookOpen, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PanduanTabsClient } from "./panduan-tabs-client"

export const metadata: Metadata = {
  title: "Buku Panduan & Dokumentasi Sistem | Monitoring Departemen",
  description:
    "Pusat dokumentasi sistem, arsitektur teknologi, alur proses bisnis, dan buku panduan PDF siap unduh untuk seluruh peran.",
}

export default async function PanduanPage() {
  // Hanya role super_admin yang memiliki hak akses ke halaman dokumentasi dan buku panduan ini
  await requireRole("super_admin")

  return (
    <div className="space-y-6">
      {/* Header Halaman Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
              <BookOpen className="size-7 text-primary shrink-0" />
              Pusat Panduan & Dokumentasi Sistem
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
            Informasi komprehensif mengenai latar belakang sistem, fondasi arsitektur teknologi, visual alur evaluasi kinerja, panduan operasional per modul, serta buku panduan resmi PDF siap unduh.
          </p>
        </div>

        <Badge
          variant="outline"
          className="w-fit border-purple-500/50 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold px-2.5 py-1 text-xs flex items-center gap-1.5 shrink-0"
        >
          <ShieldAlert className="size-3.5" />
          Khusus Super Admin
        </Badge>
      </div>

      {/* Komponen Tab Bar Interaktif Responsif */}
      <PanduanTabsClient />
    </div>
  )
}
