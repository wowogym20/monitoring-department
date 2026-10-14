"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth"
import {
  createAspectSchema,
  updateAspectSchema,
  reorderAspectSchema,
  type CreateAspectInput,
  type UpdateAspectInput,
  type ReorderAspectInput,
} from "@/lib/validations/master-data"
import { AssessmentAspect } from "@/types/database"

/**
 * Mengambil seluruh aspek penilaian terurut berdasarkan 'urutan'.
 * Dapat diakses oleh super_admin dan admin.
 */
export async function getAspekListServer(): Promise<AssessmentAspect[]> {
  await requireRole("super_admin", "admin")

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("assessment_aspects")
    .select("*")
    .order("urutan", { ascending: true })

  if (error || !data) {
    console.error("Gagal mengambil aspek:", error?.message)
    return []
  }

  return data
}

/**
 * Server Action: Tambah Aspek Penilaian Baru (Khusus Super Admin)
 */
export async function createAspectAction(input: CreateAspectInput) {
  try {
    await requireRole("super_admin")

    const validated = createAspectSchema.parse(input)
    const supabase = await createClient()

    const { error } = await supabase.from("assessment_aspects").insert({
      nama: validated.nama,
      deskripsi: validated.deskripsi,
      urutan: validated.urutan,
      is_active: validated.is_active,
    })

    if (error) {
      return { success: false, error: `Gagal membuat aspek: ${error.message}` }
    }

    revalidatePath("/aspek")
    return { success: true, message: `Aspek '${validated.nama}' berhasil ditambahkan.` }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Ubah Aspek Penilaian (Khusus Super Admin)
 */
export async function updateAspectAction(input: UpdateAspectInput) {
  try {
    await requireRole("super_admin")

    const validated = updateAspectSchema.parse(input)
    const supabase = await createClient()

    const { error } = await supabase
      .from("assessment_aspects")
      .update({
        nama: validated.nama,
        deskripsi: validated.deskripsi,
        urutan: validated.urutan,
        is_active: validated.is_active,
      })
      .eq("id", validated.id)

    if (error) {
      return { success: false, error: `Gagal memperbarui aspek: ${error.message}` }
    }

    revalidatePath("/aspek")
    return { success: true, message: `Aspek '${validated.nama}' berhasil diperbarui.` }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

import { z } from "zod"

/**
 * Server Action: Toggle Aktif/Nonaktif Aspek (Khusus Super Admin)
 */
export async function toggleAspectStatusAction(id: string, is_active: boolean) {
  try {
    await requireRole("super_admin")

    const validatedId = z.string().uuid("ID Aspek tidak valid").parse(id)
    const validatedActive = z.boolean().parse(is_active)

    const supabase = await createClient()
    const { error } = await supabase
      .from("assessment_aspects")
      .update({ is_active: validatedActive })
      .eq("id", validatedId)

    if (error) {
      return { success: false, error: `Gagal mengubah status aspek: ${error.message}` }
    }

    revalidatePath("/aspek")
    return {
      success: true,
      message: `Aspek berhasil di${is_active ? "aktifkan" : "nonaktifkan"}.`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Ubah Urutan Aspek (Naik / Turun) (Khusus Super Admin)
 */
export async function reorderAspectAction(input: ReorderAspectInput) {
  try {
    await requireRole("super_admin")

    const validated = reorderAspectSchema.parse(input)
    const supabase = await createClient()

    // 1. Ambil semua aspek terurut
    const { data: aspects, error: fetchErr } = await supabase
      .from("assessment_aspects")
      .select("id, urutan")
      .order("urutan", { ascending: true })

    if (fetchErr || !aspects || aspects.length === 0) {
      return { success: false, error: "Gagal memuat daftar aspek" }
    }

    const currentIndex = aspects.findIndex((a) => a.id === validated.id)
    if (currentIndex === -1) {
      return { success: false, error: "Aspek tidak ditemukan" }
    }

    const targetIndex =
      validated.direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= aspects.length) {
      // Sudah di posisi paling atas atau paling bawah
      return { success: true, message: "Urutan aspek sudah berada di batas." }
    }

    const currentItem = aspects[currentIndex]
    const targetItem = aspects[targetIndex]

    // Tukar urutan
    const tempUrutan = currentItem.urutan
    let newCurrentUrutan = targetItem.urutan
    let newTargetUrutan = tempUrutan

    // Jika urutan sama persis, pastikan nilainya berbeda
    if (newCurrentUrutan === newTargetUrutan) {
      newCurrentUrutan = targetIndex + 1
      newTargetUrutan = currentIndex + 1
    }

    // Update item saat ini
    await supabase
      .from("assessment_aspects")
      .update({ urutan: newCurrentUrutan })
      .eq("id", currentItem.id)

    // Update item target
    await supabase
      .from("assessment_aspects")
      .update({ urutan: newTargetUrutan })
      .eq("id", targetItem.id)

    revalidatePath("/aspek")
    return { success: true, message: "Urutan aspek berhasil diubah." }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}

/**
 * Server Action: Hapus Aspek Penilaian (Khusus Super Admin)
 */
export async function deleteAspectAction(id: string) {
  try {
    await requireRole("super_admin")

    const validatedId = z.string().uuid("ID Aspek tidak valid").parse(id)
    const supabase = await createClient()

    // Cek apakah aspek sudah digunakan dalam lembar penilaian
    const { count, error: countErr } = await supabase
      .from("assessment_scores")
      .select("*", { count: "exact", head: true })
      .eq("aspect_id", validatedId)

    if (countErr) {
      return { success: false, error: `Gagal memeriksa riwayat penilaian: ${countErr.message}` }
    }

    if (count && count > 0) {
      return {
        success: false,
        error:
          "Aspek ini tidak dapat dihapus karena sudah digunakan dalam riwayat penilaian. Silakan nonaktifkan status aspek.",
      }
    }

    const { error: delErr } = await supabase
      .from("assessment_aspects")
      .delete()
      .eq("id", validatedId)

    if (delErr) {
      return { success: false, error: `Gagal menghapus aspek: ${delErr.message}` }
    }

    revalidatePath("/aspek")
    return { success: true, message: "Aspek penilaian berhasil dihapus." }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan pada server"
    return { success: false, error: errorMsg }
  }
}
