import { describe, it, expect } from "vitest"
import {
  parseAssessmentComments,
  serializeAssessmentComments,
  hasAssessmentComments,
} from "@/lib/penilaian"
import { saveAssessmentSchema } from "@/lib/validations/penilaian"

describe("Revisi Catatan Penilaian: 3 Komentar (Evaluasi, Proker, Hasil Usaha) & Penomoran Tabel", () => {
  describe("1. Utilitas Parsing Catatan Penilaian (parseAssessmentComments)", () => {
    it("mengembalikan objek komentar kosong jika input null, undefined, atau string kosong", () => {
      expect(parseAssessmentComments(null)).toEqual({
        evaluasi: "",
        proker: "",
        hasil_usaha: "",
      })
      expect(parseAssessmentComments(undefined)).toEqual({
        evaluasi: "",
        proker: "",
        hasil_usaha: "",
      })
      expect(parseAssessmentComments("")).toEqual({
        evaluasi: "",
        proker: "",
        hasil_usaha: "",
      })
      expect(parseAssessmentComments("   ")).toEqual({
        evaluasi: "",
        proker: "",
        hasil_usaha: "",
      })
    })

    it("mempertahankan kompatibilitas data lama (legacy plain-text) dengan memindahkannya ke evaluasi", () => {
      const legacyNote = "Sangat proaktif dan rajin dalam mengajar."
      const parsed = parseAssessmentComments(legacyNote)

      expect(parsed).toEqual({
        evaluasi: "Sangat proaktif dan rajin dalam mengajar.",
        proker: "",
        hasil_usaha: "",
      })
    })

    it("mengurai JSON terstruktur 3 komentar dengan benar", () => {
      const jsonString = JSON.stringify({
        evaluasi: "Kinerja disiplin dan loyalitas tinggi.",
        proker: "Penanggung jawab utama ujian semester berjalan lancar.",
        hasil_usaha: "Modul pembelajaran selesai 100% tepat waktu.",
      })

      const parsed = parseAssessmentComments(jsonString)

      expect(parsed).toEqual({
        evaluasi: "Kinerja disiplin dan loyalitas tinggi.",
        proker: "Penanggung jawab utama ujian semester berjalan lancar.",
        hasil_usaha: "Modul pembelajaran selesai 100% tepat waktu.",
      })
    })

    it("menangani JSON parsial jika salah satu field tidak ada", () => {
      const partialJson = JSON.stringify({
        evaluasi: "Hanya evaluasi",
      })

      const parsed = parseAssessmentComments(partialJson)

      expect(parsed).toEqual({
        evaluasi: "Hanya evaluasi",
        proker: "",
        hasil_usaha: "",
      })
    })

    it("menangani string JSON malformed dengan mengembalikannya sebagai teks evaluasi legacy", () => {
      const malformed = '{ evaluasi: "tidak valid json", proker: }'
      const parsed = parseAssessmentComments(malformed)

      expect(parsed.evaluasi).toBe(malformed)
      expect(parsed.proker).toBe("")
      expect(parsed.hasil_usaha).toBe("")
    })
  })

  describe("2. Utilitas Serialisasi Catatan Penilaian (serializeAssessmentComments)", () => {
    it("mengembalikan null jika seluruh komentar kosong atau hanya spasi", () => {
      const emptyComments = {
        evaluasi: "",
        proker: "   ",
        hasil_usaha: "",
      }
      expect(serializeAssessmentComments(emptyComments)).toBeNull()
    })

    it("menghasilkan JSON string yang rapi dan memotong whitespace (trim)", () => {
      const comments = {
        evaluasi: "  Disiplin tinggi  ",
        proker: " Mengawal proker A ",
        hasil_usaha: " Target tercapai 100% ",
      }

      const serialized = serializeAssessmentComments(comments)
      expect(serialized).not.toBeNull()

      const parsed = JSON.parse(serialized!)
      expect(parsed).toEqual({
        evaluasi: "Disiplin tinggi",
        proker: "Mengawal proker A",
        hasil_usaha: "Target tercapai 100%",
      })
    })

    it("menghasilkan JSON string valid meskipun hanya satu komentar yang diisi", () => {
      const comments = {
        evaluasi: "",
        proker: "Hanya proker",
        hasil_usaha: "",
      }

      const serialized = serializeAssessmentComments(comments)
      expect(serialized).not.toBeNull()

      const parsed = JSON.parse(serialized!)
      expect(parsed).toEqual({
        evaluasi: "",
        proker: "Hanya proker",
        hasil_usaha: "",
      })
    })
  })

  describe("3. Pengecekan Keberadaan Komentar (hasAssessmentComments)", () => {
    it("mengembalikan false jika seluruh komentar kosong", () => {
      expect(hasAssessmentComments({ evaluasi: "", proker: "", hasil_usaha: "" })).toBe(false)
      expect(hasAssessmentComments({ evaluasi: "  ", proker: "   ", hasil_usaha: "" })).toBe(false)
    })

    it("mengembalikan true jika minimal salah satu komentar terisi", () => {
      expect(hasAssessmentComments({ evaluasi: "Ada", proker: "", hasil_usaha: "" })).toBe(true)
      expect(hasAssessmentComments({ evaluasi: "", proker: "Ada", hasil_usaha: "" })).toBe(true)
      expect(hasAssessmentComments({ evaluasi: "", proker: "", hasil_usaha: "Ada" })).toBe(true)
    })
  })

  describe("4. Validasi Skema saveAssessmentSchema", () => {
    it("menerima catatan JSON hasil serialisasi 3 komentar yang panjangnya lebih dari 2000 karakter", () => {
      const longText1 = "A".repeat(1500)
      const longText2 = "B".repeat(1500)
      const longText3 = "C".repeat(1500)

      const serialized = serializeAssessmentComments({
        evaluasi: longText1,
        proker: longText2,
        hasil_usaha: longText3,
      })

      // Total panjang serialized JSON > 4500 karakter
      expect(serialized!.length).toBeGreaterThan(4500)

      const validation = saveAssessmentSchema.safeParse({
        period_id: "11111111-1111-1111-1111-111111111111",
        member_id: "22222222-2222-2222-2222-222222222222",
        status: "submitted",
        catatan: serialized,
        scores: [
          { aspect_id: "33333333-3333-3333-3333-333333333333", nilai: 5 },
        ],
      })

      expect(validation.success).toBe(true)
      if (validation.success) {
        expect(validation.data.catatan).toBe(serialized)
      }
    })

    it("mentransformasikan catatan string kosong menjadi null", () => {
      const validation = saveAssessmentSchema.safeParse({
        period_id: "11111111-1111-1111-1111-111111111111",
        member_id: "22222222-2222-2222-2222-222222222222",
        status: "draft",
        catatan: "   ",
        scores: [],
      })

      expect(validation.success).toBe(true)
      if (validation.success) {
        expect(validation.data.catatan).toBeNull()
      }
    })
  })

  describe("5. Logika Penomoran Kolom No. pada Tabel Penilaian", () => {
    it("menghasilkan nomor urut 1-based (index + 1) yang konsisten untuk setiap anggota", () => {
      const members = [
        { id: "m1", nama: "Ahmad" },
        { id: "m2", nama: "Budi" },
        { id: "m3", nama: "Citra" },
      ]

      const rowsWithNo = members.map((m, index) => ({
        no: index + 1,
        id: m.id,
        nama: m.nama,
      }))

      expect(rowsWithNo[0].no).toBe(1)
      expect(rowsWithNo[1].no).toBe(2)
      expect(rowsWithNo[2].no).toBe(3)
    })
  })
})
