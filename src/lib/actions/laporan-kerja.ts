"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import {
  createLaporanKerjaSchema,
  updateLaporanKerjaSchema,
  updateStatusLaporanSchema,
} from "@/lib/validations/laporan-kerja"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export interface LaporanKerjaItem {
  id: number
  nip: string
  nama_pegawai: string
  judul: string
  tanggal: string
  jam: string
  keterangan: string
  foto_file: string | null
  foto_url: string | null
  status: "Y" | "N" | "PENDING"
  status_label: "Disetujui" | "Ditolak" | "Pending"
}

export interface LaporanKerjaApiResponse {
  status: "success" | "error"
  total: number
  page: number
  limit: number
  total_pages: number
  data: LaporanKerjaItem[]
  message?: string
}

export interface GetLaporanKerjaParams {
  nip?: string
  status?: "PENDING" | "Y" | "N"
  tanggal_mulai?: string
  tanggal_selesai?: string
  bulan?: number
  tahun?: number
  page?: number
  limit?: number
}

export interface MutationResult {
  success: boolean
  message: string
  id?: number
}

const DEFAULT_API_BASE = "https://absensi.tazakka.or.id/api/laporan-kerja.php"
const DEFAULT_API_KEY = "tazakka_secret_key_2026"

function getApiConfig() {
  const apiKey = process.env.TAZAKKA_API_KEY || DEFAULT_API_KEY
  const apiBase = process.env.TAZAKKA_API_URL || DEFAULT_API_BASE
  return { apiKey, apiBase }
}

function formatMutationError(
  error: unknown,
  defaultMessage = "Terjadi kesalahan saat menghubungi API Tazakka"
): string {
  if (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.name === "TimeoutError" ||
      error.message.toLowerCase().includes("aborted"))
  ) {
    return "Koneksi ke server API Tazakka mengalami timeout (melebihi batas waktu)"
  }
  return error instanceof Error ? error.message : defaultMessage
}

function createTimeoutSignal(timeoutMs = 15000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  }
}

/**
 * Mengambil data laporan kerja dari API Tazakka secara efisien.
 * Menggunakan Next.js Data Cache dengan revalidasi berkala (60 detik)
 * untuk menjamin data selalu dimuat cepat tanpa membebani server asal.
 */
