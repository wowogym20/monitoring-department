import { describe, it, expect } from "vitest"
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  assignKetuaSchema,
  createKetuaSchema,
  toggleKetuaStatusSchema,
  resetKetuaPasswordSchema,
  createAspectSchema,
  updateAspectSchema,
  reorderAspectSchema,
  createPeriodSchema,
  updatePeriodSchema,
  togglePeriodStatusSchema,
} from "@/lib/validations/master-data"

describe("Unit Test Skema Validasi Zod Master Data", () => {
  describe("1. Validasi Departemen", () => {
    it("menerima data departemen yang valid dan menormalkan kode ke uppercase", () => {
      const valid = {
        nama: "Dept. Pengembangan TI",
        kode: "ti-dev",
        is_active: true,
      }
      const parsed = createDepartmentSchema.parse(valid)
      expect(parsed.nama).toBe("Dept. Pengembangan TI")
      expect(parsed.kode).toBe("TI-DEV")
      expect(parsed.is_active).toBe(true)
    })

    it("menolak kode departemen yang mengandung spasi atau karakter ilegal", () => {
      const invalid = {
        nama: "Departemen Test",
        kode: "TI DEV!",
      }
      const res = createDepartmentSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })

    it("menolak nama departemen yang terlalu pendek", () => {
      const res = createDepartmentSchema.safeParse({ nama: "A", kode: "OK" })
      expect(res.success).toBe(false)
    })

    it("memvalidasi updateDepartmentSchema dan assignKetuaSchema dengan UUID yang valid", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      const resUpdate = updateDepartmentSchema.safeParse({
        id: validUuid,
        nama: "Departemen Keuangan",
        kode: "KEU",
        is_active: true,
      })
      expect(resUpdate.success).toBe(true)

      const resAssign = assignKetuaSchema.safeParse({
        department_id: validUuid,
        ketua_id: validUuid,
      })
      expect(resAssign.success).toBe(true)

      const resUnassign = assignKetuaSchema.safeParse({
        department_id: validUuid,
        ketua_id: null,
      })
      expect(resUnassign.success).toBe(true)
    })
  })

  describe("2. Validasi Akun Ketua", () => {
    it("menerima pembuatan akun ketua yang valid", () => {
      const valid = {
        nama: "Ustadz Haris",
        email: "haris@tazakka.or.id",
        password: "Password123!",
        no_hp: "081234567890",
      }
      const res = createKetuaSchema.safeParse(valid)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.email).toBe("haris@tazakka.or.id")
        expect(res.data.no_hp).toBe("081234567890")
      }
    })

    it("menolak email tidak valid atau password kurang dari 8 karakter", () => {
      const invalidEmail = createKetuaSchema.safeParse({
        nama: "Ketua",
        email: "bukan-email",
        password: "Password123!",
      })
      expect(invalidEmail.success).toBe(false)

      const invalidPassword = createKetuaSchema.safeParse({
        nama: "Ketua",
        email: "ketua@tazakka.or.id",
        password: "12345",
      })
      expect(invalidPassword.success).toBe(false)
    })

    it("memvalidasi toggleKetuaStatusSchema dengan benar", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      expect(toggleKetuaStatusSchema.safeParse({ id: validUuid, is_active: true }).success).toBe(true)
      expect(toggleKetuaStatusSchema.safeParse({ id: "bukan-uuid", is_active: false }).success).toBe(false)
    })

    it("memvalidasi reset password dengan minimal 8 karakter", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      const ok = resetKetuaPasswordSchema.safeParse({
        id: validUuid,
        passwordBaru: "NewPassword123!",
      })
      expect(ok.success).toBe(true)

      const short = resetKetuaPasswordSchema.safeParse({
        id: validUuid,
        passwordBaru: "short",
      })
      expect(short.success).toBe(false)
    })
  })

  describe("3. Validasi Aspek Penilaian", () => {
    it("menerima aspek penilaian valid dengan urutan positif", () => {
      const valid = {
        nama: "Kinerja Kerja",
        deskripsi: "Kualitas dan ketepatan tugas",
        urutan: 1,
        is_active: true,
      }
      const res = createAspectSchema.parse(valid)
      expect(res.nama).toBe("Kinerja Kerja")

      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      const resUpdate = updateAspectSchema.safeParse({
        id: validUuid,
        ...valid,
      })
      expect(resUpdate.success).toBe(true)
    })

    it("menolak urutan negatif atau nol", () => {
      const res = createAspectSchema.safeParse({
        nama: "Aspek Negatif",
        urutan: 0,
      })
      expect(res.success).toBe(false)
    })

    it("memvalidasi reorder direction 'up' dan 'down'", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      expect(reorderAspectSchema.safeParse({ id: validUuid, direction: "up" }).success).toBe(true)
      expect(reorderAspectSchema.safeParse({ id: validUuid, direction: "down" }).success).toBe(true)
      expect(reorderAspectSchema.safeParse({ id: validUuid, direction: "left" }).success).toBe(false)
    })
  })

  describe("4. Validasi Periode Penilaian", () => {
    it("menerima periode dengan tanggal akhir >= tanggal mulai", () => {
      const valid = {
        nama: "Semester Ganjil 2026/2027",
        tanggal_mulai: "2026-10-01",
        tanggal_akhir: "2026-10-31",
        status: "open" as const,
      }
      const res = createPeriodSchema.safeParse(valid)
      expect(res.success).toBe(true)

      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      const resUpdate = updatePeriodSchema.safeParse({
        id: validUuid,
        nama: "Periode Revisi",
        tanggal_mulai: "2026-10-01",
        tanggal_akhir: "2026-10-31",
      })
      expect(resUpdate.success).toBe(true)
    })

    it("menolak jika tanggal akhir mendahului tanggal mulai", () => {
      const invalid = {
        nama: "Periode Mundur",
        tanggal_mulai: "2026-10-31",
        tanggal_akhir: "2026-10-01",
        status: "open" as const,
      }
      const res = createPeriodSchema.safeParse(invalid)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("Tanggal akhir tidak boleh mendahului tanggal mulai")
      }
    })

    it("memvalidasi togglePeriodStatusSchema hanya menerima open atau closed", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      expect(togglePeriodStatusSchema.safeParse({ id: validUuid, status: "open" }).success).toBe(true)
      expect(togglePeriodStatusSchema.safeParse({ id: validUuid, status: "closed" }).success).toBe(true)
      expect(togglePeriodStatusSchema.safeParse({ id: validUuid, status: "pending" }).success).toBe(false)
    })
  })
})
