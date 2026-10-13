import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"

export default async function PeriodePage() {
  await requireRole("super_admin", "admin")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Periode Penilaian
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pengaturan periode penilaian (buka/tutup periode evaluasi).
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Modul Periode Penilaian
            </CardTitle>
            <Badge variant="secondary">Fase 2</Badge>
          </div>
          <CardDescription>
            Buka periode baru, penutupan periode, dan riwayat periode lampau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur pengaturan status periode (Open / Closed) akan diimplementasikan pada Fase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
