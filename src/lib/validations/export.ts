import { z } from "zod"
import { UserRole } from "@/types/database"

/**
 * Hak akses ekspor sesuai PRD Bagian 4, 7 (FR-9) & Bagian 14:
 * Hanya super_admin dan admin (SDM) yang berhak mengunduh rekapitulasi penilaian.
 */
export const EXPORT_ROLES: readonly UserRole[] = ["super_admin", "admin"] as const
export type ExportRole = (typeof EXPORT_ROLES)[number]

/**
 * Validasi parameter filter ekspor
 */
export const exportFilterSchema = z.object({
  periodeId: z.string().uuid("ID periode tidak valid"),
  departmentId: z.string().optional().default("all"),
})

export type ExportFilterInput = z.infer<typeof exportFilterSchema>
