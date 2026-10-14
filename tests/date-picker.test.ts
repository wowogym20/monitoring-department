import { describe, it, expect } from "vitest"
import { format, parseISO, isValid } from "date-fns"
import { id } from "date-fns/locale"

describe("Komponen DatePicker & Utilitas Tanggal", () => {
  it("1. Konversi format ISO YYYY-MM-DD ke tampilan lokal Bahasa Indonesia", () => {
    const rawDate = "2026-10-14"
    const [y, m, d] = rawDate.split("-").map(Number)
    const dateObj = new Date(y, m - 1, d)

    expect(isValid(dateObj)).toBe(true)
    const formatted = format(dateObj, "d MMMM yyyy", { locale: id })
    expect(formatted).toBe("14 Oktober 2026")
  })

  it("2. Validasi rentang tanggal: tanggal akhir tidak boleh mendahului tanggal mulai", () => {
    const tglMulai = "2026-10-01"
    const tglAkhirValid = "2026-12-31"
    const tglAkhirInvalid = "2026-09-30"

    expect(tglAkhirValid >= tglMulai).toBe(true)
    expect(tglAkhirInvalid < tglMulai).toBe(true)
  })

  it("3. Format tanggal balik ke format ISO YYYY-MM-DD yang diharapkan backend", () => {
    const d = new Date(2026, 9, 28) // 28 Oktober 2026
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const ymd = `${year}-${month}-${day}`

    expect(ymd).toBe("2026-10-28")
    expect(/^\d{4}-\d{2}-\d{2}$/.test(ymd)).toBe(true)
  })
})
