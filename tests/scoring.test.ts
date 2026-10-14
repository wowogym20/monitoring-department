import { describe, it, expect } from "vitest"
import { kategoriSkor, roundToTwoDecimals } from "@/lib/scoring"

describe("Utilitas Scoring & Kategori Skor Akhir (PRD Bagian 8)", () => {
  describe("Pembulatan Presisi 2 Desimal", () => {
    it("harus membulatkan angka desimal dengan tepat", () => {
      expect(roundToTwoDecimals(4.494)).toBe(4.49)
      expect(roundToTwoDecimals(4.496)).toBe(4.50)
      expect(roundToTwoDecimals(3.495)).toBe(3.50)
      expect(roundToTwoDecimals(2.494)).toBe(2.49)
      expect(roundToTwoDecimals(1.495)).toBe(1.50)
      expect(roundToTwoDecimals(5.0)).toBe(5.0)
    })
  })

  describe("Verifikasi Batas Rentang Kategori Skor", () => {
    it("harus mengkategorikan rentang 4,50 – 5,00 sebagai 'Sangat Baik'", () => {
      const atMax = kategoriSkor(5.0)
      expect(atMax.kategori).toBe("Sangat Baik")
      expect(atMax.skorFormatted).toBe("5.00")
      expect(atMax.badgeClass).toContain("bg-emerald-700")

      const atThreshold = kategoriSkor(4.50)
      expect(atThreshold.kategori).toBe("Sangat Baik")
      expect(atThreshold.skorFormatted).toBe("4.50")

      const roundedUp = kategoriSkor(4.496) // round to 4.50
      expect(roundedUp.kategori).toBe("Sangat Baik")
      expect(roundedUp.skorFormatted).toBe("4.50")
    })

    it("harus mengkategorikan rentang 3,50 – 4,49 sebagai 'Baik'", () => {
      const justBelowThreshold = kategoriSkor(4.49)
      expect(justBelowThreshold.kategori).toBe("Baik")
      expect(justBelowThreshold.skorFormatted).toBe("4.49")
      expect(justBelowThreshold.badgeClass).toContain("bg-emerald-100")

      const roundedDown = kategoriSkor(4.494) // round to 4.49
      expect(roundedDown.kategori).toBe("Baik")
      expect(roundedDown.skorFormatted).toBe("4.49")

      const atMinThreshold = kategoriSkor(3.50)
      expect(atMinThreshold.kategori).toBe("Baik")
      expect(atMinThreshold.skorFormatted).toBe("3.50")
    })

    it("harus mengkategorikan rentang 2,50 – 3,49 sebagai 'Cukup'", () => {
      const justBelow = kategoriSkor(3.49)
      expect(justBelow.kategori).toBe("Cukup")
      expect(justBelow.skorFormatted).toBe("3.49")
      expect(justBelow.badgeClass).toContain("bg-slate-100")

      const atMinThreshold = kategoriSkor(2.50)
      expect(atMinThreshold.kategori).toBe("Cukup")
      expect(atMinThreshold.skorFormatted).toBe("2.50")
    })

    it("harus mengkategorikan rentang 1,50 – 2,49 sebagai 'Kurang'", () => {
      const justBelow = kategoriSkor(2.49)
      expect(justBelow.kategori).toBe("Kurang")
      expect(justBelow.skorFormatted).toBe("2.49")
      expect(justBelow.badgeClass).toContain("bg-orange-100")

      const atMinThreshold = kategoriSkor(1.50)
      expect(atMinThreshold.kategori).toBe("Kurang")
      expect(atMinThreshold.skorFormatted).toBe("1.50")
    })

    it("harus mengkategorikan rentang 1,00 – 1,49 sebagai 'Sangat Kurang'", () => {
      const justBelow = kategoriSkor(1.49)
      expect(justBelow.kategori).toBe("Sangat Kurang")
      expect(justBelow.skorFormatted).toBe("1.49")
      expect(justBelow.badgeClass).toContain("bg-orange-700")

      const atMinThreshold = kategoriSkor(1.00)
      expect(atMinThreshold.kategori).toBe("Sangat Kurang")
      expect(atMinThreshold.skorFormatted).toBe("1.00")
    })

    it("harus menangani nilai null, undefined, NaN, dan di bawah 1,00 sebagai 'Belum Dinilai'", () => {
      expect(kategoriSkor(null).kategori).toBe("Belum Dinilai")
      expect(kategoriSkor(undefined).kategori).toBe("Belum Dinilai")
      expect(kategoriSkor(NaN).kategori).toBe("Belum Dinilai")
      expect(kategoriSkor(0).kategori).toBe("Belum Dinilai")
      expect(kategoriSkor(0.99).kategori).toBe("Belum Dinilai")
    })
  })
})
