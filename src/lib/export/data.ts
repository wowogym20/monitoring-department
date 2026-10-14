import {
  AssessmentAspect,
  AssessmentStatus,
  UserRole,
} from "@/types/database"
import { DepartmentRekapSummary } from "@/lib/actions/rekap"
import { kategoriSkor } from "@/lib/scoring"
import { createAdminClient } from "@/lib/supabase/admin"
import { ExportDataset, ExportDepartmentGroup, ExportMemberItem } from "./types"

/**
 * Fungsi kalkulasi murni untuk ringkasan rekapitulasi per departemen.
 * Digunakan bersama oleh halaman /rekap dan modul ekspor untuk menjamin konsistensi angka.
 */
export function calculateDepartmentSummaries(params: {
  departments: Array<{ id: string; nama: string; kode: string }>
  members: Array<{ id: string; department_id: string }>
  assessments: Array<{ department_id: string; status: AssessmentStatus; skor_rata: number | null }>
}): DepartmentRekapSummary[] {
  const { departments, members, assessments } = params

  const deptMembersCountMap = new Map<string, number>()
  for (const m of members) {
    deptMembersCountMap.set(m.department_id, (deptMembersCountMap.get(m.department_id) || 0) + 1)
  }

  const deptAssessedCountMap = new Map<string, number>()
  const deptDraftCountMap = new Map<string, number>()
  const deptScoresSumMap = new Map<string, { sum: number; count: number }>()

  for (const a of assessments) {
    if (a.status === "draft") {
      deptDraftCountMap.set(a.department_id, (deptDraftCountMap.get(a.department_id) || 0) + 1)
    } else {
      deptAssessedCountMap.set(a.department_id, (deptAssessedCountMap.get(a.department_id) || 0) + 1)

      if (a.skor_rata !== null && a.skor_rata !== undefined && !Number.isNaN(Number(a.skor_rata))) {
        const current = deptScoresSumMap.get(a.department_id) || { sum: 0, count: 0 }
        deptScoresSumMap.set(a.department_id, {
          sum: current.sum + Number(a.skor_rata),
          count: current.count + 1,
        })
      }
    }
  }

  return departments.map((d) => {
    const totalMembers = deptMembersCountMap.get(d.id) || 0
    const assessedCount = deptAssessedCountMap.get(d.id) || 0
    const draftCount = deptDraftCountMap.get(d.id) || 0
    const scoreAgg = deptScoresSumMap.get(d.id)
    const averageScore = scoreAgg && scoreAgg.count > 0 ? Number((scoreAgg.sum / scoreAgg.count).toFixed(2)) : null
    const isIncomplete = assessedCount < totalMembers

    return {
      id: d.id,
      nama: d.nama,
      kode: d.kode,
      total_members: totalMembers,
      assessed_count: assessedCount,
      draft_count: draftCount,
      average_score: averageScore,
      is_incomplete: isIncomplete,
    }
  })
}

/**
 * Format label status ramah pengguna
 */
export function formatStatusLabel(status: AssessmentStatus | "unassessed"): string {
  switch (status) {
    case "approved":
      return "Disetujui"
    case "submitted":
      return "Submitted"
    case "revision_requested":
      return "Perlu Revisi"
    case "draft":
      return "Draf"
    case "unassessed":
      return "Belum Dinilai"
    default:
      return status
  }
}

/**
 * Fungsi murni penyusun baris ekspor detail per anggota.
 * Mudah diuji dalam unit test tanpa ketergantungan koneksi jaringan.
 */
