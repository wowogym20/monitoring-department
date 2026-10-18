import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  bulkUpdateStatusLaporanKerjaAction,
  bulkDeleteLaporanKerjaAction,
  type LaporanKerjaItem,
} from "@/lib/actions/laporan-kerja"
import { exportSelectedLaporanKerjaToExcel } from "@/lib/export/laporan-kerja-export"
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
    nama: "User Anggota",
  }),
}))

describe("Laporan Kerja - Bulk Actions & User Grouping Logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const sampleReports: LaporanKerjaItem[] = [
    {
      id: 101,
      nip: "001",
      nama_pegawai: "Ust. Ahmad Fauzi",
      judul: "Menyiapkan Bahan Ajar",
      tanggal: "2026-10-18",
      jam: "08:00:00",
      keterangan: "Bahan ajar tajwid kelas 1",
      foto_file: null,
      foto_url: null,
      status: "Y",
      status_label: "Disetujui",
    },
    {
      id: 102,
      nip: "001",
      nama_pegawai: "Ust. Ahmad Fauzi",
      judul: "Evaluasi Santri",
      tanggal: "2026-10-18",
      jam: "10:30:00",
      keterangan: "Evaluasi hafalan juz 30",
      foto_file: "foto1.jpg",
      foto_url: "https://example.com/foto1.jpg",
      status: "PENDING",
      status_label: "Pending",
    },
    {
      id: 103,
      nip: "002",
      nama_pegawai: "Ust. Bambang Hermanto",
      judul: "Piket Asrama",
      tanggal: "2026-10-18",
      jam: "13:00:00",
      keterangan: "Pemeriksaan kebersihan kamar santri",
      foto_file: null,
      foto_url: null,
      status: "N",
      status_label: "Ditolak",
    },
  ]

  it("should correctly group reports into separate containers per user", () => {
    const map = new Map<
      string,
      {
        userKey: string
        nip: string
        nama_pegawai: string
        items: LaporanKerjaItem[]
        stats: { total: number; disetujui: number; pending: number; ditolak: number }
      }
    >()

    for (const item of sampleReports) {
      const key = item.nip ? `nip:${item.nip}` : `name:${item.nama_pegawai}`
      let group = map.get(key)
      if (!group) {
        group = {
          userKey: key,
          nip: item.nip,
          nama_pegawai: item.nama_pegawai,
          items: [],
          stats: { total: 0, disetujui: 0, pending: 0, ditolak: 0 },
        }
        map.set(key, group)
      }
      group.items.push(item)
      group.stats.total++
      if (item.status === "Y") group.stats.disetujui++
      else if (item.status === "N") group.stats.ditolak++
      else group.stats.pending++
    }

    const groups = Array.from(map.values())

    // Harus terpisah menjadi 2 grup pegawai berbeda
    expect(groups).toHaveLength(2)

    // Grup 1: Ust. Ahmad Fauzi
    const ahmadGroup = groups.find((g) => g.nip === "001")
    expect(ahmadGroup).toBeDefined()
    expect(ahmadGroup?.items).toHaveLength(2)
    expect(ahmadGroup?.stats.total).toBe(2)
    expect(ahmadGroup?.stats.disetujui).toBe(1)
    expect(ahmadGroup?.stats.pending).toBe(1)

    // Grup 2: Ust. Bambang Hermanto
    const bambangGroup = groups.find((g) => g.nip === "002")
    expect(bambangGroup).toBeDefined()
    expect(bambangGroup?.items).toHaveLength(1)
    expect(bambangGroup?.stats.ditolak).toBe(1)
  })

  it("should handle selecting and deselecting per user group", () => {
    const ahmadReportIds = [101, 102]
    let selectedIds = new Set<number>()

    // Select all for Ahmad
    ahmadReportIds.forEach((id) => selectedIds.add(id))
    expect(selectedIds.size).toBe(2)
    expect(selectedIds.has(101)).toBe(true)
    expect(selectedIds.has(102)).toBe(true)

    // Deselect all for Ahmad
    ahmadReportIds.forEach((id) => selectedIds.delete(id))
    expect(selectedIds.size).toBe(0)
  })

  it("should call bulkUpdateStatusLaporanKerjaAction successfully for all roles", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", message: "Status diperbarui" }),
    } as Response)

    const res = await bulkUpdateStatusLaporanKerjaAction([101, 102], "Y")

    expect(requireRole).toHaveBeenCalledWith("super_admin", "admin", "user")
    expect(res.success).toBe(true)
    expect(res.totalRequested).toBe(2)
    expect(res.successCount).toBe(2)
    expect(res.failureCount).toBe(0)
    expect(res.message).toContain("2 dari 2 laporan berhasil disetujui")
  })

  it("should handle bulkDeleteLaporanKerjaAction with empty array gracefully", async () => {
    const res = await bulkDeleteLaporanKerjaAction([])
    expect(requireRole).toHaveBeenCalledWith("super_admin", "admin", "user")
    expect(res.success).toBe(false)
    expect(res.message).toContain("Tidak ada data laporan kerja yang dipilih")
  })

  it("should call bulkDeleteLaporanKerjaAction and report successes for all roles", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", message: "Dihapus" }),
    } as Response)

    const res = await bulkDeleteLaporanKerjaAction([101, 103])

    expect(requireRole).toHaveBeenCalledWith("super_admin", "admin", "user")
    expect(res.success).toBe(true)
    expect(res.totalRequested).toBe(2)
    expect(res.successCount).toBe(2)
    expect(res.failureCount).toBe(0)
    expect(res.message).toContain("berhasil dihapus")
  })

  it("should generate Excel export without throwing errors in Node environment", async () => {
    await expect(
      exportSelectedLaporanKerjaToExcel(sampleReports, "test.xlsx")
    ).resolves.not.toThrow()
  })
})
