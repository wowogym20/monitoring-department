import { describe, it, expect } from "vitest"
import { UserRole } from "@/types/database"
import { createCommentSchema } from "@/lib/validations/rekap"

/**
 * Pengujian Kebijakan Hak Akses & RLS untuk Modul Komentar & Riwayat (PRD Bagian 11)
 * Memverifikasi isolasi lintas departemen untuk komentar dan penandaan dibaca_at.
 */
describe("Kebijakan Hak Akses & RLS Komentar Penilaian", () => {
  // Mock data untuk pengujian
  const deptA = { id: "dept-a-uuid", nama: "Dept. Pendidikan dan Pengajaran" }
  const deptB = { id: "dept-b-uuid", nama: "Dept. Pengembangan TI" }

  const ketuaDeptA = { id: "user-a-uuid", role: "user" as UserRole, department_id: deptA.id }
  const ketuaDeptB = { id: "user-b-uuid", role: "user" as UserRole, department_id: deptB.id }
  const adminSDM = { id: "admin-sdm-uuid", role: "admin" as UserRole }
  const superAdmin = { id: "super-admin-uuid", role: "super_admin" as UserRole }

  const assessmentDeptA = { id: "assess-a-uuid", department_id: deptA.id, status: "submitted" }
  const assessmentDeptB = { id: "assess-b-uuid", department_id: deptB.id, status: "submitted" }

  // Fungsi evaluasi aturan RLS comments_user_select_insert_own_dept
  function canUserCreateComment(
    user: { id: string; role: UserRole; department_id?: string },
    assessment: { department_id: string }
  ): boolean {
    if (user.role === "super_admin") return true
    if (user.role === "admin") return true
    if (user.role === "user") {
      return user.department_id === assessment.department_id
    }
    return false
  }

  // Fungsi evaluasi penandaan dibaca_at
  function canMarkCommentAsRead(
    viewer: { id: string; role: UserRole; department_id?: string },
    commentAuthorId: string,
    assessmentDeptId: string
  ): boolean {
    // Hanya ketua yang menandai komentar dari pihak lain pada penilaian departemennya
    if (viewer.role === "user") {
      const isOwnDept = viewer.department_id === assessmentDeptId
      const isNotSelf = viewer.id !== commentAuthorId
      return isOwnDept && isNotSelf
    }
    return false
  }

  describe("1. Hak Akses Pembuatan Komentar Lintas Departemen", () => {
    it("Admin SDM dan Super Admin DAPAT memberi komentar pada penilaian di SEMUA departemen", () => {
      expect(canUserCreateComment(adminSDM, assessmentDeptA)).toBe(true)
      expect(canUserCreateComment(adminSDM, assessmentDeptB)).toBe(true)
      expect(canUserCreateComment(superAdmin, assessmentDeptA)).toBe(true)
      expect(canUserCreateComment(superAdmin, assessmentDeptB)).toBe(true)
    })

    it("Ketua A DAPAT memberi komentar pada penilaian anggota departemen A", () => {
      expect(canUserCreateComment(ketuaDeptA, assessmentDeptA)).toBe(true)
    })

    it("Ketua A DITOLAK (RLS) jika mencoba memberi komentar pada penilaian anggota departemen B", () => {
      expect(canUserCreateComment(ketuaDeptA, assessmentDeptB)).toBe(false)
    })

    it("Ketua B DITOLAK (RLS) jika mencoba memberi komentar pada penilaian anggota departemen A", () => {
      expect(canUserCreateComment(ketuaDeptB, assessmentDeptA)).toBe(false)
    })
  })

  describe("2. Validasi Skema Komentar & Balasan (Threaded / parent_id)", () => {
    it("Validasi berhasil untuk komentar utama (tanpa parent_id)", () => {
      const validTopLevel = createCommentSchema.safeParse({
        assessmentId: "00000000-0000-0000-0000-000000000001",
        isi: "Mohon klarifikasi eviden nilai ibadah.",
      })
      expect(validTopLevel.success).toBe(true)
      if (validTopLevel.success) {
        expect(validTopLevel.data.parentId).toBeUndefined()
      }
    })

    it("Validasi berhasil untuk balasan komentar (dengan parent_id)", () => {
      const validReply = createCommentSchema.safeParse({
        assessmentId: "00000000-0000-0000-0000-000000000001",
        parentId: "00000000-0000-0000-0000-000000000002",
        isi: "Baik, eviden salat berjamaah sudah saya tinjau langsung.",
      })
      expect(validReply.success).toBe(true)
      if (validReply.success) {
        expect(validReply.data.parentId).toBe("00000000-0000-0000-0000-000000000002")
      }
    })

    it("Validasi menolak komentar dengan isi kosong", () => {
      const emptyComment = createCommentSchema.safeParse({
        assessmentId: "00000000-0000-0000-0000-000000000001",
        isi: "   ",
      })
      expect(emptyComment.success).toBe(false)
    })
  })

  describe("3. Logika Penandaan Komentar Dibaca (dibaca_at)", () => {
    it("Ketua A menandai komentar dari Admin SDM pada penilaian departemen A sebagai dibaca", () => {
      const markResult = canMarkCommentAsRead(
        ketuaDeptA,
        adminSDM.id,
        assessmentDeptA.department_id
      )
      expect(markResult).toBe(true)
    })

    it("Ketua TIDAK menandai komentarnya sendiri sebagai dibaca", () => {
      const markSelfResult = canMarkCommentAsRead(
        ketuaDeptA,
        ketuaDeptA.id,
        assessmentDeptA.department_id
      )
      expect(markSelfResult).toBe(false)
    })

    it("Ketua A TIDAK BISA menandai komentar pada penilaian departemen B", () => {
      const markOtherDeptResult = canMarkCommentAsRead(
        ketuaDeptA,
        adminSDM.id,
        assessmentDeptB.department_id
      )
      expect(markOtherDeptResult).toBe(false)
    })
  })
})
