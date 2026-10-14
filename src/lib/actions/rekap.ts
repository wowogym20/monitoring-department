"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/auth"
import {
  rekapFilterSchema,
  approveAssessmentSchema,
  requestRevisionSchema,
  createCommentSchema,
  type RekapFilterInput,
  type ApproveAssessmentInput,
  type RequestRevisionInput,
  type CreateCommentInput,
} from "@/lib/validations/rekap"
import {
  AssessmentPeriod,
  AssessmentStatus,
  UserRole,
} from "@/types/database"
import { z } from "zod"

export interface RekapTableItem {
  id: string // assessment_id
  member_id: string
  member_nama: string
  member_nip: string | null
  member_jabatan: string
  department_id: string
  department_nama: string
  department_kode: string
  period_id: string
  period_nama: string
  skor_rata: number | null
  status: AssessmentStatus
  submitted_at: string | null
  updated_at: string | null
  evaluator_nama: string | null
}

export interface DepartmentRekapSummary {
  id: string
  nama: string
  kode: string
  total_members: number
  assessed_count: number
  draft_count: number
  average_score: number | null
  is_incomplete: boolean // true jika assessed_count < total_members (US-10 penanda oren)
}

export interface RekapPageData {
  items: RekapTableItem[]
  totalCount: number
  pageCount: number
  currentPage: number
  pageSize: number
  periods: AssessmentPeriod[]
  selectedPeriod: AssessmentPeriod | null
  departments: Array<{ id: string; nama: string; kode: string }>
  selectedDepartmentId: string | null
  summaries: DepartmentRekapSummary[]
  userRole: UserRole
}

export interface CommentItem {
  id: string
  assessment_id: string
  author_id: string
  author_nama: string
  author_role: UserRole
  author_foto: string | null
  parent_id: string | null
  isi: string
  dibaca_at: string | null
  created_at: string
  replies?: CommentItem[]
}

export interface AuditLogTimelineItem {
  id: string
  waktu: string
  aktor_id: string | null
  aktor_nama: string
  aktor_role: UserRole | "system"
  aksi: string // INSERT, UPDATE, DELETE
  tabel: string
  deskripsi: string
  perubahan?: {
    field: string
    label: string
    nilai_lama: string | number | null
    nilai_baru: string | number | null
  }[]
}

export interface AssessmentDetailRekapData {
  assessment: {
    id: string
    period_id: string
    period_nama: string
    period_status: "open" | "closed"
    member_id: string
    member_nama: string
    member_nip: string | null
    member_jabatan: string
    department_id: string
    department_nama: string
    department_kode: string
    evaluator_id: string | null
    evaluator_nama: string | null
    status: AssessmentStatus
    catatan: string | null
    skor_rata: number | null
    submitted_at: string | null
    updated_at: string | null
  }
  scores: Array<{
    id: string
    aspect_id: string
    aspect_nama: string
    aspect_deskripsi: string | null
    urutan: number
    nilai: number
  }>
  comments: CommentItem[]
  auditLogs: AuditLogTimelineItem[]
  currentUser: {
    id: string
    role: UserRole
    departmentId: string | null
  }
}

/**
 * 1. Mengambil data rekap lintas departemen atau departemen sendiri dengan filter & paginasi sisi server.
 */
