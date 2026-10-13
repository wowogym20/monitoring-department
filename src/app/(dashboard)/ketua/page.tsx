import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCog } from "lucide-react"

export default async function KetuaPage() {
  await requireRole("super_admin")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Akun Ketua Departemen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola akun login dan penugasan ketua departemen (Khusus Super Admin).
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Modul Manajemen Akun Ketua
            </CardTitle>
            <Badge variant="secondary">Fase 2</Badge>
          </div>
          <CardDescription>
            Pembuatan akun baru, reset password, dan asosiasi departemen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur administrasi akun ketua departemen akan diimplementasikan pada Fase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
