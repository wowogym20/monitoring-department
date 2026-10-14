import { AssessmentStatus } from "@/types/database"
import { formatDateJakarta } from "@/lib/date"
import { roundToTwoDecimals } from "@/lib/scoring"
import {
  DeptScoreChartItem,
  DeptCompletionChartItem,
  AttentionDepartmentItem,
  AttentionSubmissionItem,
  KetuaAttentionItem,
  ScoreDistributionCategory,
  SuperAdminGovernanceInfo,
  SuperAdminGovernanceAnomaly,
} from "./types"

/**
 * 1. Evaluasi Tenggat Waktu Periode Penilaian
 * Sesuai PRD Bagian 10.1 & FR-10: Penanda aksen oren bila tenggat mendekat (<= 3 hari).
 */
export function checkDeadlineInfo(
  endDateInput: string | Date | null | undefined,
  currentDateInput: Date = new Date()
): {
  endDateFormatted: string
  daysRemaining: number
  isNearDeadline: boolean
  isPastDeadline: boolean
} {
  if (!endDateInput) {
    return {
      endDateFormatted: "-",
      daysRemaining: 999,
      isNearDeadline: false,
      isPastDeadline: false,
    }
  }

  const endDateFormatted = formatDateJakarta(endDateInput)

  // Parse tanggal akhir ke jam 23:59:59 zona lokal
  let endObj: Date
  if (typeof endDateInput === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(endDateInput)) {
      const [year, month, day] = endDateInput.split("-").map(Number)
      endObj = new Date(year, month - 1, day, 23, 59, 59, 999)
    } else {
      endObj = new Date(endDateInput)
    }
  } else {
    endObj = endDateInput
  }

  const now = currentDateInput
  const diffMs = endObj.getTime() - now.getTime()
  // Hitung selisih hari bulat
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return {
    endDateFormatted,
    daysRemaining,
    isNearDeadline: daysRemaining <= 3 && daysRemaining >= 0,
    isPastDeadline: daysRemaining < 0,
  }
}

/**
 * 2. Bar Chart Rata-rata Skor per Departemen
 * Sesuai PRD FR-10 & Dashboard ADMIN: Urut dari tertinggi ke terendah, warna emerald.
 */
export function calculateDeptScoreChartData(params: {
  departments: Array<{ id: string; nama: string; kode: string }>
  assessments: Array<{ department_id: string; status: AssessmentStatus; skor_rata: number | null }>
  members?: Array<{ id: string; department_id: string }>
}): DeptScoreChartItem[] {
  const { departments, assessments, members = [] } = params

  const memberCountMap = new Map<string, number>()
  for (const m of members) {
    memberCountMap.set(m.department_id, (memberCountMap.get(m.department_id) || 0) + 1)
  }

  const deptSumMap = new Map<string, { sum: number; count: number }>()

  for (const a of assessments) {
    if (a.status !== "draft" && a.skor_rata !== null && a.skor_rata !== undefined) {
      const numScore = Number(a.skor_rata)
      if (!Number.isNaN(numScore)) {
        const cur = deptSumMap.get(a.department_id) || { sum: 0, count: 0 }
        deptSumMap.set(a.department_id, {
          sum: cur.sum + numScore,
          count: cur.count + 1,
        })
      }
    }
  }

  const list: DeptScoreChartItem[] = departments.map((d) => {
    const agg = deptSumMap.get(d.id)
    const avgScore = agg && agg.count > 0 ? roundToTwoDecimals(agg.sum / agg.count) : 0
    return {
      id: d.id,
      name: d.nama,
      kode: d.kode,
      score: avgScore,
      totalMembers: memberCountMap.get(d.id) || 0,
      assessedCount: agg ? agg.count : 0,
    }
  })

  // Urutkan dari rata-rata skor tertinggi ke terendah
  return list.sort((a, b) => b.score - a.score)
}

/**
 * 3. Bar Chart Persentase Penyelesaian per Departemen
 * Sesuai PRD FR-10: Segmen emerald untuk selesai, segmen oren untuk belum selesai.
 */
