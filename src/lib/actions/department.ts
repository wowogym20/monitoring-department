"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  assignKetuaSchema,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
  type AssignKetuaInput,
} from "@/lib/validations/master-data"

export type FillingStatus = "completed" | "partial" | "unfilled"

export interface DepartmentListItem {
  id: string
  nama: string
  kode: string
  ketua_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  ketua: {
    id: string
    nama: string
    no_hp: string | null
  } | null
  total_members: number
  assessed_count: number
  draft_count: number
  filling_status: FillingStatus
}

export interface DepartmentCompletionSummary {
  total: number
  completed: number
  partial: number
  unfilled: number
  periodName: string | null
}

export interface DepartmentFilterParams {
  search?: string
  status?: "all" | "active" | "inactive"
  fillingStatus?: "all" | "completed" | "partial" | "unfilled"
  page?: number
  pageSize?: number | "all"
  sortOrder?: "asc" | "desc"
  sortBy?: "nama" | "kode" | "is_active" | "created_at"
}

import { z } from "zod"

/**
 * Mengambil daftar departemen dengan filter status, pencarian, status pengisian penilaian, dan paginasi sisi server.
 */
export async function getDepartmentsServer(params: DepartmentFilterParams = {}) {
  await requireRole("super_admin", "admin")
  const supabase = await createClient()

  const {
    search = "",
    status = "all",
    fillingStatus = "all",
    page = 1,
    pageSize = 10,
    sortOrder = "asc",
    sortBy = "nama",
  } = params

  // 1. Ambil periode penilaian aktif (open) atau periode terbaru
  const { data: openPeriod } = await supabase
    .from("assessment_periods")
    .select("id, nama, status")
    .eq("status", "open")
    .order("tanggal_mulai", { ascending: false })
    .limit(1)
    .maybeSingle()

  // 2. Ambil seluruh anggota aktif per departemen
  const { data: membersList } = await supabase
    .from("members")
    .select("id, department_id")
    .eq("is_active", true)
    .is("deleted_at", null)

  const deptMembersCountMap = new Map<string, number>()
  for (const m of membersList || []) {
    deptMembersCountMap.set(m.department_id, (deptMembersCountMap.get(m.department_id) || 0) + 1)
  }

  // 3. Ambil penilaian pada periode aktif
  let assessmentsList: Array<{ department_id: string; status: string }> = []
  if (openPeriod) {
    const { data: rawAssess } = await supabase
      .from("assessments")
      .select("department_id, status")
      .eq("period_id", openPeriod.id)
      .is("deleted_at", null)
    assessmentsList = rawAssess || []
  }

  const deptAssessedCountMap = new Map<string, number>()
  const deptDraftCountMap = new Map<string, number>()
  for (const a of assessmentsList) {
    if (a.status === "draft") {
      deptDraftCountMap.set(a.department_id, (deptDraftCountMap.get(a.department_id) || 0) + 1)
    } else {
      deptAssessedCountMap.set(a.department_id, (deptAssessedCountMap.get(a.department_id) || 0) + 1)
    }
  }

  // 4. Query departemen dasar
  let query = supabase
    .from("departments")
    .select(
      `
      id,
      nama,
      kode,
      ketua_id,
      is_active,
      created_at,
      updated_at,
      ketua:profiles!departments_ketua_id_fkey(id, nama, no_hp)
    `
    )

  if (status === "active") {
    query = query.eq("is_active", true)
  } else if (status === "inactive") {
    query = query.eq("is_active", false)
  }

  if (search.trim()) {
    query = query.or(`nama.ilike.%${search.trim()}%,kode.ilike.%${search.trim()}%`)
  }

  const isAscending = sortOrder !== "desc"

  if (sortBy === "kode") {
    query = query.order("kode", { ascending: isAscending })
  } else if (sortBy === "is_active") {
    query = query.order("is_active", { ascending: isAscending })
  } else if (sortBy === "created_at") {
    query = query.order("created_at", { ascending: isAscending })
  } else {
    query = query.order("nama", { ascending: isAscending })
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching departments:", error.message)
    return {
      data: [] as DepartmentListItem[],
      total: 0,
      page,
      pageSize: typeof pageSize === "number" ? pageSize : 10,
      totalPages: 0,
      summary: {
        total: 0,
        completed: 0,
        partial: 0,
        unfilled: 0,
        periodName: null,
      },
      activePeriod: null,
    }
  }

  // 5. Rakit departemen dengan status pengisian
  const allDepartments: DepartmentListItem[] = ((data as unknown) as Array<Record<string, unknown>>).map(
    (item) => {
      const deptId = String(item.id)
      const totalMembers = deptMembersCountMap.get(deptId) || 0
      const assessedCount = deptAssessedCountMap.get(deptId) || 0
      const draftCount = deptDraftCountMap.get(deptId) || 0

      let filling_status: FillingStatus = "unfilled"
      if (totalMembers > 0 && assessedCount >= totalMembers) {
        filling_status = "completed"
      } else if (assessedCount > 0) {
        filling_status = "partial"
      } else {
        filling_status = "unfilled"
      }

      return {
        id: deptId,
        nama: String(item.nama),
        kode: String(item.kode),
        ketua_id: item.ketua_id ? String(item.ketua_id) : null,
        is_active: Boolean(item.is_active),
        created_at: String(item.created_at),
        updated_at: String(item.updated_at),
        ketua: item.ketua
          ? {
              id: String((item.ketua as Record<string, unknown>).id),
              nama: String((item.ketua as Record<string, unknown>).nama),
              no_hp: (item.ketua as Record<string, unknown>).no_hp
                ? String((item.ketua as Record<string, unknown>).no_hp)
                : null,
            }
          : null,
        total_members: totalMembers,
        assessed_count: assessedCount,
        draft_count: draftCount,
        filling_status,
      }
    }
  )

  // 6. Ringkasan kepatuhan pengisian departemen aktif
  let completedCount = 0
  let partialCount = 0
  let unfilledCount = 0

  allDepartments.forEach((d) => {
    if (d.filling_status === "completed") completedCount++
    else if (d.filling_status === "partial") partialCount++
    else unfilledCount++
  })

  const completionSummary: DepartmentCompletionSummary = {
    total: allDepartments.length,
    completed: completedCount,
    partial: partialCount,
    unfilled: unfilledCount,
    periodName: openPeriod?.nama || null,
  }

  // 7. Filter status pengisian jika dipilih
  let filteredList = allDepartments
  if (fillingStatus && fillingStatus !== "all") {
    filteredList = allDepartments.filter((d) => d.filling_status === fillingStatus)
  }

  // 8. Paginasi fleksibel (5, 10, 25, 50, all)
  const isAll = pageSize === "all"
  const resolvedPageSize = isAll
    ? Math.max(filteredList.length, 1)
    : typeof pageSize === "number" && pageSize > 0
    ? pageSize
    : 10
  const total = filteredList.length
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / resolvedPageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const paginatedData = isAll
    ? filteredList
    : filteredList.slice((currentPage - 1) * resolvedPageSize, currentPage * resolvedPageSize)

  return {
    data: paginatedData,
    total,
    page: currentPage,
    pageSize: resolvedPageSize,
    totalPages,
    summary: completionSummary,
    activePeriod: openPeriod,
  }
}

