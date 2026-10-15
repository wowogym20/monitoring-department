"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/auth"
import { Json } from "@/types/database"
import {
  AllSystemSettings,
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_CONTENT_SETTINGS,
  DEFAULT_SCORING_SETTINGS,
  DEFAULT_SYSTEM_CONFIG,
  DEFAULT_NOTIFICATION_SETTINGS,
  GeneralSettings,
  ContentSettings,
  ScoringSettings,
  SystemSettingsConfig,
  NotificationSettings,
} from "@/lib/settings/default-settings"
import {
  generalSettingsSchema,
  contentSettingsSchema,
  scoringSettingsSchema,
  systemSettingsSchema,
  notificationSettingsSchema,
  GeneralSettingsInput,
  ContentSettingsInput,
  ScoringSettingsInput,
  SystemSettingsInput,
  NotificationSettingsInput,
} from "@/lib/validations/settings"

export type ActionResult<T = unknown> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; error?: string }

/**
 * Mengambil seluruh pengaturan sistem dari Supabase dengan fallback ke nilai default aman.
 * Dapat dipanggil oleh semua role terautentikasi (untuk membaca branding, announcement, maintenance).
 */
export async function getSystemSettingsAction(): Promise<AllSystemSettings> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value, updated_at, updated_by")

    if (error || !data || data.length === 0) {
      return DEFAULT_SYSTEM_SETTINGS
    }

    const settingsMap = new Map<string, { value: unknown; updated_at?: string; updated_by?: string | null }>()
    data.forEach((row) => {
      settingsMap.set(row.key, {
        value: row.value,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      })
    })

    const generalData = (settingsMap.get("general")?.value as Partial<GeneralSettings>) || {}
    const contentData = (settingsMap.get("content")?.value as Partial<ContentSettings>) || {}
    const scoringData = (settingsMap.get("scoring")?.value as Partial<ScoringSettings>) || {}
    const systemData = (settingsMap.get("system")?.value as Partial<SystemSettingsConfig>) || {}
    const notificationData =
      (settingsMap.get("notifications")?.value as Partial<NotificationSettings>) || {}

    // Ambil nama pengubah terakhir jika ada
    let updatedByName: string | undefined
    const lastRow = data[0]
    if (lastRow?.updated_by) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nama")
        .eq("id", lastRow.updated_by)
        .single()
      if (profile?.nama) {
        updatedByName = profile.nama
      }
    }

    return {
      general: {
        ...DEFAULT_GENERAL_SETTINGS,
        ...generalData,
      },
      content: {
        ...DEFAULT_CONTENT_SETTINGS,
        ...contentData,
        announcement: {
          ...DEFAULT_CONTENT_SETTINGS.announcement,
          ...(contentData.announcement || {}),
        },
        leaderMessage: {
          ...DEFAULT_CONTENT_SETTINGS.leaderMessage,
          ...(contentData.leaderMessage || {}),
        },
        externalLinks: {
          ...DEFAULT_CONTENT_SETTINGS.externalLinks,
          ...(contentData.externalLinks || {}),
        },
      },
      scoring: {
        ...DEFAULT_SCORING_SETTINGS,
        ...scoringData,
        thresholds: {
          ...DEFAULT_SCORING_SETTINGS.thresholds,
          ...(scoringData.thresholds || {}),
        },
      },
      system: {
        ...DEFAULT_SYSTEM_CONFIG,
        ...systemData,
        maintenance: {
          ...DEFAULT_SYSTEM_CONFIG.maintenance,
          ...(systemData.maintenance || {}),
        },
        trash: {
          ...DEFAULT_SYSTEM_CONFIG.trash,
          ...(systemData.trash || {}),
        },
      },
      notifications: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...notificationData,
      },
      updatedAt: lastRow?.updated_at,
      updatedByName,
    }
  } catch (err) {
    console.warn("Gagal memuat system_settings dari Supabase, menggunakan default:", err)
    return DEFAULT_SYSTEM_SETTINGS
  }
}

/**
 * Menyimpan Pengaturan Identitas & Branding (Khusus Super Admin)
 */
export async function saveGeneralSettingsAction(
  input: GeneralSettingsInput
): Promise<ActionResult> {
  const currentUser = await requireRole("super_admin")

  const parsed = generalSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Data identitas tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "general",
        value: parsed.data,
        updated_at: new Date().toISOString(),
        updated_by: currentUser.id,
      },
      { onConflict: "key" }
    )

    if (error) {
      console.error("Error saving general settings:", error)
      return { success: false, message: `Gagal menyimpan: ${error.message}` }
    }

    revalidatePath("/", "layout")
    return {
      success: true,
      message: "Pengaturan identitas & branding berhasil diperbarui.",
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal"
    return { success: false, message: msg }
  }
}

