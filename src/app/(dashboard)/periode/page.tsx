import { Suspense } from "react"
import { requireRole } from "@/lib/auth"
import { getPeriodeListServer } from "@/lib/actions/periode"
import { PeriodeManager } from "./periode-manager"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default async function PeriodePage() {
  const currentUser = await requireRole("super_admin", "admin")

  const periods = await getPeriodeListServer()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Periode Penilaian
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buka periode baru, penutupan periode evaluasi, dan penguncian lembar penilaian anggota.
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </Card>
        }
      >
        <PeriodeManager
          initialPeriods={periods}
          currentUserRole={currentUser.role}
        />
      </Suspense>
    </div>
  )
}
