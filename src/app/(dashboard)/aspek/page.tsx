import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ListOrdered } from "lucide-react"

export default function AspekPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Aspek Penilaian
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Konfigurasi 7 aspek penilaian kinerja (Khusus Super Admin).
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-primary" />
              Modul Aspek Penilaian
            </CardTitle>
            <Badge variant="secondary">Fase 2</Badge>
          </div>
          <CardDescription>
            Pengaturan nama aspek, deskripsi panduan skala Likert 1-5, dan urutan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur konfigurasi aspek penilaian akan diimplementasikan pada Fase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
