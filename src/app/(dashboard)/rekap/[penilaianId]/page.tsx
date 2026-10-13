import { requireRole } from "@/lib/auth"
import { getAssessmentDetailWithAuditAndCommentsServer, AssessmentDetailRekapData } from "@/lib/actions/rekap"
import { AssessmentDetailView } from "./assessment-detail-view"
import { notFound } from "next/navigation"

export default async function DetailPenilaianPage({
  params,
}: {
  params: Promise<{ penilaianId: string }>
}) {
  await requireRole("super_admin", "admin", "user")
  const { penilaianId } = await params

  let detailData: AssessmentDetailRekapData
  try {
    detailData = await getAssessmentDetailWithAuditAndCommentsServer(penilaianId)
  } catch (err: unknown) {
    console.error("Gagal memuat detail penilaian:", err)
    notFound()
  }

  return <AssessmentDetailView data={detailData} />
}
