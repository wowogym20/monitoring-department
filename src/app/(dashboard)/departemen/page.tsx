import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2 } from "lucide-react"

export default async function DepartemenPage() {
  await requireRole("super_admin", "admin")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Departemen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daftar dan struktur departemen organisasi.
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Modul Manajemen Departemen
            </CardTitle>
            <Badge variant="secondary">Fase 2</Badge>
          </div>
          <CardDescription>
            Pengelolaan 14 departemen dan penetapan ketua departemen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur pemetaan ketua departemen dan konfigurasi departemen akan diimplementasikan pada Fase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
