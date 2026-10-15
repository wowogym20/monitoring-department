import { Suspense } from "react"
import { requireRole, getCurrentUser } from "@/lib/auth"
import {
  getUsersServer,
  getDepartmentOptionsServer,
} from "@/lib/actions/users"
import { UserManager } from "./user-manager"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default async function PenggunaPage() {
  await requireRole("super_admin")

  const [currentUser, users, departments] = await Promise.all([
    getCurrentUser(),
    getUsersServer(),
    getDepartmentOptionsServer(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Manajemen Pengguna
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pusat pengelolaan akun seluruh pengguna sistem (Super Admin, SDM, dan Ketua Departemen), pembuatan akun baru, penugasan role, dan keamanan login.
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </Card>
        }
      >
        <UserManager
          initialUsers={users}
          departments={departments}
          currentUserId={currentUser?.id || ""}
        />
      </Suspense>
    </div>
  )
}
