import { Metadata } from "next"
import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Database, Server, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Laporan Kerja Anggota | Monitoring Departemen",
  description: "Pusat rekapitulasi dan pemantauan laporan kerja harian anggota departemen terintegrasi.",
}

export default async function LaporanKerjaPage() {
  // Akses terbuka untuk semua peran yang sah
  const currentUser = await requireRole("super_admin", "admin", "user")

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
              <FileText className="size-7 text-primary shrink-0" />
              Laporan Kerja Anggota
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Pusat pemantauan dan rekapitulasi laporan kerja harian anggota departemen yang terintegrasi dengan modul operasional Tazakka.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium px-2.5 py-1 text-xs flex items-center gap-1.5"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Siap Integrasi API
          </Badge>
          {currentUser.department?.nama && (
            <Badge variant="secondary" className="text-xs font-normal">
              {currentUser.department.nama}
            </Badge>
          )}
        </div>
      </div>

      {/* Kontainer Placeholder - Siap Menerima Data API PHP */}
      <Card className="border-dashed border-2 bg-card/50 shadow-none">
        <CardHeader className="text-center pb-3 pt-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <Database className="size-7" />
          </div>
          <CardTitle className="text-lg sm:text-xl font-semibold">
            Modul Laporan Kerja Anggota
          </CardTitle>
          <CardDescription className="max-w-md mx-auto text-xs sm:text-sm">
            Halaman ini telah dikonfigurasi di seluruh role dan siap dihubungkan dengan endpoint API laporan kerja dari projek PHP (Tazakka).
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10">
          <div className="max-w-md mx-auto rounded-lg border border-border/80 bg-background/60 p-4 text-xs text-muted-foreground space-y-2.5">
            <div className="flex items-center justify-between text-foreground font-medium pb-1 border-b border-border/40">
              <span className="flex items-center gap-1.5">
                <Server className="size-3.5 text-primary" /> Sumber Data
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">API Eksternal PHP</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status Koneksi</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">Menunggu Integrasi</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Target Modul</span>
              <span className="font-mono text-[11px]">tazakka/laporan-kerja</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> Akses Role
              </span>
              <span className="capitalize">{currentUser.role.replace("_", " ")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
