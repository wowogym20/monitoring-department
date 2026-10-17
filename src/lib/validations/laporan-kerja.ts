import { z } from "zod"

export const createLaporanKerjaSchema = z.object({
  nip: z
    .string()
    .min(1, "NIP pegawai wajib diisi")
    .max(50, "NIP maksimal 50 karakter"),
  nama: z
    .string()
    .min(3, "Judul laporan minimal 3 karakter")
    .max(100, "Judul laporan maksimal 100 karakter"),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  keterangan: z
    .string()
    .min(3, "Uraian pekerjaan minimal 3 karakter")
    .max(2000, "Uraian pekerjaan maksimal 2000 karakter"),
})

export const updateLaporanKerjaSchema = z.object({
  id: z.number().int().positive("ID laporan tidak valid"),
  nama: z
    .string()
    .min(3, "Judul laporan minimal 3 karakter")
    .max(100, "Judul laporan maksimal 100 karakter"),
  tanggal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  keterangan: z
    .string()
    .min(3, "Uraian pekerjaan minimal 3 karakter")
    .max(2000, "Uraian pekerjaan maksimal 2000 karakter"),
})

export const updateStatusLaporanSchema = z.object({
  id: z.number().int().positive("ID laporan tidak valid"),
  status: z.enum(["Y", "N", "PENDING"], {
    errorMap: () => ({ message: "Status harus salah satu dari: Y, N, atau PENDING" }),
  }),
})

export type CreateLaporanKerjaInput = z.infer<typeof createLaporanKerjaSchema>
export type UpdateLaporanKerjaInput = z.infer<typeof updateLaporanKerjaSchema>
export type UpdateStatusLaporanInput = z.infer<typeof updateStatusLaporanSchema>