export async function getRekapDataServer(rawFilter: Partial<RekapFilterInput>): Promise<RekapPageData> {
  const currentUser = await requireRole("super_admin", "admin", "user")
  const validated = rekapFilterSchema.parse(rawFilter)
  const supabase = await createClient()

  // Ambil daftar periode
  const { data: periodsData } = await supabase
    .from("assessment_periods")
    .select("*")
    .order("tanggal_mulai", { ascending: false })

  const periods: AssessmentPeriod[] = periodsData || []

  // Tentukan periode terpilih
  let selectedPeriod: AssessmentPeriod | null = null
  if (validated.periodeId) {
    selectedPeriod = periods.find((p) => p.id === validated.periodeId) || null
  }
  if (!selectedPeriod) {
    selectedPeriod = periods.find((p) => p.status === "open") || periods[0] || null
  }

  // Ambil daftar departemen untuk filter dropdown (admin & super_admin)
  let departments: Array<{ id: string; nama: string; kode: string }> = []
  if (currentUser.role === "super_admin" || currentUser.role === "admin") {
    const { data: deptData } = await supabase
      .from("departments")
      .select("id, nama, kode")
      .eq("is_active", true)
      .order("nama", { ascending: true })
    departments = deptData || []
  }

  // Filter departemen:
  // - Ketua terkunci ke departemennya
  // - Admin / Super Admin sesuai pilihan filter
  let filterDepartmentId: string | null = null
  if (currentUser.role === "user") {
    filterDepartmentId = currentUser.department?.id || null
  } else if (validated.departmentId && validated.departmentId !== "all") {
    filterDepartmentId = validated.departmentId
  }

  // Hitung ringkasan per departemen di atas tabel
  const summaries = await getDepartmentSummariesInternal(
    selectedPeriod?.id || null,
    currentUser.role === "user" ? currentUser.department?.id || null : null
  )

  // Jika belum ada periode terpilih, kembalikan kosong
  if (!selectedPeriod) {
    return {
      items: [],
      totalCount: 0,
      pageCount: 0,
      currentPage: validated.page,
      pageSize: validated.pageSize,
      periods,
      selectedPeriod: null,
      departments,
      selectedDepartmentId: filterDepartmentId,
      summaries: [],
      userRole: currentUser.role,
    }
  }

  // Mulai membangun query tabel assessments
  let query = supabase
    .from("assessments")
    .select(`
      id,
      member_id,
      department_id,
      period_id,
      evaluator_id,
      status,
      catatan,
      skor_rata,
      submitted_at,
      updated_at,
      members!inner (
        id,
        nama,
        nip,
        jabatan
      ),
      departments!inner (
        id,
        nama,
        kode
      ),
      assessment_periods!inner (
        id,
        nama
      ),
      evaluator:profiles!evaluator_id (
        nama
      )
    `, { count: "exact" })
    .eq("period_id", selectedPeriod.id)
    .is("deleted_at", null)

  // Filter departemen
  if (filterDepartmentId) {
    query = query.eq("department_id", filterDepartmentId)
  }

  // Admin SDM RLS & query: Admin tidak boleh melihat penilaian draft
  if (currentUser.role === "admin") {
    query = query.neq("status", "draft")
  }

  // Filter status
  if (validated.status && validated.status !== "all") {
    query = query.eq("status", validated.status)
  }

  // Filter pencarian nama / NIP
  if (validated.search && validated.search.trim() !== "") {
    const term = validated.search.trim()
    query = query.or(`nama.ilike.%${term}%,nip.ilike.%${term}%`, { foreignTable: "members" })
  }

  // Paginasi sisi server
  const from = (validated.page - 1) * validated.pageSize
  const to = from + validated.pageSize - 1

  query = query
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .range(from, to)

  const { data: rows, count, error } = await query

  if (error) {
    console.error("Gagal mengambil data rekap:", error.message)
  }

  const totalCount = count || 0
  const pageCount = Math.ceil(totalCount / validated.pageSize)

  interface AssessmentJoinedRow {
    id: string
    member_id: string
    department_id: string
    period_id: string
    evaluator_id: string | null
    status: AssessmentStatus
    catatan: string | null
    skor_rata: number | null
    submitted_at: string | null
    updated_at: string | null
    members: {
      id: string
      nama: string
      nip: string | null
      jabatan: string
    }
    departments: {
      id: string
      nama: string
      kode: string
    }
    assessment_periods: {
      id: string
      nama: string
    }
    evaluator: {
      nama: string
    } | null
  }

  const items: RekapTableItem[] = ((rows as unknown as AssessmentJoinedRow[]) || []).map((r) => ({
    id: r.id,
    member_id: r.member_id,
    member_nama: r.members?.nama || "-",
    member_nip: r.members?.nip || null,
    member_jabatan: r.members?.jabatan || "-",
    department_id: r.department_id,
    department_nama: r.departments?.nama || "-",
    department_kode: r.departments?.kode || "-",
    period_id: r.period_id,
    period_nama: r.assessment_periods?.nama || "-",
    skor_rata: r.skor_rata !== null ? Number(r.skor_rata) : null,
    status: r.status,
    submitted_at: r.submitted_at,
    updated_at: r.updated_at,
    evaluator_nama: r.evaluator?.nama || null,
  }))

  return {
    items,
    totalCount,
    pageCount,
    currentPage: validated.page,
    pageSize: validated.pageSize,
    periods,
    selectedPeriod,
    departments,
    selectedDepartmentId: filterDepartmentId,
    summaries,
    userRole: currentUser.role,
  }
}

