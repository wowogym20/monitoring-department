import { describe, it, expect } from "vitest"
import { navigationItems, NAV_SECTION_LABELS } from "@/components/layout/nav-items"

describe("Navigasi Role & Pemisahan Menu Main vs Menu Admin", () => {
  it("memiliki label section yang terdefinisi dengan benar", () => {
    expect(NAV_SECTION_LABELS.main).toBe("Main")
    expect(NAV_SECTION_LABELS.admin).toBe("Menu Admin")
  })

  it("seluruh item navigasi memiliki section valid ('main' atau 'admin')", () => {
    navigationItems.forEach((item) => {
      expect(["main", "admin"]).toContain(item.section)
      expect(item.title).toBeTruthy()
      expect(item.href.startsWith("/")).toBe(true)
      expect(item.roles.length).toBeGreaterThan(0)
    })
  })

  it("menu admin khusus super_admin mencakup pengguna, ketua, panduan, dan pengaturan", () => {
    const adminItems = navigationItems.filter((item) => item.section === "admin")
    const adminHrefs = adminItems.map((item) => item.href)

    expect(adminHrefs).toContain("/pengguna")
    expect(adminHrefs).toContain("/ketua")
    expect(adminHrefs).toContain("/panduan")
    expect(adminHrefs).toContain("/pengaturan")

    // Seluruh item di section admin HANYA boleh diakses super_admin
    adminItems.forEach((item) => {
      expect(item.roles).toEqual(["super_admin"])
      expect(item.roles.includes("admin")).toBe(false)
      expect(item.roles.includes("user")).toBe(false)
    })
  })

  it("menu main berisi menu operasional yang dapat diakses sesuai role", () => {
    const mainItems = navigationItems.filter((item) => item.section === "main")
    const mainHrefs = mainItems.map((item) => item.href)

    expect(mainHrefs).toContain("/dashboard")
    expect(mainHrefs).toContain("/anggota")
    expect(mainHrefs).toContain("/penilaian")
    expect(mainHrefs).toContain("/rekap")
    expect(mainHrefs).toContain("/departemen")
    expect(mainHrefs).toContain("/periode")
    expect(mainHrefs).toContain("/aspek")
    expect(mainHrefs).toContain("/ekspor")
    expect(mainHrefs).toContain("/profil")
  })

  it("memastikan role super_admin mendapatkan item pada kedua section (Main dan Menu Admin)", () => {
    const superAdminItems = navigationItems.filter((item) =>
      item.roles.includes("super_admin")
    )

    const mainCount = superAdminItems.filter((item) => item.section === "main").length
    const adminCount = superAdminItems.filter((item) => item.section === "admin").length

    expect(mainCount).toBeGreaterThan(0)
    expect(adminCount).toBe(4) // /pengguna, /ketua, /panduan, /pengaturan
  })

  it("memastikan role admin (Koordinator) dan user (Kepala Departemen) HANYA mendapatkan section Main", () => {
    const adminItems = navigationItems.filter((item) => item.roles.includes("admin"))
    const userItems = navigationItems.filter((item) => item.roles.includes("user"))

    // Tidak boleh ada satupun item admin yang lolos untuk role admin dan user
    expect(adminItems.filter((item) => item.section === "admin").length).toBe(0)
    expect(userItems.filter((item) => item.section === "admin").length).toBe(0)

    // Seluruh item yang didapat harus berada di section main
    adminItems.forEach((item) => expect(item.section).toBe("main"))
    userItems.forEach((item) => expect(item.section).toBe("main"))
  })
})
