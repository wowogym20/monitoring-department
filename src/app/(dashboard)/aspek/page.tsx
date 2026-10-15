import { Suspense } from "react"
import { requireRole } from "@/lib/auth"
import { getAspekListServer } from "@/lib/actions/aspek"
import { AspekManager } from "./aspek-manager"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default async function AspekPage() {
  const currentUser = await requireRole("super_admin", "admin")

  const aspects = await getAspekListServer()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Aspek Penilaian
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola aspek penilaian kinerja, urutan formulir, dan panduan rubrik skala 1–5.
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </Card>
        }
      >
        <AspekManager
          initialAspects={aspects}
          currentUserRole={currentUser.role}
        />
      </Suspense>
    </div>
  )
}
