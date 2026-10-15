"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/auth"
import {
  saveAssessmentSchema,
  deleteAssessmentSchema,
  type SaveAssessmentInput,
  type DeleteAssessmentInput,
} from "@/lib/validations/penilaian"
import {
  AssessmentPeriod,
  AssessmentAspect,
  Assessment,
  AssessmentStatus,
  Database,
} from "@/types/database"

export interface PenilaianMemberItem {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  department_id: string
  department_nama: string
  department_kode: string
  assessment_id: string | null
  status: AssessmentStatus | "unassessed"
  skor_rata: number | null
  evaluator_id: string | null
  submitted_at: string | null
  updated_at: string | null
  can_edit: boolean
}

export interface PenilaianDashboardData {
  periodeList: AssessmentPeriod[]
  selectedPeriode: AssessmentPeriod | null
  departments: Array<{ id: string; nama: string; kode: string }>
  selectedDepartmentId: string | null
  members: PenilaianMemberItem[]
  summary: {
    totalMembers: number
    submittedCount: number
    submittedOnlyCount: number
    approvedCount: number
    revisionRequestedCount: number
    draftCount: number
    unassessedCount: number
    percentage: number
  }
  userRole: "super_admin" | "admin" | "user"
  userDepartmentId: string | null
}

export interface PenilaianDetailData {
  member: {
    id: string
    nama: string
    nip: string | null
    jabatan: string
    department_id: string
    department_nama: string
    department_kode: string
  }
  periode: AssessmentPeriod
  aspects: AssessmentAspect[]
  assessment: Assessment | null
  scores: Record<string, number> // aspect_id -> nilai
  isReadOnly: boolean
  isApprovedBefore: boolean
}

interface MemberWithDeptRow {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  department_id: string
  departments: {
    id: string
    nama: string
    kode: string
  } | null
}

/**
 * Mengambil seluruh data yang dibutuhkan untuk halaman /penilaian:
 * - Selector periode (default: periode open terbaru)
 * - Filter departemen untuk admin & super_admin
 * - Daftar anggota beserta status penilaian & skor
 * - Ringkasan progres penilaian "X dari Y anggota sudah dinilai"
 */
