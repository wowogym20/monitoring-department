import { describe, it, expect, vi, beforeEach } from "vitest"
import { getLaporanKerjaServer } from "@/lib/actions/laporan-kerja"
import { navigationItems } from "@/components/layout/nav-items"

describe("Laporan Kerja Integration & Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("should have /laporan-kerja configured in navigationItems with proper roles", () => {
    const navItem = navigationItems.find((item) => item.href === "/laporan-kerja")
    expect(navItem).toBeDefined()
    expect(navItem?.title).toBe("Laporan Kerja Anggota")
    expect(navItem?.section).toBe("main")
    expect(navItem?.roles).toContain("super_admin")
    expect(navItem?.roles).toContain("admin")
    expect(navItem?.roles).toContain("user")
  })

  it("should successfully fetch and map laporan kerja from mock API response", async () => {
    const mockApiResponse = {
      status: "success",
      total: 2,
      page: 1,
      limit: 50,
      total_pages: 1,
      data: [
        {
          id: 23,
          nip: "066",
          nama_pegawai: "Firmana Putra, S.Kom.",
          judul: "tes sekali lagi",
          tanggal: "2026-10-17",
          jam: "20:17:37",
          keterangan: "tes sekali lagi",
          foto_file: "5696ad37571cf1087.98066080.jpg",
          foto_url: "https://absensi.tazakka.or.id/sw-content/laporan-kerja/5696ad37571cf1087.98066080.jpg",
          status: "Y",
          status_label: "Disetujui",
        },
        {
          id: 22,
          nip: "060",
          nama_pegawai: "Febrian Ikhza Maulana, S.H.",
          judul: "Kontroling santri",
          tanggal: "2026-07-06",
          jam: "06:04:25",
          keterangan: "Kontroling santri sakit",
          foto_file: null,
          foto_url: null,
          status: "PENDING",
          status_label: "Pending",
        },
      ],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response)

    const result = await getLaporanKerjaServer()

    expect(result.status).toBe("success")
    expect(result.total).toBe(2)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].id).toBe(23)
    expect(result.data[0].status).toBe("Y")
    expect(result.data[0].status_label).toBe("Disetujui")
    expect(result.data[1].status).toBe("PENDING")
    expect(result.data[1].status_label).toBe("Pending")
  })

  it("should handle API failure gracefully without throwing exceptions", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"))

    const result = await getLaporanKerjaServer()

    expect(result.status).toBe("error")
    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
    expect(result.message).toContain("Network timeout")
  })
})
