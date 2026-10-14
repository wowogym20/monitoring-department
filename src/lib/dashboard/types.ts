export interface PeriodOption {
  id: string
  nama: string
  status: "open" | "closed"
  tanggal_mulai: string
  tanggal_akhir: string
}

export interface DeptScoreChartItem {
  id: string
  name: string
  kode: string
  score: number
  totalMembers: number
  assessedCount: number
}

export interface DeptCompletionChartItem {
  id: string
  name: string
  kode: string
  completedPercent: number
  incompletePercent: number
  completedCount: number
  totalMembers: number
}

export interface AttentionDepartmentItem {
  department_id: string
  nama: string
  kode: string
  totalMembers: number
  assessedCount: number
  remainingCount: number
  href: string
}

export interface AttentionSubmissionItem {
  assessment_id: string
  member_id: string
  member_nama: string
  member_jabatan: string
  department_id: string
  department_nama: string
  submitted_at: string | null
  href: string
}

export interface KetuaAttentionItem {
  member_id: string
  nama: string
  nip: string | null
  jabatan: string
  status: "unassessed" | "revision_requested"
  assessment_id?: string
  href: string
}

export interface ScoreDistributionCategory {
  key: "sangat_baik" | "baik" | "cukup" | "kurang" | "sangat_kurang"
  label: string
  range: string
  count: number
  percentage: number
  badgeClass: string
  meaning: string
}

export interface SuperAdminGovernanceAnomaly {
  type: "unassigned_dept" | "inactive_ketua"
  id: string
  nama: string
  keterangan: string
  actionHref: string
  actionLabel: string
}

export interface SuperAdminGovernanceInfo {
  unassignedDeptCount: number
  inactiveKetuaCount: number
  anomalies: SuperAdminGovernanceAnomaly[]
}

export interface KetuaDashboardData {
  role: "user"
  department: {
    id: string
    nama: string
    kode: string
  } | null
  period: PeriodOption | null
  periods: PeriodOption[]
  progress: {
    totalMembers: number
    assessedCount: number
    draftCount: number
    completionPercent: number
  }
  unreadComments: {
    count: number
    items: Array<{
      assessmentId: string
      memberNama: string
      authorNama: string
      isi: string
      createdAt: string
    }>
  }
  deadlineInfo: {
    endDateFormatted: string
    daysRemaining: number
    isNearDeadline: boolean
    isPastDeadline: boolean
  }
  attentionList: KetuaAttentionItem[]
  kpi: {
    totalMembers: number
    assessedCount: number
    needActionCount: number
    averageScore: number | null
  }
}

export interface AdminDashboardData {
  role: "admin" | "super_admin"
  period: PeriodOption | null
  periods: PeriodOption[]
  kpi: {
    totalDepartments: number
    totalMembers: number
    completionPercentage: number
    overallAverageScore: number | null
  }
  deptScores: DeptScoreChartItem[]
  deptCompletions: DeptCompletionChartItem[]
  attentionList: {
    incompleteDepartments: AttentionDepartmentItem[]
    pendingSubmissions: AttentionSubmissionItem[]
  }
  scoreDistribution: ScoreDistributionCategory[]
  governance?: SuperAdminGovernanceInfo
}
