import { z } from "zod"

/**
 * Skema validasi formulir anggota (Client & Server)
 */
export const memberFormSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi")
    .max(150, "Nama maksimal 150 karakter"),
  nip: z
    .string()
    .trim()
    .max(50, "NIG maksimal 50 karakter")
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  jabatan: z
    .string()
    .trim()
    .min(1, "Jabatan wajib diisi")
    .max(100, "Jabatan maksimal 100 karakter"),
  no_hp: z
    .string()
    .trim()
    .max(25, "Nomor HP maksimal 25 karakter")
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim().length === 0) return true
        // Format nomor HP opsional: boleh diawali +, angka, tanda hubung, spasi
        return /^[0-9+\s\-().]{8,25}$/.test(val.trim())
      },
      {
        message: "Format nomor HP tidak valid (minimal 8 angka)",
      }
    )
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  is_active: z.boolean().default(true),
  department_id: z.string().trim().optional().nullable(),
})

export type MemberFormInput = z.input<typeof memberFormSchema>
export type MemberFormOutput = z.output<typeof memberFormSchema>

/**
 * Skema pembuatan anggota baru
 */
export const createMemberSchema = memberFormSchema

export type CreateMemberInput = MemberFormInput

/**
 * Skema pembaruan data anggota
 */
export const updateMemberSchema = memberFormSchema.extend({
  id: z.string().uuid("ID Anggota tidak valid"),
})

export type UpdateMemberInput = z.input<typeof updateMemberSchema>

/**
 * Skema parameter filter daftar anggota
 */
export const memberFilterSchema = z.object({
  search: z.string().optional().default(""),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  department_id: z.string().optional().default(""),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
})

export type MemberFilterParams = z.infer<typeof memberFilterSchema>

/**
 * Skema satu baris impor massal anggota
 */
export const importMemberRowSchema = z.object({
  kode_departemen: z
    .string()
    .trim()
    .min(1, "Kode departemen wajib diisi"),
  nip: z
    .string()
    .trim()
    .max(50, "NIG maksimal 50 karakter")
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  nama: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi")
    .max(150, "Nama maksimal 150 karakter"),
  jabatan: z
    .string()
    .trim()
    .min(1, "Jabatan wajib diisi")
    .max(100, "Jabatan maksimal 100 karakter"),
  no_hp: z
    .string()
    .trim()
    .max(25, "Nomor HP maksimal 25 karakter")
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.trim().length === 0) return true
        return /^[0-9+\s\-().]{8,25}$/.test(val.trim())
      },
      {
        message: "Format nomor HP tidak valid",
      }
    )
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
})

export type ImportMemberRow = z.infer<typeof importMemberRowSchema>