/**
 * Mengambil daftar akun ketua (role: user) yang memenuhi syarat:
 * Belum memegang departemen manapun, atau saat ini memegang departemen tertentu (currentDepartmentId).
 */
export async function getEligibleKetuaList(currentDepartmentId?: string | null) {
  await requireRole("super_admin")
  const supabase = await createClient()

  // Ambil semua departemen yang sudah memiliki ketua
  const { data: assignedDepts } = await supabase
    .from("departments")
    .select("id, ketua_id")
    .not("ketua_id", "is", null)

  const assignedKetuaIds = new Set<string>()
  assignedDepts?.forEach((d) => {
    // Kecualikan ketua departemen saat ini agar tetap muncul dalam opsi pilihan
    if (d.id !== currentDepartmentId && d.ketua_id) {
      assignedKetuaIds.add(d.ketua_id)
    }
  })

  // Ambil semua akun dengan role 'user' yang aktif
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, nama, no_hp, is_active")
    .eq("role", "user")
    .eq("is_active", true)
    .order("nama", { ascending: true })

  if (error || !users) {
    return []
  }

  // Saring hanya user yang belum ditugaskan ke departemen lain
  return users.filter((u) => !assignedKetuaIds.has(u.id))
}

/**
 * Server Action: Tambah Departemen Baru (Khusus Super Admin)
 */
