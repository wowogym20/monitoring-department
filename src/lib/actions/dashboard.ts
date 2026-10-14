"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/auth"
import {
  PeriodOption,
  KetuaDashboardData,
  AdminDashboardData,
} from "@/lib/dashboard/types"
import {
  checkDeadlineInfo,
  calculateDeptScoreChartData,
  calculateDeptCompletionData,
  calculateScoreDistribution,
  calculateAdminKpi,
  calculateAttentionList,
  calculateSuperAdminGovernance,
  calculateKetuaProgressAndAttention,
} from "@/lib/dashboard/aggregation"

export async function getDashboardData(
  periodIdParam?: string
): Promise<KetuaDashboardData | AdminDashboardData | null> {
  const currentUser = await requireRole("super_admin", "admin", "user")
  const supabase = await createClient()

  // 1. Ambil seluruh periode yang tersedia
  const { data: rawPeriods, error: periodsError } = await supabase
    .from("assessment_periods")
    .select("id, nama, status, tanggal_mulai, tanggal_akhir")
    .order("tanggal_mulai", { ascending: false })

  if (periodsError) {
    console.error("Gagal mengambil periode penilaian:", periodsError.message)
  }

  const periods: PeriodOption[] = (rawPeriods || []).map((p) => ({
    id: p.id,
    nama: p.nama,
    status: p.status as "open" | "closed",
    tanggal_mulai: p.tanggal_mulai,
    tanggal_akhir: p.tanggal_akhir,
  }))

  // Tentukan periode terpilih:
  // - Sesuai parameter jika ada
  // - Default: periode berstatus 'open', atau periode terbaru
  let selectedPeriod: PeriodOption | null = null
  if (periodIdParam) {
    selectedPeriod = periods.find((p) => p.id === periodIdParam) || null
  }
  if (!selectedPeriod) {
    selectedPeriod = periods.find((p) => p.status === "open") || periods[0] || null
  }

  // ---------------------------------------------------------------------------
  // 2. DASHBOARD KETUA (Role: user)
  // Menghormati RLS: hanya mengakses data departemen miliknya
  // ---------------------------------------------------------------------------
  if (currentUser.role === "user") {
    // Ambil departemen ketua
    const { data: dept } = await supabase
      .from("departments")
      .select("id, nama, kode")
      .eq("ketua_id", currentUser.id)
      .eq("is_active", true)
      .single()

    if (!dept) {
      return {
        role: "user",
        department: null,
        period: selectedPeriod,
        periods,
        progress: {
          totalMembers: 0,
          assessedCount: 0,
          draftCount: 0,
          completionPercent: 0,
        },
        unreadComments: { count: 0, items: [] },
        deadlineInfo: checkDeadlineInfo(selectedPeriod?.tanggal_akhir),
        attentionList: [],
        kpi: {
          totalMembers: 0,
          assessedCount: 0,
          needActionCount: 0,
          averageScore: null,
        },
      }
    }

    // Ambil anggota aktif departemen ketua
    const { data: membersRaw } = await supabase
      .from("members")
      .select("id, nama, nip, jabatan")
      .eq("department_id", dept.id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("nama", { ascending: true })

    const members = membersRaw || []

    // Ambil lembar penilaian departemen pada periode ini
    let assessments: Array<{
      id: string
      member_id: string
      status: "draft" | "submitted" | "revision_requested" | "approved"
      skor_rata: number | null
    }> = []

    if (selectedPeriod) {
      const { data: assessRaw } = await supabase
        .from("assessments")
        .select("id, member_id, status, skor_rata")
        .eq("period_id", selectedPeriod.id)
        .eq("department_id", dept.id)
        .is("deleted_at", null)

      assessments = (assessRaw || []) as Array<{
        id: string
        member_id: string
        status: "draft" | "submitted" | "revision_requested" | "approved"
        skor_rata: number | null
      }>
    }

    // Ambil komentar SDM yang belum dibaca oleh ketua
    const adminClient = createAdminClient()
    const { data: unreadCommentsRaw } = await adminClient
      .from("assessment_comments")
      .select(`
        id,
        assessment_id,
        isi,
        created_at,
        author:profiles!author_id (
          nama
        ),
        assessments!inner (
          id,
          department_id,
          members!inner (
            nama
          )
        )
      `)
      .eq("assessments.department_id", dept.id)
      .neq("author_id", currentUser.id)
      .is("dibaca_at", null)
      .order("created_at", { ascending: false })

    interface RawUnreadComment {
      id: string
      assessment_id: string
      isi: string
      created_at: string
      author?: { nama: string } | null
      assessments?: {
        id: string
        department_id: string
        members?: { nama: string } | null
      } | null
    }

    const unreadCommentItems = ((unreadCommentsRaw as unknown as RawUnreadComment[]) || []).map((c) => ({
      assessmentId: c.assessment_id,
      memberNama: c.assessments?.members?.nama || "Anggota",
      authorNama: c.author?.nama || "SDM",
      isi: c.isi,
      createdAt: c.created_at,
    }))

    const deadlineInfo = checkDeadlineInfo(selectedPeriod?.tanggal_akhir)
    const { progress, attentionList, averageScore } = calculateKetuaProgressAndAttention({
      members,
      assessments,
    })

    return {
      role: "user",
      department: dept,
      period: selectedPeriod,
      periods,
      progress,
      unreadComments: {
        count: unreadCommentItems.length,
        items: unreadCommentItems,
      },
      deadlineInfo,
      attentionList,
      kpi: {
        totalMembers: progress.totalMembers,
        assessedCount: progress.assessedCount,
        needActionCount: attentionList.length,
        averageScore,
      },
    }
  }

  // ---------------------------------------------------------------------------
  // 3. DASHBOARD ADMIN (SDM) & SUPER_ADMIN
  // ---------------------------------------------------------------------------
  // Ambil seluruh 14 departemen aktif
  const { data: deptData } = await supabase
    .from("departments")
    .select("id, nama, kode, ketua_id, is_active")
    .eq("is_active", true)
    .order("nama", { ascending: true })

  const departments = deptData || []

  // Ambil seluruh anggota aktif di semua departemen
  const { data: membersData } = await supabase
    .from("members")
    .select("id, nama, nip, jabatan, department_id")
    .eq("is_active", true)
    .is("deleted_at", null)

  const members = membersData || []

  // Ambil penilaian periode ini
  let assessmentsQuery = supabase
    .from("assessments")
    .select(`
      id,
      member_id,
      department_id,
      status,
      skor_rata,
      submitted_at,
      members!inner (
        nama,
        jabatan
      )
    `)
    .is("deleted_at", null)

  if (selectedPeriod) {
    assessmentsQuery = assessmentsQuery.eq("period_id", selectedPeriod.id)
  }

  // Admin SDM: RLS & filter mencegah pembacaan draft
  if (currentUser.role === "admin") {
    assessmentsQuery = assessmentsQuery.neq("status", "draft")
  }

  const { data: assessData } = await assessmentsQuery

  interface JoinedAssessmentRow {
    id: string
    member_id: string
    department_id: string
    status: "draft" | "submitted" | "revision_requested" | "approved"
    skor_rata: number | null
    submitted_at: string | null
    members: {
      nama: string
      jabatan: string
    }
  }

  const assessments = (assessData as unknown as JoinedAssessmentRow[]) || []

  // Hitung metrik dan chart dataset
  const kpi = calculateAdminKpi({
    departments,
    members,
    assessments,
  })

  const deptScores = calculateDeptScoreChartData({
    departments,
    assessments,
    members,
  })

  const deptCompletions = calculateDeptCompletionData({
    departments,
    members,
    assessments,
  })

  const scoreDistribution = calculateScoreDistribution(assessments)

  const attentionList = calculateAttentionList({
    departments,
    members,
    assessments,
  })

  // Khusus SUPER_ADMIN: Evaluasi akun ketua nonaktif & departemen tanpa ketua
  let governanceInfo = undefined
  if (currentUser.role === "super_admin") {
    const adminClient = createAdminClient()
    const { data: profilesData } = await adminClient
      .from("profiles")
      .select("id, nama, role, is_active")

    governanceInfo = calculateSuperAdminGovernance({
      departments,
      profiles: profilesData || [],
    })
  }

  return {
    role: currentUser.role,
    period: selectedPeriod,
    periods,
    kpi,
    deptScores,
    deptCompletions,
    attentionList,
    scoreDistribution,
    governance: governanceInfo,
  }
}