/**
 * Menyimpan Pengaturan Konten & Pengumuman (Khusus Super Admin)
 */
export async function saveContentSettingsAction(
  input: ContentSettingsInput
): Promise<ActionResult> {
  const currentUser = await requireRole("super_admin")

  const parsed = contentSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Data konten tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "content",
        value: parsed.data,
        updated_at: new Date().toISOString(),
        updated_by: currentUser.id,
      },
      { onConflict: "key" }
    )

    if (error) {
      console.error("Error saving content settings:", error)
      return { success: false, message: `Gagal menyimpan: ${error.message}` }
    }

    revalidatePath("/", "layout")
    revalidatePath("/dashboard")
    return {
      success: true,
      message: "Pengaturan konten & pengumuman berhasil disimpan.",
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal"
    return { success: false, message: msg }
  }
}

/**
 * Menyimpan Pengaturan Kebijakan Penilaian (Khusus Super Admin)
 */
export async function saveScoringSettingsAction(
  input: ScoringSettingsInput
): Promise<ActionResult> {
  const currentUser = await requireRole("super_admin")

  const parsed = scoringSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Data kebijakan skor tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "scoring",
        value: parsed.data,
        updated_at: new Date().toISOString(),
        updated_by: currentUser.id,
      },
      { onConflict: "key" }
    )

    if (error) {
      console.error("Error saving scoring settings:", error)
      return { success: false, message: `Gagal menyimpan: ${error.message}` }
    }

    revalidatePath("/penilaian")
    revalidatePath("/rekap")
    revalidatePath("/dashboard")
    return {
      success: true,
      message: "Kebijakan dan ambang batas penilaian berhasil disimpan.",
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal"
    return { success: false, message: msg }
  }
}

/**
 * Menyimpan Pengaturan Mode Pemeliharaan & Sistem (Khusus Super Admin)
 */
export async function saveSystemSettingsAction(
  input: SystemSettingsInput
): Promise<ActionResult> {
  const currentUser = await requireRole("super_admin")

  const parsed = systemSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Data konfigurasi sistem tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "system",
        value: parsed.data,
        updated_at: new Date().toISOString(),
        updated_by: currentUser.id,
      },
      { onConflict: "key" }
    )

    if (error) {
      console.error("Error saving system settings:", error)
      return { success: false, message: `Gagal menyimpan: ${error.message}` }
    }

    revalidatePath("/", "layout")
    return {
      success: true,
      message: "Konfigurasi pemeliharaan & sistem berhasil diperbarui.",
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal"
    return { success: false, message: msg }
  }
}

/**
 * Menyimpan Pengaturan Notifikasi & Pengingat (Khusus Super Admin)
 */
export async function saveNotificationSettingsAction(
  input: NotificationSettingsInput
): Promise<ActionResult> {
  const currentUser = await requireRole("super_admin")

  const parsed = notificationSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Data preferensi notifikasi tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "notifications",
        value: parsed.data,
        updated_at: new Date().toISOString(),
        updated_by: currentUser.id,
      },
      { onConflict: "key" }
    )

    if (error) {
      console.error("Error saving notification settings:", error)
      return { success: false, message: `Gagal menyimpan: ${error.message}` }
    }

    revalidatePath("/", "layout")
    return {
      success: true,
      message: "Preferensi pengingat & notifikasi berhasil disimpan.",
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal"
    return { success: false, message: msg }
  }
}

/**
 * Mengunggah file logo baru dan menyimpannya ke general settings (Khusus Super Admin)
 */
