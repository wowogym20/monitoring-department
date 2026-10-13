import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"

export default async function DetailPenilaianPage({
  params,
}: {
  params: Promise<{ penilaianId: string }>
}) {
  // Semua role yang terautentikasi dapat melihat detail rekap penilaian
  await requireRole("super_admin", "admin", "user")
  const { penilaianId } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Detail Hasil Penilaian
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rincian evaluasi kinerja, riwayat revisi, dan jejak komentar untuk penilaian ID: <span className="font-mono text-foreground">{penilaianId}</span>
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Detail Penilaian & Thread Komentar
            </CardTitle>
            <Badge variant="secondary">Fase 3</Badge>
          </div>
          <CardDescription>
            Tampilan nilai 7 aspek, audit log riwayat perubahan status, dan interaksi komentar SDM & Ketua.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Modul detail penilaian dan percakapan komentar revisi akan diimplementasikan pada Fase 3 sesuai PRD.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
