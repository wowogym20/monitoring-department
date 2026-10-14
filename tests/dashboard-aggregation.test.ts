import { describe, it, expect } from "vitest"
import {
  checkDeadlineInfo,
  calculateDeptScoreChartData,
  calculateDeptCompletionData,
  calculateScoreDistribution,
  calculateAdminKpi,
  calculateAttentionList,
  calculateKetuaProgressAndAttention,
  calculateSuperAdminGovernance,
} from "@/lib/dashboard/aggregation"
import { AssessmentStatus } from "@/types/database"

describe("Dashboard Aggregation & Business Rules (FR-10, PRD 8, 9, 10.1)", () => {
  // Mock 14 Departemen Resmi Tazakka
  const mockDepartments = [
    { id: "dept-1", nama: "Dept. Pendidikan dan Pengajaran", kode: "PEND-AJAR", is_active: true, ketua_id: "user-1" },
    { id: "dept-2", nama: "Dept. Penelitian dan Pengembangan Akademik", kode: "LITBANG-GURU", is_active: true, ketua_id: "user-2" },
    { id: "dept-3", nama: "Dept. Pengasuhan Santri", kode: "ASUH-SANTRI", is_active: true, ketua_id: "user-3" },
    { id: "dept-4", nama: "Dept. Lazis Tazakka", kode: "LAZIS", is_active: true, ketua_id: "user-4" },
    { id: "dept-5", nama: "Dept. Wakaf Tazakka", kode: "WAKAF", is_active: true, ketua_id: "user-5" },
    { id: "dept-6", nama: "Dept. Pengembangan Amal Usaha", kode: "AMAL-USAHA", is_active: true, ketua_id: "user-6" },
    { id: "dept-7", nama: "Dept. Pengembangan TI", kode: "TI", is_active: true, ketua_id: "user-7" },
    { id: "dept-8", nama: "Dept. SDM", kode: "SDM", is_active: true, ketua_id: "user-8" },
    { id: "dept-9", nama: "Dept. Kesekretariatan", kode: "SEKRETARIAT", is_active: true, ketua_id: "user-9" },
    { id: "dept-10", nama: "Dept. Keuangan", kode: "KEUANGAN", is_active: true, ketua_id: "user-10" },
    { id: "dept-11", nama: "Dept. Kehumasan", kode: "HUMAS", is_active: true, ketua_id: "user-11" },
    { id: "dept-12", nama: "Dept. Kerjasama Luar Negeri", kode: "KERJASAMA-LN", is_active: true, ketua_id: "user-12" },
    { id: "dept-13", nama: "Dept. Pengembangan PT", kode: "PT", is_active: true, ketua_id: "user-13" },
    { id: "dept-14", nama: "Dept. Pekerjaan Umum", kode: "PU", is_active: true, ketua_id: "user-14" },
  ]

  describe("1. Evaluasi Tenggat Waktu Periode (checkDeadlineInfo)", () => {
    it("menandai isNearDeadline = false bila sisa hari > 3", () => {
      const now = new Date("2026-10-14T09:00:00Z")
      const endDate = "2026-10-25" // sisa 11 hari
      const info = checkDeadlineInfo(endDate, now)

      expect(info.isNearDeadline).toBe(false)
      expect(info.isPastDeadline).toBe(false)
      expect(info.daysRemaining).toBeGreaterThan(3)
    })

    it("menandai isNearDeadline = true bila sisa hari <= 3 dan >= 0 (aksen oren)", () => {
      const now = new Date("2026-10-14T09:00:00Z")
      const endDate = "2026-10-16" // sisa 2 hari
      const info = checkDeadlineInfo(endDate, now)

      expect(info.isNearDeadline).toBe(true)
      expect(info.isPastDeadline).toBe(false)
      expect(info.daysRemaining).toBe(3)
    })

    it("menandai isPastDeadline = true bila tenggat telah terlampaui", () => {
      const now = new Date("2026-10-14T09:00:00Z")
      const endDate = "2026-10-10" // sudah lewat 4 hari
      const info = checkDeadlineInfo(endDate, now)

      expect(info.isPastDeadline).toBe(true)
      expect(info.isNearDeadline).toBe(false)
      expect(info.daysRemaining).toBeLessThan(0)
    })
  })

  describe("2. Grafik Batang Rata-rata Skor per Departemen (calculateDeptScoreChartData)", () => {
    it("menghitung rata-rata skor per departemen dan mengurutkan dari skor tertinggi ke terendah", () => {
      const assessments = [
        { department_id: "dept-1", status: "submitted" as AssessmentStatus, skor_rata: 4.80 },
        { department_id: "dept-1", status: "approved" as AssessmentStatus, skor_rata: 4.60 },
        { department_id: "dept-2", status: "submitted" as AssessmentStatus, skor_rata: 3.50 },
        { department_id: "dept-7", status: "submitted" as AssessmentStatus, skor_rata: 4.90 },
        { department_id: "dept-7", status: "draft" as AssessmentStatus, skor_rata: 2.00 }, // draf harus diabaikan
      ]

      const chartData = calculateDeptScoreChartData({
        departments: mockDepartments.slice(0, 3), // dept-1, dept-2, dept-3
        assessments,
      })

      // Peringkat 1: dept-1 (avg 4.70), Peringkat 2: dept-2 (avg 3.50), Peringkat 3: dept-3 (avg 0)
      expect(chartData[0].id).toBe("dept-1")
      expect(chartData[0].score).toBe(4.70)
      expect(chartData[1].id).toBe("dept-2")
      expect(chartData[1].score).toBe(3.50)
      expect(chartData[2].id).toBe("dept-3")
      expect(chartData[2].score).toBe(0)
    })
  })

  describe("3. Grafik Persentase Penyelesaian per Departemen (calculateDeptCompletionData)", () => {
    it("menghitung completedPercent dan incompletePercent secara akurat dengan batas total 100%", () => {
      const members = [
        { id: "m-1", department_id: "dept-1" },
        { id: "m-2", department_id: "dept-1" },
        { id: "m-3", department_id: "dept-1" },
        { id: "m-4", department_id: "dept-1" },
        { id: "m-5", department_id: "dept-2" },
        { id: "m-6", department_id: "dept-2" },
      ]

      const assessments = [
        { department_id: "dept-1", status: "submitted" as AssessmentStatus },
        { department_id: "dept-1", status: "approved" as AssessmentStatus },
        { department_id: "dept-1", status: "draft" as AssessmentStatus }, // draf belum selesai
        { department_id: "dept-2", status: "approved" as AssessmentStatus },
        { department_id: "dept-2", status: "approved" as AssessmentStatus },
      ]

      const completionData = calculateDeptCompletionData({
        departments: mockDepartments.slice(0, 2),
        members,
        assessments,
      })

      const dept1 = completionData.find((d) => d.id === "dept-1")!
      expect(dept1.totalMembers).toBe(4)
      expect(dept1.completedCount).toBe(2)
      expect(dept1.completedPercent).toBe(50)
      expect(dept1.incompletePercent).toBe(50)

      const dept2 = completionData.find((d) => d.id === "dept-2")!
      expect(dept2.totalMembers).toBe(2)
      expect(dept2.completedCount).toBe(2)
      expect(dept2.completedPercent).toBe(100)
      expect(dept2.incompletePercent).toBe(0)
    })
  })

  describe("4. Distribusi Kategori Skor PRD Bagian 8 (calculateScoreDistribution)", () => {
    it("mengelompokkan nilai sesuai rentang resmi PRD Bagian 8", () => {
      const assessments = [
        { status: "submitted" as AssessmentStatus, skor_rata: 4.85 }, // Sangat Baik
        { status: "approved" as AssessmentStatus, skor_rata: 4.50 }, // Sangat Baik
        { status: "submitted" as AssessmentStatus, skor_rata: 4.10 }, // Baik
        { status: "submitted" as AssessmentStatus, skor_rata: 3.50 }, // Baik
        { status: "submitted" as AssessmentStatus, skor_rata: 2.80 }, // Cukup
        { status: "submitted" as AssessmentStatus, skor_rata: 1.90 }, // Kurang
        { status: "submitted" as AssessmentStatus, skor_rata: 1.20 }, // Sangat Kurang
        { status: "draft" as AssessmentStatus, skor_rata: 5.00 }, // draf diabaikan
        { status: "submitted" as AssessmentStatus, skor_rata: null }, // null diabaikan
      ]

      const distribution = calculateScoreDistribution(assessments)

      const sangatBaik = distribution.find((d) => d.key === "sangat_baik")!
      const baik = distribution.find((d) => d.key === "baik")!
      const cukup = distribution.find((d) => d.key === "cukup")!
      const kurang = distribution.find((d) => d.key === "kurang")!
      const sangatKurang = distribution.find((d) => d.key === "sangat_kurang")!

      expect(sangatBaik.count).toBe(2)
      expect(baik.count).toBe(2)
      expect(cukup.count).toBe(1)
      expect(kurang.count).toBe(1)
      expect(sangatKurang.count).toBe(1)

      // Total 7 nilai valid
      expect(sangatBaik.percentage).toBe(Math.round((2 / 7) * 100))
    })
  })

  describe("5. Baris KPI Admin (calculateAdminKpi)", () => {
    it("menghitung total departemen, total anggota, % selesai, dan rata-rata skor keseluruhan", () => {
      const departments = [
        { id: "dept-1", is_active: true },
        { id: "dept-2", is_active: true },
        { id: "dept-3", is_active: false }, // tidak aktif
      ]

      const members = [
        { id: "m-1" },
        { id: "m-2" },
        { id: "m-3" },
        { id: "m-4" },
      ]

      const assessments = [
        { status: "approved" as AssessmentStatus, skor_rata: 4.00 },
        { status: "submitted" as AssessmentStatus, skor_rata: 4.50 },
        { status: "draft" as AssessmentStatus, skor_rata: 5.00 }, // draf diabaikan
      ]

      const kpi = calculateAdminKpi({
        departments,
        members,
        assessments,
      })

      expect(kpi.totalDepartments).toBe(2)
      expect(kpi.totalMembers).toBe(4)
      expect(kpi.completionPercentage).toBe(50) // 2 dari 4
      expect(kpi.overallAverageScore).toBe(4.25) // (4.00 + 4.50) / 2
    })
  })

  describe("6. Daftar Perlu Tindak Lanjut Ketua (calculateKetuaProgressAndAttention)", () => {
    it("menampilkan anggota belum dinilai dan menempatkan status revision_requested di paling atas", () => {
      const members = [
        { id: "m-1", nama: "Ahmad", nip: "101", jabatan: "Staff" },
        { id: "m-2", nama: "Budi", nip: "102", jabatan: "Guru" },
        { id: "m-3", nama: "Chandra", nip: "103", jabatan: "Admin" },
      ]

      const assessments = [
        { id: "a-1", member_id: "m-1", status: "approved" as AssessmentStatus, skor_rata: 4.5 },
        { id: "a-2", member_id: "m-2", status: "revision_requested" as AssessmentStatus, skor_rata: 3.0 },
        // m-3 belum memiliki assessment
      ]

      const res = calculateKetuaProgressAndAttention({
        members,
        assessments,
      })

      expect(res.progress.totalMembers).toBe(3)
      expect(res.progress.assessedCount).toBe(2) // approved + revision_requested
      expect(res.attentionList.length).toBe(2) // Budi (revisi) + Chandra (belum dinilai)

      // Budi (revisi) harus berada di urutan pertama
      expect(res.attentionList[0].nama).toBe("Budi")
      expect(res.attentionList[0].status).toBe("revision_requested")
      expect(res.attentionList[1].nama).toBe("Chandra")
      expect(res.attentionList[1].status).toBe("unassessed")
    })
  })

  describe("7. Tata Kelola Super-Admin (calculateSuperAdminGovernance)", () => {
    it("mendeteksi anomali departemen tanpa ketua dan akun ketua nonaktif", () => {
      const departments = [
        { id: "d-1", nama: "Dept. TI", kode: "TI", ketua_id: "u-1", is_active: true },
        { id: "d-2", nama: "Dept. SDM", kode: "SDM", ketua_id: null, is_active: true }, // tanpa ketua
        { id: "d-3", nama: "Dept. PU", kode: "PU", ketua_id: "u-3", is_active: true }, // ketua nonaktif
      ]

      const profiles = [
        { id: "u-1", nama: "Ustadz Fajar", role: "user", is_active: true },
        { id: "u-3", nama: "Ustadz Rudi", role: "user", is_active: false }, // nonaktif
      ]

      const gov = calculateSuperAdminGovernance({
        departments,
        profiles,
      })

      expect(gov.unassignedDeptCount).toBe(1)
      expect(gov.inactiveKetuaCount).toBe(1)
      expect(gov.anomalies.length).toBe(2)
      expect(gov.anomalies.some((a) => a.type === "unassigned_dept")).toBe(true)
      expect(gov.anomalies.some((a) => a.type === "inactive_ketua")).toBe(true)
    })
  })

  describe("8. Uji Performa Agregasi Dashboard (500 Anggota)", () => {
    it("menghitung metrik dan data visualisasi 500 anggota lintas 14 departemen dalam waktu <= 50ms (target batas sistem <= 2000ms)", () => {
      const generatedMembers = Array.from({ length: 500 }, (_, i) => ({
        id: `mem-${i}`,
        department_id: mockDepartments[i % 14].id,
        nama: `Anggota Ke-${i + 1}`,
        nip: `19850101${String(i).padStart(4, "0")}`,
        jabatan: "Staff Operasional",
      }))

      const generatedAssessments = Array.from({ length: 420 }, (_, i) => ({
        id: `assess-${i}`,
        member_id: `mem-${i}`,
        department_id: mockDepartments[i % 14].id,
        status: (i % 5 === 0 ? "revision_requested" : i % 2 === 0 ? "approved" : "submitted") as AssessmentStatus,
        skor_rata: Number((3.0 + (i % 20) * 0.1).toFixed(2)),
        submitted_at: new Date(Date.now() - i * 3600000).toISOString(),
        members: { nama: `Anggota Ke-${i + 1}`, jabatan: "Staff Operasional" },
      }))

      const tStart = performance.now()

      const kpi = calculateAdminKpi({
        departments: mockDepartments,
        members: generatedMembers,
        assessments: generatedAssessments,
      })

      const deptScores = calculateDeptScoreChartData({
        departments: mockDepartments,
        assessments: generatedAssessments,
        members: generatedMembers,
      })

      const deptCompletions = calculateDeptCompletionData({
        departments: mockDepartments,
        members: generatedMembers,
        assessments: generatedAssessments,
      })

      const scoreDist = calculateScoreDistribution(generatedAssessments)

      const attention = calculateAttentionList({
        departments: mockDepartments,
        members: generatedMembers,
        assessments: generatedAssessments,
      })

      const tEnd = performance.now()
      const durationMs = tEnd - tStart

      console.log(`[Dashboard Benchmark 500 Anggota]: ${durationMs.toFixed(2)} ms`)

      expect(durationMs).toBeLessThan(50) // target jauh di bawah 2000 ms
      expect(kpi.totalMembers).toBe(500)
      expect(deptScores.length).toBe(14)
      expect(deptCompletions.length).toBe(14)
      expect(scoreDist.length).toBe(5)
      expect(attention.incompleteDepartments.length).toBeGreaterThanOrEqual(0)
    })
  })
})
