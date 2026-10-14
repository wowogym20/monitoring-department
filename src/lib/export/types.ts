import {
  AssessmentAspect,
  AssessmentPeriod,
  AssessmentStatus,
  UserRole,
} from "@/types/database"

export interface DepartmentRekapSummary {
  id: string
  nama: string
  kode: string
  total_members: number
  assessed_count: number
  draft_count: number
  average_score: number | null
  is_incomplete: boolean // true jika assessed_count < total_members (US-10 penanda oren)
}

export interface ExportMemberItem {
  no: number
  department_id: string
  department_nama: string
  department_kode: string
  member_id: string
  member_nama: string
  member_nip: string | null
  member_jabatan: string
  status: AssessmentStatus | "unassessed"
  statusLabel: string
  skor_rata: number | null
  kategori: string
  aspect_scores: Record<string, number | null>
  submitted_at: string | null
  evaluator_nama: string | null
}

export interface ExportDepartmentGroup {
  department: {
    id: string
    nama: string
    kode: string
  }
  summary: DepartmentRekapSummary
  members: ExportMemberItem[]
}

export interface ExportDataset {
  period: AssessmentPeriod
  scopeDepartmentName: string
  scopeDepartmentKode: string | null
  aspects: AssessmentAspect[]
  summaries: DepartmentRekapSummary[]
  members: ExportMemberItem[]
  departmentGroups: ExportDepartmentGroup[]
  exportedAt: Date
  userRole: UserRole
}
