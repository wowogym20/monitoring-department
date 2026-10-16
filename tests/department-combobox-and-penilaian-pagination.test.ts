import { describe, it, expect } from "vitest"

// Helper function untuk simulasi logika filter departemen seperti di DepartmentCombobox
function filterDepartments(
  departments: Array<{ id: string; nama: string; kode: string }>,
  query: string,
  includeAllOption = true,
  allLabel = "Semua Departemen"
) {
  const q = query.toLowerCase().trim()
  const result: Array<{ id: string; nama: string; kode?: string; isAll?: boolean }> = []

  if (includeAllOption) {
    if (!q || allLabel.toLowerCase().includes(q) || "semua".includes(q)) {
      result.push({ id: "all", nama: allLabel, isAll: true })
    }
  }

  departments.forEach((d) => {
    const matchNama = d.nama.toLowerCase().includes(q)
    const matchKode = d.kode.toLowerCase().includes(q)
    if (!q || matchNama || matchKode) {
      result.push({ id: d.id, nama: d.nama, kode: d.kode })
    }
  })

  return result
}

// Helper function untuk simulasi pemotongan paginasi pada daftar anggota penilaian
function paginateList<T>(
  items: T[],
  page: number,
  pageSize: number
): { paginatedItems: T[]; totalPages: number; rowOffset: number } {
  const totalPages = pageSize >= items.length ? 1 : Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const rowOffset = (safePage - 1) * pageSize
  const paginatedItems = pageSize >= items.length
    ? items
    : items.slice(rowOffset, rowOffset + pageSize)

  return { paginatedItems, totalPages, rowOffset }
}

describe("Fitur Pencarian Filter Departemen & Paginasi Tabel Penilaian", () => {
  const dummyDepts = [
    { id: "dept-1", nama: "Departemen SDM & Organisasi", kode: "SDM" },
    { id: "dept-2", nama: "Departemen Pendidikan & Kurikulum", kode: "DIK" },
    { id: "dept-3", nama: "Departemen Sarana & Prasarana", kode: "SARPRAS" },
    { id: "dept-4", nama: "Departemen Hubungan Masyarakat", kode: "HUMAS" },
    { id: "dept-5", nama: "Departemen Kesehatan & Keperawatan", kode: "KES" },
  ]

  describe("1. Logika Pencarian & Opsi Teratas (Top Match) Filter Departemen", () => {
    it("menampilkan opsi 'Semua Departemen' dan semua list jika kata kunci kosong", () => {
      const results = filterDepartments(dummyDepts, "")
      expect(results).toHaveLength(6) // 1 opsi semua + 5 depts
      expect(results[0].id).toBe("all")
      expect(results[0].nama).toBe("Semua Departemen")
    })

    it("menemukan departemen berdasarkan nama secara case-insensitive", () => {
      const results = filterDepartments(dummyDepts, "pendidikan")
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].id).toBe("dept-2")
      expect(results[0].nama).toBe("Departemen Pendidikan & Kurikulum")
    })

    it("menemukan departemen berdasarkan kode singkatan (misal: 'SARPRAS' atau 'hum')", () => {
      const results = filterDepartments(dummyDepts, "hum")
      expect(results.length).toBe(1)
      expect(results[0].id).toBe("dept-4")
      expect(results[0].kode).toBe("HUMAS")
    })

    it("memilih item pertama sebagai target Enter saat kata kunci cocok", () => {
      // Saat pengguna mengetik 'kes', item pertama adalah 'Departemen Kesehatan & Keperawatan'
      const query = "kes"
      const results = filterDepartments(dummyDepts, query)
      expect(results.length).toBe(1)
      const topSelected = results[0]
      expect(topSelected.id).toBe("dept-5")
      expect(topSelected.nama).toContain("Kesehatan")
    })

    it("mengembalikan array kosong jika tidak ada kata kunci yang cocok", () => {
      const results = filterDepartments(dummyDepts, "xyz-tidak-ada")
      expect(results).toHaveLength(0)
    })

    it("dapat menyesuaikan allLabel custom (misalnya pada halaman ekspor)", () => {
      const customLabel = "Semua Departemen (Rekap Lengkap)"
      const results = filterDepartments(dummyDepts, "", true, customLabel)
      expect(results[0].nama).toBe(customLabel)
    })
  })

  describe("2. Logika Paginasi Tabel Penilaian & Penomoran Baris", () => {
    // 35 data dummy anggota
    const dummyMembers = Array.from({ length: 35 }, (_, i) => ({
      id: `member-${i + 1}`,
      nama: `Anggota ${i + 1}`,
    }))

    it("memotong halaman pertama dengan pageSize 10 secara tepat", () => {
      const { paginatedItems, totalPages, rowOffset } = paginateList(dummyMembers, 1, 10)
      expect(totalPages).toBe(4)
      expect(rowOffset).toBe(0)
      expect(paginatedItems).toHaveLength(10)
      expect(paginatedItems[0].nama).toBe("Anggota 1")
      expect(paginatedItems[9].nama).toBe("Anggota 10")

      // Validasi penomoran baris No: rowOffset + index + 1
      expect(rowOffset + 0 + 1).toBe(1)
      expect(rowOffset + 9 + 1).toBe(10)
    })

    it("menghitung penomoran baris dinamis pada halaman 2 dan 3", () => {
      // Halaman 2 (item 11-20)
      const page2 = paginateList(dummyMembers, 2, 10)
      expect(page2.rowOffset).toBe(10)
      expect(page2.paginatedItems[0].nama).toBe("Anggota 11")
      expect(page2.rowOffset + 0 + 1).toBe(11) // Baris No. 11
      expect(page2.rowOffset + 9 + 1).toBe(20) // Baris No. 20

      // Halaman 4 (sisa 5 item: 31-35)
      const page4 = paginateList(dummyMembers, 4, 10)
      expect(page4.rowOffset).toBe(30)
      expect(page4.paginatedItems).toHaveLength(5)
      expect(page4.rowOffset + 0 + 1).toBe(31) // Baris No. 31
      expect(page4.rowOffset + 4 + 1).toBe(35) // Baris No. 35
    })

    it("menampilkan seluruh baris ketika pageSize lebih besar dari total data (mode 'Semua')", () => {
      const { paginatedItems, totalPages, rowOffset } = paginateList(dummyMembers, 1, 1000)
      expect(totalPages).toBe(1)
      expect(rowOffset).toBe(0)
      expect(paginatedItems).toHaveLength(35)
      expect(rowOffset + 34 + 1).toBe(35)
    })

    it("menangani data kosong tanpa error", () => {
      const { paginatedItems, totalPages, rowOffset } = paginateList([], 1, 10)
      expect(totalPages).toBe(1)
      expect(rowOffset).toBe(0)
      expect(paginatedItems).toHaveLength(0)
    })
  })
})
