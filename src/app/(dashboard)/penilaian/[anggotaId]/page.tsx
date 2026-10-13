import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardCheck } from "lucide-react"

export default async function FormPenilaianAnggotaPage({
  params,
}: {
  params: Promise<{ anggotaId: string }>
}) {
  // Hanya super_admin dan ketua departemen (user) yang boleh mengakses form penilaian ini
  await requireRole("super_admin", "user")
  const { anggotaId } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Formulir Penilaian Anggota
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Evaluasi kinerja 7 aspek untuk anggota dengan ID: <span className="font-mono text-foreground">{anggotaId}</span>
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Lembar Penilaian Kinerja Anggota
            </CardTitle>
            <Badge variant="secondary">Fase 3</Badge>
          </div>
          <CardDescription>
            Input nilai skala Likert 1–5 untuk 7 aspek kompetensi, catatan evaluasi, draf dan submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Form penilaian interaktif dan kalkulasi skor otomatis rata-rata akan diimplementasikan pada Fase 3 sesuai PRD.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