export async function getLaporanKerjaServer(
  params?: GetLaporanKerjaParams
): Promise<LaporanKerjaApiResponse> {
  const { apiKey, apiBase } = getApiConfig()
  const url = new URL(apiBase)
  url.searchParams.set("api_key", apiKey)

  if (params?.nip) url.searchParams.set("nip", params.nip)
  if (params?.status) url.searchParams.set("status", params.status)
  if (params?.tanggal_mulai) url.searchParams.set("tanggal_mulai", params.tanggal_mulai)
  if (params?.tanggal_selesai) url.searchParams.set("tanggal_selesai", params.tanggal_selesai)
  if (params?.bulan) url.searchParams.set("bulan", params.bulan.toString())
  if (params?.tahun) url.searchParams.set("tahun", params.tahun.toString())
  if (params?.page) url.searchParams.set("page", params.page.toString())
  if (params?.limit) {
    url.searchParams.set("limit", params.limit.toString())
  } else {
    url.searchParams.set("limit", "100")
  }

  const timeoutMs = Number(process.env.TAZAKKA_API_TIMEOUT_MS) || 10000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60,
        tags: ["laporan-kerja"],
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const json = (await response.json()) as LaporanKerjaApiResponse
    return {
      status: json.status || "success",
      total: json.total || (json.data ? json.data.length : 0),
      page: json.page || 1,
      limit: json.limit || 100,
      total_pages: json.total_pages || 1,
      data: Array.isArray(json.data) ? json.data : [],
    }
  } catch (error) {
    const isAbort =
      error instanceof Error &&
      (error.name === "AbortError" ||
        error.name === "TimeoutError" ||
        error.message.toLowerCase().includes("aborted"))

    const message = isAbort
      ? "Koneksi ke server API Tazakka mengalami batas waktu (timeout). Server absensi saat ini tidak merespons atau sedang offline."
      : error instanceof Error
        ? error.message
        : "Gagal memuat data dari server API Tazakka"

    // Gunakan console.warn string agar Turbopack (Next.js 16) tidak mencegat sebagai unhandled console error overlay
    console.warn(`[getLaporanKerjaServer] ${isAbort ? "Timeout" : "Gagal memuat data"}: ${message}`)

    return {
      status: "error",
      total: 0,
      page: 1,
      limit: 50,
      total_pages: 0,
      data: [],
      message,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

interface MutationRequestOptions {
  action: "add" | "update" | "status" | "delete"
  method?: "POST" | "PUT" | "PATCH" | "DELETE"
  body?: FormData | Record<string, unknown>
  queryParams?: Record<string, string | number | undefined | null>
}

interface MutationResponse {
  success: boolean
  message: string
  id?: number
  new_status?: string
}

/**
 * Helper terpusat untuk memproses mutasi ke API Tazakka.
 * Mendukung metode HTTP POST serta fallback otomatis ke HTTP GET
 * jika server Tazakka merespons 405 Method Not Allowed ("Hanya metode GET yang didukung").
 */
async function executeTazakkaMutation(
  options: MutationRequestOptions
): Promise<MutationResponse> {
  const { apiKey, apiBase } = getApiConfig()
  const { signal, cleanup } = createTimeoutSignal(15000)

  try {
    // 1. Coba request via POST / metode utama terlebih dahulu
    const postUrl = new URL(apiBase)
    postUrl.searchParams.set("api_key", apiKey)
    postUrl.searchParams.set("action", options.action)

    if (options.queryParams) {
      for (const [k, v] of Object.entries(options.queryParams)) {
        if (v !== undefined && v !== null) postUrl.searchParams.set(k, String(v))
      }
    }

    const headers: Record<string, string> = {
      "X-Api-Key": apiKey,
      Accept: "application/json",
    }

    let postBody: BodyInit | undefined = undefined
    if (options.body instanceof FormData) {
      postBody = options.body
    } else if (options.body && typeof options.body === "object") {
      headers["Content-Type"] = "application/json"
      postBody = JSON.stringify(options.body)
    }

    let response: Response | null = null
    let responseText = ""
    let result: Record<string, unknown> | null = null
    let isMethodNotAllowed = false

    try {
      response = await fetch(postUrl.toString(), {
        method: options.method || "POST",
        headers,
        body: postBody,
        signal,
      })

      if (typeof response.text === "function") {
        responseText = await response.text()
        try {
          result = JSON.parse(responseText)
        } catch {
          result = null
        }
      } else if (typeof response.json === "function") {
        result = (await response.json()) as Record<string, unknown>
        responseText = JSON.stringify(result)
      }

      const resMessage = String(result?.message || responseText || "")
      if (
        response.status === 405 ||
        resMessage.includes("Method Not Allowed") ||
        resMessage.toLowerCase().includes("hanya metode get")
      ) {
        isMethodNotAllowed = true
      }
    } catch (postErr) {
      const errMsg = postErr instanceof Error ? postErr.message : String(postErr)
      if (errMsg.toLowerCase().includes("405") || errMsg.toLowerCase().includes("method not allowed")) {
        isMethodNotAllowed = true
      } else {
        throw postErr
      }
    }

    // Jika POST berhasil dan response OK
    if (!isMethodNotAllowed && response && response.ok && result?.status === "success") {
      return {
        success: true,
        message: (result.message as string) || "Operasi berhasil",
        id: result.id as number | undefined,
        new_status: result.new_status as string | undefined,
      }
    }

    // 2. Fallback otomatis ke HTTP GET jika metode non-GET ditolak
    if (isMethodNotAllowed || (!response?.ok && response?.status === 405)) {
      const getUrl = new URL(apiBase)
      getUrl.searchParams.set("api_key", apiKey)
      getUrl.searchParams.set("action", options.action)
      getUrl.searchParams.set("_method", options.method || "POST")

      if (options.queryParams) {
        for (const [k, v] of Object.entries(options.queryParams)) {
          if (v !== undefined && v !== null) getUrl.searchParams.set(k, String(v))
        }
      }

      if (options.body instanceof FormData) {
        for (const [key, val] of options.body.entries()) {
          if (typeof val === "string") {
            getUrl.searchParams.set(key, val)
          }
        }
      } else if (options.body && typeof options.body === "object") {
        for (const [key, val] of Object.entries(options.body)) {
          if (val !== undefined && val !== null) {
            getUrl.searchParams.set(key, String(val))
          }
        }
      }

      const getResponse = await fetch(getUrl.toString(), {
        method: "GET",
        headers: {
          "X-Api-Key": apiKey,
          Accept: "application/json",
        },
        signal,
      })

      let getRawText = ""
      let getResult: Record<string, unknown> | null = null
      if (typeof getResponse.text === "function") {
        getRawText = await getResponse.text()
        try {
          getResult = JSON.parse(getRawText)
        } catch {
          getResult = null
        }
      } else if (typeof getResponse.json === "function") {
        getResult = (await getResponse.json()) as Record<string, unknown>
        getRawText = JSON.stringify(getResult)
      }

      if (getResponse.ok && getResult?.status === "success") {
        return {
          success: true,
          message: (getResult.message as string) || "Operasi berhasil",
          id: getResult.id as number | undefined,
          new_status: getResult.new_status as string | undefined,
        }
      }

      const getMsg = String(getResult?.message || getRawText || "")
      if (getMsg.toLowerCase().includes("hanya metode get") || getMsg.includes("Method Not Allowed")) {
        return {
          success: false,
          message:
            "Server API Tazakka (absensi.tazakka.or.id) belum mengaktifkan endpoint operasi ini. Silakan perbarui file api/laporan-kerja.php di server Tazakka.",
        }
      }

      return {
        success: false,
        message: (getResult?.message as string) || "Gagal melakukan operasi di server API Tazakka",
      }
    }

    return {
      success: false,
      message:
        (result?.message as string) ||
        (responseText ? responseText.slice(0, 150) : "Gagal memproses permintaan di server API Tazakka"),
    }
  } catch (error) {
    return {
      success: false,
      message: formatMutationError(error, "Terjadi kesalahan saat menghubungi API Tazakka"),
    }
  } finally {
    cleanup()
  }
}

async function validateUserDepartmentMember(
  currentUser: Awaited<ReturnType<typeof requireRole>> | null | undefined,
  nip: string
): Promise<{ allowed: boolean; message?: string }> {
  if (!currentUser || currentUser.role !== "user" || !currentUser.department?.id) {
    return { allowed: true }
  }

  try {
    const supabase = await createClient()
    const { data: members, error } = await supabase
      .from("members")
      .select("id, nip")
      .eq("department_id", currentUser.department.id)
      .is("deleted_at", null)

    if (error || !members || members.length === 0) {
      return { allowed: true }
    }

    const cleanNip = nip.trim().toLowerCase()
    const isMatch = members.some(
      (m) =>
        (m.nip && m.nip.trim().toLowerCase() === cleanNip) ||
        m.id.toLowerCase() === cleanNip
    )

    if (!isMatch) {
      return {
        allowed: false,
        message: "Anda hanya berhak menambahkan laporan kerja untuk anggota di departemen Anda",
      }
    }
  } catch {
    return { allowed: true }
  }

  return { allowed: true }
}

/**
 * CREATE: Menambahkan Laporan Kerja baru ke server Tazakka via API.
 * Terbuka untuk seluruh role: Super Admin, Admin, dan User.
 */
export async function createLaporanKerjaAction(
  formData: FormData
): Promise<MutationResult> {
  const currentUser = await requireRole("super_admin", "admin", "user")

  const rawData = {
    nip: (formData.get("nip") as string) || "",
    nama: (formData.get("nama") as string) || "",
    tanggal: (formData.get("tanggal") as string) || "",
    keterangan: (formData.get("keterangan") as string) || "",
  }

  const validated = createLaporanKerjaSchema.safeParse(rawData)
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || "Validasi data gagal",
    }
  }

  const deptCheck = await validateUserDepartmentMember(currentUser, rawData.nip)
  if (!deptCheck.allowed) {
    return {
      success: false,
      message: deptCheck.message || "Akses ditolak",
    }
  }

  const res = await executeTazakkaMutation({
    action: "add",
    method: "POST",
    body: formData,
    queryParams: {
      nip: rawData.nip,
      nama: rawData.nama,
      tanggal: rawData.tanggal,
    },
  })

  if (!res.success) {
    return { success: false, message: res.message }
  }

  revalidateTag("laporan-kerja", "default")
  revalidatePath("/laporan-kerja")

  return {
    success: true,
    message: "Laporan kerja berhasil ditambahkan",
    id: res.id,
  }
}

