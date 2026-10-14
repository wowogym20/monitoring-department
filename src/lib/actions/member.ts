"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/auth"
import {
  memberFilterSchema,
  createMemberSchema,
  updateMemberSchema,
  importMemberRowSchema,
  type MemberFilterParams,
  type CreateMemberInput,
  type UpdateMemberInput,
} from "@/lib/validations/member"
import ExcelJS from "exceljs"
import { z } from "zod"

export interface MemberListItem {
  id: string
  department_id: string
  department_nama: string
  department_kode: string
  nama: string
  nip: string | null
  jabatan: string
  no_hp: string | null
  is_active: boolean
  has_assessment: boolean
  assessment_count: number
  created_at: string
  updated_at: string
}

export interface GetMembersResponse {
  data: MemberListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  currentDepartmentName?: string
}

export interface ImportMembersResult {
  success: boolean
  totalProcessed: number
  totalSuccess: number
  totalFailed: number
  errors: Array<{ row: number; nip?: string; nama?: string; message: string }>
}

/**
 * Mengambil daftar anggota dengan filter status, pencarian, dan paginasi sisi server.
 * Mematuhi hak akses:
 * - Ketua: HANYA melihat anggota departemennya sendiri.
 * - Admin (SDM) & Super Admin: Melihat semua departemen dan dapat memfilter per departemen.
 */