export async function uploadLogoAction(
  formData: FormData
): Promise<ActionResult<{ logoUrl: string }>> {
  const currentUser = await requireRole("super_admin")

  const file = formData.get("logo") as File | null
  if (!file) {
    return { success: false, message: "File logo tidak ditemukan" }
  }

  // Validasi ukuran (maksimal 3MB)
  if (file.size > 3 * 1024 * 1024) {
    return { success: false, message: "Ukuran file logo maksimal 3MB" }
  }

  // Validasi tipe mime
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]
  if (!allowedMimes.includes(file.type)) {
    return {
      success: false,
      message: "Format file harus JPEG, PNG, WebP, atau SVG",
    }
  }

  try {
    const buffer = await file.arrayBuffer()
    const bytes = Buffer.from(buffer)

    let finalLogoUrl = ""

    // Coba upload ke Supabase Storage jika bucket avatars/branding tersedia
    try {
      const adminClient = createAdminClient()
      const ext = file.name.split(".").pop() || "png"
      const fileName = `logo-${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from("avatars")
        .upload(`branding/${fileName}`, bytes, {
          contentType: file.type,
          upsert: true,
        })

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = adminClient.storage
          .from("avatars")
          .getPublicUrl(`branding/${fileName}`)

        if (publicUrlData?.publicUrl) {
          finalLogoUrl = publicUrlData.publicUrl
        }
      }
    } catch {
      // Fallback: simpan sebagai base64 Data URL jika storage bucket belum siap
    }

    if (!finalLogoUrl) {
      finalLogoUrl = `data:${file.type};base64,${bytes.toString("base64")}`
    }

    // Ambil setting general saat ini dan update logoUrl
    const current = await getSystemSettingsAction()
    const updatedGeneral: GeneralSettings = {
      ...current.general,
      logoUrl: finalLogoUrl,
    }

    const supabase = await createClient()
    await supabase.from("system_settings").upsert(
      {
        key: "general",
        value: updatedGeneral,
        updated_at: new Date().toISOString(),
        updated_by: currentUser.id,
      },
      { onConflict: "key" }
    )

    revalidatePath("/", "layout")
    return {
      success: true,
      message: "Logo aplikasi berhasil diperbarui.",
      data: { logoUrl: finalLogoUrl },
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengunggah logo"
    return { success: false, message: msg }
  }
}

/**
 * Mereset pengaturan ke default pabrik (Khusus Super Admin)
 */
export async function resetSettingsAction(
  category?: "all" | "general" | "content" | "scoring" | "system" | "notifications"
): Promise<ActionResult> {
  const currentUser = await requireRole("super_admin")

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    if (!category || category === "all") {
      const rows: Array<{ key: string; value: unknown; updated_at: string; updated_by: string }> = [
        { key: "general", value: DEFAULT_GENERAL_SETTINGS, updated_at: now, updated_by: currentUser.id },
        { key: "content", value: DEFAULT_CONTENT_SETTINGS, updated_at: now, updated_by: currentUser.id },
        { key: "scoring", value: DEFAULT_SCORING_SETTINGS, updated_at: now, updated_by: currentUser.id },
        { key: "system", value: DEFAULT_SYSTEM_CONFIG, updated_at: now, updated_by: currentUser.id },
        { key: "notifications", value: DEFAULT_NOTIFICATION_SETTINGS, updated_at: now, updated_by: currentUser.id },
      ]

      for (const row of rows) {
        await supabase.from("system_settings").upsert(
          {
            key: row.key,
            value: row.value as Json,
            updated_at: row.updated_at,
            updated_by: row.updated_by,
          },
          { onConflict: "key" }
        )
      }
    } else {
      let defaultValue: unknown = DEFAULT_GENERAL_SETTINGS
      if (category === "content") defaultValue = DEFAULT_CONTENT_SETTINGS
      if (category === "scoring") defaultValue = DEFAULT_SCORING_SETTINGS
      if (category === "system") defaultValue = DEFAULT_SYSTEM_CONFIG
      if (category === "notifications") defaultValue = DEFAULT_NOTIFICATION_SETTINGS

      await supabase.from("system_settings").upsert(
        {
          key: category,
          value: defaultValue,
          updated_at: now,
          updated_by: currentUser.id,
        },
        { onConflict: "key" }
      )
    }

    revalidatePath("/", "layout")
    revalidatePath("/dashboard")
    return {
      success: true,
      message: "Pengaturan berhasil dikembalikan ke nilai default pabrik.",
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mereset pengaturan"
    return { success: false, message: msg }
  }
}

/**
 * Mengekspor seluruh snapshot konfigurasi dalam format JSON (Khusus Super Admin)
 */
export async function exportSettingsJsonAction(): Promise<ActionResult<{ jsonString: string; filename: string }>> {
  await requireRole("super_admin")

  try {
    const settings = await getSystemSettingsAction()
    const payload = {
      exportMeta: {
        appName: settings.general.appName,
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
      },
      settings,
    }

    const filename = `pengaturan-sistem-${new Date().toISOString().split("T")[0]}.json`
    return {
      success: true,
      message: "Snapshot konfigurasi berhasil dibuat.",
      data: {
        jsonString: JSON.stringify(payload, null, 2),
        filename,
      },
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengekspor konfigurasi"
    return { success: false, message: msg }
  }
}

/**
 * Mengimpor dan memvalidasi file JSON konfigurasi sistem (Khusus Super Admin)
 */
export async function importSettingsJsonAction(jsonString: string): Promise<ActionResult> {
  const currentUser = await requireRole("super_admin")

  try {
    const parsed = JSON.parse(jsonString)
    const settings = parsed.settings || parsed

    if (!settings.general || !settings.scoring) {
      return {
        success: false,
        message: "Format file JSON tidak valid. Komponen pengaturan utama tidak ditemukan.",
      }
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    const rowsToUpsert: Array<{ key: string; value: unknown; updated_at: string; updated_by: string }> = []

    if (settings.general) {
      const validGeneral = generalSettingsSchema.safeParse(settings.general)
      if (validGeneral.success) {
        rowsToUpsert.push({ key: "general", value: validGeneral.data, updated_at: now, updated_by: currentUser.id })
      }
    }

    if (settings.content) {
      const validContent = contentSettingsSchema.safeParse(settings.content)
      if (validContent.success) {
        rowsToUpsert.push({ key: "content", value: validContent.data, updated_at: now, updated_by: currentUser.id })
      }
    }

    if (settings.scoring) {
      const validScoring = scoringSettingsSchema.safeParse(settings.scoring)
      if (validScoring.success) {
        rowsToUpsert.push({ key: "scoring", value: validScoring.data, updated_at: now, updated_by: currentUser.id })
      }
    }

    if (settings.system) {
      const validSystem = systemSettingsSchema.safeParse(settings.system)
      if (validSystem.success) {
        rowsToUpsert.push({ key: "system", value: validSystem.data, updated_at: now, updated_by: currentUser.id })
      }
    }

    if (settings.notifications) {
      const validNotif = notificationSettingsSchema.safeParse(settings.notifications)
      if (validNotif.success) {
        rowsToUpsert.push({ key: "notifications", value: validNotif.data, updated_at: now, updated_by: currentUser.id })
      }
    }

    for (const row of rowsToUpsert) {
      await supabase.from("system_settings").upsert(
        {
          key: row.key,
          value: row.value as Json,
          updated_at: row.updated_at,
          updated_by: row.updated_by,
        },
        { onConflict: "key" }
      )
    }

    revalidatePath("/", "layout")
    revalidatePath("/dashboard")
    return {
      success: true,
      message: `Konfigurasi berhasil dipulihkan (${rowsToUpsert.length} modul pengaturan diperbarui).`,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memproses file konfigurasi JSON"
    return { success: false, message: msg }
  }
}

/**
 * Membersihkan langsung data tempat sampah yang kedaluwarsa sesuai retensi (Khusus Super Admin)
 */
export async function purgeTrashNowAction(): Promise<ActionResult<{ purgedCount: number }>> {
  await requireRole("super_admin")

  try {
    const supabase = await createClient()

    // Ambil setting retensi
    const settings = await getSystemSettingsAction()
    const retentionDays = settings.system.trash.retentionDays || 30

    // Panggil fungsi RPC purge jika ada, atau lakukan query langsung
    const { data: purgedCount, error } = await supabase.rpc(
      "purge_expired_trash_members" as never
    )

    if (error) {
      // Manual cleanup jika RPC terkendala
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
      const { data: membersToPurge } = await supabase
        .from("members")
        .select("id")
        .not("deleted_at", "is", null)
        .lt("deleted_at", cutoffDate)

      if (membersToPurge && membersToPurge.length > 0) {
        const ids = membersToPurge.map((m) => m.id)
        await supabase.from("assessments").delete().in("member_id", ids)
        await supabase.from("members").delete().in("id", ids)
        return {
          success: true,
          message: `Berhasil membersihkan ${ids.length} data anggota tempat sampah yang melewati ${retentionDays} hari.`,
          data: { purgedCount: ids.length },
        }
      }

      return {
        success: true,
        message: "Tidak ada data tempat sampah yang melebihi batas waktu retensi.",
        data: { purgedCount: 0 },
      }
    }

    return {
      success: true,
      message: `Pembersihan selesai. ${purgedCount || 0} data tempat sampah dibersihkan.`,
      data: { purgedCount: Number(purgedCount) || 0 },
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membersihkan tempat sampah"
    return { success: false, message: msg }
  }
}
