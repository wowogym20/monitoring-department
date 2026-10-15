import { z } from "zod"

export const userRoleEnum = z.enum(["super_admin", "admin", "user"], {
  required_error: "Role pengguna wajib dipilih",
  invalid_type_error: "Role yang dipilih tidak valid",
})

export type UserManagementRole = z.infer<typeof userRoleEnum>

export const createUserSchema = z.object({
  nama: z
    .string({ required_error: "Nama lengkap pengguna wajib diisi" })
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
  role: userRoleEnum,
  department_id: z
    .string()
    .uuid({ message: "ID departemen tidak valid" })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null))
    .transform((val) => val || null),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  id: z.string().uuid({ message: "ID pengguna tidak valid" }),
  nama: z
    .string({ required_error: "Nama lengkap pengguna wajib diisi" })
    .min(2, { message: "Nama minimal 2 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" })
    .trim(),
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email({ message: "Format email tidak valid" })
    .trim()
    .toLowerCase(),
  no_hp: z
    .string()
    .trim()
    .max(20, { message: "Nomor HP maksimal 20 digit" })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  role: userRoleEnum,
  department_id: z
    .string()
    .uuid({ message: "ID departemen tidak valid" })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null))
    .transform((val) => val || null),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const toggleUserStatusSchema = z.object({
  id: z.string().uuid({ message: "ID pengguna tidak valid" }),
  is_active: z.boolean(),
})

export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>

export const resetUserPasswordSchema = z.object({
  id: z.string().uuid({ message: "ID pengguna tidak valid" }),
  passwordBaru: z
    .string({ required_error: "Password baru wajib diisi" })
    .min(8, { message: "Password baru minimal 8 karakter" }),
})

export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>

export const deleteUserSchema = z.object({
  id: z.string().uuid({ message: "ID pengguna tidak valid" }),
})

export type DeleteUserInput = z.infer<typeof deleteUserSchema>
