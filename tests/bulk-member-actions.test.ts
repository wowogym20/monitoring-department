import { describe, it, expect } from "vitest"
import {
  bulkDeleteMemberSchema,
  bulkUpdateMemberSchema,
} from "@/lib/validations/member"

describe("Uji Validasi Skema Aksi Massal Anggota (Client & Server)", () => {
  describe("bulkDeleteMemberSchema", () => {
    it("harus menerima array ID anggota UUID yang valid", () => {
      const valid = {
        memberIds: [
          "550e8400-e29b-41d4-a716-446655440000",
          "550e8400-e29b-41d4-a716-446655440001",
        ],
      }
      const res = bulkDeleteMemberSchema.safeParse(valid)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.memberIds).toHaveLength(2)
      }
    })

    it("harus menolak jika array memberIds kosong", () => {
      const empty = {
        memberIds: [],
      }
      const res = bulkDeleteMemberSchema.safeParse(empty)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.errors[0].message).toContain("Minimal pilih 1 anggota")
      }
    })

    it("harus menolak jika salah satu ID bukan format UUID", () => {
      const invalid = {
        memberIds: ["invalid-uuid-123"],
      }
      const res = bulkDeleteMemberSchema.safeParse(invalid)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.errors[0].message).toContain("ID Anggota tidak valid")
      }
    })
  })

  describe("bulkUpdateMemberSchema", () => {
    it("harus menerima pembaruan status keaktifan menjadi aktif", () => {
      const payload = {
        memberIds: ["550e8400-e29b-41d4-a716-446655440000"],
        is_active: "active",
      }
      const res = bulkUpdateMemberSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.is_active).toBe("active")
      }
    })

    it("harus menerima pemindahan departemen untuk super_admin", () => {
      const payload = {
        memberIds: ["550e8400-e29b-41d4-a716-446655440000"],
        is_active: "keep",
        department_id: "660e8400-e29b-41d4-a716-446655440000",
      }
      const res = bulkUpdateMemberSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.department_id).toBe("660e8400-e29b-41d4-a716-446655440000")
      }
    })

    it("harus menerima pembaruan jabatan serentak saat ubah_jabatan bernilai true", () => {
      const payload = {
        memberIds: ["550e8400-e29b-41d4-a716-446655440000"],
        is_active: "keep" as const,
        department_id: "",
        ubah_jabatan: true,
        jabatan: "Staf Khusus Kurikulum",
      }
      const res = bulkUpdateMemberSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.ubah_jabatan).toBe(true)
        expect(res.data.jabatan).toBe("Staf Khusus Kurikulum")
      }
    })

    it("harus menerima pembaruan jabatan serentak saat jabatan diisi meskipun ubah_jabatan tidak disertakan", () => {
      const payload = {
        memberIds: ["550e8400-e29b-41d4-a716-446655440000"],
        is_active: "keep" as const,
        department_id: "",
        jabatan: "Pengajar Muda",
      }
      const res = bulkUpdateMemberSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.jabatan).toBe("Pengajar Muda")
      }
    })

    it("harus menolak jika ubah_jabatan true namun input jabatan kosong", () => {
      const payload = {
        memberIds: ["550e8400-e29b-41d4-a716-446655440000"],
        is_active: "keep" as const,
        department_id: "",
        ubah_jabatan: true,
        jabatan: "   ",
      }
      const res = bulkUpdateMemberSchema.safeParse(payload)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.errors[0].message).toContain("Nama jabatan baru wajib diisi")
      }
    })

    it("harus menolak jika tidak ada satu pun bidang yang diubah (semua keep / kosong / false)", () => {
      const unchanged = {
        memberIds: ["550e8400-e29b-41d4-a716-446655440000"],
        is_active: "keep",
        department_id: "",
        ubah_jabatan: false,
        jabatan: "",
      }
      const res = bulkUpdateMemberSchema.safeParse(unchanged)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.errors[0].message).toContain("Pilih setidaknya satu bidang untuk diubah")
      }
    })

    it("harus menolak jika memberIds kosong", () => {
      const emptyIds = {
        memberIds: [],
        is_active: "active",
      }
      const res = bulkUpdateMemberSchema.safeParse(emptyIds)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.errors[0].message).toContain("Minimal pilih 1 anggota")
      }
    })
  })
})