import { calculateDepartmentSummaries } from "@/lib/export/data"

/**
 * Helper internal untuk menghitung ringkasan departemen (US-10 penanda oren bila belum selesai menilai).
 * Diekspor untuk digunakan bersama oleh modul rekap dan ekspor.
 */
export async function getDepartmentSummaries(
  periodId: string | null,
  restrictDeptId: string | null
): Promise<DepartmentRekapSummary[]> {
  const adminClient = createAdminClient()

  // 1. Ambil seluruh departemen aktif
  let deptQuery = adminClient
    .from("departments")
    .select("id, nama, kode")
    .eq("is_active", true)
    .order("nama", { ascending: true })

  if (restrictDeptId) {
    deptQuery = deptQuery.eq("id", restrictDeptId)
  }

  const { data: deptList } = await deptQuery
  if (!deptList || deptList.length === 0) return []

  // 2. Ambil seluruh anggota aktif per departemen
  let membersQuery = adminClient
    .from("members")
    .select("id, department_id")
    .eq("is_active", true)
    .is("deleted_at", null)

  if (restrictDeptId) {
    membersQuery = membersQuery.eq("department_id", restrictDeptId)
  }

  const { data: membersList } = await membersQuery

  const deptMembersCountMap = new Map<string, number>()
  for (const m of membersList || []) {
    deptMembersCountMap.set(m.department_id, (deptMembersCountMap.get(m.department_id) || 0) + 1)
  }

  // 3. Ambil seluruh penilaian pada periode ini
  let assessList: Array<{ department_id: string; status: AssessmentStatus; skor_rata: number | null }> = []

  if (periodId) {
    let assessQuery = adminClient
      .from("assessments")
      .select("department_id, status, skor_rata")
      .eq("period_id", periodId)
      .is("deleted_at", null)

    if (restrictDeptId) {
      assessQuery = assessQuery.eq("department_id", restrictDeptId)
    }

    const { data: rawAssess } = await assessQuery
    assessList = (rawAssess || []) as Array<{ department_id: string; status: AssessmentStatus; skor_rata: number | null }>
  }

  // 4. Hitung ringkasan departemen menggunakan logika kalkulasi bersama
  return calculateDepartmentSummaries({
    departments: deptList,
    members: (membersList || []).map((m) => ({ id: m.id, department_id: m.department_id })),
    assessments: assessList,
  })
}

const getDepartmentSummariesInternal = getDepartmentSummaries

/**
 * 2. Mengambil detail lengkap penilaian: 7 Aspek, Komentar Utas, dan Audit Log berlabel aspek.
 */
