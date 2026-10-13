import { describe, it, expect } from "vitest"
import {
  memberFormSchema,
  updateMemberSchema,
  importMemberRowSchema,
  memberFilterSchema,
} from "@/lib/validations/member"

describe("Validasi Zod Modul Anggota (Client & Server)", () => {
  describe("memberFormSchema & createMemberSchema", () => {
    it("harus menerima data anggota yang valid dan lengkap", () => {
      const validData = {
        nama: "Ustadz Ahmad Fauzi, S.Pd.",
        nip: "199201012020",
        jabatan: "Staff Kurikulum",
        no_hp: "081234567890",
        is_active: true,
        department_id: "550e8400-e29b-41d4-a716-446655440000",
      }

      const result = memberFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.nama).toBe("Ustadz Ahmad Fauzi, S.Pd.")
        expect(result.data.nip).toBe("199201012020")
        expect(result.data.jabatan).toBe("Staff Kurikulum")
        expect(result.data.no_hp).toBe("081234567890")
      }
    })

    it("harus menolak jika nama kosong atau hanya whitespace", () => {
      const emptyName = {
        nama: "   ",
        jabatan: "Guru",
      }

      const result = memberFormSchema.safeParse(emptyName)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Nama lengkap wajib diisi")
      }
    })

    it("harus menolak jika jabatan kosong", () => {
      const emptyJabatan = {
        nama: "Ustadz Budi",
        jabatan: "",
      }

      const result = memberFormSchema.safeParse(emptyJabatan)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Jabatan wajib diisi")
      }
    })

    it("NIP dan No HP opsional harus di-transform menjadi null jika string kosong", () => {
      const optionalEmpty = {
        nama: "Ustadz Hasan",
        jabatan: "Pengajar",
        nip: "   ",
        no_hp: "",
      }

      const result = memberFormSchema.safeParse(optionalEmpty)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.nip).toBeNull()
        expect(result.data.no_hp).toBeNull()
      }
    })

    it("harus menolak jika format no_hp tidak valid (< 8 digit)", () => {
      const invalidPhone = {
        nama: "Ustadz Hasan",
        jabatan: "Pengajar",
        no_hp: "123",
      }

      const result = memberFormSchema.safeParse(invalidPhone)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Format nomor HP tidak valid")
      }
    })
  })

  describe("updateMemberSchema", () => {
    it("harus menolak pembaruan jika ID bukan format UUID valid", () => {
      const invalidId = {
        id: "bukan-uuid",
        nama: "Ustadz Farhan",
        jabatan: "Staff",
      }

      const result = updateMemberSchema.safeParse(invalidId)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("ID Anggota tidak valid")
      }
    })

    it("harus menerima pembaruan dengan ID UUID valid", () => {
      const validUpdate = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        nama: "Ustadz Farhan Al-Hafidz",
        jabatan: "Kepala Laboratorium",
        nip: "19950101",
        is_active: true,
      }

      const result = updateMemberSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe("importMemberRowSchema (Impor Massal)", () => {
    it("harus memvalidasi baris impor yang valid", () => {
      const validRow = {
        kode_departemen: "PEND-AJAR",
        nip: "19900101",
        nama: "Ustadz Salim",
        jabatan: "Wali Kelas",
        no_hp: "081299998888",
      }

      const result = importMemberRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
    })

    it("harus menolak baris jika kode departemen kosong", () => {
      const missingDept = {
        kode_departemen: "   ",
        nama: "Ustadz Salim",
        jabatan: "Wali Kelas",
      }

      const result = importMemberRowSchema.safeParse(missingDept)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Kode departemen wajib diisi")
      }
    })

    it("harus menolak baris jika nama kosong", () => {
      const missingNama = {
        kode_departemen: "TI",
        nama: "",
        jabatan: "Staff IT",
      }

      const result = importMemberRowSchema.safeParse(missingNama)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Nama lengkap wajib diisi")
      }
    })
  })

  describe("memberFilterSchema", () => {
    it("harus menggunakan nilai default jika filter kosong", () => {
      const result = memberFilterSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.status).toBe("all")
      expect(result.search).toBe("")
      expect(result.department_id).toBe("")
    })

    it("harus mengonversi string query params ke angka", () => {
      const result = memberFilterSchema.parse({
        page: "3",
        pageSize: "25",
        status: "active",
        search: "ahmad",
      })
      expect(result.page).toBe(3)
      expect(result.pageSize).toBe(25)
      expect(result.status).toBe("active")
      expect(result.search).toBe("ahmad")
    })
  })
})
