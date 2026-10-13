import { z } from "zod"

export const scoreItemSchema = z.object({
  aspect_id: z.string().uuid("ID aspek tidak valid"),
  nilai: z.number().int().min(1, "Nilai minimal 1").max(5, "Nilai maksimal 5"),
})

export const saveAssessmentSchema = z.object({
  period_id: z.string().uuid("ID periode tidak valid"),
  member_id: z.string().uuid("ID anggota tidak valid"),
  status: z.enum(["draft", "submitted"]),
  catatan: z
    .string()
    .max(2000, "Catatan umum maksimal 2000 karakter")
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null)),
  scores: z.array(scoreItemSchema),
})

export const deleteAssessmentSchema = z.object({
  assessment_id: z.string().uuid("ID penilaian tidak valid"),
})

export type ScoreItemInput = z.infer<typeof scoreItemSchema>
export type SaveAssessmentInput = z.infer<typeof saveAssessmentSchema>
export type DeleteAssessmentInput = z.infer<typeof deleteAssessmentSchema>
