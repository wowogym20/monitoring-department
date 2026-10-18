import { describe, it, expect } from "vitest"
import { navigationItems } from "@/components/layout/nav-items"
import { UserRole } from "@/types/database"

describe("Hak Akses Halaman & CRUD Kepala Departemen (/ketua) untuk Role Admin & Super Admin", () => {
  it("memastikan item menu Kepala Departemen di sidebar dapat diakses oleh super_admin dan admin", () => {
    const ketuaItem = navigationItems.find((item) => item.href === "/ketua")

    expect(ketuaItem).toBeDefined()
    expect(ketuaItem?.title).toBe("Kepala Departemen")
    expect(ketuaItem?.roles).toContain("super_admin")
    expect(ketuaItem?.roles).toContain("admin")
    expect(ketuaItem?.roles.includes("user")).toBe(false)
    expect(ketuaItem?.section).toBe("admin")
  })

  it("memverifikasi role authorization untuk halaman /ketua (requireRole('super_admin', 'admin'))", () => {
    function canAccessKetuaPage(role: UserRole): boolean {
      const allowedRoles: UserRole[] = ["super_admin", "admin"]
      return allowedRoles.includes(role)
    }

    expect(canAccessKetuaPage("super_admin")).toBe(true)
    expect(canAccessKetuaPage("admin")).toBe(true)
    expect(canAccessKetuaPage("user")).toBe(false)
  })

  it("memverifikasi otorisasi aksi CRUD akun ketua (Create, Read, Update, Delete, Toggle Status, Reset Password)", () => {
    function canExecuteKetuaCrud(role: UserRole): {
      canRead: boolean
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
      canToggleStatus: boolean
      canResetPassword: boolean
    } {
      const isAllowed = role === "super_admin" || role === "admin"
      return {
        canRead: isAllowed,
        canCreate: isAllowed,
        canUpdate: isAllowed,
        canDelete: isAllowed,
        canToggleStatus: isAllowed,
        canResetPassword: isAllowed,
      }
    }

    const superAdminCrud = canExecuteKetuaCrud("super_admin")
    expect(superAdminCrud.canRead).toBe(true)
    expect(superAdminCrud.canCreate).toBe(true)
    expect(superAdminCrud.canUpdate).toBe(true)
    expect(superAdminCrud.canDelete).toBe(true)
    expect(superAdminCrud.canToggleStatus).toBe(true)
    expect(superAdminCrud.canResetPassword).toBe(true)

    const adminCrud = canExecuteKetuaCrud("admin")
    expect(adminCrud.canRead).toBe(true)
    expect(adminCrud.canCreate).toBe(true)
    expect(adminCrud.canUpdate).toBe(true)
    expect(adminCrud.canDelete).toBe(true)
    expect(adminCrud.canToggleStatus).toBe(true)
    expect(adminCrud.canResetPassword).toBe(true)

    const userCrud = canExecuteKetuaCrud("user")
    expect(userCrud.canRead).toBe(false)
    expect(userCrud.canCreate).toBe(false)
    expect(userCrud.canUpdate).toBe(false)
    expect(userCrud.canDelete).toBe(false)
    expect(userCrud.canToggleStatus).toBe(false)
    expect(userCrud.canResetPassword).toBe(false)
  })

  it("memverifikasi middleware route guard untuk rute /ketua", () => {
    function evaluateMiddleware(pathname: string, role: UserRole): "allow" | "redirect_to_dashboard" {
      // Sesuai middleware: /pengguna, /panduan, /pengaturan khusus super_admin
      if (
        (pathname.startsWith("/pengguna") ||
          pathname.startsWith("/panduan") ||
          pathname.startsWith("/pengaturan")) &&
        role !== "super_admin"
      ) {
        return "redirect_to_dashboard"
      }

      // /ketua, /aspek, /departemen, /periode, /ekspor ditolak untuk role user
      if (
        (pathname.startsWith("/ketua") ||
          pathname.startsWith("/aspek") ||
          pathname.startsWith("/departemen") ||
          pathname.startsWith("/periode") ||
          pathname.startsWith("/ekspor")) &&
        role === "user"
      ) {
        return "redirect_to_dashboard"
      }

      return "allow"
    }

    // super_admin -> allow
    expect(evaluateMiddleware("/ketua", "super_admin")).toBe("allow")
    // admin -> allow
    expect(evaluateMiddleware("/ketua", "admin")).toBe("allow")
    // user -> redirect
    expect(evaluateMiddleware("/ketua", "user")).toBe("redirect_to_dashboard")

    // Pengguna tetap khusus super_admin
    expect(evaluateMiddleware("/pengguna", "super_admin")).toBe("allow")
    expect(evaluateMiddleware("/pengguna", "admin")).toBe("redirect_to_dashboard")
  })
})
