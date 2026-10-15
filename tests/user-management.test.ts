import { describe, it, expect } from "vitest"
import {
  createUserSchema,
  updateUserSchema,
  toggleUserStatusSchema,
  resetUserPasswordSchema,
  deleteUserSchema,
} from "@/lib/validations/user-management"

describe("Unit Test Skema Validasi Manajemen Pengguna (Zod)", () => {
  describe("1. Validasi Pembuatan Pengguna Baru (createUserSchema)", () => {
    it("menerima pembuatan pengguna dengan role super_admin", () => {
      const validSuperAdmin = {
        nama: "Pimpinan Tazakka",
        email: "pimpinan@tazakka.or.id",
        password: "SuperPassword123!",
        no_hp: "081234567890",
        role: "super_admin",
      }

      const res = createUserSchema.safeParse(validSuperAdmin)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.role).toBe("super_admin")
        expect(res.data.email).toBe("pimpinan@tazakka.or.id")
        expect(res.data.department_id).toBeNull()
      }
    })

    it("menerima pembuatan pengguna dengan role admin (SDM)", () => {
      const validAdmin = {
        nama: "Staff SDM & Kepegawaian",
        email: "sdm.staff@tazakka.or.id",
        password: "SdmPassword123!",
        no_hp: "081298765432",
        role: "admin",
      }

      const res = createUserSchema.safeParse(validAdmin)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.role).toBe("admin")
        expect(res.data.nama).toBe("Staff SDM & Kepegawaian")
      }
    })

    it("menerima pembuatan pengguna dengan role user (Ketua Departemen) dengan penugasan departemen", () => {
      const validKetua = {
        nama: "Ustadz Haris, S.Pd.",
        email: "haris@tazakka.or.id",
        password: "KetuaPassword123!",
        no_hp: "081234567890",
        role: "user",
        department_id: "123e4567-e89b-12d3-a456-426614174000",
      }

      const res = createUserSchema.safeParse(validKetua)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.role).toBe("user")
        expect(res.data.department_id).toBe("123e4567-e89b-12d3-a456-426614174000")
      }
    })

    it("menormalkan department_id string kosong ke null", () => {
      const res = createUserSchema.safeParse({
        nama: "Ustadz Budi",
        email: "budi@tazakka.or.id",
        password: "Password123!",
        role: "user",
        department_id: "",
      })

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.department_id).toBeNull()
      }
    })

    it("menolak jika password kurang dari 8 karakter", () => {
      const invalidPassword = createUserSchema.safeParse({
        nama: "Pengguna Baru",
        email: "baru@tazakka.or.id",
        password: "12345",
        role: "admin",
      })

      expect(invalidPassword.success).toBe(false)
      if (!invalidPassword.success) {
        expect(invalidPassword.error.errors[0].message).toContain("minimal 8 karakter")
      }
    })

    it("menolak format email yang tidak valid", () => {
      const invalidEmail = createUserSchema.safeParse({
        nama: "Pengguna Baru",
        email: "bukan-sebuah-email",
        password: "Password123!",
        role: "admin",
      })

      expect(invalidEmail.success).toBe(false)
      if (!invalidEmail.success) {
        expect(invalidEmail.error.errors[0].message).toContain("Format email tidak valid")
      }
    })

    it("menolak role selain super_admin, admin, atau user", () => {
      const invalidRole = createUserSchema.safeParse({
        nama: "Pengguna Baru",
        email: "test@tazakka.or.id",
        role: "guest",
      })

      expect(invalidRole.success).toBe(false)
    })
  })

  describe("2. Validasi Pembaruan Pengguna (updateUserSchema)", () => {
    it("menerima pembaruan pengguna dengan UUID dan data valid", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000"
      const res = updateUserSchema.safeParse({
        id: validUuid,
        nama: "Ustadz Ahmad Fauzi, M.Pd.",
        email: "ahmad.fauzi@tazakka.or.id",
        no_hp: "081299998888",
        role: "admin",
        department_id: null,
      })

      expect(res.success).toBe(true)
    })

    it("menolak pembaruan jika ID bukan UUID valid", () => {
      const res = updateUserSchema.safeParse({
        id: "invalid-id",
        nama: "Ustadz Ahmad Fauzi",
        email: "ahmad@tazakka.or.id",
        role: "admin",
      })

      expect(res.success).toBe(false)
    })
  })

  describe("3. Validasi Toggle Status, Reset Password, dan Delete", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000"

    it("memvalidasi toggleUserStatusSchema", () => {
      const res = toggleUserStatusSchema.safeParse({
        id: validUuid,
        is_active: false,
      })
      expect(res.success).toBe(true)
    })

    it("memvalidasi resetUserPasswordSchema dengan password minimal 8 karakter", () => {
      const validRes = resetUserPasswordSchema.safeParse({
        id: validUuid,
        passwordBaru: "NewPassword123!",
      })
      expect(validRes.success).toBe(true)

      const shortRes = resetUserPasswordSchema.safeParse({
        id: validUuid,
        passwordBaru: "pendek",
      })
      expect(shortRes.success).toBe(false)
    })

    it("memvalidasi deleteUserSchema", () => {
      const res = deleteUserSchema.safeParse({
        id: validUuid,
      })
      expect(res.success).toBe(true)
    })
  })
})
