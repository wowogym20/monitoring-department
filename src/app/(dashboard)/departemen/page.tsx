import { Suspense } from "react"
import { requireRole } from "@/lib/auth"
import {
  getDepartmentsServer,
  getEligibleKetuaList,
} from "@/lib/actions/department"
import { DepartmentTable } from "./department-table"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface DepartemenPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DepartemenPage({
  searchParams,
}: DepartemenPageProps) {
  const currentUser = await requireRole("super_admin", "admin")

  const resolvedParams = await searchParams
  const search =
    typeof resolvedParams.search === "string" ? resolvedParams.search : ""
  const statusParam =
    typeof resolvedParams.status === "string" ? resolvedParams.status : "all"
  const status =
    statusParam === "active" || statusParam === "inactive"
      ? statusParam
      : "all"
  const page =
    typeof resolvedParams.page === "string"
      ? Math.max(1, parseInt(resolvedParams.page, 10) || 1)
      : 1
  const pageSize = 10
  const sortOrder =
    resolvedParams.sort === "desc" ? "desc" : "asc"

  const [departmentsResult, eligibleKetua] = await Promise.all([
    getDepartmentsServer({ search, status, page, pageSize, sortOrder }),
    getEligibleKetuaList(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Departemen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentUser.role === "super_admin"
              ? "Kelola struktur 14 departemen, status keaktifan, dan penugasan ketua departemen."
              : "Daftar struktur 14 departemen dan ketua yang bertugas (Mode Baca)."}
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </Card>
        }
      >
        <DepartmentTable
          initialData={departmentsResult.data}
          total={departmentsResult.total}
          page={departmentsResult.page}
          pageSize={departmentsResult.pageSize}
          totalPages={departmentsResult.totalPages}
          currentUserRole={currentUser.role}
          eligibleKetua={eligibleKetua}
        />
      </Suspense>
    </div>
  )
}