export function calculateDeptCompletionData(params: {
  departments: Array<{ id: string; nama: string; kode: string }>
  members: Array<{ id: string; department_id: string }>
  assessments: Array<{ department_id: string; status: AssessmentStatus }>
}): DeptCompletionChartItem[] {
  const { departments, members, assessments } = params

  const memberCountMap = new Map<string, number>()
  for (const m of members) {
    memberCountMap.set(m.department_id, (memberCountMap.get(m.department_id) || 0) + 1)
  }

  const assessedCountMap = new Map<string, number>()
  for (const a of assessments) {
    if (a.status !== "draft") {
      assessedCountMap.set(a.department_id, (assessedCountMap.get(a.department_id) || 0) + 1)
    }
  }

  return departments.map((d) => {
    const totalMembers = memberCountMap.get(d.id) || 0
    const completedCount = assessedCountMap.get(d.id) || 0
    const completedPercent = totalMembers > 0 ? Math.min(100, Math.round((completedCount / totalMembers) * 100)) : 0
    const incompletePercent = Math.max(0, 100 - completedPercent)

    return {
      id: d.id,
      name: d.nama,
      kode: d.kode,
      completedPercent,
      incompletePercent,
      completedCount,
      totalMembers,
    }
  })
}

/**
 * 4. Distribusi Kategori Skor
 * Sesuai PRD Bagian 8: Sangat Baik (4.50-5.00), Baik (3.50-4.49), Cukup (2.50-3.49),
 * Kurang (1.50-2.49), Sangat Kurang (1.00-1.49).
 */
export function calculateScoreDistribution(
  assessments: Array<{ status: AssessmentStatus; skor_rata: number | null }>
): ScoreDistributionCategory[] {
  const validScores: number[] = []

  for (const a of assessments) {
    if (a.status !== "draft" && a.skor_rata !== null && a.skor_rata !== undefined) {
      const num = Number(a.skor_rata)
      if (!Number.isNaN(num) && num >= 1.0) {
        validScores.push(roundToTwoDecimals(num))
      }
    }
  }

  const total = validScores.length

  let sangatBaik = 0
  let baik = 0
  let cukup = 0
  let kurang = 0
  let sangatKurang = 0

  for (const s of validScores) {
    if (s >= 4.50) sangatBaik++
    else if (s >= 3.50) baik++
    else if (s >= 2.50) cukup++
    else if (s >= 1.50) kurang++
    else sangatKurang++
  }

  const calcPct = (cnt: number) => (total > 0 ? Math.round((cnt / total) * 100) : 0)

  return [
    {
      key: "sangat_baik",
      label: "Sangat Baik",
      range: "4,50 – 5,00",
      count: sangatBaik,
      percentage: calcPct(sangatBaik),
      badgeClass: "bg-emerald-700 text-white dark:bg-emerald-800",
      meaning: "Capaian istimewa, konsisten melampaui standar",
    },
    {
      key: "baik",
      label: "Baik",
      range: "3,50 – 4,49",
      count: baik,
      percentage: calcPct(baik),
      badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      meaning: "Kinerja solid memenuhi ekspektasi",
    },
    {
      key: "cukup",
      label: "Cukup",
      range: "2,50 – 3,49",
      count: cukup,
      percentage: calcPct(cukup),
      badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
      meaning: "Memenuhi kriteria minimum standar",
    },
    {
      key: "kurang",
      label: "Kurang",
      range: "1,50 – 2,49",
      count: kurang,
      percentage: calcPct(kurang),
      badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300 dark:border-orange-800",
      meaning: "Butuh pembinaan dan peningkatan aktif",
    },
    {
      key: "sangat_kurang",
      label: "Sangat Kurang",
      range: "1,00 – 1,49",
      count: sangatKurang,
      percentage: calcPct(sangatKurang),
      badgeClass: "bg-orange-700 text-white dark:bg-orange-800",
      meaning: "Memerlukan intervensi & pendampingan intensif",
    },
  ]
}

/**
 * 5. Baris KPI Keseluruhan Admin & Super-Admin
 */
