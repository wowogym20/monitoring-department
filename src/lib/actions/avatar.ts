"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Ekstrak path storage dari URL avatar internal /api/avatar?path=...
 */
function extractStoragePathFromUrl(url: string | null): string | null {
  if (!url) return null
  try {
    if (url.includes("/api/avatar?path=")) {
      const parts = url.split("/api/avatar?path=")
      if (parts[1]) {
        return decodeURIComponent(parts[1])
      }
    }
  } catch {
    // fallback abaikan galat parsing URL
  }
  return null
}

/**
 * Upload foto profil baru:
 * - Validasi tipe dan batas ukuran 2MB
 * - Menggunakan admin client agar bekerja sempurna untuk seluruh role (super_admin, admin, user)
 * - Otomatis menghapus berkas avatar lama dari bucket avatars
 */
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

  const adminClient = createAdminClient()

  // 1. Ambil data profil saat ini untuk mengecek apakah ada avatar lama
  const { data: currentProfile } = await adminClient
    .from("profiles")
    .select("foto_url")
    .eq("id", user.id)
    .single()

  const oldStoragePath = extractStoragePathFromUrl(currentProfile?.foto_url || null)

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `avatar-${Date.now()}.${ext}`
  const filePath = `${user.id}/${fileName}`

  // Pastikan bucket avatars tersedia
  try {
    const { data: bucket } = await adminClient.storage.getBucket("avatars")
    if (!bucket) {
      await adminClient.storage.createBucket("avatars", {
        public: false,
        fileSizeLimit: 2 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      })
    }
  } catch (bucketErr) {
    console.warn("Pemeriksaan bucket avatars:", bucketErr)
  }

  // 2. Upload ke bucket avatars menggunakan adminClient untuk menjamin permission
  const fileBuffer = await file.arrayBuffer()
  const { error: uploadError } = await adminClient.storage
    .from("avatars")
    .upload(filePath, Buffer.from(fileBuffer), {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    return {
      success: false,
      error: "Gagal mengunggah foto: " + uploadError.message,
    }
  }

  // 3. Simpan path foto ke profil pengguna
  const avatarUrl = `/api/avatar?path=${encodeURIComponent(filePath)}`
  const { error: profileError } = await adminClient
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

  // 4. Jika ada foto lama di storage, bersihkan agar tidak ada sampah berkas
  if (oldStoragePath && oldStoragePath !== filePath) {
    try {
      await adminClient.storage.from("avatars").remove([oldStoragePath])
    } catch {
      // Non-kritis: lanjutkan jika berkas lama sudah tidak ada
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

/**
 * Hapus foto profil:
 * - Menghapus file fisik dari storage bucket 'avatars'
 * - Mengosongkan kolom foto_url di tabel profiles
 */
export async function deleteAvatarAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Anda belum login" }
  }

  const adminClient = createAdminClient()

  // Ambil profil saat ini
  const { data: currentProfile } = await adminClient
    .from("profiles")
    .select("foto_url")
    .eq("id", user.id)
    .single()

  const storagePath = extractStoragePathFromUrl(currentProfile?.foto_url || null)

  // Hapus berkas dari storage bucket jika ada
  if (storagePath) {
    try {
      await adminClient.storage.from("avatars").remove([storagePath])
    } catch (err: unknown) {
      console.error("Gagal menghapus file avatar dari storage:", err)
    }
  }

  // Set foto_url menjadi null
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      foto_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    return {
      success: false,
      error: "Gagal memperbarui profil: " + updateError.message,
    }
  }

  revalidatePath("/profil")
  revalidatePath("/dashboard", "layout")
  return {
    success: true,
    message: "Foto profil berhasil dihapus",
  }
}
