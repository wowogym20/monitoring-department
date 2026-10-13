import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email({ message: "Format email tidak valid" })
    .trim(),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(6, { message: "Password minimal 6 karakter" }),
})

export type LoginInput = z.infer<typeof loginSchema>

export const updateProfileSchema = z.object({
  nama: z
    .string({ required_error: "Nama lengkap wajib diisi" })
    .min(2, { message: "Nama minimal 2 karakter" })
    .trim(),
  no_hp: z
    .string()
    .trim()
    .optional()
    .nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const updatePasswordSchema = z
  .object({
    passwordBaru: z
      .string({ required_error: "Password baru wajib diisi" })
      .min(8, { message: "Password baru minimal 8 karakter" }),
    konfirmasiPassword: z
      .string({ required_error: "Konfirmasi password wajib diisi" })
      .min(8, { message: "Konfirmasi password minimal 8 karakter" }),
  })
  .refine((data) => data.passwordBaru === data.konfirmasiPassword, {
    message: "Konfirmasi password tidak cocok dengan password baru",
    path: ["konfirmasiPassword"],
  })

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
