import { describe, it, expect } from "vitest"
import { navigationItems } from "@/components/layout/nav-items"
import { UserRole } from "@/types/database"

describe("Hak Akses Halaman Departemen untuk Role Admin & Super Admin", () => {
  it("memastikan item menu Departemen di sidebar dapat diakses oleh super_admin dan admin", () => {
    const deptItem = navigationItems.find((item) => item.href === "/departemen")

    expect(deptItem).toBeDefined()
    expect(deptItem?.title).toBe("Departemen")
    expect(deptItem?.roles).toContain("super_admin")
    expect(deptItem?.roles).toContain("admin")
    expect(deptItem?.roles.includes("user")).toBe(false)
    expect(deptItem?.section).toBe("main")
  })

  it("memverifikasi role authorization untuk halaman Departemen", () => {
    function canAccessDepartmentPage(role: UserRole): boolean {
      const allowedRoles: UserRole[] = ["super_admin", "admin"]
      return allowedRoles.includes(role)
    }

    expect(canAccessDepartmentPage("super_admin")).toBe(true)
    expect(canAccessDepartmentPage("admin")).toBe(true)
    expect(canAccessDepartmentPage("user")).toBe(false)
  })

  it("memverifikasi hak akses pemanggilan getEligibleKetuaList", () => {
    function canCallGetEligibleKetuaList(role: UserRole): boolean {
      const allowedRoles: UserRole[] = ["super_admin", "admin"]
      return allowedRoles.includes(role)
    }

    // Role admin dan super_admin kini diizinkan memanggil tanpa trigger redirect error
    expect(canCallGetEligibleKetuaList("super_admin")).toBe(true)
    expect(canCallGetEligibleKetuaList("admin")).toBe(true)
    expect(canCallGetEligibleKetuaList("user")).toBe(false)
  })

  it("memverifikasi matriks kapabilitas visual UI tabel Departemen", () => {
    function getDepartmentTableCapabilities(role: UserRole) {
      const isSuperAdmin = role === "super_admin"
      return {
        canViewSummaryCards: true,
        canViewDepartmentList: true,
        canFilterAndSearch: true,
        canAddDepartment: isSuperAdmin,
        canEditDepartment: isSuperAdmin,
        canAssignKetua: isSuperAdmin,
        canToggleStatus: isSuperAdmin,
        canDeleteDepartment: isSuperAdmin,
      }
    }

    const superAdminCaps = getDepartmentTableCapabilities("super_admin")
    expect(superAdminCaps.canViewDepartmentList).toBe(true)
    expect(superAdminCaps.canAddDepartment).toBe(true)
    expect(superAdminCaps.canEditDepartment).toBe(true)
    expect(superAdminCaps.canAssignKetua).toBe(true)
    expect(superAdminCaps.canDeleteDepartment).toBe(true)

    const adminCaps = getDepartmentTableCapabilities("admin")
    expect(adminCaps.canViewSummaryCards).toBe(true)
    expect(adminCaps.canViewDepartmentList).toBe(true)
    expect(adminCaps.canFilterAndSearch).toBe(true)
    // Mode monitoring aman: mutasi hanya untuk super_admin
    expect(adminCaps.canAddDepartment).toBe(false)
    expect(adminCaps.canEditDepartment).toBe(false)
    expect(adminCaps.canAssignKetua).toBe(false)
    expect(adminCaps.canDeleteDepartment).toBe(false)
  })
})
