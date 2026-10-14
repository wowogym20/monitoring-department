import { describe, it, expect } from "vitest"
import {
  restoreMemberSchema,
  bulkRestoreMemberSchema,
  hardDeleteMemberSchema,
} from "@/lib/validations/member"

describe("Uji Fitur Tempat Sampah (Trash Bin) Anggota", () => {
  describe("1. Validasi Skema Zod Tempat Sampah", () => {
    it("restoreMemberSchema: harus menerima UUID yang valid", () => {
      const valid = { id: "550e8400-e29b-41d4-a716-446655440000" }
      const res = restoreMemberSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it("restoreMemberSchema: harus menolak jika ID bukan UUID", () => {
      const invalid = { id: "bukan-uuid" }
      const res = restoreMemberSchema.safeParse(invalid)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.errors[0].message).toContain("ID Anggota tidak valid")
      }
    })

    it("bulkRestoreMemberSchema: harus menerima array UUID anggota", () => {
      const valid = {
        memberIds: [
          "550e8400-e29b-41d4-a716-446655440000",
          "660e8400-e29b-41d4-a716-446655440001",
        ],
      }
      const res = bulkRestoreMemberSchema.safeParse(valid)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.memberIds).toHaveLength(2)
      }
    })

    it("bulkRestoreMemberSchema: harus menolak jika array memberIds kosong", () => {
      const empty = { memberIds: [] }
      const res = bulkRestoreMemberSchema.safeParse(empty)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.errors[0].message).toContain("Minimal pilih 1 anggota")
      }
    })

    it("hardDeleteMemberSchema: harus menerima UUID yang valid untuk hapus permanen", () => {
      const valid = { id: "550e8400-e29b-41d4-a716-446655440000" }
      const res = hardDeleteMemberSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it("hardDeleteMemberSchema: harus menolak format ID non-UUID", () => {
      const invalid = { id: "12345" }
      const res = hardDeleteMemberSchema.safeParse(invalid)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.errors[0].message).toContain("ID Anggota tidak valid")
      }
    })
  })

  describe("2. Logika Perhitungan Batas Simpan 7 Hari", () => {
    function calculateDaysRemaining(deletedAtIso: string, referenceNow: number): number {
      const deletedTime = new Date(deletedAtIso).getTime()
      const diffDays = Math.floor((referenceNow - deletedTime) / (1000 * 60 * 60 * 24))
      return Math.max(0, 7 - diffDays)
    }

    function isExpiredForPurge(deletedAtIso: string, referenceNow: number): boolean {
      const cutoffTime = referenceNow - 7 * 24 * 60 * 60 * 1000
      return new Date(deletedAtIso).getTime() < cutoffTime
    }

    const mockNow = new Date("2026-10-14T12:00:00Z").getTime()

    it("data yang baru dihapus hari ini harus memiliki sisa 7 hari", () => {
      const deletedToday = new Date("2026-10-14T08:00:00Z").toISOString()
      const remaining = calculateDaysRemaining(deletedToday, mockNow)
      expect(remaining).toBe(7)
      expect(isExpiredForPurge(deletedToday, mockNow)).toBe(false)
    })

    it("data yang dihapus 3 hari lalu harus memiliki sisa 4 hari", () => {
      const deleted3DaysAgo = new Date("2026-10-11T12:00:00Z").toISOString()
      const remaining = calculateDaysRemaining(deleted3DaysAgo, mockNow)
      expect(remaining).toBe(4)
      expect(isExpiredForPurge(deleted3DaysAgo, mockNow)).toBe(false)
    })

    it("data yang dihapus tepat 7 hari lalu harus bernilai 0 hari dan masuk kriteria kedaluwarsa", () => {
      const deleted7DaysAgo = new Date("2026-10-07T11:00:00Z").toISOString()
      const remaining = calculateDaysRemaining(deleted7DaysAgo, mockNow)
      expect(remaining).toBe(0)
      expect(isExpiredForPurge(deleted7DaysAgo, mockNow)).toBe(true)
    })

    it("data yang dihapus 10 hari lalu harus ditandai kedaluwarsa untuk auto-purge", () => {
      const deleted10DaysAgo = new Date("2026-10-04T12:00:00Z").toISOString()
      expect(isExpiredForPurge(deleted10DaysAgo, mockNow)).toBe(true)
    })
  })
})
