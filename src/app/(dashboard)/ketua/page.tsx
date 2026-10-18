import { Suspense } from "react"
import { requireRole } from "@/lib/auth"
import {
  getKetuaAccountsServer,
  getDepartmentOptionsServer,
} from "@/lib/actions/ketua"
import { KetuaManager } from "./ketua-manager"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default async function KetuaPage() {
  await requireRole("super_admin", "admin")

  const [accounts, departments] = await Promise.all([
    getKetuaAccountsServer(),
    getDepartmentOptionsServer(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Akun Kepala Departemen
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola data akun login kepala departemen, penugasan departemen, aktivasi akun, dan reset kata sandi.
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </Card>
        }
      >
        <KetuaManager initialAccounts={accounts} departments={departments} />
      </Suspense>
    </div>
  )
}