export async function getAssessmentDashboardDataServer(params: {
  periodeId?: string
  departmentId?: string
}): Promise<PenilaianDashboardData> {
  const currentUser = await requireRole("super_admin", "admin", "user")
  const supabase = await createClient()

  // 1. Ambil seluruh periode penilaian terurut berdasarkan tanggal_mulai descending
  const { data: periodsData } = await supabase
    .from("assessment_periods")
    .select("*")
    .order("tanggal_mulai", { ascending: false })

  const periodeList: AssessmentPeriod[] = periodsData || []

  // Tentukan periode terpilih: dari params, atau fallback ke periode 'open' pertama, atau periode paling baru
  let selectedPeriode: AssessmentPeriod | null = null
  if (params.periodeId) {
    selectedPeriode = periodeList.find((p) => p.id === params.periodeId) || null
  }
  if (!selectedPeriode) {
    selectedPeriode = periodeList.find((p) => p.status === "open") || periodeList[0] || null
  }

  // 2. Ambil daftar departemen untuk dropdown filter (admin & super_admin)
  let departments: Array<{ id: string; nama: string; kode: string }> = []
  if (currentUser.role === "super_admin" || currentUser.role === "admin") {
    const { data: deptData } = await supabase
      .from("departments")
      .select("id, nama, kode")
      .eq("is_active", true)
      .order("nama", { ascending: true })
    departments = deptData || []
  }

  // Tentukan departemen yang disaring:
  // - Ketua (user): dikunci ke departemen miliknya
  // - Admin / Super Admin: sesuai query param atau semua jika kosong
  let filterDepartmentId: string | null = null
  if (currentUser.role === "user") {
    filterDepartmentId = currentUser.department?.id || null
  } else if (params.departmentId && params.departmentId !== "all") {
    filterDepartmentId = params.departmentId
  }

  // 3. Ambil anggota aktif
  let membersQuery = supabase
    .from("members")
    .select(`
      id,
      nama,
      nip,
      jabatan,
      department_id,
      departments!inner (
        id,
        nama,
        kode
      )
    `)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("nama", { ascending: true })

  if (filterDepartmentId) {
    membersQuery = membersQuery.eq("department_id", filterDepartmentId)
  }

  const { data: membersData, error: membersError } = await membersQuery

  if (membersError) {
    console.error("Gagal mengambil anggota:", membersError.message)
  }

  const rawMembers = (membersData as unknown as MemberWithDeptRow[]) || []

  // 4. Ambil penilaian pada periode terpilih (jika ada periode terpilih)
  const assessmentsMap = new Map<string, Assessment>()

  if (selectedPeriode && rawMembers.length > 0) {
    let assessmentsQuery = supabase
      .from("assessments")
      .select("*")
      .eq("period_id", selectedPeriode.id)
      .is("deleted_at", null)

    if (filterDepartmentId) {
      assessmentsQuery = assessmentsQuery.eq("department_id", filterDepartmentId)
    }

    const { data: assessmentsData } = await assessmentsQuery
    if (assessmentsData) {
      for (const a of assessmentsData) {
        assessmentsMap.set(a.member_id, a as Assessment)
      }
    }
  }

  // 5. Rakit item anggota dengan status penilaian
  const members: PenilaianMemberItem[] = rawMembers.map((m) => {
    const assessment = assessmentsMap.get(m.id)
    const canEdit =
      currentUser.role === "super_admin" ||
      currentUser.role === "admin" ||
      (currentUser.role === "user" && currentUser.department?.id === m.department_id)

    return {
      id: m.id,
      nama: m.nama,
      nip: m.nip,
      jabatan: m.jabatan,
      department_id: m.department_id,
      department_nama: m.departments?.nama || "-",
      department_kode: m.departments?.kode || "-",
      assessment_id: assessment?.id || null,
      status: assessment ? assessment.status : "unassessed",
      skor_rata:
        assessment?.skor_rata !== undefined && assessment?.skor_rata !== null
          ? Number(assessment.skor_rata)
          : null,
      evaluator_id: assessment?.evaluator_id || null,
      submitted_at: assessment?.submitted_at || null,
      updated_at: assessment?.updated_at || null,
      can_edit: canEdit,
    }
  })

  // 6. Ringkasan progres: X dari Y anggota sudah dinilai
  // Dinilai = berstatus submitted, approved, atau revision_requested
  const totalMembers = members.length
  let submittedCount = 0
  let submittedOnlyCount = 0
  let approvedCount = 0
  let revisionRequestedCount = 0
  let draftCount = 0
  let unassessedCount = 0

  for (const m of members) {
    if (m.status === "draft") {
      draftCount++
    } else if (m.status === "submitted") {
      submittedCount++
      submittedOnlyCount++
    } else if (m.status === "approved") {
      submittedCount++
      approvedCount++
    } else if (m.status === "revision_requested") {
      submittedCount++
      revisionRequestedCount++
    } else {
      unassessedCount++
    }
  }

  const percentage = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0

  return {
    periodeList,
    selectedPeriode,
    departments,
    selectedDepartmentId: filterDepartmentId,
    members,
    summary: {
      totalMembers,
      submittedCount,
      submittedOnlyCount,
      approvedCount,
      revisionRequestedCount,
      draftCount,
      unassessedCount,
      percentage,
    },
    userRole: currentUser.role,
    userDepartmentId: currentUser.department?.id || null,
  }
}

/**
 * Mengambil data detail formulir penilaian anggota:
 * - Profil anggota & departemen
 * - Periode penilaian
 * - 7 Aspek penilaian aktif
 * - Nilai penilaian terdahulu jika sudah pernah diisi
 */