/**
 * UPDATE: Memperbarui Laporan Kerja di server Tazakka via API.
 * Terbuka untuk seluruh role: Super Admin, Admin, dan User.
 */
export async function updateLaporanKerjaAction(
  id: number,
  formData: FormData
): Promise<MutationResult> {
  await requireRole("super_admin", "admin", "user")

  const rawData = {
    id,
    nama: (formData.get("nama") as string) || "",
    tanggal: (formData.get("tanggal") as string) || "",
    keterangan: (formData.get("keterangan") as string) || "",
  }

  const validated = updateLaporanKerjaSchema.safeParse(rawData)
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || "Validasi data gagal",
    }
  }

  formData.set("id", id.toString())

  const res = await executeTazakkaMutation({
    action: "update",
    method: "POST",
    body: formData,
    queryParams: {
      id,
      nama: rawData.nama,
      tanggal: rawData.tanggal,
    },
  })

  if (!res.success) {
    return { success: false, message: res.message }
  }

  revalidateTag("laporan-kerja", "default")
  revalidatePath("/laporan-kerja")

  return {
    success: true,
    message: "Laporan kerja berhasil diperbarui",
  }
}

/**
 * STATUS / APPROVAL: Mengubah status persetujuan laporan kerja.
 * Terbuka untuk seluruh role: Super Admin, Admin, dan User.
 */
