import { requireRole } from "@/lib/auth"
import { getRekapDataServer } from "@/lib/actions/rekap"
import { RekapSummaryCards } from "./rekap-summary-cards"
import { RekapTable } from "./rekap-table"
import { BarChart3 } from "lucide-react"

export default async function RekapPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodeId?: string
    departmentId?: string
    status?: "all" | "draft" | "submitted" | "revision_requested" | "approved"
    search?: string
    page?: string
    pageSize?: string
  }>
}) {
  await requireRole("super_admin", "admin", "user")
  const params = await searchParams

  const page = params.page ? parseInt(params.page, 10) : 1
  const rawPageSize = params.pageSize === "all" ? -1 : params.pageSize ? parseInt(params.pageSize, 10) : 10
  const pageSize = isNaN(rawPageSize) ? 10 : rawPageSize

  const rekapData = await getRekapDataServer({
    periodeId: params.periodeId,
    departmentId: params.departmentId,
    status: params.status,
    search: params.search,
    page: isNaN(page) ? 1 : page,
    pageSize,
  })

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
          <BarChart3 className="size-7 text-primary" />
          Rekap Penilaian Kinerja
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {rekapData.userRole === "user"
            ? "Rekapitulasi penilaian anggota departemen Anda beserta status dan skor evaluasi."
            : "Monitoring capaian evaluasi kinerja lintas departemen, status approval, dan ringkasan skor."}
        </p>
      </div>

      {/* 2. Ringkasan per Departemen di atas tabel (US-10 penanda oren bila belum selesai) */}
      <RekapSummaryCards
        summaries={rekapData.summaries}
        userRole={rekapData.userRole}
      />

      {/* 1. Tabel TanStack Table Lintas Departemen / Departemen Sendiri */}
      <RekapTable
        data={rekapData.items}
        totalCount={rekapData.totalCount}
        pageCount={rekapData.pageCount}
        currentPage={rekapData.currentPage}
        pageSize={rekapData.pageSize}
        periods={rekapData.periods}
        selectedPeriodId={rekapData.selectedPeriod?.id || null}
        departments={rekapData.departments}
        selectedDepartmentId={rekapData.selectedDepartmentId}
        currentStatus={params.status || "all"}
        currentSearch={params.search || ""}
        userRole={rekapData.userRole}
      />
    </div>
  )
}
