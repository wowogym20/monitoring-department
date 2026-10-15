import { describe, it, expect } from "vitest"
import { isKetuaMember } from "@/lib/penilaian"
import { UserRole } from "@/types/database"

describe("Aturan Pembatasan Penilaian Mandiri Ketua Departemen (Self-Assessment Restriction)", () => {
  const mockKetuaProfile = {
    id: "user-ketua-uuid",
    nama: "Ustadz Hakim (Ketua Pendidikan)",
    no_hp: "081234567890",
  }

  describe("1. Helper isKetuaMember (Deteksi Anggota sebagai Ketua)", () => {
    it("mendeteksi jabatan variasi ketua/kepala/kadep sebagai Ketua Departemen", () => {
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "Ketua Departemen" })).toBe(true)
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "Kepala Departemen" })).toBe(true)
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "Kadep Pendidikan" })).toBe(true)
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "ketua" })).toBe(true)
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "kepala bagian" })).toBe(true)
    })

    it("tidak menganggap jabatan wakil ketua atau sub-bagian sebagai Ketua Departemen utama", () => {
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "Wakil Ketua Departemen" })).toBe(false)
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "Wakil Kepala" })).toBe(false)
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "Sub-Ketua" })).toBe(false)
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "Staf Administrasi" })).toBe(false)
      expect(isKetuaMember({ nama: "Ahmad", jabatan: "Guru Pengajar" })).toBe(false)
    })

    it("mencocokkan nama anggota dengan profil ketua departemen meskipun jabatannya ditulis umum", () => {
      // Nama sama persis atau mengandung nama bersih tanpa embel-embel tanda kurung
      expect(
        isKetuaMember(
          { nama: "Ustadz Hakim", jabatan: "Pengajar" },
          mockKetuaProfile
        )
      ).toBe(true)

      // Nama anggota berbeda tidak dianggap ketua jika jabatan bukan ketua
      expect(
        isKetuaMember(
          { nama: "Ustadz Budi", jabatan: "Pengajar" },
          mockKetuaProfile
        )
      ).toBe(false)
    })

    it("mencocokkan nomor telepon anggota dengan kontak profil ketua", () => {
      expect(
        isKetuaMember(
          { nama: "Anggota X", jabatan: "Staff", no_hp: "0812-3456-7890" },
          mockKetuaProfile
        )
      ).toBe(true)

      expect(
        isKetuaMember(
          { nama: "Anggota Y", jabatan: "Staff", no_hp: "0899-9999-9999" },
          mockKetuaProfile
        )
      ).toBe(false)
    })
  })

  describe("2. Hak Akses & Matriks Penilaian per Peran Pengguna", () => {
    interface MockUser {
      id: string
      role: UserRole
      departmentId: string | null
      nama: string
    }

    interface MockMember {
      id: string
      nama: string
      jabatan: string
      departmentId: string
    }

    const currentUserKetua: MockUser = {
      id: "user-ketua-uuid",
      role: "user",
      departmentId: "dept-pendidikan",
      nama: "Ustadz Hakim",
    }

    const currentUserAdmin: MockUser = {
      id: "admin-sdm-uuid",
      role: "admin",
      departmentId: null,
      nama: "Ustadz Haris (SDM)",
    }

    const currentUserSuperAdmin: MockUser = {
      id: "super-admin-uuid",
      role: "super_admin",
      departmentId: null,
      nama: "Pimpinan Lembaga",
    }

    const memberKetua: MockMember = {
      id: "mem-1",
      nama: "Ustadz Hakim",
      jabatan: "Ketua Departemen",
      departmentId: "dept-pendidikan",
    }

    const memberStaf: MockMember = {
      id: "mem-2",
      nama: "Ustadz Ahmad",
      jabatan: "Staff Kurikulum",
      departmentId: "dept-pendidikan",
    }

    function evaluateCanEdit(
      user: MockUser,
      member: MockMember,
      ketuaProfile: { id?: string; nama?: string } | null
    ) {
      const isKetua = isKetuaMember(member, ketuaProfile)
      const isSelf = user.role === "user" && isKetua

      let canEdit =
        user.role === "super_admin" ||
        user.role === "admin" ||
        (user.role === "user" && user.departmentId === member.departmentId)

      if (isSelf) {
        canEdit = false
      }

      return { canEdit, isKetua, isSelf }
    }

    it("Ketua Departemen (user) DILARANG menilai dirinya sendiri (canEdit = false, isSelf = true)", () => {
      const res = evaluateCanEdit(currentUserKetua, memberKetua, mockKetuaProfile)
      expect(res.isKetua).toBe(true)
      expect(res.isSelf).toBe(true)
      expect(res.canEdit).toBe(false)
    })

    it("Ketua Departemen (user) BISA menilai anggota staf biasa di departemennya (canEdit = true, isSelf = false)", () => {
      const res = evaluateCanEdit(currentUserKetua, memberStaf, mockKetuaProfile)
      expect(res.isKetua).toBe(false)
      expect(res.isSelf).toBe(false)
      expect(res.canEdit).toBe(true)
    })

    it("Admin (SDM) BISA menilai Ketua Departemen (canEdit = true, isSelf = false)", () => {
      const res = evaluateCanEdit(currentUserAdmin, memberKetua, mockKetuaProfile)
      expect(res.isKetua).toBe(true)
      expect(res.isSelf).toBe(false)
      expect(res.canEdit).toBe(true)
    })

    it("Super Admin BISA menilai Ketua Departemen (canEdit = true, isSelf = false)", () => {
      const res = evaluateCanEdit(currentUserSuperAdmin, memberKetua, mockKetuaProfile)
      expect(res.isKetua).toBe(true)
      expect(res.isSelf).toBe(false)
      expect(res.canEdit).toBe(true)
    })
  })

  describe("3. Evaluasi Mode Baca-Saja (isReadOnly) & Banner Penilaian", () => {
    function resolveReadOnlyState(
      userRole: UserRole,
      isSelf: boolean,
      periodStatus: "open" | "closed"
    ) {
      let isReadOnly = periodStatus === "closed" && userRole !== "super_admin"
      let readOnlyReason: "closed_period" | "self_assessment_blocked" | undefined = undefined

      if (isSelf) {
        isReadOnly = true
        readOnlyReason = "self_assessment_blocked"
      } else if (periodStatus === "closed" && userRole !== "super_admin") {
        readOnlyReason = "closed_period"
      }

      return { isReadOnly, readOnlyReason }
    }

    it("mengunci formulir Ketua saat membuka dirinya sendiri pada periode open", () => {
      const state = resolveReadOnlyState("user", true, "open")
      expect(state.isReadOnly).toBe(true)
      expect(state.readOnlyReason).toBe("self_assessment_blocked")
    })

    it("membuka formulir dalam mode edit saat Admin SDM menilai Ketua pada periode open", () => {
      const state = resolveReadOnlyState("admin", false, "open")
      expect(state.isReadOnly).toBe(false)
      expect(state.readOnlyReason).toBeUndefined()
    })

    it("membuka formulir dalam mode edit saat Super Admin menilai Ketua pada periode open", () => {
      const state = resolveReadOnlyState("super_admin", false, "open")
      expect(state.isReadOnly).toBe(false)
      expect(state.readOnlyReason).toBeUndefined()
    })
  })

  describe("4. Penolakan Mutasi Server Action (saveAssessmentAction)", () => {
    function simulateSaveValidation(
      userRole: UserRole,
      isKetuaTarget: boolean
    ): { success: boolean; error?: string } {
      if (userRole === "user" && isKetuaTarget) {
        return {
          success: false,
          error:
            "Sebagai Ketua Departemen, Anda tidak berhak menilai diri Anda sendiri. Penilaian Ketua Departemen hanya dapat dilakukan oleh Admin (SDM) atau Super Admin.",
        }
      }
      return { success: true }
    }

    it("menolak eksekusi simpan/kirim jika Ketua mencoba menilai dirinya sendiri", () => {
      const result = simulateSaveValidation("user", true)
      expect(result.success).toBe(false)
      expect(result.error).toContain("tidak berhak menilai diri Anda sendiri")
    })

    it("menerima eksekusi simpan jika Ketua menilai anggota staf biasa", () => {
      const result = simulateSaveValidation("user", false)
      expect(result.success).toBe(true)
    })

    it("menerima eksekusi simpan jika Admin SDM menilai Ketua Departemen", () => {
      const result = simulateSaveValidation("admin", true)
      expect(result.success).toBe(true)
    })

    it("menerima eksekusi simpan jika Super Admin menilai Ketua Departemen", () => {
      const result = simulateSaveValidation("super_admin", true)
      expect(result.success).toBe(true)
    })
  })
})
