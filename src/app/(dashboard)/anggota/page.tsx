import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

export default async function AnggotaPage() {
  await requireRole("super_admin", "admin", "user")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Data Anggota
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola data anggota departemen aktif dan riwayat keanggotaan.
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Modul Manajemen Anggota
            </CardTitle>
            <Badge variant="secondary">Fase 2</Badge>
          </div>
          <CardDescription>
            Fitur CRUD anggota departemen, pencarian, dan pengelolaan status aktif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fondasi autentikasi dan otorisasi telah siap. Modul data anggota akan diimplementasikan pada Fase 2 sesuai PRD.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