export async function getAssessmentDetailServer(
  memberId: string,
  periodeId?: string
): Promise<PenilaianDetailData> {
  // Super_admin, admin (SDM/Koordinator), dan ketua departemen (user) boleh mengakses form
  const currentUser = await requireRole("super_admin", "admin", "user")
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Ambil data anggota (gunakan adminClient untuk memvalidasi departemen secara eksplisit)
  const { data: memberData, error: memberError } = await adminClient
    .from("members")
    .select(`
      id,
      nama,
      nip,
      jabatan,
      department_id,
      departments!inner (
        id,
        nama,
        kode
      )
    `)
    .eq("id", memberId)
    .is("deleted_at", null)
    .single()

  if (memberError || !memberData) {
    throw new Error("Anggota tidak ditemukan atau telah dinonaktifkan.")
  }

  const memberDept = memberData.departments as unknown as {
    id: string
    nama: string
    kode: string
  } | null

  // Validasi kepemilikan departemen untuk Ketua
  if (currentUser.role === "user") {
    if (memberData.department_id !== currentUser.department?.id) {
      throw new Error("Akses ditolak: Anda hanya dapat menilai anggota departemen Anda sendiri.")
    }
  }

  // 2. Ambil periode yang diminta atau periode open default
  let periode: AssessmentPeriod | null = null
  if (periodeId) {
    const { data: pData } = await supabase
      .from("assessment_periods")
      .select("*")
      .eq("id", periodeId)
      .single()
    if (pData) periode = pData as AssessmentPeriod
  }

  if (!periode) {
    const { data: openPeriod } = await supabase
      .from("assessment_periods")
      .select("*")
      .eq("status", "open")
      .order("tanggal_mulai", { ascending: false })
      .limit(1)
      .single()

    if (openPeriod) {
      periode = openPeriod as AssessmentPeriod
    } else {
      // Ambil periode terbaru apa saja jika tidak ada yang open
      const { data: latestPeriod } = await supabase
        .from("assessment_periods")
        .select("*")
        .order("tanggal_mulai", { ascending: false })
        .limit(1)
        .single()
      if (latestPeriod) periode = latestPeriod as AssessmentPeriod
    }
  }

  if (!periode) {
    throw new Error("Belum ada periode penilaian yang terdaftar di sistem.")
  }

  // 3. Ambil aspek penilaian aktif terurut berdasarkan urutan
  const { data: aspectsData, error: aspectsError } = await supabase
    .from("assessment_aspects")
    .select("*")
    .eq("is_active", true)
    .order("urutan", { ascending: true })

  if (aspectsError || !aspectsData || aspectsData.length === 0) {
    throw new Error("Aspek penilaian belum dikonfigurasi di sistem.")
  }

  // 4. Cari penilaian yang sudah ada untuk anggota ini pada periode terkait (aktif / belum soft-deleted)
  const { data: assessmentData } = await supabase
    .from("assessments")
    .select("*")
    .eq("period_id", periode.id)
    .eq("member_id", memberId)
    .is("deleted_at", null)
    .maybeSingle()

  const scores: Record<string, number> = {}

  if (assessmentData) {
    const { data: scoresData } = await supabase
      .from("assessment_scores")
      .select("aspect_id, nilai")
      .eq("assessment_id", assessmentData.id)

    if (scoresData) {
      for (const s of scoresData) {
        scores[s.aspect_id] = s.nilai
      }
    }
  }

  // Form read-only jika periode closed untuk ketua (super_admin tetap bisa ubah jika perlu)
  const isReadOnly = periode.status === "closed" && currentUser.role !== "super_admin"
  const isApprovedBefore = assessmentData?.status === "approved"

  return {
    member: {
      id: memberData.id,
      nama: memberData.nama,
      nip: memberData.nip,
      jabatan: memberData.jabatan,
      department_id: memberData.department_id,
      department_nama: memberDept?.nama || "-",
      department_kode: memberDept?.kode || "-",
    },
    periode,
    aspects: aspectsData as AssessmentAspect[],
    assessment: assessmentData as Assessment | null,
    scores,
    isReadOnly,
    isApprovedBefore,
  }
}

