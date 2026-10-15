export interface GeneralSettings {
  appName: string
  appTagline: string
  institutionName: string
  appDescription: string
  footerText: string
  logoUrl: string
  supportEmail: string
  supportPhone: string
  supportHours: string
  officeAddress: string
}

export type AnnouncementType = "info" | "warning" | "success" | "destructive"
export type AnnouncementRoleTarget = "all" | "super_admin" | "admin" | "user"

export interface ContentSettings {
  announcement: {
    isActive: boolean
    type: AnnouncementType
    title: string
    message: string
    targetRoles: AnnouncementRoleTarget[]
  }
  leaderMessage: {
    leaderName: string
    leaderTitle: string
    messageText: string
  }
  externalLinks: {
    manualUrl: string
  }
}

export interface ScoringSettings {
  minScore: number
  maxScore: number
  thresholds: {
    sangatBaik: number
    baik: number
    cukup: number
    kurang: number
  }
  requireCommentBelowThreshold: boolean
  requireCommentThreshold: number
  allowEvaluatorEditDraft: boolean
  autoLockOnClose: boolean
  allowBulkApproval: boolean
}

export interface SystemSettingsConfig {
  maintenance: {
    isActive: boolean
    message: string
    allowSuperAdminBypass: boolean
  }
  trash: {
    retentionDays: number
    autoPurgeEnabled: boolean
  }
}

export interface NotificationSettings {
  remindH7: boolean
  remindH3: boolean
  remindH1: boolean
  commentBadge: boolean
}

export interface AllSystemSettings {
  general: GeneralSettings
  content: ContentSettings
  scoring: ScoringSettings
  system: SystemSettingsConfig
  notifications: NotificationSettings
  updatedAt?: string
  updatedByName?: string
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  appName: "Monitoring Departemen",
  appTagline: "Sistem Penilaian Kinerja",
  institutionName: "Pondok Modern Tazakka",
  appDescription:
    "Platform evaluasi dan monitoring kinerja berkala seluruh departemen dan asatidz di lingkungan Pondok Modern Tazakka.",
  footerText: "© 2026 Pondok Modern Tazakka. All rights reserved.",
  logoUrl: "/Logo.jpeg",
  supportEmail: "sdm@tazakka.or.id",
  supportPhone: "+62 812-3456-7890",
  supportHours: "Senin - Jumat, 08:00 - 16:00 WIB",
  officeAddress:
    "Jl. Bandar-Batang km. 9, Desa Sidayu, Kec. Bandar, Batang, Jawa Tengah 51254",
}

export const DEFAULT_CONTENT_SETTINGS: ContentSettings = {
  announcement: {
    isActive: false,
    type: "info",
    title: "Pengumuman Penting",
    message:
      "Pastikan seluruh evaluasi kinerja departemen diselesaikan sebelum batas waktu periode berakhir.",
    targetRoles: ["all"],
  },
  leaderMessage: {
    leaderName: "KH. Anang Rikza Masyhadi, M.A.",
    leaderTitle: "Pimpinan Pondok Modern Tazakka",
    messageText:
      "Kinerja adalah cerminan dedikasi dan keikhlasan dalam berkhidmah. Lakukan evaluasi secara objektif, amanah, dan membangun demi kemajuan pondok.",
  },
  externalLinks: {
    manualUrl: "",
  },
}

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  minScore: 1.0,
  maxScore: 5.0,
  thresholds: {
    sangatBaik: 4.5,
    baik: 3.5,
    cukup: 2.5,
    kurang: 1.5,
  },
  requireCommentBelowThreshold: true,
  requireCommentThreshold: 2.5,
  allowEvaluatorEditDraft: true,
  autoLockOnClose: true,
  allowBulkApproval: true,
}

export const DEFAULT_SYSTEM_CONFIG: SystemSettingsConfig = {
  maintenance: {
    isActive: false,
    message:
      "Sistem sedang dalam proses pemeliharaan berkala. Mode baca-saja aktif sementara.",
    allowSuperAdminBypass: true,
  },
  trash: {
    retentionDays: 30,
    autoPurgeEnabled: true,
  },
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  remindH7: true,
  remindH3: true,
  remindH1: true,
  commentBadge: true,
}

export const DEFAULT_SYSTEM_SETTINGS: AllSystemSettings = {
  general: DEFAULT_GENERAL_SETTINGS,
  content: DEFAULT_CONTENT_SETTINGS,
  scoring: DEFAULT_SCORING_SETTINGS,
  system: DEFAULT_SYSTEM_CONFIG,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
}