export async function getAssessmentDetailWithAuditAndCommentsServer(
  assessmentId: string
): Promise<AssessmentDetailRekapData> {
  const currentUser = await requireRole("super_admin", "admin", "user")
  const adminClient = createAdminClient()

  // 1. Ambil data penilaian
  const { data: assessmentData, error: assessError } = await adminClient
    .from("assessments")
    .select(`
      id,
      period_id,
      member_id,
      department_id,
      evaluator_id,
      status,
      catatan,
      skor_rata,
      submitted_at,
      updated_at,
      deleted_at,
      members!inner (
        id,
        nama,
        nip,
        jabatan
      ),
      departments!inner (
        id,
        nama,
        kode
      ),
      assessment_periods!inner (
        id,
        nama,
        status
      ),
      evaluator:profiles!evaluator_id (
        nama
      )
    `)
    .eq("id", assessmentId)
    .is("deleted_at", null)
    .single()

  if (assessError || !assessmentData) {
    throw new Error("Penilaian tidak ditemukan atau telah dihapus.")
  }

  // Verifikasi isolasi hak akses:
  // - Ketua hanya boleh melihat penilaian departemennya
  // - Admin tidak boleh melihat penilaian berstatus 'draft'
  if (currentUser.role === "user" && assessmentData.department_id !== currentUser.department?.id) {
    throw new Error("Akses ditolak: Anda tidak memiliki akses ke penilaian departemen lain.")
  }

  if (currentUser.role === "admin" && assessmentData.status === "draft") {
    throw new Error("Akses ditolak: Penilaian berstatus draf hanya dapat diakses oleh ketua departemen.")
  }

  // 2. Ambil seluruh aspek penilaian dan nilai tersimpan
  const { data: aspects } = await adminClient
    .from("assessment_aspects")
    .select("id, nama, deskripsi, urutan")
    .eq("is_active", true)
    .order("urutan", { ascending: true })

  const { data: scoresData } = await adminClient
    .from("assessment_scores")
    .select("id, aspect_id, nilai")
    .eq("assessment_id", assessmentId)

  const scoresMap = new Map<string, { id: string; nilai: number }>()
  for (const s of scoresData || []) {
    scoresMap.set(s.aspect_id, { id: s.id, nilai: s.nilai })
  }

  const aspectNameMap = new Map<string, string>()
  for (const a of aspects || []) {
    aspectNameMap.set(a.id, a.nama)
  }

  const scores = (aspects || []).map((a) => {
    const scored = scoresMap.get(a.id)
    return {
      id: scored?.id || a.id,
      aspect_id: a.id,
      aspect_nama: a.nama,
      aspect_deskripsi: a.deskripsi,
      urutan: a.urutan,
      nilai: scored ? scored.nilai : 0,
    }
  })

  // 3. Ambil komentar berulir
  const { data: commentsRaw } = await adminClient
    .from("assessment_comments")
    .select(`
      id,
      assessment_id,
      author_id,
      parent_id,
      isi,
      dibaca_at,
      created_at,
      author:profiles!author_id (
        id,
        nama,
        role,
        foto_url
      )
    `)
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: true })

  interface RawCommentWithAuthor {
    id: string
    assessment_id: string
    author_id: string
    parent_id: string | null
    isi: string
    dibaca_at: string | null
    created_at: string
    author: {
      id: string
      nama: string
      role: UserRole
      foto_url: string | null
    } | null
  }

  const allComments: CommentItem[] = ((commentsRaw as unknown as RawCommentWithAuthor[]) || []).map((c) => ({
    id: c.id,
    assessment_id: c.assessment_id,
    author_id: c.author_id,
    author_nama: c.author?.nama || "Pengguna",
    author_role: c.author?.role || "user",
    author_foto: c.author?.foto_url || null,
    parent_id: c.parent_id,
    isi: c.isi,
    dibaca_at: c.dibaca_at,
    created_at: c.created_at,
    replies: [],
  }))

  // Susun struktur thread komentar (top-level + replies)
  const commentMap = new Map<string, CommentItem>()
  const rootComments: CommentItem[] = []

  for (const c of allComments) {
    commentMap.set(c.id, { ...c, replies: [] })
  }

  for (const c of allComments) {
    const current = commentMap.get(c.id)!
    if (c.parent_id && commentMap.has(c.parent_id)) {
      commentMap.get(c.parent_id)!.replies!.push(current)
    } else {
      rootComments.push(current)
    }
  }

  // 4. Ambil Jejak Audit Logs (Timeline dengan label aspek ramah pengguna)
  // Ambil log yang tabel-nya assessments atau assessment_scores untuk penilaian ini
  const { data: auditLogsRaw } = await adminClient
    .from("audit_logs")
    .select(`
      id,
      aktor_id,
      aksi,
      tabel,
      record_id,
      data_lama,
      data_baru,
      waktu,
      aktor:profiles!aktor_id (
        id,
        nama,
        role
      )
    `)
    .or(`record_id.eq.${assessmentId},data_baru->>assessment_id.eq.${assessmentId},data_lama->>assessment_id.eq.${assessmentId}`)
    .order("waktu", { ascending: false })

  interface RawAuditWithAktor {
    id: string
    aktor_id: string | null
    aksi: string
    tabel: string
    record_id: string
    data_lama: Record<string, unknown> | null
    data_baru: Record<string, unknown> | null
    waktu: string
    aktor: {
      id: string
      nama: string
      role: UserRole
    } | null
  }

  const auditLogs: AuditLogTimelineItem[] = ((auditLogsRaw as unknown as RawAuditWithAktor[]) || []).map((log) => {
    const aktorNama = log.aktor?.nama || "Sistem"
    const aktorRole = log.aktor?.role || "system"
    const perubahanList: {
      field: string
      label: string
      nilai_lama: string | number | null
      nilai_baru: string | number | null
    }[] = []

    let deskripsi = ""

    if (log.tabel === "assessments") {
      if (log.aksi === "INSERT") {
        deskripsi = `Membuat lembar penilaian dengan status '${log.data_baru?.status || "draft"}'`
      } else if (log.aksi === "UPDATE") {
        const oldStatus = log.data_lama?.status
        const newStatus = log.data_baru?.status

        if (oldStatus !== newStatus) {
          deskripsi = `Mengubah status penilaian dari '${oldStatus}' ke '${newStatus}'`
          perubahanList.push({
            field: "status",
            label: "Status Penilaian",
            nilai_lama: String(oldStatus || "-"),
            nilai_baru: String(newStatus || "-"),
          })
        } else {
          deskripsi = `Memperbarui data penilaian (catatan evaluasi / skor rata-rata)`
        }

        if (log.data_lama?.catatan !== log.data_baru?.catatan) {
          perubahanList.push({
            field: "catatan",
            label: "Catatan Evaluasi",
            nilai_lama: (log.data_lama?.catatan as string) || "(Kosong)",
            nilai_baru: (log.data_baru?.catatan as string) || "(Kosong)",
          })
        }
      } else if (log.aksi === "DELETE") {
        deskripsi = `Menghapus lembar penilaian`
      }
    } else if (log.tabel === "assessment_scores") {
      const aspectId = (log.data_baru?.aspect_id || log.data_lama?.aspect_id) as string
      const aspectNama = aspectNameMap.get(aspectId) || "Aspek Penilaian"
      const oldNilai = log.data_lama?.nilai as number | undefined
      const newNilai = log.data_baru?.nilai as number | undefined

      if (log.aksi === "INSERT") {
        deskripsi = `Menetapkan nilai ${aspectNama} = ${newNilai}`
      } else if (log.aksi === "UPDATE") {
        deskripsi = `Mengubah nilai ${aspectNama} dari ${oldNilai} menjadi ${newNilai}`
      }

      perubahanList.push({
        field: "nilai",
        label: aspectNama,
        nilai_lama: oldNilai ?? null,
        nilai_baru: newNilai ?? null,
      })
    } else {
      deskripsi = `Aktivitas ${log.aksi} pada tabel ${log.tabel}`
    }

    return {
      id: log.id,
      waktu: log.waktu,
      aktor_id: log.aktor_id,
      aktor_nama: aktorNama,
      aktor_role: aktorRole,
      aksi: log.aksi,
      tabel: log.tabel,
      deskripsi,
      perubahan: perubahanList,
    }
  })

  // 5. Tandai komentar dibaca otomatis saat Ketua membuka detail
  if (currentUser.role === "user") {
    await adminClient
      .from("assessment_comments")
      .update({ dibaca_at: new Date().toISOString() })
      .eq("assessment_id", assessmentId)
      .neq("author_id", currentUser.id)
      .is("dibaca_at", null)
  }

  const memberRaw = assessmentData.members as unknown as {
    id: string
    nama: string
    nip: string | null
    jabatan: string
  }
  const deptRaw = assessmentData.departments as unknown as {
    id: string
    nama: string
    kode: string
  }
  const periodRaw = assessmentData.assessment_periods as unknown as {
    id: string
    nama: string
    status: "open" | "closed"
  }
  const evalRaw = assessmentData.evaluator as unknown as {
    nama: string
  } | null

  return {
    assessment: {
      id: assessmentData.id,
      period_id: assessmentData.period_id,
      period_nama: periodRaw?.nama || "-",
      period_status: periodRaw?.status || "open",
      member_id: assessmentData.member_id,
      member_nama: memberRaw?.nama || "-",
      member_nip: memberRaw?.nip || null,
      member_jabatan: memberRaw?.jabatan || "-",
      department_id: assessmentData.department_id,
      department_nama: deptRaw?.nama || "-",
      department_kode: deptRaw?.kode || "-",
      evaluator_id: assessmentData.evaluator_id,
      evaluator_nama: evalRaw?.nama || null,
      status: assessmentData.status,
      catatan: assessmentData.catatan,
      skor_rata: assessmentData.skor_rata !== null ? Number(assessmentData.skor_rata) : null,
      submitted_at: assessmentData.submitted_at,
      updated_at: assessmentData.updated_at,
    },
    scores,
    comments: rootComments,
    auditLogs,
    currentUser: {
      id: currentUser.id,
      role: currentUser.role,
      departmentId: currentUser.department?.id || null,
    },
  }
}

