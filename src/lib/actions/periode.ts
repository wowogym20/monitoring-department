"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import {
  createPeriodSchema,
  updatePeriodSchema,
  togglePeriodStatusSchema,
  type CreatePeriodInput,
  type UpdatePeriodInput,
  type TogglePeriodStatusInput,
} from "@/lib/validations/master-data"
import { AssessmentPeriod } from "@/types/database"

/**
 * Mengambil seluruh periode penilaian terurut berdasarkan tanggal_mulai descending.
 * Dapat diakses oleh super_admin dan admin.
 */
export async function getPeriodeListServer(): Promise<AssessmentPeriod[]> {
  await requireRole("super_admin", "admin")

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("assessment_periods")
    .select("*")
    .order("tanggal_mulai", { ascending: false })

  if (error || !data) {
    console.error("Gagal mengambil periode:", error?.message)
    return []
  }

  return data
}

/**
 * Server Action: Buat Periode Penilaian Baru (Super Admin & Admin)
 */
export async function createPeriodAction(input: CreatePeriodInput) {
  try {
    await requireRole("super_admin", "admin")

    const validated = createPeriodSchema.parse(input)
    const supabase = await createClient()

    const { error } = await supabase.from("assessment_periods").insert({
      nama: validated.nama,
      tanggal_mulai: validated.tanggal_mulai,
      tanggal_akhir: validated.tanggal_akhir,
      status: validated.status,
    })

    if (error) {
      return { success: false, error: `Gagal membuat periode: ${error.message}` }
    }

    revalidatePath("/periode")
    return { success: true, message: `Periode '${validated.nama}' berhasil dibuat.` }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Ubah Periode Penilaian (Super Admin & Admin)
 */
export async function updatePeriodAction(input: UpdatePeriodInput) {
  try {
    await requireRole("super_admin", "admin")

    const validated = updatePeriodSchema.parse(input)
    const supabase = await createClient()

    const { error } = await supabase
      .from("assessment_periods")
      .update({
        nama: validated.nama,
        tanggal_mulai: validated.tanggal_mulai,
        tanggal_akhir: validated.tanggal_akhir,
      })
      .eq("id", validated.id)

    if (error) {
      return { success: false, error: `Gagal memperbarui periode: ${error.message}` }
    }

    revalidatePath("/periode")
    return { success: true, message: `Periode '${validated.nama}' berhasil diperbarui.` }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Buka / Tutup Periode Penilaian
 * Aturan Penting PRD: Setelah ditutup, HANYA super_admin yang bisa membuka kembali.
 */
export async function togglePeriodStatusAction(input: TogglePeriodStatusInput) {
  try {
    const currentUser = await requireRole("super_admin", "admin")

    const validated = togglePeriodStatusSchema.parse(input)
    const supabase = await createClient()

    // 1. Ambil status periode saat ini
    const { data: currentPeriod, error: fetchErr } = await supabase
      .from("assessment_periods")
      .select("id, nama, status")
      .eq("id", validated.id)
      .single()

    if (fetchErr || !currentPeriod) {
      return { success: false, error: "Periode tidak ditemukan." }
    }

    // 2. Jika hendak MEMBUKA KEMBALI periode yang sudah ditutup (closed -> open),
    // hanya super_admin yang diperbolehkan!
    if (
      currentPeriod.status === "closed" &&
      validated.status === "open" &&
      currentUser.role !== "super_admin"
    ) {
      return {
        success: false,
        error:
          "Hanya Super-Admin (Pimpinan) yang berwenang membuka kembali periode yang sudah ditutup.",
      }
    }

    const { error: updateErr } = await supabase
      .from("assessment_periods")
      .update({ status: validated.status })
      .eq("id", validated.id)

    if (updateErr) {
      return { success: false, error: `Gagal mengubah status periode: ${updateErr.message}` }
    }

    revalidatePath("/periode")
    return {
      success: true,
      message: `Status periode '${currentPeriod.nama}' berhasil diubah menjadi ${
        validated.status === "open" ? "Terbuka (Open)" : "Ditutup (Closed)"
      }.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

import { z } from "zod"

/**
 * Server Action: Hapus Periode Penilaian (Khusus Super Admin)
 */
export async function deletePeriodAction(id: string) {
  try {
    await requireRole("super_admin")

    const validatedId = z.string().uuid("ID Periode tidak valid").parse(id)
    const supabase = await createClient()

    // Cek apakah ada penilaian di periode ini
    const { count, error: countErr } = await supabase
      .from("assessments")
      .select("*", { count: "exact", head: true })
      .eq("period_id", validatedId)

    if (countErr) {
      return { success: false, error: `Gagal memeriksa penilaian: ${countErr.message}` }
    }

    if (count && count > 0) {
      return {
        success: false,
        error:
          "Periode ini tidak dapat dihapus karena sudah memiliki riwayat penilaian. Anda dapat menutup periode.",
      }
    }

    const { error: delErr } = await supabase
      .from("assessment_periods")
      .delete()
      .eq("id", validatedId)

    if (delErr) {
      return { success: false, error: `Gagal menghapus periode: ${delErr.message}` }
    }

    revalidatePath("/periode")
    return { success: true, message: "Periode penilaian berhasil dihapus." }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}
