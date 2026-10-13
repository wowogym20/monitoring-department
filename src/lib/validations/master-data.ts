import { z } from "zod"

// ============================================================================
// 1. SKEMA VALIDASI DEPARTEMEN
// ============================================================================

export const createDepartmentSchema = z.object({
  nama: z
    .string({ required_error: "Nama departemen wajib diisi" })
    .min(2, { message: "Nama departemen minimal 2 karakter" })
    .max(100, { message: "Nama departemen maksimal 100 karakter" })
    .trim(),
  kode: z
    .string({ required_error: "Kode singkat departemen wajib diisi" })
    .min(2, { message: "Kode minimal 2 karakter" })
    .max(30, { message: "Kode maksimal 30 karakter" })
    .regex(/^[A-Za-z0-9_-]+$/, {
      message: "Kode hanya boleh huruf, angka, underscore (_), atau strip (-)",
    })
    .transform((val) => val.toUpperCase().trim()),
  is_active: z.boolean().default(true),
})

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>

export const updateDepartmentSchema = z.object({
  id: z.string().uuid({ message: "ID departemen tidak valid" }),
  nama: z
    .string({ required_error: "Nama departemen wajib diisi" })
    .min(2, { message: "Nama departemen minimal 2 karakter" })
    .max(100, { message: "Nama departemen maksimal 100 karakter" })
    .trim(),
  kode: z
    .string({ required_error: "Kode singkat departemen wajib diisi" })
    .min(2, { message: "Kode minimal 2 karakter" })
    .max(30, { message: "Kode maksimal 30 karakter" })
    .regex(/^[A-Za-z0-9_-]+$/, {
      message: "Kode hanya boleh huruf, angka, underscore (_), atau strip (-)",
    })
    .transform((val) => val.toUpperCase().trim()),
  is_active: z.boolean(),
})

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>

export const assignKetuaSchema = z.object({
  department_id: z.string().uuid({ message: "ID departemen tidak valid" }),
  ketua_id: z
    .string()
    .uuid({ message: "ID ketua tidak valid" })
    .nullable()
    .or(z.literal("").transform(() => null)),
})

export type AssignKetuaInput = z.infer<typeof assignKetuaSchema>

// ============================================================================
// 2. SKEMA VALIDASI KETUA DEPARTEMEN
// ============================================================================

export const createKetuaSchema = z.object({
  nama: z
    .string({ required_error: "Nama ketua wajib diisi" })
    .min(2, { message: "Nama minimal 2 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" })
    .trim(),
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email({ message: "Format email tidak valid" })
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: "Password awal wajib diisi" })
    .min(8, { message: "Password awal minimal 8 karakter" }),
  no_hp: z
    .string()
    .trim()
    .max(20, { message: "Nomor HP maksimal 20 digit" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
})

export type CreateKetuaInput = z.infer<typeof createKetuaSchema>

export const toggleKetuaStatusSchema = z.object({
  id: z.string().uuid({ message: "ID akun tidak valid" }),
  is_active: z.boolean(),
})

export type ToggleKetuaStatusInput = z.infer<typeof toggleKetuaStatusSchema>

export const resetKetuaPasswordSchema = z.object({
  id: z.string().uuid({ message: "ID akun tidak valid" }),
  passwordBaru: z
    .string({ required_error: "Password baru wajib diisi" })
    .min(8, { message: "Password baru minimal 8 karakter" }),
})

export type ResetKetuaPasswordInput = z.infer<typeof resetKetuaPasswordSchema>

// ============================================================================
// 3. SKEMA VALIDASI ASPEK PENILAIAN
// ============================================================================

export const createAspectSchema = z.object({
  nama: z
    .string({ required_error: "Nama aspek wajib diisi" })
    .min(2, { message: "Nama aspek minimal 2 karakter" })
    .max(100, { message: "Nama aspek maksimal 100 karakter" })
    .trim(),
  deskripsi: z
    .string()
    .trim()
    .max(255, { message: "Deskripsi maksimal 255 karakter" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  urutan: z.number().int().min(1, { message: "Urutan minimal 1" }),
  is_active: z.boolean().default(true),
})

export type CreateAspectInput = z.infer<typeof createAspectSchema>

export const updateAspectSchema = z.object({
  id: z.string().uuid({ message: "ID aspek tidak valid" }),
  nama: z
    .string({ required_error: "Nama aspek wajib diisi" })
    .min(2, { message: "Nama aspek minimal 2 karakter" })
    .max(100, { message: "Nama aspek maksimal 100 karakter" })
    .trim(),
  deskripsi: z
    .string()
    .trim()
    .max(255, { message: "Deskripsi maksimal 255 karakter" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  urutan: z.number().int().min(1, { message: "Urutan minimal 1" }),
  is_active: z.boolean(),
})

export type UpdateAspectInput = z.infer<typeof updateAspectSchema>

export const reorderAspectSchema = z.object({
  id: z.string().uuid({ message: "ID aspek tidak valid" }),
  direction: z.enum(["up", "down"], {
    required_error: "Arah perpindahan urutan wajib diisi (up atau down)",
  }),
})

export type ReorderAspectInput = z.infer<typeof reorderAspectSchema>

// ============================================================================
// 4. SKEMA VALIDASI PERIODE PENILAIAN
// ============================================================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const createPeriodSchema = z
  .object({
    nama: z
      .string({ required_error: "Nama periode wajib diisi" })
      .min(3, { message: "Nama periode minimal 3 karakter" })
      .max(100, { message: "Nama periode maksimal 100 karakter" })
      .trim(),
    tanggal_mulai: z
      .string({ required_error: "Tanggal mulai wajib diisi" })
      .regex(DATE_REGEX, { message: "Format tanggal mulai harus YYYY-MM-DD" }),
    tanggal_akhir: z
      .string({ required_error: "Tanggal akhir wajib diisi" })
      .regex(DATE_REGEX, { message: "Format tanggal akhir harus YYYY-MM-DD" }),
    status: z.enum(["open", "closed"]).default("open"),
  })
  .refine((data) => data.tanggal_akhir >= data.tanggal_mulai, {
    message: "Tanggal akhir tidak boleh mendahului tanggal mulai",
    path: ["tanggal_akhir"],
  })

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>

export const updatePeriodSchema = z
  .object({
    id: z.string().uuid({ message: "ID periode tidak valid" }),
    nama: z
      .string({ required_error: "Nama periode wajib diisi" })
      .min(3, { message: "Nama periode minimal 3 karakter" })
      .max(100, { message: "Nama periode maksimal 100 karakter" })
      .trim(),
    tanggal_mulai: z
      .string({ required_error: "Tanggal mulai wajib diisi" })
      .regex(DATE_REGEX, { message: "Format tanggal mulai harus YYYY-MM-DD" }),
    tanggal_akhir: z
      .string({ required_error: "Tanggal akhir wajib diisi" })
      .regex(DATE_REGEX, { message: "Format tanggal akhir harus YYYY-MM-DD" }),
  })
  .refine((data) => data.tanggal_akhir >= data.tanggal_mulai, {
    message: "Tanggal akhir tidak boleh mendahului tanggal mulai",
    path: ["tanggal_akhir"],
  })

export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>

export const togglePeriodStatusSchema = z.object({
  id: z.string().uuid({ message: "ID periode tidak valid" }),
  status: z.enum(["open", "closed"], {
    required_error: "Status periode wajib 'open' atau 'closed'",
  }),
})

export type TogglePeriodStatusInput = z.infer<typeof togglePeriodStatusSchema>