export function buildExportRows(params: {
  members: Array<{
    id: string
    nama: string
    nip: string | null
    jabatan: string
    department_id: string
  }>
  departments: Array<{
    id: string
    nama: string
    kode: string
  }>
  assessments: Array<{
    id: string
    member_id: string
    department_id: string
    period_id: string
    status: AssessmentStatus
    skor_rata: number | null
    submitted_at: string | null
    updated_at: string | null
    evaluator_nama?: string | null
  }>
  aspectScores: Array<{
    assessment_id: string
    aspect_id: string
    nilai: number
  }>
  aspects: Array<{
    id: string
    nama: string
    urutan: number
  }>
  userRole?: UserRole
}): ExportMemberItem[] {
  const { members, departments, assessments, aspectScores, aspects, userRole } = params

  const deptMap = new Map(departments.map((d) => [d.id, d]))

  // Filter assessment berdasarkan role: Admin tidak boleh melihat penilaian draft (PRD FR-5 & FR-9)
  const effectiveAssessments = assessments.filter((a) => {
    if (userRole === "admin" && a.status === "draft") {
      return false
    }
    return true
  })

  const assessmentByMemberId = new Map(effectiveAssessments.map((a) => [a.member_id, a]))

  // Petakan skor aspek per assessment_id
  const aspectScoresByAssessmentId = new Map<string, Map<string, number>>()
  for (const s of aspectScores) {
    if (!aspectScoresByAssessmentId.has(s.assessment_id)) {
      aspectScoresByAssessmentId.set(s.assessment_id, new Map())
    }
    aspectScoresByAssessmentId.get(s.assessment_id)!.set(s.aspect_id, s.nilai)
  }

  // Urutkan anggota: berdasarkan nama departemen, lalu nama anggota
  const sortedMembers = [...members].sort((a, b) => {
    const deptA = deptMap.get(a.department_id)?.nama || ""
    const deptB = deptMap.get(b.department_id)?.nama || ""
    const deptCompare = deptA.localeCompare(deptB, "id")
    if (deptCompare !== 0) return deptCompare
    return a.nama.localeCompare(b.nama, "id")
  })

  return sortedMembers.map((member, index) => {
    const dept = deptMap.get(member.department_id) || {
      id: member.department_id,
      nama: "-",
      kode: "-",
    }
    const assessment = assessmentByMemberId.get(member.id)

    const aspectScoreRecord: Record<string, number | null> = {}
    for (const aspect of aspects) {
      if (assessment) {
        const scoresMap = aspectScoresByAssessmentId.get(assessment.id)
        aspectScoreRecord[aspect.id] = scoresMap?.get(aspect.id) ?? null
      } else {
        aspectScoreRecord[aspect.id] = null
      }
    }

    const rawSkor = assessment?.skor_rata !== null && assessment?.skor_rata !== undefined
      ? Number(assessment.skor_rata)
      : null

    const kat = kategoriSkor(rawSkor)
    const status: AssessmentStatus | "unassessed" = assessment ? assessment.status : "unassessed"

    return {
      no: index + 1,
      department_id: dept.id,
      department_nama: dept.nama,
      department_kode: dept.kode,
      member_id: member.id,
      member_nama: member.nama,
      member_nip: member.nip,
      member_jabatan: member.jabatan,
      status,
      statusLabel: formatStatusLabel(status),
      skor_rata: kat.skorRounded,
      kategori: kat.kategori,
      aspect_scores: aspectScoreRecord,
      submitted_at: assessment?.submitted_at || assessment?.updated_at || null,
      evaluator_nama: assessment?.evaluator_nama || null,
    }
  })
}

/**
 * Mengambil dataset lengkap untuk ekspor langsung dari database Supabase.
 * Menggunakan query/view yang SAMA dengan halaman rekap.
 */
