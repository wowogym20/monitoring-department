import { describe, it, expect } from "vitest"
import {
  buildExportRows,
  calculateDepartmentSummaries,
  buildExportFilename,
} from "@/lib/export/data"
import { generateExcelWorkbook } from "@/lib/export/excel"
import { generatePdfBuffer } from "@/lib/export/pdf"
import { exportFilterSchema, EXPORT_ROLES } from "@/lib/validations/export"
import { formatDateJakarta } from "@/lib/date"
import {
  AssessmentAspect,
  AssessmentPeriod,
  AssessmentStatus,
} from "@/types/database"
import { ExportDataset, ExportDepartmentGroup } from "@/lib/export/types"
import ExcelJS from "exceljs"

describe("Fase 7 — Fitur Ekspor (Excel & PDF)", () => {
  // 14 Departemen resmi (PRD Bagian 5 & seed.sql)
  const officialDepts = [
    { id: "dept-1", nama: "Dept. Pendidikan dan Pengajaran", kode: "PEND-AJAR" },
    { id: "dept-2", nama: "Dept. Penelitian dan Pengembangan Akademik (Majelis Guru)", kode: "LITBANG-GURU" },
    { id: "dept-3", nama: "Dept. Pengasuhan Santri", kode: "ASUH-SANTRI" },
    { id: "dept-4", nama: "Dept. Lazis Tazakka", kode: "LAZIS" },
    { id: "dept-5", nama: "Dept. Wakaf Tazakka", kode: "WAKAF" },
    { id: "dept-6", nama: "Dept. Pengembangan Amal Usaha", kode: "AMAL-USAHA" },
    { id: "dept-7", nama: "Dept. Pengembangan TI", kode: "TI" },
    { id: "dept-8", nama: "Dept. SDM", kode: "SDM" },
    { id: "dept-9", nama: "Dept. Kesekretariatan", kode: "SEKRETARIAT" },
    { id: "dept-10", nama: "Dept. Keuangan", kode: "KEUANGAN" },
    { id: "dept-11", nama: "Dept. Kehumasan", kode: "HUMAS" },
    { id: "dept-12", nama: "Dept. Kerjasama Kelembagaan dan Luar Negeri", kode: "KERJASAMA-LN" },
    { id: "dept-13", nama: "Dept. Pengembangan Perguruan Tinggi", kode: "PT" },
    { id: "dept-14", nama: "Dept. Pekerjaan Umum", kode: "PU" },
  ]

  // 7 Aspek penilaian resmi (PRD Bagian 8 & seed.sql)
  const officialAspects: AssessmentAspect[] = [
    { id: "asp-1", nama: "Kinerja Kerja", deskripsi: "Kualitas dan ketepatan tugas", urutan: 1, is_active: true, created_at: "", updated_at: "" },
    { id: "asp-2", nama: "Kerajinan", deskripsi: "Ketekunan dan kehadiran", urutan: 2, is_active: true, created_at: "", updated_at: "" },
    { id: "asp-3", nama: "Ibadah", deskripsi: "Kedisiplinan ibadah", urutan: 3, is_active: true, created_at: "", updated_at: "" },
    { id: "asp-4", nama: "Kebersihan", deskripsi: "Kebersihan diri dan lingkungan", urutan: 4, is_active: true, created_at: "", updated_at: "" },
    { id: "asp-5", nama: "Kerja Sama Tim", deskripsi: "Kolaborasi dan komunikasi", urutan: 5, is_active: true, created_at: "", updated_at: "" },
    { id: "asp-6", nama: "Inisiatif & Tanggung Jawab", deskripsi: "Proaktif dan menuntaskan amanah", urutan: 6, is_active: true, created_at: "", updated_at: "" },
    { id: "asp-7", nama: "Akhlak & Adab", deskripsi: "Sikap dan etika dalam bekerja", urutan: 7, is_active: true, created_at: "", updated_at: "" },
  ]

  const mockPeriod: AssessmentPeriod = {
    id: "period-2026-ganjil",
    nama: "Periode Penilaian Semester Ganjil 2026/2027",
    tanggal_mulai: "2026-10-01",
    tanggal_akhir: "2026-11-30",
    status: "open",
    created_at: "",
    updated_at: "",
  }

  // ===========================================================================
  // 1. UNIT TEST PEMBENTUKAN BARIS EKSPOR & VALIDASI
  // ===========================================================================
  describe("1. Unit Test Pembentukan Baris Ekspor & Validasi", () => {
    it("EXPORT_ROLES hanya mengizinkan super_admin dan admin, menolak user (ketua)", () => {
      expect(EXPORT_ROLES).toContain("super_admin")
      expect(EXPORT_ROLES).toContain("admin")
      expect(EXPORT_ROLES).not.toContain("user")
      expect((EXPORT_ROLES as readonly string[]).includes("user")).toBe(false)
    })

    it("exportFilterSchema memvalidasi UUID periode dan default departmentId='all'", () => {
      const valid = exportFilterSchema.safeParse({
        periodeId: "11111111-1111-1111-1111-111111111111",
      })
      expect(valid.success).toBe(true)
      if (valid.success) {
        expect(valid.data.departmentId).toBe("all")
      }

      const invalid = exportFilterSchema.safeParse({
        periodeId: "bukan-uuid",
      })
      expect(invalid.success).toBe(false)
    })

    it("buildExportFilename membentuk nama file deskriptif sesuai PRD", () => {
      const fixedDate = new Date("2026-10-14T08:00:00Z")

      // Semua departemen (tanpa kode departemen)
      const excelFilename = buildExportFilename({
        periodeNama: "Periode Penilaian Semester Ganjil 2026/2027",
        ext: "xlsx",
        date: fixedDate,
      })
      expect(excelFilename).toBe(
        "monitoring-departemen_periode-penilaian-semester-ganjil-2026-2027_2026-10-14.xlsx"
      )

      // Difilter departemen TI
      const pdfFilename = buildExportFilename({
        periodeNama: "Semester Ganjil 2026",
        departmentKode: "TI",
        ext: "pdf",
        date: fixedDate,
      })
      expect(pdfFilename).toBe(
        "monitoring-departemen_ti_semester-ganjil-2026_2026-10-14.pdf"
      )
    })

    it("formatDateJakarta menghasilkan tanggal berformat 'dd MMM yyyy' zona Asia/Jakarta", () => {
      const formatted = formatDateJakarta("2026-10-14")
      expect(formatted).toMatch(/14\s+Okt\s+2026/i)
    })

    it("buildExportRows memetakan seluruh 7 aspek nilai anggota, skor rata-rata, dan kategori dengan benar", () => {
      const members = [
        { id: "mem-1", nama: "Ustadz Ahmad", nip: "199001", jabatan: "Kepala Kurikulum", department_id: "dept-1" },
        { id: "mem-2", nama: "Ustadz Budi", nip: "199002", jabatan: "Pengajar", department_id: "dept-1" },
      ]

      const assessments = [
        {
          id: "ass-1",
          member_id: "mem-1",
          department_id: "dept-1",
          period_id: "period-1",
          status: "approved" as AssessmentStatus,
          skor_rata: 4.86,
          submitted_at: "2026-10-13T10:00:00Z",
          updated_at: "2026-10-13T10:00:00Z",
          evaluator_nama: "Ketua Pendidik",
        },
      ]

      const aspectScores = [
        { assessment_id: "ass-1", aspect_id: "asp-1", nilai: 5 },
        { assessment_id: "ass-1", aspect_id: "asp-2", nilai: 5 },
        { assessment_id: "ass-1", aspect_id: "asp-3", nilai: 5 },
        { assessment_id: "ass-1", aspect_id: "asp-4", nilai: 5 },
        { assessment_id: "ass-1", aspect_id: "asp-5", nilai: 5 },
        { assessment_id: "ass-1", aspect_id: "asp-6", nilai: 4 },
        { assessment_id: "ass-1", aspect_id: "asp-7", nilai: 5 },
      ]

      const rows = buildExportRows({
        members,
        departments: officialDepts,
        assessments,
        aspectScores,
        aspects: officialAspects,
        userRole: "admin",
      })

      expect(rows).toHaveLength(2)

      // Anggota 1: Memiliki penilaian approved
      const row1 = rows.find((r) => r.member_id === "mem-1")!
      expect(row1).toBeDefined()
      expect(row1.member_nama).toBe("Ustadz Ahmad")
      expect(row1.status).toBe("approved")
      expect(row1.statusLabel).toBe("Disetujui")
      expect(row1.skor_rata).toBe(4.86)
      expect(row1.kategori).toBe("Sangat Baik")
      expect(row1.aspect_scores["asp-1"]).toBe(5)
      expect(row1.aspect_scores["asp-6"]).toBe(4)

      // Anggota 2: Belum dinilai
      const row2 = rows.find((r) => r.member_id === "mem-2")!
      expect(row2).toBeDefined()
      expect(row2.member_nama).toBe("Ustadz Budi")
      expect(row2.status).toBe("unassessed")
      expect(row2.statusLabel).toBe("Belum Dinilai")
      expect(row2.skor_rata).toBeNull()
      expect(row2.kategori).toBe("Belum Dinilai")
      expect(row2.aspect_scores["asp-1"]).toBeNull()
    })

    it("Role 'admin' menyembunyikan penilaian berstatus 'draft' (diperlakukan sebagai belum dinilai)", () => {
      const members = [
        { id: "mem-3", nama: "Ustadz Harun", nip: "199003", jabatan: "Staff", department_id: "dept-1" },
      ]

      const assessments = [
        {
          id: "ass-draft",
          member_id: "mem-3",
          department_id: "dept-1",
          period_id: "period-1",
          status: "draft" as AssessmentStatus,
          skor_rata: 3.5,
          submitted_at: null,
          updated_at: "2026-10-13T10:00:00Z",
        },
      ]

      // Admin melihat -> draft disembunyikan
      const adminRows = buildExportRows({
        members,
        departments: officialDepts,
        assessments,
        aspectScores: [],
        aspects: officialAspects,
        userRole: "admin",
      })
      expect(adminRows[0].status).toBe("unassessed")
      expect(adminRows[0].statusLabel).toBe("Belum Dinilai")

      // Super admin melihat -> draft tampil
      const superAdminRows = buildExportRows({
        members,
        departments: officialDepts,
        assessments,
        aspectScores: [],
        aspects: officialAspects,
        userRole: "super_admin",
      })
      expect(superAdminRows[0].status).toBe("draft")
      expect(superAdminRows[0].statusLabel).toBe("Draf")
    })
  })

  // ===========================================================================
  // 2. TEST KONSISTENSI (ANGKA EKSPOR == ANGKA REKAP UNTUK DATA SEED)
  // ===========================================================================
  describe("2. Test Konsistensi (Angka Ekspor == Angka Rekap untuk Data Seed)", () => {
    // Siapkan seed data: 14 departemen, masing-masing memiliki anggota dan penilaian
    const seedMembers: Array<{
      id: string
      nama: string
      nip: string
      jabatan: string
      department_id: string
    }> = []

    const seedAssessments: Array<{
      id: string
      member_id: string
      department_id: string
      period_id: string
      status: AssessmentStatus
      skor_rata: number | null
      submitted_at: string | null
      updated_at: string | null
    }> = []

    const seedScores: Array<{
      assessment_id: string
      aspect_id: string
      nilai: number
    }> = []

    // Buat data realistis: Dept PEND-AJAR (5 anggota), TI (4 anggota), HUMAS (3 anggota)
    const deptMemberDistribution: Record<string, number> = {
      "dept-1": 5,
      "dept-7": 4,
      "dept-11": 3,
    }

    let memberCounter = 1
    let assessmentCounter = 1

    for (const [deptId, memberCount] of Object.entries(deptMemberDistribution)) {
      for (let i = 0; i < memberCount; i++) {
        const memId = `seed-mem-${memberCounter}`
        seedMembers.push({
          id: memId,
          nama: `Anggota ${officialDepts.find((d) => d.id === deptId)?.kode} #${i + 1}`,
          nip: `NIP-199${memberCounter}`,
          jabatan: i === 0 ? "Koordinator" : "Staff",
          department_id: deptId,
        })

        // Sebagian dinilai submitted, sebagian approved, 1 unassessed di dept-1
        if (!(deptId === "dept-1" && i === memberCount - 1)) {
          const assId = `seed-ass-${assessmentCounter}`
          const status: AssessmentStatus = i % 2 === 0 ? "approved" : "submitted"

          // 7 aspek nilai (rentang 3-5)
          const scores = [4, 5, 4, 4, 5, 4, 5]
          const sum = scores.reduce((a, b) => a + b, 0)
          const avg = Number((sum / scores.length).toFixed(2))

          scores.forEach((val, aspIdx) => {
            seedScores.push({
              assessment_id: assId,
              aspect_id: officialAspects[aspIdx].id,
              nilai: val,
            })
          })

          seedAssessments.push({
            id: assId,
            member_id: memId,
            department_id: deptId,
            period_id: mockPeriod.id,
            status,
            skor_rata: avg,
            submitted_at: "2026-10-12T08:00:00Z",
            updated_at: "2026-10-12T08:00:00Z",
          })
          assessmentCounter++
        }
        memberCounter++
      }
    }

    it("Fungsi kalkulasi rekapitulasi menghasilkan ringkasan yang identik dengan baris ekspor", () => {
      // 1. Hitung ringkasan rekapitulasi (fungsi query bersama halaman /rekap)
      const rekapSummaries = calculateDepartmentSummaries({
        departments: officialDepts.filter((d) => ["dept-1", "dept-7", "dept-11"].includes(d.id)),
        members: seedMembers,
        assessments: seedAssessments,
      })

      // 2. Susun baris detail ekspor
      const exportRows = buildExportRows({
        members: seedMembers,
        departments: officialDepts,
        assessments: seedAssessments,
        aspectScores: seedScores,
        aspects: officialAspects,
        userRole: "admin",
      })

      // 3. Verifikasi konsistensi per departemen
      for (const summary of rekapSummaries) {
        const deptExportRows = exportRows.filter((r) => r.department_id === summary.id)
        const assessedRows = deptExportRows.filter((r) => r.status !== "unassessed" && r.status !== "draft")

        // a. Total anggota di ekspor == total anggota di rekap
        expect(deptExportRows.length).toBe(summary.total_members)

        // b. Jumlah yang sudah dinilai di ekspor == assessed_count di rekap
        expect(assessedRows.length).toBe(summary.assessed_count)

        // c. Belum dinilai = total - assessed
        const unassessedCount = deptExportRows.length - assessedRows.length
        expect(summary.total_members - summary.assessed_count).toBe(unassessedCount)

        // d. Rata-rata skor departemen pada ekspor == rata-rata skor pada rekap
        if (assessedRows.length > 0) {
          const sumScores = assessedRows.reduce((acc, curr) => acc + (curr.skor_rata || 0), 0)
          const computedAvg = Number((sumScores / assessedRows.length).toFixed(2))
          expect(summary.average_score).toBe(computedAvg)
        } else {
          expect(summary.average_score).toBeNull()
        }
      }
    })

    it("File Excel yang dihasilkan memuat sheet ringkasan dan detail yang nilainya 100% konsisten dengan rekap", async () => {
      const summaries = calculateDepartmentSummaries({
        departments: officialDepts.filter((d) => ["dept-1", "dept-7", "dept-11"].includes(d.id)),
        members: seedMembers,
        assessments: seedAssessments,
      })

      const exportRows = buildExportRows({
        members: seedMembers,
        departments: officialDepts,
        assessments: seedAssessments,
        aspectScores: seedScores,
        aspects: officialAspects,
        userRole: "admin",
      })

      const departmentGroups: ExportDepartmentGroup[] = summaries.map((summary) => ({
        department: officialDepts.find((d) => d.id === summary.id)!,
        summary,
        members: exportRows.filter((m) => m.department_id === summary.id),
      }))

      const dataset: ExportDataset = {
        period: mockPeriod,
        scopeDepartmentName: "Semua Departemen",
        scopeDepartmentKode: null,
        aspects: officialAspects,
        summaries,
        members: exportRows,
        departmentGroups,
        exportedAt: new Date("2026-10-14T08:00:00Z"),
        userRole: "admin",
      }

      // Generate Excel Buffer
      const excelBuffer = await generateExcelWorkbook(dataset)
      expect(excelBuffer).toBeDefined()
      expect(excelBuffer.length).toBeGreaterThan(0)

      // Baca kembali menggunakan exceljs untuk memverifikasi isi sel
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(excelBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0])

      // 1. Periksa Sheet 1: Ringkasan Departemen
      const sheet1 = workbook.getWorksheet("Ringkasan Departemen")
      expect(sheet1).toBeDefined()
      expect(sheet1?.getCell("A1").value).toContain("REKAPITULASI PENILAIAN")

      // Baris data pertama (Baris 7)
      const dept1Summary = summaries.find((s) => s.id === "dept-1")!
      const row7 = sheet1?.getRow(7)
      expect(row7?.getCell(2).value).toBe("PEND-AJAR") // Kode
      expect(row7?.getCell(4).value).toBe(dept1Summary.total_members) // Total Anggota
      expect(row7?.getCell(5).value).toBe(dept1Summary.assessed_count) // Sudah Dinilai
      expect(row7?.getCell(7).value).toBe(dept1Summary.average_score) // Rata-rata Skor

      // 2. Periksa Sheet 2: Detail Anggota
      const sheet2 = workbook.getWorksheet("Detail Anggota")
      expect(sheet2).toBeDefined()
      expect(sheet2?.getCell("A1").value).toContain("DETAIL PENILAIAN ANGGOTA")

      // Header kolom (Baris 5) memuat 7 aspek
      const headerRow2 = sheet2?.getRow(5)
      officialAspects.forEach((asp, idx) => {
        expect(headerRow2?.getCell(6 + idx).value).toBe(asp.nama)
      })

      // Total baris anggota di Sheet 2 harus sama dengan total seedMembers
      const memberRowCount = (sheet2?.rowCount || 0) - 5 // Kurangi header dan metadata
      expect(memberRowCount).toBe(seedMembers.length)
    })
  })

  // ===========================================================================
  // 3. UJI WAKTU EKSPOR ≤ 10 DETIK DENGAN DATA ±500 ANGGOTA (PRD BAGIAN 13 & 14)
  // ===========================================================================
  describe("3. Uji Waktu Ekspor ≤ 10 Detik dengan Data ±500 Anggota", () => {
    it("Pemrosesan data, pembentukan Excel (.xlsx), dan dokumen PDF (.pdf) untuk 500 anggota selesai dalam ≤ 10 detik", async () => {
      const TOTAL_MEMBERS = 500
      const largeMembers: Array<{
        id: string
        nama: string
        nip: string
        jabatan: string
        department_id: string
      }> = []

      const largeAssessments: Array<{
        id: string
        member_id: string
        department_id: string
        period_id: string
        status: AssessmentStatus
        skor_rata: number | null
        submitted_at: string | null
        updated_at: string | null
      }> = []

      const largeScores: Array<{
        assessment_id: string
        aspect_id: string
        nilai: number
      }> = []

      // Sebar 500 anggota secara merata di 14 departemen
      for (let i = 1; i <= TOTAL_MEMBERS; i++) {
        const dept = officialDepts[i % officialDepts.length]
        const memId = `perf-mem-${i}`
        const isAssessed = i % 10 !== 0 // 90% sudah dinilai sesuai target metrik PRD Bagian 2

        largeMembers.push({
          id: memId,
          nama: `Pegawai Tazakka #${i}`,
          nip: `199001${String(i).padStart(4, "0")}`,
          jabatan: i % 5 === 0 ? "Koordinator" : "Staff Pelaksana",
          department_id: dept.id,
        })

        if (isAssessed) {
          const assId = `perf-ass-${i}`
          // Beri nilai bervariasi antara 3 dan 5
          const scores = officialAspects.map((_, idx) => ((i + idx) % 3) + 3)
          const sum = scores.reduce((a, b) => a + b, 0)
          const avg = Number((sum / scores.length).toFixed(2))

          scores.forEach((val, aspIdx) => {
            largeScores.push({
              assessment_id: assId,
              aspect_id: officialAspects[aspIdx].id,
              nilai: val,
            })
          })

          largeAssessments.push({
            id: assId,
            member_id: memId,
            department_id: dept.id,
            period_id: mockPeriod.id,
            status: "approved",
            skor_rata: avg,
            submitted_at: "2026-10-14T07:00:00Z",
            updated_at: "2026-10-14T07:00:00Z",
          })
        }
      }

      // Mulai pengukuran waktu performa
      const startTime = performance.now()

      // 1. Eksekusi kalkulasi rekapitulasi untuk 14 departemen
      const summaries = calculateDepartmentSummaries({
        departments: officialDepts,
        members: largeMembers,
        assessments: largeAssessments,
      })

      // 2. Susun baris detail ekspor untuk 500 anggota
      const memberRows = buildExportRows({
        members: largeMembers,
        departments: officialDepts,
        assessments: largeAssessments,
        aspectScores: largeScores,
        aspects: officialAspects,
        userRole: "admin",
      })

      const summaryMap = new Map(summaries.map((s) => [s.id, s]))
      const departmentGroups: ExportDepartmentGroup[] = officialDepts.map((dept) => ({
        department: dept,
        summary: summaryMap.get(dept.id)!,
        members: memberRows.filter((m) => m.department_id === dept.id),
      }))

      const dataset: ExportDataset = {
        period: mockPeriod,
        scopeDepartmentName: "Semua Departemen",
        scopeDepartmentKode: null,
        aspects: officialAspects,
        summaries,
        members: memberRows,
        departmentGroups,
        exportedAt: new Date(),
        userRole: "admin",
      }

      // 3. Generate berkas Excel (.xlsx) dengan 2 sheet lengkap
      const excelStartTime = performance.now()
      const excelBuffer = await generateExcelWorkbook(dataset)
      const excelDuration = performance.now() - excelStartTime

      // 4. Generate berkas PDF (.pdf) dengan tema emerald dan tata letak per departemen
      const pdfStartTime = performance.now()
      const pdfBuffer = await generatePdfBuffer(dataset)
      const pdfDuration = performance.now() - pdfStartTime

      const totalDuration = performance.now() - startTime

      // Log durasi benchmark untuk transparansi pengujian
      console.log(`[Benchmark Ekspor 500 Anggota]:`)
      console.log(`  - Excel (.xlsx) : ${Math.round(excelDuration)} ms (${(excelBuffer.length / 1024).toFixed(1)} KB)`)
      console.log(`  - PDF (.pdf)    : ${Math.round(pdfDuration)} ms (${(pdfBuffer.length / 1024).toFixed(1)} KB)`)
      console.log(`  - Total Waktu   : ${Math.round(totalDuration)} ms (Target: <= 10.000 ms)`)

      // Validasi integritas berkas
      expect(excelBuffer.length).toBeGreaterThan(1000)
      expect(pdfBuffer.length).toBeGreaterThan(1000)
      // File PDF harus diawali dengan header standar '%PDF-'
      expect(pdfBuffer.toString("utf-8", 0, 5)).toBe("%PDF-")

      // Target SLA Non-Fungsional PRD Bagian 13: waktu ekspor per berkas <= 10 detik (10.000 ms)
      expect(excelDuration).toBeLessThan(10000)
      expect(pdfDuration).toBeLessThan(10000)
    }, 20000)
  })
})
