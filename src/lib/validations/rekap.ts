import { z } from "zod"

export const rekapFilterSchema = z.object({
  periodeId: z.string().uuid("ID periode tidak valid").optional().nullable(),
  departmentId: z.string().uuid("ID departemen tidak valid").optional().nullable(),
  status: z
    .enum(["all", "draft", "submitted", "revision_requested", "approved"])
    .optional()
    .default("all"),
  search: z.string().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
})

export const approveAssessmentSchema = z.object({
  assessmentId: z.string().uuid("ID penilaian tidak valid"),
})

export const requestRevisionSchema = z.object({
  assessmentId: z.string().uuid("ID penilaian tidak valid"),
  comment: z
    .string()
    .trim()
    .min(3, "Catatan permintaan revisi minimal 3 karakter")
    .max(2000, "Catatan revisi maksimal 2000 karakter"),
})

export const createCommentSchema = z.object({
  assessmentId: z.string().uuid("ID penilaian tidak valid"),
  parentId: z.string().uuid("ID komentar induk tidak valid").optional().nullable(),
  isi: z
    .string()
    .trim()
    .min(1, "Isi komentar tidak boleh kosong")
    .max(2000, "Isi komentar maksimal 2000 karakter"),
})

export const markCommentsReadSchema = z.object({
  assessmentId: z.string().uuid("ID penilaian tidak valid"),
})

export type RekapFilterInput = z.infer<typeof rekapFilterSchema>
export type ApproveAssessmentInput = z.infer<typeof approveAssessmentSchema>
export type RequestRevisionInput = z.infer<typeof requestRevisionSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type MarkCommentsReadInput = z.infer<typeof markCommentsReadSchema>