/**
 * Server Action: Menyimpan Penilaian (Draf atau Kirim/Submit)
 * - Validasi role: super_admin atau user (ketua departemen)
 * - Validasi kepemilikan departemen
 * - Validasi periode berstatus 'open' (kecuali super_admin)
 * - Jika status 'submitted', pastikan seluruh aspek aktif terisi
 * - Simpan penilaian dan skor secara atomik
 * - Trigger database secara otomatis menghitung skor rata-rata & audit log
 */
export async function saveAssessmentAction(input: SaveAssessmentInput) {
  try {
    const currentUser = await requireRole("super_admin", "admin", "user")
    const validated = saveAssessmentSchema.parse(input)
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // 1. Ambil data anggota untuk validasi departemen
    const { data: member, error: memberErr } = await adminClient
      .from("members")
      .select("id, department_id, is_active, deleted_at")
      .eq("id", validated.member_id)
      .single()

    if (memberErr || !member || member.deleted_at || !member.is_active) {
      return {
        success: false,
        error: "Anggota tidak ditemukan atau berstatus nonaktif.",
      }
    }

    if (currentUser.role === "user" && member.department_id !== currentUser.department?.id) {
      return {
        success: false,
        error: "Anda tidak berhak menilai anggota di luar departemen Anda.",
      }
    }

    // 2. Ambil data periode untuk validasi status
    const { data: period, error: periodErr } = await supabase
      .from("assessment_periods")
      .select("id, status, nama")
      .eq("id", validated.period_id)
      .single()

    if (periodErr || !period) {
      return { success: false, error: "Periode penilaian tidak ditemukan." }
    }

    if (currentUser.role !== "super_admin" && period.status !== "open") {
      return {
        success: false,
        error: `Periode '${period.nama}' telah ditutup. Penilaian tidak dapat diubah.`,
      }
    }

    // 3. Validasi kelengkapan aspek jika ingin 'submitted'
    const { data: activeAspects, error: aspectsErr } = await supabase
      .from("assessment_aspects")
      .select("id")
      .eq("is_active", true)

    if (aspectsErr || !activeAspects || activeAspects.length === 0) {
      return { success: false, error: "Aspek penilaian tidak ditemukan di sistem." }
    }

    if (validated.status === "submitted") {
      const scoredIds = new Set(validated.scores.map((s) => s.aspect_id))
      const hasAll = activeAspects.every((a) => scoredIds.has(a.id))
      if (!hasAll || validated.scores.length < activeAspects.length) {
        return {
          success: false,
          error: "Seluruh aspek penilaian wajib diisi sebelum mengirim penilaian.",
        }
      }
    }

    // 4. Cari apakah sudah ada baris assessment untuk (period_id, member_id)
    // Termasuk yang mungkin soft-deleted untuk menghindari duplikasi constraint uq_assessments_period_member
    const { data: existingAssessment } = await adminClient
      .from("assessments")
      .select("id, status, deleted_at")
      .eq("period_id", validated.period_id)
      .eq("member_id", validated.member_id)
      .maybeSingle()

    let assessmentId: string

    if (existingAssessment) {
      // Mode Ubah / Pulihkan jika soft-deleted
      assessmentId = existingAssessment.id

      const updatePayload: Database["public"]["Tables"]["assessments"]["Update"] = {
        status: validated.status,
        catatan: validated.catatan,
        evaluator_id: currentUser.id,
        deleted_at: null, // Pulihkan jika sebelumnya soft delete
        updated_at: new Date().toISOString(),
      }

      // Jika sebelumnya approved lalu diubah ketua, trigger DB fn_validate_assessment_rules
      // akan otomatis merevert status ke 'submitted'.
      const { error: updateError } = await adminClient
        .from("assessments")
        .update(updatePayload)
        .eq("id", assessmentId)

      if (updateError) {
        return {
          success: false,
          error: `Gagal memperbarui lembar penilaian: ${updateError.message}`,
        }
      }
    } else {
      // Mode Buat Baru
      const insertPayload: Database["public"]["Tables"]["assessments"]["Insert"] = {
        period_id: validated.period_id,
        member_id: validated.member_id,
        department_id: member.department_id,
        evaluator_id: currentUser.id,
        status: validated.status,
        catatan: validated.catatan,
      }

      if (validated.status === "submitted") {
        insertPayload.submitted_at = new Date().toISOString()
      }

      const { data: inserted, error: insertError } = await adminClient
        .from("assessments")
        .insert(insertPayload)
        .select("id")
        .single()

      if (insertError || !inserted) {
        return {
          success: false,
          error: `Gagal membuat lembar penilaian: ${insertError?.message}`,
        }
      }

      assessmentId = inserted.id
    }

    // 5. Simpan nilai aspek (assessment_scores)
    if (validated.scores.length > 0) {
      const scoresPayload = validated.scores.map((s) => ({
        assessment_id: assessmentId,
        aspect_id: s.aspect_id,
        nilai: s.nilai,
        updated_at: new Date().toISOString(),
      }))

      const { error: scoresError } = await adminClient
        .from("assessment_scores")
        .upsert(scoresPayload, {
          onConflict: "assessment_id, aspect_id",
        })

      if (scoresError) {
        return {
          success: false,
          error: `Gagal menyimpan nilai aspek: ${scoresError.message}`,
        }
      }
    }

    revalidatePath("/penilaian")
    revalidatePath(`/penilaian/${validated.member_id}`)
    revalidatePath("/rekap")
    revalidatePath("/dashboard")

    return {
      success: true,
      assessmentId,
      message:
        validated.status === "submitted"
          ? "Penilaian berhasil dikirim."
          : "Draf penilaian berhasil disimpan.",
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Hapus Penilaian (Soft Delete)
 * Ketua boleh menghapus penilaian (termasuk setelah submit) selama periode masih terbuka.
 * Memakai soft delete (deleted_at) dengan konfirmasi.
 */
export async function deleteAssessmentAction(input: DeleteAssessmentInput) {
  try {
    const currentUser = await requireRole("super_admin", "admin", "user")
    const validated = deleteAssessmentSchema.parse(input)
    const adminClient = createAdminClient()

    // 1. Ambil data penilaian saat ini
    const { data: assessment, error: fetchErr } = await adminClient
      .from("assessments")
      .select(`
        id,
        department_id,
        period_id,
        member_id,
        deleted_at,
        assessment_periods!inner (
          id,
          status,
          nama
        )
      `)
      .eq("id", validated.assessment_id)
      .is("deleted_at", null)
      .single()

    if (fetchErr || !assessment) {
      return { success: false, error: "Penilaian tidak ditemukan atau sudah dihapus." }
    }

    // 2. Validasi kepemilikan departemen untuk ketua
    if (currentUser.role === "user" && assessment.department_id !== currentUser.department?.id) {
      return {
        success: false,
        error: "Anda tidak berhak menghapus penilaian departemen lain.",
      }
    }

    // 3. Validasi status periode masih open
    const period = assessment.assessment_periods as unknown as {
      id: string
      status: string
      nama: string
    }
    if (currentUser.role !== "super_admin" && period.status !== "open") {
      return {
        success: false,
        error: `Periode '${period.nama}' telah ditutup. Penilaian tidak dapat dihapus.`,
      }
    }

    // 4. Lakukan soft delete
    const { error: deleteError } = await adminClient
      .from("assessments")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.assessment_id)

    if (deleteError) {
      return {
        success: false,
        error: `Gagal menghapus penilaian: ${deleteError.message}`,
      }
    }

    revalidatePath("/penilaian")
    revalidatePath(`/penilaian/${assessment.member_id}`)
    revalidatePath("/rekap")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Penilaian berhasil dihapus.",
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}
