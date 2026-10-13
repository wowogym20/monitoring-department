import { requireRole } from "@/lib/auth"
import { getAssessmentDashboardDataServer } from "@/lib/actions/penilaian"
import { PenilaianList } from "./penilaian-list"

interface PenilaianPageProps {
  searchParams: Promise<{
    periodeId?: string
    departmentId?: string
  }>
}

export default async function PenilaianPage({ searchParams }: PenilaianPageProps) {
  // Hanya super_admin, admin, dan ketua (user) yang boleh mengakses halaman daftar penilaian
  await requireRole("super_admin", "admin", "user")

  const resolvedParams = await searchParams
  const dashboardData = await getAssessmentDashboardDataServer({
    periodeId: resolvedParams.periodeId,
    departmentId: resolvedParams.departmentId,
  })

  return <PenilaianList initialData={dashboardData} />
}
