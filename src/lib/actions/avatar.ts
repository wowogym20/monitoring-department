"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function uploadAvatarAction(formData: FormData) {
  const file = formData.get("file") as File | null

  if (!file) {
    return { success: false, error: "Berkas foto belum dipilih" }
  }

  // Validasi ukuran (maks 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "Ukuran berkas maksimal 2MB" }
  }

  // Validasi format
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Format berkas harus JPEG, PNG, atau WebP",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Anda belum login" }
  }

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `avatar-${Date.now()}.${ext}`
  const filePath = `${user.id}/${fileName}`

  // Upload ke bucket avatars
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    return {
      success: false,
      error: "Gagal mengunggah foto: " + uploadError.message,
    }
  }

  // Simpan path foto ke profil pengguna
  const avatarUrl = `/api/avatar?path=${encodeURIComponent(filePath)}`
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      foto_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (profileError) {
    return {
      success: false,
      error: "Gagal memperbarui profil: " + profileError.message,
    }
  }

  revalidatePath("/profil")
  revalidatePath("/dashboard", "layout")
  return {
    success: true,
    fotoUrl: avatarUrl,
    message: "Foto profil berhasil diperbarui",
  }
}
