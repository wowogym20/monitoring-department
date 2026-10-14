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
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
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

/**
 * Skema penghapusan massal anggota
 */
export const bulkDeleteMemberSchema = z.object({
  memberIds: z
    .array(z.string().uuid("ID Anggota tidak valid"))
    .min(1, "Minimal pilih 1 anggota untuk dihapus"),
})

export type BulkDeleteMemberInput = z.infer<typeof bulkDeleteMemberSchema>

/**
 * Skema pembaruan massal data anggota
 */
export const bulkUpdateMemberSchema = z
  .object({
    memberIds: z
      .array(z.string().uuid("ID Anggota tidak valid"))
      .min(1, "Minimal pilih 1 anggota untuk diperbarui"),
    is_active: z.enum(["keep", "active", "inactive"]).default("keep"),
    department_id: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => !val || val.length === 0 || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val),
        { message: "Departemen tujuan tidak valid" }
      ),
    ubah_jabatan: z.boolean().optional().default(false),
    jabatan: z
      .string()
      .trim()
      .max(100, "Jabatan maksimal 100 karakter")
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.ubah_jabatan && (!data.jabatan || data.jabatan.trim().length === 0)) {
        return false
      }
      return true
    },
    {
      message: "Nama jabatan baru wajib diisi jika opsi ubah jabatan diaktifkan",
      path: ["jabatan"],
    }
  )
  .refine(
    (data) => {
      const hasStatusChange = data.is_active !== "keep"
      const hasDeptChange = Boolean(data.department_id && data.department_id.trim() !== "")
      const hasJabatanChange = Boolean(data.jabatan && data.jabatan.trim().length > 0)
      return hasStatusChange || hasDeptChange || hasJabatanChange
    },
    {
      message: "Pilih setidaknya satu bidang untuk diubah (Status, Departemen, atau Jabatan)",
      path: ["is_active"],
    }
  )

export type BulkUpdateMemberInput = z.infer<typeof bulkUpdateMemberSchema>

/**
 * Skema pemulihan anggota dari tempat sampah
 */
export const restoreMemberSchema = z.object({
  id: z.string().uuid("ID Anggota tidak valid"),
})

export type RestoreMemberInput = z.infer<typeof restoreMemberSchema>

/**
 * Skema pemulihan massal anggota dari tempat sampah
 */
export const bulkRestoreMemberSchema = z.object({
  memberIds: z
    .array(z.string().uuid("ID Anggota tidak valid"))
    .min(1, "Minimal pilih 1 anggota untuk dipulihkan"),
})

export type BulkRestoreMemberInput = z.infer<typeof bulkRestoreMemberSchema>

/**
 * Skema penghapusan permanen (hard delete) anggota
 */
export const hardDeleteMemberSchema = z.object({
  id: z.string().uuid("ID Anggota tidak valid"),
})

export type HardDeleteMemberInput = z.infer<typeof hardDeleteMemberSchema>