export async function getMembersServer(
  params: Partial<MemberFilterParams> = {}
): Promise<GetMembersResponse> {
  const currentUser = await requireRole("super_admin", "admin", "user")
  const parsed = memberFilterSchema.parse(params)
  const supabase = await createClient()

  let targetDepartmentId: string | undefined = undefined
  let currentDepartmentName: string | undefined = undefined

  if (currentUser.role === "user") {
    // Role ketua: Wajib batasi hanya ke departemen miliknya
    if (!currentUser.department) {
      return {
        data: [],
        total: 0,
        page: parsed.page,
        pageSize: parsed.pageSize,
        totalPages: 0,
        currentDepartmentName: "Belum Ditugaskan",
      }
    }
    targetDepartmentId = currentUser.department.id
    currentDepartmentName = currentUser.department.nama
  } else if (parsed.department_id && parsed.department_id.trim() !== "") {
    targetDepartmentId = parsed.department_id.trim()
  }

  // Buat query anggota
  let query = supabase
    .from("members")
    .select(
      `
      id,
      department_id,
      nama,
      nip,
      jabatan,
      no_hp,
      is_active,
      created_at,
      updated_at,
      department:departments!members_department_id_fkey(nama, kode)
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)

  // Filter departemen
  if (targetDepartmentId) {
    query = query.eq("department_id", targetDepartmentId)
  }

  // Filter status aktif
  if (parsed.status === "active") {
    query = query.eq("is_active", true)
  } else if (parsed.status === "inactive") {
    query = query.eq("is_active", false)
  }

  // Pencarian nama atau NIP
  if (parsed.search.trim()) {
    const term = parsed.search.trim()
    query = query.or(`nama.ilike.%${term}%,nip.ilike.%${term}%`)
  }

  // Paginasi sisi server
  const from = (parsed.page - 1) * parsed.pageSize
  const to = from + parsed.pageSize - 1

  query = query.order("nama", { ascending: true }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error("Error fetching members:", error.message)
    return {
      data: [],
      total: 0,
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalPages: 0,
      currentDepartmentName,
    }
  }

  const memberIds = (data || []).map((m) => m.id)
  const assessmentCountMap = new Map<string, number>()

  // Cek apakah anggota sudah memiliki penilaian (untuk aturan hapus vs nonaktif)
  if (memberIds.length > 0) {
    const { data: assessmentsData } = await supabase
      .from("assessments")
      .select("member_id")
      .in("member_id", memberIds)
      .is("deleted_at", null)

    if (assessmentsData) {
      assessmentsData.forEach((a) => {
        const current = assessmentCountMap.get(a.member_id) || 0
        assessmentCountMap.set(a.member_id, current + 1)
      })
    }
  }

  const members: MemberListItem[] = ((data as unknown) as Array<Record<string, unknown>>).map(
    (item) => {
      const dept = item.department as { nama?: string; kode?: string } | null
      const id = String(item.id)
      const count = assessmentCountMap.get(id) || 0

      return {
        id,
        department_id: String(item.department_id),
        department_nama: dept?.nama || "Departemen",
        department_kode: dept?.kode || "-",
        nama: String(item.nama),
        nip: item.nip ? String(item.nip) : null,
        jabatan: String(item.jabatan),
        no_hp: item.no_hp ? String(item.no_hp) : null,
        is_active: Boolean(item.is_active),
        has_assessment: count > 0,
        assessment_count: count,
        created_at: String(item.created_at),
        updated_at: String(item.updated_at),
      }
    }
  )

  const total = count || 0
  const totalPages = Math.ceil(total / parsed.pageSize)

  return {
    data: members,
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
    totalPages,
    currentDepartmentName,
  }
}

/**
 * Server Action: Tambah Anggota Baru
 * - Ketua: department_id diambil otomatis dari akun yang login di SERVER.
 * - Super Admin: department_id wajib dipilih dari input.
 * - Admin (SDM): Ditolak (hanya view & import).
 */
export async function createMemberAction(input: CreateMemberInput) {
  try {
    const currentUser = await requireRole("super_admin", "user")
    const validated = createMemberSchema.parse(input)
    const supabase = await createClient()

    let departmentIdToUse: string

    if (currentUser.role === "user") {
      // Role ketua: Wajib diambil dari departemen miliknya di server
      if (!currentUser.department?.id) {
        return {
          success: false,
          error: "Akun Anda belum ditetapkan sebagai ketua di departemen manapun.",
        }
      }
      departmentIdToUse = currentUser.department.id
    } else {
      // Role super_admin: Wajib memilih departemen
      if (!validated.department_id || validated.department_id.trim() === "") {
        return {
          success: false,
          error: "Departemen wajib dipilih.",
        }
      }
      departmentIdToUse = validated.department_id.trim()

      // Validasi keberadaan departemen
      const { data: dept } = await supabase
        .from("departments")
        .select("id")
        .eq("id", departmentIdToUse)
        .maybeSingle()

      if (!dept) {
        return {
          success: false,
          error: "Departemen yang dipilih tidak valid atau tidak ditemukan.",
        }
      }
    }

    // Validasi NIP unik per departemen untuk anggota aktif
    if (validated.nip) {
      const { data: duplicateNip } = await supabase
        .from("members")
        .select("id, nama")
        .eq("department_id", departmentIdToUse)
        .eq("nip", validated.nip)
        .is("deleted_at", null)
        .maybeSingle()

      if (duplicateNip) {
        return {
          success: false,
          error: `NIG '${validated.nip}' sudah digunakan oleh '${duplicateNip.nama}' di departemen ini.`,
        }
      }
    }

    const { error: insertError } = await supabase.from("members").insert({
      department_id: departmentIdToUse,
      nama: validated.nama,
      nip: validated.nip,
      jabatan: validated.jabatan,
      no_hp: validated.no_hp,
      is_active: validated.is_active,
    })

    if (insertError) {
      return {
        success: false,
        error: `Gagal menambahkan anggota: ${insertError.message}`,
      }
    }

    revalidatePath("/anggota")
    return {
      success: true,
      message: `Anggota '${validated.nama}' berhasil ditambahkan.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Ubah Data Anggota
 */
export async function updateMemberAction(input: UpdateMemberInput) {
  try {
    const currentUser = await requireRole("super_admin", "user")
    const validated = updateMemberSchema.parse(input)
    const supabase = await createClient()

    // Ambil data anggota saat ini
    const { data: currentMember, error: fetchError } = await supabase
      .from("members")
      .select("id, department_id, deleted_at")
      .eq("id", validated.id)
      .maybeSingle()

    if (fetchError || !currentMember || currentMember.deleted_at) {
      return {
        success: false,
        error: "Data anggota tidak ditemukan atau sudah dihapus.",
      }
    }

    let departmentIdToUse = currentMember.department_id

    if (currentUser.role === "user") {
      // Ketua HANYA boleh mengubah anggota di departemennya sendiri
      if (currentMember.department_id !== currentUser.department?.id) {
        return {
          success: false,
          error: "Anda tidak memiliki hak akses untuk mengubah anggota departemen lain.",
        }
      }
    } else if (currentUser.role === "super_admin") {
      // Super admin boleh memindahkan departemen
      if (validated.department_id && validated.department_id.trim() !== "") {
        departmentIdToUse = validated.department_id.trim()
      }
    }

    // Validasi NIP unik per departemen (abaikan baris ini sendiri)
    if (validated.nip) {
      const { data: duplicateNip } = await supabase
        .from("members")
        .select("id, nama")
        .eq("department_id", departmentIdToUse)
        .eq("nip", validated.nip)
        .neq("id", validated.id)
        .is("deleted_at", null)
        .maybeSingle()

      if (duplicateNip) {
        return {
          success: false,
          error: `NIG '${validated.nip}' sudah digunakan oleh '${duplicateNip.nama}' di departemen ini.`,
        }
      }
    }

    const { error: updateError } = await supabase
      .from("members")
      .update({
        nama: validated.nama,
        nip: validated.nip,
        jabatan: validated.jabatan,
        no_hp: validated.no_hp,
        is_active: validated.is_active,
        department_id: departmentIdToUse,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id)

    if (updateError) {
      return {
        success: false,
        error: `Gagal memperbarui data anggota: ${updateError.message}`,
      }
    }

    revalidatePath("/anggota")
    return {
      success: true,
      message: `Data anggota '${validated.nama}' berhasil diperbarui.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Aktifkan / Nonaktifkan Anggota
 */
export async function toggleMemberStatusAction(id: string, is_active: boolean) {
  try {
    const currentUser = await requireRole("super_admin", "user")
    const validatedId = z.string().uuid("ID Anggota tidak valid").parse(id)
    const validatedActive = z.boolean().parse(is_active)
    const supabase = await createClient()

    const { data: member, error: fetchError } = await supabase
      .from("members")
      .select("id, department_id, nama, deleted_at")
      .eq("id", validatedId)
      .maybeSingle()

    if (fetchError || !member || member.deleted_at) {
      return {
        success: false,
        error: "Data anggota tidak ditemukan.",
      }
    }

    if (currentUser.role === "user" && member.department_id !== currentUser.department?.id) {
      return {
        success: false,
        error: "Anda tidak memiliki hak akses untuk mengubah anggota departemen lain.",
      }
    }

    const { error: updateError } = await supabase
      .from("members")
      .update({
        is_active: validatedActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validatedId)

    if (updateError) {
      return {
        success: false,
        error: `Gagal mengubah status anggota: ${updateError.message}`,
      }
    }

    revalidatePath("/anggota")
    return {
      success: true,
      message: `Status anggota '${member.nama}' berhasil diubah menjadi ${
        validatedActive ? "Aktif" : "Nonaktif"
      }.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Hapus Anggota (Soft Delete)
 * Aturan PRD Bagian 7 (FR-3):
 * "Anggota yang sudah punya penilaian hanya boleh dinonaktifkan (tolak hapus di server,
 * dan UI menampilkan alasannya). Hapus memakai soft delete (deleted_at)."
 */
export async function deleteMemberAction(id: string) {
  try {
    const currentUser = await requireRole("super_admin", "user")
    const validatedId = z.string().uuid("ID Anggota tidak valid").parse(id)
    const supabase = await createClient()

    const { data: member, error: fetchError } = await supabase
      .from("members")
      .select("id, department_id, nama, deleted_at")
      .eq("id", validatedId)
      .maybeSingle()

    if (fetchError || !member || member.deleted_at) {
      return {
        success: false,
        error: "Data anggota tidak ditemukan atau sudah dihapus.",
      }
    }

    if (currentUser.role === "user" && member.department_id !== currentUser.department?.id) {
      return {
        success: false,
        error: "Anda tidak memiliki hak akses untuk menghapus anggota departemen lain.",
      }
    }

    // 1. Cek riwayat penilaian
    const { count: assessmentCount, error: countErr } = await supabase
      .from("assessments")
      .select("*", { count: "exact", head: true })
      .eq("member_id", validatedId)
      .is("deleted_at", null)

    if (countErr) {
      return {
        success: false,
        error: `Gagal memeriksa riwayat penilaian: ${countErr.message}`,
      }
    }

    if (assessmentCount && assessmentCount > 0) {
      return {
        success: false,
        error:
          "Anggota tidak dapat dihapus karena sudah memiliki riwayat penilaian. Anda hanya dapat menonaktifkan status anggota ini.",
      }
    }

    // 2. Lakukan soft delete
    const { error: deleteError } = await supabase
      .from("members")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validatedId)

    if (deleteError) {
      return {
        success: false,
        error: `Gagal menghapus anggota: ${deleteError.message}`,
      }
    }

    revalidatePath("/anggota")
    return {
      success: true,
      message: `Anggota '${member.nama}' berhasil dihapus.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Impor Massal Anggota dari Berkas Excel (.xlsx) atau CSV
 * Hanya diizinkan untuk super_admin dan admin (SDM).
 */
export async function importMembersAction(formData: FormData): Promise<ImportMembersResult> {
  try {
    await requireRole("super_admin", "admin")

    const file = formData.get("file") as File | null
    if (!file) {
      return {
        success: false,
        totalProcessed: 0,
        totalSuccess: 0,
        totalFailed: 1,
        errors: [{ row: 0, message: "File Excel atau CSV wajib diunggah." }],
      }
    }

    const fileName = file.name.toLowerCase()
    const isXlsx = fileName.endsWith(".xlsx")
    const isCsv = fileName.endsWith(".csv")

    if (!isXlsx && !isCsv) {
      return {
        success: false,
        totalProcessed: 0,
        totalSuccess: 0,
        totalFailed: 1,
        errors: [
          {
            row: 0,
            message: "Format file tidak didukung. Harap unggah berkas berekstensi .xlsx atau .csv.",
          },
        ],
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const workbook = new ExcelJS.Workbook()

    if (isXlsx) {
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0])
    } else {
      // Parse CSV
      const { Readable } = await import("stream")
      const stream = Readable.from(buffer as unknown as Uint8Array)
      await workbook.csv.read(stream)
    }

    const worksheet = workbook.worksheets[0]
    if (!worksheet || worksheet.rowCount < 2) {
      return {
        success: false,
        totalProcessed: 0,
        totalSuccess: 0,
        totalFailed: 1,
        errors: [{ row: 0, message: "File kosong atau tidak memiliki baris data." }],
      }
    }

    // 1. Baca Header di Baris 1
    const headerRow = worksheet.getRow(1)
    const headerMap: Record<string, number> = {}

    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
      if (val) {
        headerMap[val] = colNumber
      }
    })

    // Temukan indeks kolom dengan toleransi variasi penamaan
    const colKodeDept =
      headerMap["kode_departemen"] ||
      headerMap["kode_dept"] ||
      headerMap["kode"] ||
      headerMap["departemen"]
    const colNama = headerMap["nama"] || headerMap["nama_lengkap"] || headerMap["nama_anggota"]
    const colJabatan = headerMap["jabatan"] || headerMap["posisi"]
    const colNip = headerMap["nig"] || headerMap["nip"] || headerMap["id_internal"] || headerMap["nip_id"]
    const colNoHp =
      headerMap["no_hp"] ||
      headerMap["nomor_hp"] ||
      headerMap["telepon"] ||
      headerMap["no_telepon"] ||
      headerMap["hp"]

    if (!colKodeDept || !colNama || !colJabatan) {
      return {
        success: false,
        totalProcessed: 0,
        totalSuccess: 0,
        totalFailed: 1,
        errors: [
          {
            row: 1,
            message:
              "Format kolom tidak sesuai. Kolom wajib: 'kode_departemen', 'nama', dan 'jabatan'. Kolom opsional: 'nip', 'no_hp'.",
          },
        ],
      }
    }

    const adminClient = createAdminClient()

    // 2. Pre-fetch seluruh departemen untuk mapping kode -> department_id
    const { data: deptList } = await adminClient
      .from("departments")
      .select("id, kode, nama, is_active")

    const deptByKode = new Map<string, { id: string; kode: string; nama: string; is_active: boolean }>()
    deptList?.forEach((d) => {
      deptByKode.set(d.kode.toUpperCase(), d)
    })

    // 3. Pre-fetch seluruh NIP aktif yang sudah ada di database per departemen
    const { data: existingMembers } = await adminClient
      .from("members")
      .select("department_id, nip")
      .is("deleted_at", null)
      .not("nip", "is", null)

    const existingNipSet = new Set<string>()
    existingMembers?.forEach((m) => {
      if (m.nip) {
        existingNipSet.add(`${m.department_id}:${m.nip.toLowerCase()}`)
      }
    })

    // Set untuk mendeteksi duplikat NIP di dalam file itu sendiri
    const fileNipSet = new Set<string>()

    const rowsToInsert: Array<{
      department_id: string
      nama: string
      nip: string | null
      jabatan: string
      no_hp: string | null
      is_active: boolean
    }> = []

    const rowErrors: Array<{ row: number; nip?: string; nama?: string; message: string }> = []
    let totalProcessed = 0

    // 4. Proses baris data mulai dari baris 2
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      if (!row || !row.hasValues) continue

      const rawKode = String(row.getCell(colKodeDept).text || row.getCell(colKodeDept).value || "").trim()
      const rawNama = String(row.getCell(colNama).text || row.getCell(colNama).value || "").trim()
      const rawJabatan = String(row.getCell(colJabatan).text || row.getCell(colJabatan).value || "").trim()
      const rawNip = colNip
        ? String(row.getCell(colNip).text || row.getCell(colNip).value || "").trim()
        : ""
      const rawNoHp = colNoHp
        ? String(row.getCell(colNoHp).text || row.getCell(colNoHp).value || "").trim()
        : ""

      // Lewati jika seluruh kolom wajib kosong (baris kosong tak sengaja)
      if (!rawKode && !rawNama && !rawJabatan) {
        continue
      }

      totalProcessed++

      // Validasi baris dengan Zod
      const parseResult = importMemberRowSchema.safeParse({
        kode_departemen: rawKode,
        nama: rawNama,
        jabatan: rawJabatan,
        nip: rawNip || null,
        no_hp: rawNoHp || null,
      })

      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0]?.message || "Data tidak valid"
        rowErrors.push({
          row: rowNumber,
          nama: rawNama,
          nip: rawNip,
          message: firstError,
        })
        continue
      }

      const rowData = parseResult.data

      // Validasi kode departemen
      const dept = deptByKode.get(rowData.kode_departemen.toUpperCase())
      if (!dept) {
        rowErrors.push({
          row: rowNumber,
          nama: rowData.nama,
          nip: rowData.nip || undefined,
          message: `Kode departemen '${rowData.kode_departemen}' tidak terdaftar di sistem.`,
        })
        continue
      }

      if (!dept.is_active) {
        rowErrors.push({
          row: rowNumber,
          nama: rowData.nama,
          nip: rowData.nip || undefined,
          message: `Departemen '${dept.nama}' (${dept.kode}) sedang nonaktif.`,
        })
        continue
      }

      // Validasi keunikan NIP per departemen
      if (rowData.nip) {
        const key = `${dept.id}:${rowData.nip.toLowerCase()}`

        if (fileNipSet.has(key)) {
          rowErrors.push({
            row: rowNumber,
            nama: rowData.nama,
            nip: rowData.nip,
            message: `NIG '${rowData.nip}' duplikat dalam berkas impor untuk departemen ${dept.kode}.`,
          })
          continue
        }

        if (existingNipSet.has(key)) {
          rowErrors.push({
            row: rowNumber,
            nama: rowData.nama,
            nip: rowData.nip,
            message: `NIG '${rowData.nip}' sudah terdaftar pada anggota aktif di departemen ${dept.kode}.`,
          })
          continue
        }

        fileNipSet.add(key)
      }

      rowsToInsert.push({
        department_id: dept.id,
        nama: rowData.nama,
        nip: rowData.nip,
        jabatan: rowData.jabatan,
        no_hp: rowData.no_hp,
        is_active: true,
      })
    }

    let insertedCount = 0
    if (rowsToInsert.length > 0) {
      // Insert dalam batch 100 baris menggunakan adminClient (layanan terproteksi peran)
      const chunkSize = 100
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize)
        const { error: insertError } = await adminClient.from("members").insert(chunk)
        if (insertError) {
          console.error("Batch insert error:", insertError.message)
          rowErrors.push({
            row: 0,
            message: `Gagal menyimpan sebagian data ke database: ${insertError.message}`,
          })
        } else {
          insertedCount += chunk.length
        }
      }
    }

    revalidatePath("/anggota")

    const totalSuccess = insertedCount
    const totalFailed = rowErrors.length

    return {
      success: totalFailed === 0,
      totalProcessed,
      totalSuccess,
      totalFailed,
      errors: rowErrors,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan internal saat memproses berkas"
    return {
      success: false,
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 1,
      errors: [{ row: 0, message: errorMsg }],
    }
  }
}