export async function createDepartmentAction(input: CreateDepartmentInput) {
  try {
    await requireRole("super_admin")

    const validated = createDepartmentSchema.parse(input)
    const supabase = await createClient()

    // Cek duplikasi kode
    const { data: existingKode } = await supabase
      .from("departments")
      .select("id")
      .eq("kode", validated.kode)
      .maybeSingle()

    if (existingKode) {
      return {
        success: false,
        error: `Kode departemen '${validated.kode}' sudah digunakan.`,
      }
    }

    const { error } = await supabase.from("departments").insert({
      nama: validated.nama,
      kode: validated.kode,
      is_active: validated.is_active,
    })

    if (error) {
      return { success: false, error: `Gagal membuat departemen: ${error.message}` }
    }

    revalidatePath("/departemen")
    return { success: true, message: `Departemen '${validated.nama}' berhasil dibuat.` }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Ubah Departemen (Khusus Super Admin)
 */
export async function updateDepartmentAction(input: UpdateDepartmentInput) {
  try {
    await requireRole("super_admin")

    const validated = updateDepartmentSchema.parse(input)
    const supabase = await createClient()

    // Cek duplikasi kode dengan ID lain
    const { data: existingKode } = await supabase
      .from("departments")
      .select("id")
      .eq("kode", validated.kode)
      .neq("id", validated.id)
      .maybeSingle()

    if (existingKode) {
      return {
        success: false,
        error: `Kode departemen '${validated.kode}' sudah digunakan departemen lain.`,
      }
    }

    const { error } = await supabase
      .from("departments")
      .update({
        nama: validated.nama,
        kode: validated.kode,
        is_active: validated.is_active,
      })
      .eq("id", validated.id)

    if (error) {
      return { success: false, error: `Gagal memperbarui departemen: ${error.message}` }
    }

    revalidatePath("/departemen")
    return { success: true, message: `Data departemen '${validated.nama}' berhasil diperbarui.` }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Pilih atau Ganti Ketua Departemen (Khusus Super Admin)
 * Catatan: Mengganti ketua tidak menghapus data penilaian lama.
 */
export async function assignKetuaAction(input: AssignKetuaInput) {
  try {
    await requireRole("super_admin")

    const validated = assignKetuaSchema.parse(input)
    const supabase = await createClient()

    // Jika menetapkan ketua baru (bukan unassign), verifikasi ketua belum memegang departemen lain
    if (validated.ketua_id) {
      const { data: otherDept } = await supabase
        .from("departments")
        .select("id, nama")
        .eq("ketua_id", validated.ketua_id)
        .neq("id", validated.department_id)
        .maybeSingle()

      if (otherDept) {
        return {
          success: false,
          error: `Akun ketua ini sudah memegang departemen '${otherDept.nama}'. Satu ketua hanya boleh memegang satu departemen.`,
        }
      }
    }

    const { error } = await supabase
      .from("departments")
      .update({
        ketua_id: validated.ketua_id,
      })
      .eq("id", validated.department_id)

    if (error) {
      return { success: false, error: `Gagal menetapkan ketua: ${error.message}` }
    }

    revalidatePath("/departemen")
    return {
      success: true,
      message: validated.ketua_id
        ? "Ketua departemen berhasil diperbarui."
        : "Ketua departemen berhasil dikosongkan.",
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Toggle Status Aktif/Nonaktif Departemen (Khusus Super Admin)
 */
export async function toggleDepartmentStatusAction(id: string, is_active: boolean) {
  try {
    await requireRole("super_admin")

    const validatedId = z.string().uuid("ID Departemen tidak valid").parse(id)
    const validatedActive = z.boolean().parse(is_active)

    const supabase = await createClient()
    const { error } = await supabase
      .from("departments")
      .update({ is_active: validatedActive })
      .eq("id", validatedId)

    if (error) {
      return { success: false, error: `Gagal mengubah status: ${error.message}` }
    }

    revalidatePath("/departemen")
    return {
      success: true,
      message: `Status departemen berhasil diubah menjadi ${validatedActive ? "Aktif" : "Nonaktif"}.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Hapus Departemen Permanen (Khusus Super Admin)
 * Aturan PRD: Departemen yang sudah punya penilaian TIDAK boleh dihapus permanen,
 * hanya dinonaktifkan (tolak di server dan tampilkan pesan jelas).
 */
export async function deleteDepartmentAction(id: string) {
  try {
    await requireRole("super_admin")

    const validatedId = z.string().uuid("ID Departemen tidak valid").parse(id)
    const supabase = await createClient()

    // 1. Cek riwayat penilaian
    const { count: assessmentCount, error: countErr } = await supabase
      .from("assessments")
      .select("*", { count: "exact", head: true })
      .eq("department_id", validatedId)

    if (countErr) {
      return { success: false, error: `Gagal memeriksa riwayat penilaian: ${countErr.message}` }
    }

    if (assessmentCount && assessmentCount > 0) {
      return {
        success: false,
        error:
          "Departemen tidak dapat dihapus permanen karena sudah memiliki riwayat penilaian. Silakan nonaktifkan status departemen.",
      }
    }

    // 2. Cek apakah ada anggota aktif terikat ke departemen ini
    const { count: memberCount } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("department_id", validatedId)
      .is("deleted_at", null)

    if (memberCount && memberCount > 0) {
      return {
        success: false,
        error:
          "Departemen masih memiliki data anggota aktif. Silakan hapus atau pindahkan anggota terlebih dahulu, atau nonaktifkan departemen.",
      }
    }

    // 3. Hapus departemen
    const { error: deleteErr } = await supabase.from("departments").delete().eq("id", validatedId)

    if (deleteErr) {
      return { success: false, error: `Gagal menghapus departemen: ${deleteErr.message}` }
    }

    revalidatePath("/departemen")
    return { success: true, message: "Departemen berhasil dihapus permanen." }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}
