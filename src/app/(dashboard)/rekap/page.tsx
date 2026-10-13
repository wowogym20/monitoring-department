import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"

export default function RekapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Rekap Penilaian
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan dan visualisasi statistik nilai kinerja per departemen dan periode.
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Modul Rekapitulasi & Statistik
            </CardTitle>
            <Badge variant="secondary">Fase 4</Badge>
          </div>
          <CardDescription>
            Grafik distribusi nilai, rata-rata departemen, dan komparasi periode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur visualisasi statistik interaktif berbasis Recharts akan diimplementasikan pada Fase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
