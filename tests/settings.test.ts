import { describe, it, expect } from "vitest"
import {
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_CONTENT_SETTINGS,
  DEFAULT_SCORING_SETTINGS,
  DEFAULT_SYSTEM_CONFIG,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "@/lib/settings/default-settings"
import {
  generalSettingsSchema,
  contentSettingsSchema,
  scoringSettingsSchema,
  systemSettingsSchema,
  notificationSettingsSchema,
} from "@/lib/validations/settings"
import { navigationItems } from "@/components/layout/nav-items"

describe("Fitur Menu Pengaturan Khusus Super Admin", () => {
  describe("1. Keamanan Menu & Kontrol Akses Role (PRD Bagian 10)", () => {
    it("item menu /pengaturan HANYA terdaftar untuk role super_admin", () => {
      const pengaturanItem = navigationItems.find((item) => item.href === "/pengaturan")
      expect(pengaturanItem).toBeDefined()
      expect(pengaturanItem?.roles).toEqual(["super_admin"])
      expect(pengaturanItem?.roles).not.toContain("admin")
      expect(pengaturanItem?.roles).not.toContain("user")
    })

    it("menu pengaturan memiliki label yang jelas dan ikon Settings", () => {
      const pengaturanItem = navigationItems.find((item) => item.href === "/pengaturan")
      expect(pengaturanItem?.title).toBe("Pengaturan")
      expect(pengaturanItem?.icon).toBeDefined()
    })
  })

  describe("2. Integritas Nilai Default Pengaturan Sistem (Fallback Safe)", () => {
    it("memiliki data bawaan resmi Pondok Modern Tazakka", () => {
      expect(DEFAULT_GENERAL_SETTINGS.appName).toBe("Monitoring Departemen")
      expect(DEFAULT_GENERAL_SETTINGS.institutionName).toBe("Pondok Modern Tazakka")
      expect(DEFAULT_GENERAL_SETTINGS.logoUrl).toBe("/Logo.jpeg")
      expect(DEFAULT_GENERAL_SETTINGS.supportEmail).toBe("sdm@tazakka.or.id")
    })

    it("memiliki konfigurasi ambang batas penilaian standar (Sangat Baik >= 4.50, Baik >= 3.50, Cukup >= 2.50, Kurang >= 1.50)", () => {
      expect(DEFAULT_SCORING_SETTINGS.thresholds.sangatBaik).toBe(4.5)
      expect(DEFAULT_SCORING_SETTINGS.thresholds.baik).toBe(3.5)
      expect(DEFAULT_SCORING_SETTINGS.thresholds.cukup).toBe(2.5)
      expect(DEFAULT_SCORING_SETTINGS.thresholds.kurang).toBe(1.5)
      expect(DEFAULT_SCORING_SETTINGS.requireCommentBelowThreshold).toBe(true)
    })

    it("memiliki konfigurasi pemeliharaan dan retensi tempat sampah yang aman", () => {
      expect(DEFAULT_SYSTEM_CONFIG.maintenance.isActive).toBe(false)
      expect(DEFAULT_SYSTEM_CONFIG.maintenance.allowSuperAdminBypass).toBe(true)
      expect(DEFAULT_SYSTEM_CONFIG.trash.retentionDays).toBe(30)
      expect(DEFAULT_SYSTEM_CONFIG.trash.autoPurgeEnabled).toBe(true)
    })

    it("memiliki konfigurasi pengingat periode H-7, H-3, H-1", () => {
      expect(DEFAULT_NOTIFICATION_SETTINGS.remindH7).toBe(true)
      expect(DEFAULT_NOTIFICATION_SETTINGS.remindH3).toBe(true)
      expect(DEFAULT_NOTIFICATION_SETTINGS.remindH1).toBe(true)
      expect(DEFAULT_NOTIFICATION_SETTINGS.commentBadge).toBe(true)
    })
  })

  describe("3. Validasi Skema Zod Form Pengaturan", () => {
    it("memvalidasi data identitas & branding yang valid", () => {
      const result = generalSettingsSchema.safeParse(DEFAULT_GENERAL_SETTINGS)
      expect(result.success).toBe(true)
    })

    it("menolak email dukungan dengan format yang salah", () => {
      const invalid = {
        ...DEFAULT_GENERAL_SETTINGS,
        supportEmail: "bukan-email-valid",
      }
      const result = generalSettingsSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("email")
      }
    })

    it("memvalidasi konten siaran pengumuman & amanat pimpinan", () => {
      const result = contentSettingsSchema.safeParse(DEFAULT_CONTENT_SETTINGS)
      expect(result.success).toBe(true)
    })

    it("menolak pengumuman dengan judul yang terlalu pendek", () => {
      const invalid = {
        ...DEFAULT_CONTENT_SETTINGS,
        announcement: {
          ...DEFAULT_CONTENT_SETTINGS.announcement,
          title: "A",
        },
      }
      const result = contentSettingsSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it("memvalidasi kebijakan skor dan memeriksa konsistensi hierarki ambang batas", () => {
      const result = scoringSettingsSchema.safeParse(DEFAULT_SCORING_SETTINGS)
      expect(result.success).toBe(true)
    })

    it("menolak ambang batas jika urutan terbalik (misal Sangat Baik <= Baik)", () => {
      const invalid = {
        ...DEFAULT_SCORING_SETTINGS,
        thresholds: {
          sangatBaik: 3.0,
          baik: 4.0, // Error: Baik lebih tinggi dari Sangat Baik
          cukup: 2.5,
          kurang: 1.5,
        },
      }
      const result = scoringSettingsSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Urutan ambang batas tidak valid")
      }
    })

    it("memvalidasi konfigurasi mode pemeliharaan dan retensi sampah", () => {
      const result = systemSettingsSchema.safeParse(DEFAULT_SYSTEM_CONFIG)
      expect(result.success).toBe(true)
    })

    it("menolak retensi tempat sampah yang di luar rentang (misal 0 hari atau 500 hari)", () => {
      const invalidZero = {
        ...DEFAULT_SYSTEM_CONFIG,
        trash: {
          retentionDays: 0,
          autoPurgeEnabled: true,
        },
      }
      expect(systemSettingsSchema.safeParse(invalidZero).success).toBe(false)

      const invalidOver = {
        ...DEFAULT_SYSTEM_CONFIG,
        trash: {
          retentionDays: 500,
          autoPurgeEnabled: true,
        },
      }
      expect(systemSettingsSchema.safeParse(invalidOver).success).toBe(false)
    })

    it("memvalidasi preferensi notifikasi", () => {
      const result = notificationSettingsSchema.safeParse(DEFAULT_NOTIFICATION_SETTINGS)
      expect(result.success).toBe(true)
    })
  })

  describe("4. Serialisasi & Parsing Snapshot Cadangan Konfigurasi (JSON Backup)", () => {
    it("dapat mengekspor dan memulihkan konfigurasi lengkap ke/dari format JSON", () => {
      const backupJson = JSON.stringify({
        exportMeta: {
          appName: DEFAULT_SYSTEM_SETTINGS.general.appName,
          exportedAt: new Date().toISOString(),
          version: "1.0.0",
        },
        settings: DEFAULT_SYSTEM_SETTINGS,
      })

      const parsed = JSON.parse(backupJson)
      expect(parsed.exportMeta.appName).toBe("Monitoring Departemen")
      expect(parsed.settings.general.institutionName).toBe("Pondok Modern Tazakka")
      expect(parsed.settings.scoring.thresholds.sangatBaik).toBe(4.5)
    })
  })
})