export function calculateAdminKpi(params: {
  departments: Array<{ id: string; is_active: boolean }>
  members: Array<{ id: string }>
  assessments: Array<{ status: AssessmentStatus; skor_rata: number | null }>
}): {
  totalDepartments: number
  totalMembers: number
  completionPercentage: number
  overallAverageScore: number | null
} {
  const { departments, members, assessments } = params

  const totalDepartments = departments.filter((d) => d.is_active).length
  const totalMembers = members.length

  const assessedList = assessments.filter((a) => a.status !== "draft")
  const totalAssessed = assessedList.length

  const completionPercentage =
    totalMembers > 0 ? Math.min(100, Math.round((totalAssessed / totalMembers) * 100)) : 0

  let scoreSum = 0
  let scoreCount = 0

  for (const a of assessedList) {
    if (a.skor_rata !== null && a.skor_rata !== undefined) {
      const num = Number(a.skor_rata)
      if (!Number.isNaN(num)) {
        scoreSum += num
        scoreCount++
      }
    }
  }

  const overallAverageScore =
    scoreCount > 0 ? roundToTwoDecimals(scoreSum / scoreCount) : null

  return {
    totalDepartments,
    totalMembers,
    completionPercentage,
    overallAverageScore,
  }
}

/**
 * 6. Daftar "Perlu Tindak Lanjut" untuk Admin & Super-Admin
 * Sesuai PRD Dashboard ADMIN: Departemen belum selesai menilai & status Submitted menunggu review
 */
export function calculateAttentionList(params: {
  departments: Array<{ id: string; nama: string; kode: string }>
  members: Array<{ id: string; department_id: string }>
  assessments: Array<{
    id: string
    member_id: string
    department_id: string
    status: AssessmentStatus
    submitted_at: string | null
    members?: { nama: string; jabatan: string }
  }>
}): {
  incompleteDepartments: AttentionDepartmentItem[]
  pendingSubmissions: AttentionSubmissionItem[]
} {
  const { departments, members, assessments } = params

  const memberCountMap = new Map<string, number>()
  for (const m of members) {
    memberCountMap.set(m.department_id, (memberCountMap.get(m.department_id) || 0) + 1)
  }

  const assessedCountMap = new Map<string, number>()
  for (const a of assessments) {
    if (a.status !== "draft") {
      assessedCountMap.set(a.department_id, (assessedCountMap.get(a.department_id) || 0) + 1)
    }
  }

  // Departemen belum selesai
  const incompleteDepartments: AttentionDepartmentItem[] = []
  for (const d of departments) {
    const total = memberCountMap.get(d.id) || 0
    const assessed = assessedCountMap.get(d.id) || 0
    if (assessed < total) {
      incompleteDepartments.push({
        department_id: d.id,
        nama: d.nama,
        kode: d.kode,
        totalMembers: total,
        assessedCount: assessed,
        remainingCount: total - assessed,
        href: `/rekap?departmentId=${d.id}`,
      })
    }
  }

  // Urutkan departemen yang sisa anggotanya paling banyak terlebih dahulu
  incompleteDepartments.sort((a, b) => b.remainingCount - a.remainingCount)

  // Penilaian status submitted yang menunggu review
  const pendingSubmissions: AttentionSubmissionItem[] = []
  const deptMap = new Map(departments.map((d) => [d.id, d]))

  for (const a of assessments) {
    if (a.status === "submitted") {
      const dept = deptMap.get(a.department_id)
      pendingSubmissions.push({
        assessment_id: a.id,
        member_id: a.member_id,
        member_nama: a.members?.nama || "Anggota",
        member_jabatan: a.members?.jabatan || "-",
        department_id: a.department_id,
        department_nama: dept ? dept.nama : "-",
        submitted_at: a.submitted_at,
        href: `/rekap/${a.id}`,
      })
    }
  }

  // Urutkan submission submitted dari yang terlama agar tidak tertunda
  pendingSubmissions.sort((a, b) => {
    const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
    const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
    return timeA - timeB
  })

  return {
    incompleteDepartments,
    pendingSubmissions,
  }
}

/**
 * 7. Evaluasi Tata Kelola Super-Admin
 * Ringkasan akun ketua nonaktif atau departemen tanpa ketua
 */
