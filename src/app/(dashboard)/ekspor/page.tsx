import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet } from "lucide-react"

export default function EksporPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Ekspor Laporan
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unduh laporan penilaian dan rekap departemen dalam format Excel / CSV.
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Modul Ekspor Laporan
            </CardTitle>
            <Badge variant="secondary">Fase 4</Badge>
          </div>
          <CardDescription>
            Fitur ekspor data nilai, audit log, dan rekapitulasi anggota per periode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur unduh spreadsheet terintegrasi akan diimplementasikan pada Fase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