export async function updateStatusLaporanKerjaAction(
  id: number,
  status: "Y" | "N" | "PENDING"
): Promise<MutationResult> {
  await requireRole("super_admin", "admin", "user")

  const validated = updateStatusLaporanSchema.safeParse({ id, status })
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0]?.message || "Status tidak valid",
    }
  }

  const res = await executeTazakkaMutation({
    action: "status",
    method: "POST",
    body: { id, status },
    queryParams: { id, status },
  })

  if (!res.success) {
    return { success: false, message: res.message }
  }

  revalidateTag("laporan-kerja", "default")
  revalidatePath("/laporan-kerja")

  const label = status === "Y" ? "disetujui" : status === "N" ? "ditolak" : "diubah ke pending"
  return {
    success: true,
    message: `Laporan kerja berhasil ${label}`,
  }
}

/**
 * DELETE: Menghapus laporan kerja dari server Tazakka via API.
 * Terbuka untuk seluruh role: Super Admin, Admin, dan User.
 */
export async function deleteLaporanKerjaAction(id: number): Promise<MutationResult> {
  await requireRole("super_admin", "admin", "user")

  if (!id || id <= 0) {
    return { success: false, message: "ID laporan kerja tidak valid" }
  }

  const res = await executeTazakkaMutation({
    action: "delete",
    method: "POST",
    body: { id },
    queryParams: { id },
  })

  if (!res.success) {
    return { success: false, message: res.message }
  }

  revalidateTag("laporan-kerja", "default")
  revalidatePath("/laporan-kerja")

  return {
    success: true,
    message: "Laporan kerja berhasil dihapus",
  }
}

export interface BulkMutationResult {
  success: boolean
  message: string
  totalRequested: number
  successCount: number
  failureCount: number
}

/**
 * BULK STATUS: Memperbarui status persetujuan banyak laporan kerja sekaligus.
 * Terbuka untuk seluruh role: Super Admin, Admin, dan User.
 */
export async function bulkUpdateStatusLaporanKerjaAction(
  ids: number[],
  status: "Y" | "N" | "PENDING"
): Promise<BulkMutationResult> {
  await requireRole("super_admin", "admin", "user")

  if (!ids || ids.length === 0) {
    return {
      success: false,
      message: "Tidak ada data laporan kerja yang dipilih",
      totalRequested: 0,
      successCount: 0,
      failureCount: 0,
    }
  }

  let successCount = 0
  let failureCount = 0

  await Promise.all(
    ids.map(async (id) => {
      const res = await executeTazakkaMutation({
        action: "status",
        method: "POST",
        body: { id, status },
        queryParams: { id, status },
      })
      if (res.success) {
        successCount++
      } else {
        failureCount++
      }
    })
  )

  revalidateTag("laporan-kerja", "default")
  revalidatePath("/laporan-kerja")

  const statusLabel =
    status === "Y" ? "disetujui" : status === "N" ? "ditolak" : "diubah ke pending"

  return {
    success: successCount > 0,
    message: `${successCount} dari ${ids.length} laporan berhasil ${statusLabel}${
      failureCount > 0 ? ` (${failureCount} gagal)` : ""
    }`,
    totalRequested: ids.length,
    successCount,
    failureCount,
  }
}

/**
 * BULK DELETE: Menghapus banyak laporan kerja dari server Tazakka sekaligus.
 * Terbuka untuk seluruh role: Super Admin, Admin, dan User.
 */
export async function bulkDeleteLaporanKerjaAction(
  ids: number[]
): Promise<BulkMutationResult> {
  await requireRole("super_admin", "admin", "user")

  if (!ids || ids.length === 0) {
    return {
      success: false,
      message: "Tidak ada data laporan kerja yang dipilih",
      totalRequested: 0,
      successCount: 0,
      failureCount: 0,
    }
  }

  let successCount = 0
  let failureCount = 0

  await Promise.all(
    ids.map(async (id) => {
      const res = await executeTazakkaMutation({
        action: "delete",
        method: "POST",
        body: { id },
        queryParams: { id },
      })
      if (res.success) {
        successCount++
      } else {
        failureCount++
      }
    })
  )

  revalidateTag("laporan-kerja", "default")
  revalidatePath("/laporan-kerja")

  return {
    success: successCount > 0,
    message: `${successCount} dari ${ids.length} laporan kerja berhasil dihapus${
      failureCount > 0 ? ` (${failureCount} gagal)` : ""
    }`,
    totalRequested: ids.length,
    successCount,
    failureCount,
  }
}

