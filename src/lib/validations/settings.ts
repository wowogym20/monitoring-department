import { z } from "zod"

export const generalSettingsSchema = z.object({
  appName: z
    .string()
    .min(2, "Nama aplikasi minimal 2 karakter")
    .max(100, "Nama aplikasi maksimal 100 karakter"),
  appTagline: z
    .string()
    .min(2, "Tagline minimal 2 karakter")
    .max(150, "Tagline maksimal 150 karakter"),
  institutionName: z
    .string()
    .min(2, "Nama institusi minimal 2 karakter")
    .max(150, "Nama institusi maksimal 150 karakter"),
  appDescription: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter")
    .optional()
    .default(""),
  footerText: z
    .string()
    .min(2, "Teks footer minimal 2 karakter")
    .max(200, "Teks footer maksimal 200 karakter"),
  logoUrl: z.string().min(1, "URL Logo wajib diisi"),
  supportEmail: z
    .string()
    .email("Format email tidak valid")
    .or(z.literal("")),
  supportPhone: z
    .string()
    .max(30, "Nomor telepon maksimal 30 karakter")
    .optional()
    .default(""),
  supportHours: z
    .string()
    .max(100, "Jam operasional maksimal 100 karakter")
    .optional()
    .default(""),
  officeAddress: z
    .string()
    .max(300, "Alamat kantor maksimal 300 karakter")
    .optional()
    .default(""),
})

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>

export const contentSettingsSchema = z.object({
  announcement: z.object({
    isActive: z.boolean(),
    type: z.enum(["info", "warning", "success", "destructive"]),
    title: z
      .string()
      .min(2, "Judul pengumuman minimal 2 karakter")
      .max(100, "Judul pengumuman maksimal 100 karakter"),
    message: z
      .string()
      .min(5, "Isi pengumuman minimal 5 karakter")
      .max(1000, "Isi pengumuman maksimal 1000 karakter"),
    targetRoles: z
      .array(z.enum(["all", "super_admin", "admin", "user"]))
      .min(1, "Minimal pilih 1 target audiens"),
  }),
  leaderMessage: z.object({
    leaderName: z
      .string()
      .min(2, "Nama pimpinan minimal 2 karakter")
      .max(100, "Nama pimpinan maksimal 100 karakter"),
    leaderTitle: z
      .string()
      .min(2, "Jabatan pimpinan minimal 2 karakter")
      .max(100, "Jabatan pimpinan maksimal 100 karakter"),
    messageText: z
      .string()
      .max(1000, "Pesan amanat maksimal 1000 karakter")
      .optional()
      .default(""),
  }),
  externalLinks: z.object({
    manualUrl: z.string().url("Format URL panduan tidak valid").or(z.literal("")),
  }),
})

export type ContentSettingsInput = z.infer<typeof contentSettingsSchema>

export const scoringSettingsSchema = z
  .object({
    minScore: z.number().min(0).max(10),
    maxScore: z.number().min(1).max(10),
    thresholds: z.object({
      sangatBaik: z.number().min(1).max(5),
      baik: z.number().min(1).max(5),
      cukup: z.number().min(1).max(5),
      kurang: z.number().min(1).max(5),
    }),
    requireCommentBelowThreshold: z.boolean(),
    requireCommentThreshold: z.number().min(1).max(5),
    allowEvaluatorEditDraft: z.boolean(),
    autoLockOnClose: z.boolean(),
    allowBulkApproval: z.boolean(),
  })
  .refine(
    (data) =>
      data.thresholds.sangatBaik > data.thresholds.baik &&
      data.thresholds.baik > data.thresholds.cukup &&
      data.thresholds.cukup > data.thresholds.kurang,
    {
      message:
        "Urutan ambang batas tidak valid: Sangat Baik harus lebih tinggi dari Baik, Baik lebih tinggi dari Cukup, dan Cukup lebih tinggi dari Kurang.",
      path: ["thresholds", "sangatBaik"],
    }
  )

export type ScoringSettingsInput = z.infer<typeof scoringSettingsSchema>

export const systemSettingsSchema = z.object({
  maintenance: z.object({
    isActive: z.boolean(),
    message: z
      .string()
      .min(5, "Pesan pemeliharaan minimal 5 karakter")
      .max(500, "Pesan pemeliharaan maksimal 500 karakter"),
    allowSuperAdminBypass: z.boolean().default(true),
  }),
  trash: z.object({
    retentionDays: z
      .number()
      .int()
      .min(1, "Masa retensi minimal 1 hari")
      .max(365, "Masa retensi maksimal 365 hari"),
    autoPurgeEnabled: z.boolean(),
  }),
})

export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>

export const notificationSettingsSchema = z.object({
  remindH7: z.boolean(),
  remindH3: z.boolean(),
  remindH1: z.boolean(),
  commentBadge: z.boolean(),
})

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
