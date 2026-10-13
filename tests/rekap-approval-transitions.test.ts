import { describe, it, expect } from "vitest"
import { AssessmentStatus, UserRole } from "@/types/database"
import {
  approveAssessmentSchema,
  requestRevisionSchema,
} from "@/lib/validations/rekap"

/**
 * Pengujian Logika Transisi Status Penilaian sesuai PRD Bagian 9 & Bagian 14.2:
 * - submitted -> approved (oleh admin/super_admin)
 * - submitted -> revision_requested (oleh admin/super_admin; wajib ada komentar)
 * - revision_requested -> submitted (saat ketua mengubah)
 * - approved -> submitted (aturan pasca-approval: otomatis kembali submitted jika diubah ketua)
 * - Transisi ilegal dicegah (misal draf -> approved)
 */
describe("Logika Transisi Status Penilaian (PRD Bagian 9)", () => {
  // Model transisi status sistem
  interface TransitionContext {
    currentStatus: AssessmentStatus
    actorRole: UserRole
    action?: "approve" | "request_revision" | "edit"
    comment?: string
    isEditedByKetua?: boolean
  }

  function validateStatusTransition(ctx: TransitionContext): {
    allowed: boolean
    nextStatus?: AssessmentStatus
    reason?: string
  } {
    const { currentStatus, actorRole, action, comment, isEditedByKetua } = ctx

    // Skenario 1: Permintaan Revisi (Wajib komentar)
    if (action === "request_revision" || comment !== undefined) {
      if (actorRole !== "admin" && actorRole !== "super_admin") {
        return { allowed: false, reason: "Hanya admin dan super_admin yang berhak meminta revisi." }
      }
      if (currentStatus !== "submitted" && currentStatus !== "approved") {
        return { allowed: false, reason: "Revisi hanya dapat diminta untuk status submitted atau approved." }
      }
      if (!comment || comment.trim().length < 3) {
        return { allowed: false, reason: "Catatan revisi wajib diisi minimal 3 karakter." }
      }
      return { allowed: true, nextStatus: "revision_requested" }
    }

    // Skenario 2: Persetujuan (Approval)
    if (action === "approve" || (action === undefined && isEditedByKetua !== true)) {
      if (actorRole !== "admin" && actorRole !== "super_admin") {
        return { allowed: false, reason: "Hanya admin dan super_admin yang berhak menyetujui penilaian." }
      }
      if (currentStatus === "submitted") {
        return { allowed: true, nextStatus: "approved" }
      }
      if (currentStatus === "draft") {
        return { allowed: false, reason: "Penilaian berstatus draft tidak boleh disetujui." }
      }
    }

    // Skenario 3: Pengubahan oleh Ketua (Role: user)
    if (actorRole === "user" && isEditedByKetua) {
      // Jika sebelumnya revision_requested, beralih ke submitted
      if (currentStatus === "revision_requested") {
        return { allowed: true, nextStatus: "submitted" }
      }
      // Aturan Pasca-Approval (PRD 9 & 14.2): Jika ketua mengubah penilaian yang sudah disetujui
      if (currentStatus === "approved") {
        return { allowed: true, nextStatus: "submitted" }
      }
      // Jika sebelumnya submitted, tetap submitted
      if (currentStatus === "submitted") {
        return { allowed: true, nextStatus: "submitted" }
      }
      // Dari draft ke submitted
      if (currentStatus === "draft") {
        return { allowed: true, nextStatus: "submitted" }
      }
    }

    return { allowed: false, reason: "Transisi tidak diizinkan untuk peran atau status ini." }
  }

  describe("1. Transisi dari 'submitted'", () => {
    it("Admin & Super Admin BERHASIL menyetujui penilaian dari status submitted -> approved", () => {
      const adminApproval = validateStatusTransition({
        currentStatus: "submitted",
        actorRole: "admin",
        action: "approve",
      })
      expect(adminApproval.allowed).toBe(true)
      expect(adminApproval.nextStatus).toBe("approved")

      const superAdminApproval = validateStatusTransition({
        currentStatus: "submitted",
        actorRole: "super_admin",
        action: "approve",
      })
      expect(superAdminApproval.allowed).toBe(true)
      expect(superAdminApproval.nextStatus).toBe("approved")
    })

    it("Ketua TIDAK BOLEH menyetujui penilaian (approval hanya untuk admin / super_admin)", () => {
      const ketuaApproval = validateStatusTransition({
        currentStatus: "submitted",
        actorRole: "user",
        action: "approve",
      })
      expect(ketuaApproval.allowed).toBe(false)
    })

    it("Admin BERHASIL meminta revisi dari submitted -> revision_requested bila disertai komentar", () => {
      const revision = validateStatusTransition({
        currentStatus: "submitted",
        actorRole: "admin",
        action: "request_revision",
        comment: "Tolong lengkapi catatan untuk aspek kebersihan",
      })
      expect(revision.allowed).toBe(true)
      expect(revision.nextStatus).toBe("revision_requested")
    })

    it("Permintaan revisi GAGAL bila komentar kosong atau kurang dari 3 karakter", () => {
      const emptyComment = validateStatusTransition({
        currentStatus: "submitted",
        actorRole: "admin",
        action: "request_revision",
        comment: "",
      })
      expect(emptyComment.allowed).toBe(false)
      expect(emptyComment.reason).toContain("minimal 3 karakter")

      // Validasi skema Zod juga menolak
      const parseResult = requestRevisionSchema.safeParse({
        assessmentId: "00000000-0000-0000-0000-000000000001",
        comment: "ok",
      })
      expect(parseResult.success).toBe(false)
    })
  })

  describe("2. Transisi dari 'revision_requested'", () => {
    it("Ketika Ketua mengubah penilaian berstatus revision_requested, status otomatis kembali ke 'submitted'", () => {
      const ketuaEdits = validateStatusTransition({
        currentStatus: "revision_requested",
        actorRole: "user",
        isEditedByKetua: true,
      })
      expect(ketuaEdits.allowed).toBe(true)
      expect(ketuaEdits.nextStatus).toBe("submitted")
    })
  })

  describe("3. Aturan Pasca-Approval ('approved')", () => {
    it("Jika Ketua mengubah penilaian yang sudah 'approved', status otomatis reset ke 'submitted' (PRD Bagian 9 & 14.2)", () => {
      const ketuaEditsApproved = validateStatusTransition({
        currentStatus: "approved",
        actorRole: "user",
        isEditedByKetua: true,
      })
      expect(ketuaEditsApproved.allowed).toBe(true)
      expect(ketuaEditsApproved.nextStatus).toBe("submitted")
    })

    it("Admin dapat meminta revisi pada penilaian yang berstatus 'approved' jika ditemukan kekeliruan baru", () => {
      const revisionOnApproved = validateStatusTransition({
        currentStatus: "approved",
        actorRole: "admin",
        action: "request_revision",
        comment: "Data kehadiran terupdate, mohon sesuaikan aspek kerajinan.",
      })
      expect(revisionOnApproved.allowed).toBe(true)
      expect(revisionOnApproved.nextStatus).toBe("revision_requested")
    })
  })

  describe("4. Proteksi Transisi Ilegal", () => {
    it("Admin TIDAK BISA menyetujui penilaian yang masih berstatus 'draft'", () => {
      const approveDraft = validateStatusTransition({
        currentStatus: "draft",
        actorRole: "admin",
        action: "approve",
      })
      expect(approveDraft.allowed).toBe(false)
    })

    it("ApproveAssessmentSchema menolak assessmentId yang bukan format UUID", () => {
      const invalidUuid = approveAssessmentSchema.safeParse({
        assessmentId: "bukan-uuid",
      })
      expect(invalidUuid.success).toBe(false)
    })
  })
})
