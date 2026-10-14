import { describe, it, expect } from "vitest"
import { navigationItems } from "@/components/layout/nav-items"
import { MANUAL_CONFIGS, ManualRole } from "@/lib/panduan/manual-pdf-types"
import { generateManualPdfBuffer } from "@/lib/panduan/manual-pdf-generator"

describe("Fitur Menu & Buku Panduan Khusus Super Admin", () => {
  it("memastikan item menu Buku & Panduan hanya dapat diakses oleh role super_admin", () => {
    const panduanItem = navigationItems.find((item) => item.href === "/panduan")

    expect(panduanItem).toBeDefined()
    expect(panduanItem?.title).toBe("Buku & Panduan")
    expect(panduanItem?.roles).toEqual(["super_admin"])
    expect(panduanItem?.roles.includes("admin")).toBe(false)
    expect(panduanItem?.roles.includes("user")).toBe(false)
  })

  it("memiliki konfigurasi metadata lengkap untuk 4 varian buku panduan", () => {
    const roles: ManualRole[] = ["all", "user", "admin", "super_admin"]

    roles.forEach((role) => {
      const config = MANUAL_CONFIGS[role]
      expect(config).toBeDefined()
      expect(config.title).toBeTruthy()
      expect(config.subtitle).toBeTruthy()
      expect(config.targetAudience).toBeTruthy()
      expect(config.version).toBeTruthy()
      expect(config.institution).toContain("Pondok Modern Tazakka")
      expect(config.filename.endsWith(".pdf")).toBe(true)
    })
  })

  it("berhasil menghasilkan file buffer PDF valid (magic bytes %PDF-) untuk seluruh varian role", async () => {
    const roles: ManualRole[] = ["all", "user", "admin", "super_admin"]

    for (const role of roles) {
      const buffer = await generateManualPdfBuffer(role)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(1000)

      // Header PDF resmi selalu diawali karakter magic bytes "%PDF-"
      const magicBytes = buffer.subarray(0, 5).toString("ascii")
      expect(magicBytes).toBe("%PDF-")
    }
  }, 30000)
})