export async function getExportDataset(params: {
  periodeId: string
  departmentId?: string | null
  userRole: UserRole
}): Promise<ExportDataset> {
  const { periodeId, departmentId, userRole } = params
  const adminClient = createAdminClient()

  // 1. Ambil data periode
  const { data: period, error: periodErr } = await adminClient
    .from("assessment_periods")
    .select("*")
    .eq("id", periodeId)
    .single()

  if (periodErr || !period) {
    throw new Error("Periode penilaian tidak ditemukan.")
  }

  // 2. Ambil daftar departemen aktif (difilter jika ada parameter departmentId)
  let deptQuery = adminClient
    .from("departments")
    .select("id, nama, kode")
    .eq("is_active", true)
    .order("nama", { ascending: true })

  if (departmentId && departmentId !== "all") {
    deptQuery = deptQuery.eq("id", departmentId)
  }

  const { data: departmentsRaw } = await deptQuery
  const departments = departmentsRaw || []

  if (departments.length === 0) {
    throw new Error("Departemen tidak ditemukan atau tidak aktif.")
  }

  const departmentIds = departments.map((d) => d.id)

  // 3. Ambil seluruh aspek penilaian aktif
  const { data: aspectsRaw } = await adminClient
    .from("assessment_aspects")
    .select("id, nama, deskripsi, urutan, is_active")
    .eq("is_active", true)
    .order("urutan", { ascending: true })

  const aspects: AssessmentAspect[] = (aspectsRaw as AssessmentAspect[]) || []

  // 4. Ambil seluruh anggota aktif di departemen terpilih
  const { data: membersRaw } = await adminClient
    .from("members")
    .select("id, department_id, nama, nip, jabatan")
    .eq("is_active", true)
    .is("deleted_at", null)
    .in("department_id", departmentIds)
    .order("nama", { ascending: true })

  const members = membersRaw || []

  // 5. Ambil seluruh penilaian pada periode dan departemen terpilih
  const { data: assessmentsRaw } = await adminClient
    .from("assessments")
    .select(`
      id,
      member_id,
      department_id,
      period_id,
      status,
      skor_rata,
      submitted_at,
      updated_at,
      evaluator:profiles!evaluator_id (
        nama
      )
    `)
    .eq("period_id", periodeId)
    .is("deleted_at", null)
    .in("department_id", departmentIds)

  interface RawAssessmentWithEval {
    id: string
    member_id: string
    department_id: string
    period_id: string
    status: AssessmentStatus
    skor_rata: number | null
    submitted_at: string | null
    updated_at: string | null
    evaluator: { nama: string } | null
  }

  const assessments = ((assessmentsRaw as unknown as RawAssessmentWithEval[]) || []).map((a) => ({
    id: a.id,
    member_id: a.member_id,
    department_id: a.department_id,
    period_id: a.period_id,
    status: a.status,
    skor_rata: a.skor_rata !== null ? Number(a.skor_rata) : null,
    submitted_at: a.submitted_at,
    updated_at: a.updated_at,
    evaluator_nama: a.evaluator?.nama || null,
  }))

  const assessmentIds = assessments.map((a) => a.id)

  // 6. Ambil skor tiap aspek untuk semua penilaian tersebut
  let aspectScores: Array<{ assessment_id: string; aspect_id: string; nilai: number }> = []
  if (assessmentIds.length > 0) {
    const { data: scoresRaw } = await adminClient
      .from("assessment_scores")
      .select("assessment_id, aspect_id, nilai")
      .in("assessment_id", assessmentIds)

    aspectScores = (scoresRaw || []) as Array<{ assessment_id: string; aspect_id: string; nilai: number }>
  }

  // 7. Hitung ringkasan departemen menggunakan logika kalkulasi bersama
  const summaries = calculateDepartmentSummaries({
    departments,
    members: members.map((m) => ({ id: m.id, department_id: m.department_id })),
    assessments: assessments.map((a) => ({
      department_id: a.department_id,
      status: a.status,
      skor_rata: a.skor_rata,
    })),
  })

  // 8. Susun baris detail anggota
  const memberRows = buildExportRows({
    members,
    departments,
    assessments,
    aspectScores,
    aspects,
    userRole,
  })

  // 9. Kelompokkan per departemen untuk kemudahan rendering PDF
  const summaryMap = new Map(summaries.map((s) => [s.id, s]))
  const departmentGroups: ExportDepartmentGroup[] = departments.map((dept) => {
    const deptMembers = memberRows.filter((m) => m.department_id === dept.id)
    const summary = summaryMap.get(dept.id) || {
      id: dept.id,
      nama: dept.nama,
      kode: dept.kode,
      total_members: deptMembers.length,
      assessed_count: 0,
      draft_count: 0,
      average_score: null,
      is_incomplete: true,
    }

    return {
      department: dept,
      summary,
      members: deptMembers,
    }
  })

  const scopeDepartmentName =
    departmentId && departmentId !== "all" && departments.length === 1
      ? departments[0].nama
      : "Semua Departemen"

  const scopeDepartmentKode =
    departmentId && departmentId !== "all" && departments.length === 1
      ? departments[0].kode
      : null

  return {
    period,
    scopeDepartmentName,
    scopeDepartmentKode,
    aspects,
    summaries,
    members: memberRows,
    departmentGroups,
    exportedAt: new Date(),
    userRole,
  }
}

/**
 * Membentuk nama file deskriptif sesuai PRD:
 * Format: monitoring-departemen_<periode>_<tanggal>.xlsx/pdf
 * Jika difilter spesifik per departemen: monitoring-departemen_<kode-dept>_<periode>_<tanggal>.xlsx/pdf
 */
export function buildExportFilename(params: {
  periodeNama: string
  departmentKode?: string | null
  ext: "xlsx" | "pdf"
  date?: Date
}): string {
  const d = params.date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const dateStr = `${year}-${month}-${day}`

  const cleanPeriod = params.periodeNama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (params.departmentKode) {
    const cleanDept = params.departmentKode
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    return `monitoring-departemen_${cleanDept}_${cleanPeriod}_${dateStr}.${params.ext}`
  }

  return `monitoring-departemen_${cleanPeriod}_${dateStr}.${params.ext}`
}
