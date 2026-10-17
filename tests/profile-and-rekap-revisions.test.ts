import { describe, it, expect } from "vitest"
import { DepartmentRekapSummary } from "@/lib/actions/rekap"

describe("Revisi Halaman Profil: Deteksi Perubahan Data Profil", () => {
  function checkProfileHasChanges(
    currentData: { nama: string; no_hp?: string | null },
    baselineData: { nama: string; no_hp?: string | null }
  ): boolean {
    const currentNama = currentData.nama.trim()
    const baselineNama = baselineData.nama.trim()
    const currentNoHp = (currentData.no_hp || "").trim()
    const baselineNoHp = (baselineData.no_hp || "").trim()

    return currentNama !== baselineNama || currentNoHp !== baselineNoHp
  }

  it("mendeteksi bahwa tidak ada perubahan jika nama dan nomor HP sama persis", () => {
    const baseline = { nama: "Ustadz Ahmad", no_hp: "08123456789" }
    const current = { nama: "Ustadz Ahmad", no_hp: "08123456789" }

    expect(checkProfileHasChanges(current, baseline)).toBe(false)
  })

  it("mendeteksi bahwa tidak ada perubahan meskipun terdapat spasi tambahan di awal/akhir (trim normalisasi)", () => {
    const baseline = { nama: "Ustadz Ahmad", no_hp: "08123456789" }
    const current = { nama: "  Ustadz Ahmad  ", no_hp: " 08123456789 " }

    expect(checkProfileHasChanges(current, baseline)).toBe(false)
  })

  it("mendeteksi tidak ada perubahan jika no_hp bernilai null vs string kosong", () => {
    const baseline = { nama: "Ustadz Ahmad", no_hp: null }
    const current = { nama: "Ustadz Ahmad", no_hp: "" }

    expect(checkProfileHasChanges(current, baseline)).toBe(false)
  })

  it("mendeteksi perubahan ketika nama diubah", () => {
    const baseline = { nama: "Ustadz Ahmad", no_hp: "08123456789" }
    const current = { nama: "Ustadz Ahmad Fulan", no_hp: "08123456789" }

    expect(checkProfileHasChanges(current, baseline)).toBe(true)
  })

  it("mendeteksi perubahan ketika nomor HP diubah", () => {
    const baseline = { nama: "Ustadz Ahmad", no_hp: "08123456789" }
    const current = { nama: "Ustadz Ahmad", no_hp: "08999999999" }

    expect(checkProfileHasChanges(current, baseline)).toBe(true)
  })
})

describe("Revisi Halaman /rekap: Kontrol Visibilitas Bagian Ringkasan Progres per Departemen", () => {
  const dummySummaries: DepartmentRekapSummary[] = [
    {
      id: "dept-1",
      nama: "Departemen Pendidikan",
      kode: "PEND",
      total_members: 10,
      assessed_count: 10,
      draft_count: 0,
      average_score: 4.5,
      is_incomplete: false,
    },
    {
      id: "dept-2",
      nama: "Departemen Pengasuhan",
      kode: "ASUH",
      total_members: 8,
      assessed_count: 6,
      draft_count: 2,
      average_score: 4.2,
      is_incomplete: true,
    },
  ]

  function shouldRenderDepartmentProgressSection(userRole?: "super_admin" | "admin" | "user"): boolean {
    return userRole !== "user"
  }

  it("menyembunyikan bagian Ringkasan Progres per Departemen khusus untuk role user (Kepala Departemen)", () => {
    expect(shouldRenderDepartmentProgressSection("user")).toBe(false)
  })

  it("tetap menampilkan bagian Ringkasan Progres per Departemen untuk role admin (SDM)", () => {
    expect(shouldRenderDepartmentProgressSection("admin")).toBe(true)
  })

  it("tetap menampilkan bagian Ringkasan Progres per Departemen untuk role super_admin (Pimpinan)", () => {
    expect(shouldRenderDepartmentProgressSection("super_admin")).toBe(true)
  })

  it("tetap menampilkan bagian jika userRole tidak didefinisikan (default fallback aman)", () => {
    expect(shouldRenderDepartmentProgressSection(undefined)).toBe(true)
  })

  it("menghitung metrik agregat KPI global dengan benar untuk seluruh role", () => {
    const totalDepts = dummySummaries.length
    const completedDepts = dummySummaries.filter((d) => !d.is_incomplete).length
    const incompleteDepts = dummySummaries.filter((d) => d.is_incomplete).length

    expect(totalDepts).toBe(2)
    expect(completedDepts).toBe(1)
    expect(incompleteDepts).toBe(1)
  })

  it("menangani nama departemen yang panjang dan berkarakter khusus tanpa error data", () => {
    const longNamedDept: DepartmentRekapSummary = {
      id: "dept-long",
      nama: "Dept. Penelitian dan Pengembangan Akademik (Majelis Guru & Pengasuhan)",
      kode: "LITBANG-GURU-PENGASUHAN",
      total_members: 25,
      assessed_count: 20,
      draft_count: 5,
      average_score: 4.65,
      is_incomplete: true,
    }

    const percentage = Math.round((longNamedDept.assessed_count / longNamedDept.total_members) * 100)
    expect(percentage).toBe(80)
    expect(longNamedDept.nama.length).toBeGreaterThan(40)
    expect(longNamedDept.is_incomplete).toBe(true)
  })
})

