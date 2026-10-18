"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import {
  createLaporanKerjaSchema,
  updateLaporanKerjaSchema,
  updateStatusLaporanSchema,
} from "@/lib/validations/laporan-kerja"
import { requireRole } from "@/lib/auth"

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

/**
 * CREATE: Menambahkan Laporan Kerja baru ke server Tazakka via API.
 */
export async function createLaporanKerjaAction(
  formData: FormData
): Promise<MutationResult> {
  await requireRole("super_admin", "admin", "user")

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

  const { apiKey, apiBase } = getApiConfig()
  const url = new URL(apiBase)
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("action", "add")

  const { signal, cleanup } = createTimeoutSignal(15000)

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
      signal,
    })

    const result = await response.json()
    if (!response.ok || result.status !== "success") {
      return {
        success: false,
        message: result.message || "Gagal membuat laporan kerja di server",
      }
    }

    revalidateTag("laporan-kerja", "default")
    revalidatePath("/laporan-kerja")

    return {
      success: true,
      message: "Laporan kerja berhasil ditambahkan",
      id: result.id,
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

/**
 * UPDATE: Memperbarui Laporan Kerja di server Tazakka via API.
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

  const { apiKey, apiBase } = getApiConfig()
  const url = new URL(apiBase)
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("action", "update")
  formData.set("id", id.toString())

  const { signal, cleanup } = createTimeoutSignal(15000)

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
      signal,
    })

    const result = await response.json()
    if (!response.ok || result.status !== "success") {
      return {
        success: false,
        message: result.message || "Gagal memperbarui laporan kerja",
      }
    }

    revalidateTag("laporan-kerja", "default")
    revalidatePath("/laporan-kerja")

    return {
      success: true,
      message: "Laporan kerja berhasil diperbarui",
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

  const { apiKey, apiBase } = getApiConfig()
  const url = new URL(apiBase)
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("action", "status")

  const { signal, cleanup } = createTimeoutSignal(15000)

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ id, status }),
      signal,
    })

    const result = await response.json()
    if (!response.ok || result.status !== "success") {
      return {
        success: false,
        message: result.message || "Gagal memperbarui status laporan",
      }
    }

    revalidateTag("laporan-kerja", "default")
    revalidatePath("/laporan-kerja")

    const label = status === "Y" ? "disetujui" : status === "N" ? "ditolak" : "diubah ke pending"
    return {
      success: true,
      message: `Laporan kerja berhasil ${label}`,
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

/**
 * DELETE: Menghapus laporan kerja dari server Tazakka via API.
 * Terbuka untuk seluruh role: Super Admin, Admin, dan User.
 */
export async function deleteLaporanKerjaAction(id: number): Promise<MutationResult> {
  await requireRole("super_admin", "admin", "user")

  if (!id || id <= 0) {
    return { success: false, message: "ID laporan kerja tidak valid" }
  }

  const { apiKey, apiBase } = getApiConfig()
  const url = new URL(apiBase)
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("action", "delete")

  const { signal, cleanup } = createTimeoutSignal(15000)

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ id }),
      signal,
    })

    const result = await response.json()
    if (!response.ok || result.status !== "success") {
      return {
        success: false,
        message: result.message || "Gagal menghapus laporan kerja",
      }
    }

    revalidateTag("laporan-kerja", "default")
    revalidatePath("/laporan-kerja")

    return {
      success: true,
      message: "Laporan kerja berhasil dihapus",
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

  const { apiKey, apiBase } = getApiConfig()
  const url = new URL(apiBase)
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("action", "status")

  const { signal, cleanup } = createTimeoutSignal(15000)

  let successCount = 0
  let failureCount = 0

  try {
    await Promise.all(
      ids.map(async (id) => {
        try {
          const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": apiKey,
            },
            body: JSON.stringify({ id, status }),
            signal,
          })
          const result = await response.json()
          if (response.ok && result.status === "success") {
            successCount++
          } else {
            failureCount++
          }
        } catch {
          failureCount++
        }
      })
    )
  } finally {
    cleanup()
  }

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

  const { apiKey, apiBase } = getApiConfig()
  const url = new URL(apiBase)
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("action", "delete")

  const { signal, cleanup } = createTimeoutSignal(15000)

  let successCount = 0
  let failureCount = 0

  try {
    await Promise.all(
      ids.map(async (id) => {
        try {
          const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": apiKey,
            },
            body: JSON.stringify({ id }),
            signal,
          })
          const result = await response.json()
          if (response.ok && result.status === "success") {
            successCount++
          } else {
            failureCount++
          }
        } catch {
          failureCount++
        }
      })
    )
  } finally {
    cleanup()
  }

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

