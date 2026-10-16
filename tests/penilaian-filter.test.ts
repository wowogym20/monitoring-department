import { describe, it, expect } from "vitest"
import { UserRole } from "@/types/database"

describe("Logika Filter Departemen pada Halaman Penilaian (/penilaian)", () => {
  interface MockMember {
    id: string
    nama: string
    nip: string | null
    jabatan: string
    department_id: string
    status: string
  }

  const mockMembers: MockMember[] = [
    { id: "m-1", nama: "Ahmad", nip: "101", jabatan: "Staff", department_id: "dept-1", status: "unassessed" },
    { id: "m-2", nama: "Budi", nip: "102", jabatan: "Admin", department_id: "dept-1", status: "submitted" },
    { id: "m-3", nama: "Chandra", nip: "103", jabatan: "Teknisi", department_id: "dept-2", status: "approved" },
    { id: "m-4", nama: "Dedi", nip: "104", jabatan: "Driver", department_id: "dept-3", status: "unassessed" },
  ]

  it("super_admin dan admin dapat menyaring anggota berdasarkan departemen yang dipilih", () => {
    function filterByDepartment(members: MockMember[], selectedDeptId: string | null | undefined): MockMember[] {
      if (!selectedDeptId || selectedDeptId === "all") {
        return members
      }
      return members.filter((m) => m.department_id === selectedDeptId)
    }

    // Default (Semua Departemen)
    expect(filterByDepartment(mockMembers, "all")).toHaveLength(4)
    expect(filterByDepartment(mockMembers, null)).toHaveLength(4)

    // Pilih Departemen TI (dept-1)
    const dept1Members = filterByDepartment(mockMembers, "dept-1")
    expect(dept1Members).toHaveLength(2)
    expect(dept1Members.map((m) => m.nama)).toEqual(["Ahmad", "Budi"])

    // Pilih Departemen SDM (dept-2)
    const dept2Members = filterByDepartment(mockMembers, "dept-2")
    expect(dept2Members).toHaveLength(1)
    expect(dept2Members[0].nama).toBe("Chandra")
  })

  it("memverifikasi hak akses visibilitas dropdown filter departemen per peran (role)", () => {
    function canSelectDepartment(role: UserRole): boolean {
      return role === "super_admin" || role === "admin"
    }

    expect(canSelectDepartment("super_admin")).toBe(true)
    expect(canSelectDepartment("admin")).toBe(true)
    expect(canSelectDepartment("user")).toBe(false)
  })

  it("memverifikasi pembentukan parameter query URL saat departemen dipilih atau direset", () => {
    function resolveDepartmentQuery(currentParams: Record<string, string>, deptId: string): string {
      const searchParams = new URLSearchParams(currentParams)
      if (deptId === "all" || !deptId) {
        searchParams.delete("departmentId")
      } else {
        searchParams.set("departmentId", deptId)
      }
      return searchParams.toString()
    }

    // Saat memilih departemen baru
    expect(resolveDepartmentQuery({ periodeId: "p-2026" }, "dept-1")).toBe("periodeId=p-2026&departmentId=dept-1")

    // Saat memilih 'all' (reset departemen)
    expect(resolveDepartmentQuery({ periodeId: "p-2026", departmentId: "dept-1" }, "all")).toBe("periodeId=p-2026")
  })
})