/**
 * 3. Server Action: Menyetujui Penilaian (Status: approved)
 * Validasi transisi status: Hanya boleh dari 'submitted' (PRD Bagian 9)
 * Hak akses: Hanya super_admin & admin
 */
export async function approveAssessmentAction(input: ApproveAssessmentInput) {
  try {
    await requireRole("super_admin", "admin")
    const validated = approveAssessmentSchema.parse(input)
    const adminClient = createAdminClient()

    // 1. Ambil data penilaian saat ini
    const { data: assessment, error: fetchErr } = await adminClient
      .from("assessments")
      .select("id, status, member_id, deleted_at")
      .eq("id", validated.assessmentId)
      .is("deleted_at", null)
      .single()

    if (fetchErr || !assessment) {
      return { success: false, error: "Penilaian tidak ditemukan atau telah dihapus." }
    }

    // 2. Validasi transisi status sesuai PRD Bagian 9:
    // Status 'approved' hanya dapat diberikan jika status saat ini 'submitted'
    if (assessment.status !== "submitted") {
      return {
        success: false,
        error: `Persetujuan hanya dapat diberikan pada penilaian berstatus 'submitted'. Status saat ini: '${assessment.status}'.`,
      }
    }

    // 3. Update status menjadi approved
    const { error: updateErr } = await adminClient
      .from("assessments")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.assessmentId)

    if (updateErr) {
      return { success: false, error: `Gagal menyetujui penilaian: ${updateErr.message}` }
    }

    revalidatePath("/rekap")
    revalidatePath(`/rekap/${validated.assessmentId}`)
    revalidatePath("/penilaian")
    revalidatePath(`/penilaian/${assessment.member_id}`)
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Penilaian berhasil disetujui.",
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * 4. Server Action: Meminta Revisi Penilaian (Status: revision_requested)
 * Validasi transisi status: Hanya boleh dari 'submitted' atau 'approved' (PRD Bagian 9)
 * Wajib disertai komentar/catatan revisi
 * Hak akses: Hanya super_admin & admin
 */
export async function requestRevisionAssessmentAction(input: RequestRevisionInput) {
  try {
    const currentUser = await requireRole("super_admin", "admin")
    const validated = requestRevisionSchema.parse(input)
    const adminClient = createAdminClient()

    // 1. Ambil data penilaian saat ini
    const { data: assessment, error: fetchErr } = await adminClient
      .from("assessments")
      .select("id, status, member_id, deleted_at")
      .eq("id", validated.assessmentId)
      .is("deleted_at", null)
      .single()

    if (fetchErr || !assessment) {
      return { success: false, error: "Penilaian tidak ditemukan atau telah dihapus." }
    }

    // 2. Validasi transisi status sesuai PRD Bagian 9:
    // Permintaan revisi hanya valid dari 'submitted' atau 'approved'
    if (assessment.status !== "submitted" && assessment.status !== "approved") {
      return {
        success: false,
        error: `Permintaan revisi hanya dapat diajukan untuk penilaian berstatus 'submitted' atau 'approved'. Status saat ini: '${assessment.status}'.`,
      }
    }

    // 3. Update status menjadi revision_requested
    const { error: updateErr } = await adminClient
      .from("assessments")
      .update({
        status: "revision_requested",
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.assessmentId)

    if (updateErr) {
      return { success: false, error: `Gagal memperbarui status revisi: ${updateErr.message}` }
    }

    // 4. Masukkan komentar alasan revisi secara otomatis ke assessment_comments
    const { error: commentErr } = await adminClient
      .from("assessment_comments")
      .insert({
        assessment_id: validated.assessmentId,
        author_id: currentUser.id,
        isi: `[Permintaan Revisi]: ${validated.comment}`,
        dibaca_at: null, // belum dibaca ketua
      })

    if (commentErr) {
      console.error("Gagal menambahkan komentar revisi:", commentErr.message)
    }

    revalidatePath("/rekap")
    revalidatePath(`/rekap/${validated.assessmentId}`)
    revalidatePath("/penilaian")
    revalidatePath(`/penilaian/${assessment.member_id}`)
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Permintaan revisi dan catatan berhasil dikirimkan ke Ketua Departemen.",
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * 5. Server Action: Menulis Komentar Baru atau Membalas Komentar (Threaded with parent_id)
 * Hak akses: super_admin, admin, atau user (hanya di departemennya)
 */
export async function createCommentAction(input: CreateCommentInput) {
  try {
    const currentUser = await requireRole("super_admin", "admin", "user")
    const validated = createCommentSchema.parse(input)
    const adminClient = createAdminClient()

    // 1. Verifikasi penilaian ada dan hak akses ketua
    const { data: assessment, error: fetchErr } = await adminClient
      .from("assessments")
      .select("id, department_id, deleted_at")
      .eq("id", validated.assessmentId)
      .is("deleted_at", null)
      .single()

    if (fetchErr || !assessment) {
      return { success: false, error: "Penilaian tidak ditemukan atau telah dihapus." }
    }

    if (currentUser.role === "user" && assessment.department_id !== currentUser.department?.id) {
      return { success: false, error: "Anda tidak berhak memberi komentar pada penilaian departemen lain." }
    }

    // 2. Simpan komentar
    const { data: inserted, error: insertErr } = await adminClient
      .from("assessment_comments")
      .insert({
        assessment_id: validated.assessmentId,
        author_id: currentUser.id,
        parent_id: validated.parentId || null,
        isi: validated.isi,
        dibaca_at: null, // Baru dibuat
      })
      .select("id")
      .single()

    if (insertErr || !inserted) {
      return { success: false, error: `Gagal mengirim komentar: ${insertErr?.message}` }
    }

    revalidatePath(`/rekap/${validated.assessmentId}`)

    return {
      success: true,
      commentId: inserted.id,
      message: "Komentar berhasil dikirim.",
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * 6. Server Action: Menandai Seluruh Komentar Pada Penilaian Sebagai Dibaca
 * Dipanggil saat Ketua membuka halaman detail penilaian (/rekap/[penilaianId])
 */
export async function markCommentsAsReadAction(assessmentId: string) {
  try {
    const currentUser = await requireRole("super_admin", "admin", "user")
    const validatedId = z.string().uuid("ID Penilaian tidak valid").parse(assessmentId)
    if (currentUser.role !== "user") {
      return { success: true, count: 0 }
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("assessment_comments")
      .update({ dibaca_at: new Date().toISOString() })
      .eq("assessment_id", validatedId)
      .neq("author_id", currentUser.id)
      .is("dibaca_at", null)

    if (error) {
      console.error("Gagal menandai komentar dibaca:", error.message)
      return { success: false, error: error.message }
    }

    revalidatePath(`/rekap/${validatedId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal" }
  }
}

/**
 * 7. Server Action: Menghitung Total Komentar Belum Dibaca untuk Badge Sidebar Ketua
 * Hanya berlaku untuk role 'user' (ketua departemen)
 */
export async function getUnreadCommentsCountAction(): Promise<number> {
  try {
    const currentUser = await requireRole("super_admin", "admin", "user")
    if (currentUser.role !== "user" || !currentUser.department?.id) {
      return 0
    }

    const adminClient = createAdminClient()

    // Cari komentar pada penilaian di departemen ketua yang belum dibaca dan bukan ditulis ketua sendiri
    const { count, error } = await adminClient
      .from("assessment_comments")
      .select("id, assessments!inner(id, department_id, deleted_at)", { count: "exact", head: true })
      .eq("assessments.department_id", currentUser.department.id)
      .is("assessments.deleted_at", null)
      .neq("author_id", currentUser.id)
      .is("dibaca_at", null)

    if (error) {
      console.error("Gagal menghitung komentar belum dibaca:", error.message)
      return 0
    }

    return count || 0
  } catch {
    return 0
  }
}