export function calculateSuperAdminGovernance(params: {
  departments: Array<{ id: string; nama: string; kode: string; ketua_id: string | null; is_active: boolean }>
  profiles: Array<{ id: string; nama: string; role: string; is_active: boolean }>
}): SuperAdminGovernanceInfo {
  const { departments, profiles } = params
  const activeProfilesMap = new Map(profiles.filter((p) => p.is_active).map((p) => [p.id, p]))
  const allProfilesMap = new Map(profiles.map((p) => [p.id, p]))

  const anomalies: SuperAdminGovernanceAnomaly[] = []

  let unassignedCount = 0
  let inactiveKetuaCount = 0

  for (const d of departments) {
    if (!d.is_active) continue

    if (!d.ketua_id) {
      unassignedCount++
      anomalies.push({
        type: "unassigned_dept",
        id: d.id,
        nama: d.nama,
        keterangan: "Belum memiliki ketua departemen yang ditetapkan",
        actionHref: `/departemen`,
        actionLabel: "Tetapkan Ketua",
      })
    } else {
      const ketua = activeProfilesMap.get(d.ketua_id)
      if (!ketua) {
        inactiveKetuaCount++
        const anyKetua = allProfilesMap.get(d.ketua_id)
        anomalies.push({
          type: "inactive_ketua",
          id: d.id,
          nama: d.nama,
          keterangan: `Ketua (${anyKetua?.nama || "Akun"}) berstatus nonaktif`,
          actionHref: `/ketua`,
          actionLabel: "Kelola Akun Ketua",
        })
      }
    }
  }

  return {
    unassignedDeptCount: unassignedCount,
    inactiveKetuaCount,
    anomalies,
  }
}

/**
 * 8. Evaluasi Progres dan Anggota yang Belum Dinilai untuk Ketua Departemen
 */
export function calculateKetuaProgressAndAttention(params: {
  members: Array<{ id: string; nama: string; nip: string | null; jabatan: string }>
  assessments: Array<{ id: string; member_id: string; status: AssessmentStatus; skor_rata: number | null }>
}): {
  progress: {
    totalMembers: number
    assessedCount: number
    draftCount: number
    completionPercent: number
  }
  attentionList: KetuaAttentionItem[]
  averageScore: number | null
} {
  const { members, assessments } = params

  const assessMap = new Map<string, { id: string; status: AssessmentStatus; skor_rata: number | null }>()
  for (const a of assessments) {
    assessMap.set(a.member_id, a)
  }

  const attentionList: KetuaAttentionItem[] = []
  let assessedCount = 0
  let draftCount = 0
  let scoreSum = 0
  let scoreCount = 0

  for (const m of members) {
    const a = assessMap.get(m.id)
    if (!a || a.status === "draft") {
      if (a && a.status === "draft") {
        draftCount++
      }
      attentionList.push({
        member_id: m.id,
        nama: m.nama,
        nip: m.nip,
        jabatan: m.jabatan,
        status: "unassessed",
        assessment_id: a?.id,
        href: `/penilaian/${m.id}`,
      })
    } else if (a.status === "revision_requested") {
      attentionList.push({
        member_id: m.id,
        nama: m.nama,
        nip: m.nip,
        jabatan: m.jabatan,
        status: "revision_requested",
        assessment_id: a.id,
        href: `/penilaian/${m.id}`,
      })
      assessedCount++
      if (a.skor_rata !== null && a.skor_rata !== undefined) {
        scoreSum += Number(a.skor_rata)
        scoreCount++
      }
    } else {
      // submitted or approved
      assessedCount++
      if (a.skor_rata !== null && a.skor_rata !== undefined) {
        scoreSum += Number(a.skor_rata)
        scoreCount++
      }
    }
  }

  // Prioritaskan anggota dengan status revision_requested di daftar paling atas!
  attentionList.sort((a, b) => {
    if (a.status === "revision_requested" && b.status !== "revision_requested") return -1
    if (a.status !== "revision_requested" && b.status === "revision_requested") return 1
    return a.nama.localeCompare(b.nama)
  })

  const totalMembers = members.length
  const completionPercent =
    totalMembers > 0 ? Math.min(100, Math.round((assessedCount / totalMembers) * 100)) : 0
  const averageScore = scoreCount > 0 ? roundToTwoDecimals(scoreSum / scoreCount) : null

  return {
    progress: {
      totalMembers,
      assessedCount,
      draftCount,
      completionPercent,
    },
    attentionList,
    averageScore,
  }
}
