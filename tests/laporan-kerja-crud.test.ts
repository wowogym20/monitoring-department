import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  createLaporanKerjaSchema,
  updateLaporanKerjaSchema,
  updateStatusLaporanSchema,
} from "@/lib/validations/laporan-kerja"
import {
  createLaporanKerjaAction,
  updateLaporanKerjaAction,
  updateStatusLaporanKerjaAction,
  deleteLaporanKerjaAction,
  bulkUpdateStatusLaporanKerjaAction,
  bulkDeleteLaporanKerjaAction,
} from "@/lib/actions/laporan-kerja"
import { requireRole } from "@/lib/auth"

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock requireRole
vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn().mockResolvedValue({
    id: "user-123",
    role: "user",
    nama: "User Guru",
  }),
}))

describe("Laporan Kerja CRUD Validations & Actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("Zod Validation Schemas", () => {
    it("should accept valid create payload", () => {
      const validData = {
        nip: "066",
        nama: "Pemeliharaan Jaringan",
        tanggal: "2026-10-17",
        keterangan: "Pengecekan switch dan router lantai 2",
      }
      const res = createLaporanKerjaSchema.safeParse(validData)
      expect(res.success).toBe(true)
    })

    it("should reject create payload if NIP or Judul is missing", () => {
      const invalidData = {
        nip: "",
        nama: "ab", // less than 3 chars
        tanggal: "invalid-date",
        keterangan: "ok",
      }
      const res = createLaporanKerjaSchema.safeParse(invalidData)
      expect(res.success).toBe(false)
    })

    it("should accept valid status values and reject unknown status", () => {
      expect(updateStatusLaporanSchema.safeParse({ id: 1, status: "Y" }).success).toBe(true)
      expect(updateStatusLaporanSchema.safeParse({ id: 1, status: "N" }).success).toBe(true)
      expect(updateStatusLaporanSchema.safeParse({ id: 1, status: "PENDING" }).success).toBe(true)
      expect(updateStatusLaporanSchema.safeParse({ id: 1, status: "INVALID" }).success).toBe(false)
    })
  })

  describe("Server Actions Mutations", () => {
    it("createLaporanKerjaAction should send POST request and return success", async () => {
      const jsonRes = { status: "success", message: "Created", id: 99 }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(jsonRes),
        json: async () => jsonRes,
      } as Response)

      const formData = new FormData()
      formData.append("nip", "066")
      formData.append("nama", "Laporan Baru")
      formData.append("tanggal", "2026-10-17")
      formData.append("keterangan", "Melakukan pengecekan sistem")

      const res = await createLaporanKerjaAction(formData)
      expect(res.success).toBe(true)
      expect(res.id).toBe(99)
      expect(res.message).toBe("Laporan kerja berhasil ditambahkan")
    })

    it("updateLaporanKerjaAction should send update request and return success", async () => {
      const jsonRes = { status: "success", message: "Updated" }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(jsonRes),
        json: async () => jsonRes,
      } as Response)

      const formData = new FormData()
      formData.append("nama", "Laporan Revisi")
      formData.append("tanggal", "2026-10-17")
      formData.append("keterangan", "Uraian hasil perbaikan revisi")

      const res = await updateLaporanKerjaAction(23, formData)
      expect(res.success).toBe(true)
      expect(res.message).toBe("Laporan kerja berhasil diperbarui")
    })

    it("updateStatusLaporanKerjaAction should approve report with status Y for all roles", async () => {
      const jsonRes = { status: "success", new_status: "Y" }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(jsonRes),
        json: async () => jsonRes,
      } as Response)

      const res = await updateStatusLaporanKerjaAction(23, "Y")
      expect(requireRole).toHaveBeenCalledWith("super_admin", "admin", "user")
      expect(res.success).toBe(true)
      expect(res.message).toBe("Laporan kerja berhasil disetujui")
    })

    it("deleteLaporanKerjaAction should delete report and return success for all roles", async () => {
      const jsonRes = { status: "success", message: "Deleted" }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(jsonRes),
        json: async () => jsonRes,
      } as Response)

      const res = await deleteLaporanKerjaAction(23)
      expect(requireRole).toHaveBeenCalledWith("super_admin", "admin", "user")
      expect(res.success).toBe(true)
      expect(res.message).toBe("Laporan kerja berhasil dihapus")
    })

    it("should automatically fall back to GET when POST returns 405 Method Not Allowed", async () => {
      const postFail = {
        ok: false,
        status: 405,
        text: async () => JSON.stringify({ status: "error", message: "Method Not Allowed: Hanya metode GET yang didukung" }),
        json: async () => ({ status: "error", message: "Method Not Allowed: Hanya metode GET yang didukung" }),
      } as Response

      const getSuccess = {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: "success", message: "Berhasil via GET" }),
        json: async () => ({ status: "success", message: "Berhasil via GET" }),
      } as Response

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(postFail) // first POST call returns 405
        .mockResolvedValueOnce(getSuccess) // second GET fallback call returns success

      const res = await updateStatusLaporanKerjaAction(45, "Y")
      expect(res.success).toBe(true)
      expect(res.message).toBe("Laporan kerja berhasil disetujui")
      expect(global.fetch).toHaveBeenCalledTimes(2)
      // Check that second call was GET
      const secondCallArg = (global.fetch as any).mock.calls[1]
      expect(secondCallArg[1].method).toBe("GET")
      expect(secondCallArg[0]).toContain("action=status")
      expect(secondCallArg[0]).toContain("status=Y")
    })

    it("bulkUpdateStatusLaporanKerjaAction should update multiple items and support fallback", async () => {
      const jsonRes = { status: "success", message: "Updated" }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(jsonRes),
        json: async () => jsonRes,
      } as Response)

      const res = await bulkUpdateStatusLaporanKerjaAction([1, 2, 3], "Y")
      expect(res.success).toBe(true)
      expect(res.totalRequested).toBe(3)
      expect(res.successCount).toBe(3)
      expect(res.failureCount).toBe(0)
    })

    it("bulkDeleteLaporanKerjaAction should delete multiple items", async () => {
      const jsonRes = { status: "success", message: "Deleted" }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(jsonRes),
        json: async () => jsonRes,
      } as Response)

      const res = await bulkDeleteLaporanKerjaAction([10, 20])
      expect(res.success).toBe(true)
      expect(res.totalRequested).toBe(2)
      expect(res.successCount).toBe(2)
      expect(res.failureCount).toBe(0)
    })
  })
})
