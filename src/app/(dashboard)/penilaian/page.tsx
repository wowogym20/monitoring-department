import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardCheck } from "lucide-react"

export default async function PenilaianPage() {
  await requireRole("super_admin", "admin", "user")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Penilaian Anggota
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Formulir input dan evaluasi kinerja anggota departemen per periode.
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Modul Penilaian Kinerja
            </CardTitle>
            <Badge variant="secondary">Fase 3</Badge>
          </div>
          <CardDescription>
            Input penilaian skala Likert 1-5 untuk 7 aspek kompetensi anggota.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur penilaian dengan validasi status periode, draft, dan submission akan diimplementasikan pada Fase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
