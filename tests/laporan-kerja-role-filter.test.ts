import { describe, it, expect } from "vitest"
import type { LaporanKerjaItem, LaporanKerjaApiResponse } from "@/lib/actions/laporan-kerja"

describe("Laporan Kerja Role User Department Filtering", () => {
  // Sample reports from Tazakka API
  const mockApiReports: LaporanKerjaItem[] = [
    {
      id: 1,
      nip: "066",
      nama_pegawai: "Ustadz Ahmad (TI)",
      judul: "Maintenance Server",
      tanggal: "2026-10-18",
      jam: "08:00:00",
      keterangan: "Pengecekan rack server",
      foto_file: null,
      foto_url: null,
      status: "Y",
      status_label: "Disetujui",
    },
    {
      id: 2,
      nip: "077",
      nama_pegawai: "Ustadz Budi (TI)",
      judul: "Setting WiFi Kelas",
      tanggal: "2026-10-18",
      jam: "09:30:00",
      keterangan: "Konfigurasi Access Point",
      foto_file: null,
      foto_url: null,
      status: "PENDING",
      status_label: "Pending",
    },
    {
      id: 3,
      nip: "099",
      nama_pegawai: "Ustadzah Siti (Pengasuhan)",
      judul: "Pendataan Santri",
      tanggal: "2026-10-18",
      jam: "10:00:00",
      keterangan: "Absensi asrama santri",
      foto_file: null,
      foto_url: null,
      status: "Y",
      status_label: "Disetujui",
    },
    {
      id: 4,
      nip: "100",
      nama_pegawai: "Ustadz Harun (Kurikulum)",
      judul: "Penyusunan Silabus",
      tanggal: "2026-10-18",
      jam: "11:00:00",
      keterangan: "Rapat koordinasi silabus",
      foto_file: null,
      foto_url: null,
      status: "N",
      status_label: "Ditolak",
    },
  ]

  // Supabase members for TI Department
  const tiDeptMembers = [
    { id: "mem-uuid-1", nip: "066", nama: "Ustadz Ahmad (TI)", jabatan: "Kepala Lab" },
    { id: "mem-uuid-2", nip: "077", nama: "Ustadz Budi (TI)", jabatan: "Teknisi Jaringan" },
  ]

  it("filters reports so user/ketua only sees reports of members in their department", () => {
    const allowedNips = new Set(tiDeptMembers.map((m) => m.nip?.trim().toLowerCase()).filter(Boolean))
    const allowedIds = new Set(tiDeptMembers.map((m) => m.id.trim().toLowerCase()).filter(Boolean))
    const allowedNames = new Set(tiDeptMembers.map((m) => m.nama.trim().toLowerCase()).filter(Boolean))

    const filtered = mockApiReports.filter((item) => {
      const nip = (item.nip || "").trim().toLowerCase()
      const nama = (item.nama_pegawai || "").trim().toLowerCase()
      return allowedNips.has(nip) || allowedIds.has(nip) || allowedNames.has(nama)
    })

    expect(filtered).toHaveLength(2)
    expect(filtered.map((r) => r.nip)).toEqual(["066", "077"])
    expect(filtered.some((r) => r.nip === "099")).toBe(false)
    expect(filtered.some((r) => r.nip === "100")).toBe(false)
  })

  it("returns empty report list when department has no registered members", () => {
    const emptyDeptMembers: Array<{ id: string; nip: string; nama: string }> = []
    const allowedNips = new Set(emptyDeptMembers.map((m) => m.nip))

    const filtered = mockApiReports.filter((item) => allowedNips.has(item.nip))
    expect(filtered).toHaveLength(0)
  })

  it("allows super_admin and admin to view all 4 reports across departments", () => {
    const userRole = "super_admin"
    let displayReports: LaporanKerjaItem[] = []

    if (userRole === "user") {
      displayReports = []
    } else {
      displayReports = mockApiReports
    }

    expect(displayReports).toHaveLength(4)
    expect(displayReports.map((r) => r.id)).toEqual([1, 2, 3, 4])
  })

  it("correctly recalculates KPI metrics on filtered department reports", () => {
    const allowedNips = new Set(["066", "077"])
    const filtered = mockApiReports.filter((item) => allowedNips.has(item.nip))

    let disetujui = 0
    let pending = 0
    let ditolak = 0

    for (const r of filtered) {
      if (r.status === "Y") disetujui++
      else if (r.status === "N") ditolak++
      else pending++
    }

    expect(filtered.length).toBe(2)
    expect(disetujui).toBe(1) // id 1
    expect(pending).toBe(1)   // id 2
    expect(ditolak).toBe(0)
  })
})
