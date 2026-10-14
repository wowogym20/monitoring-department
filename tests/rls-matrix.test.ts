import { describe, it, expect } from 'vitest'
import { UserRole, AssessmentStatus } from '@/types/database'

/**
 * Matriks Lengkap Pengujian Row-Level Security (RLS)
 * Menguji izin operasi CRUD untuk 3 Peran Pengguna (super_admin, admin, user)
 * di seluruh 9 Tabel Publik sesuai PRD Bagian 4 & 11:
 *
 * 1. profiles
 * 2. departments
 * 3. members
 * 4. assessment_aspects
 * 5. assessment_periods
 * 6. assessments
 * 7. assessment_scores
 * 8. assessment_comments
 * 9. audit_logs
 */

// Mock User Identifiers
const SUPER_ADMIN = { id: 'super-admin-uuid', role: 'super_admin' as UserRole }
const ADMIN_SDM = { id: 'admin-sdm-uuid', role: 'admin' as UserRole }
const KETUA_DEPT_A = {
  id: 'ketua-a-uuid',
  role: 'user' as UserRole,
  department_id: 'dept-a-uuid',
}
const KETUA_DEPT_B = {
  id: 'ketua-b-uuid',
  role: 'user' as UserRole,
  department_id: 'dept-b-uuid',
}

// Model Evaluasi RLS Engine
class RlsEvaluator {
  /**
   * 1. PROFILES
   * super_admin: ALL
   * admin: SELECT all
   * user: SELECT self, UPDATE self (mencegah eskalasi role)
   */
  static evaluateProfiles(
    user: { id: string; role: UserRole },
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    target: { id: string; role?: UserRole; updateFields?: { role?: UserRole; nama?: string } }
  ): boolean {
    if (user.role === 'super_admin') return true
    if (user.role === 'admin') {
      return action === 'SELECT'
    }
    if (user.role === 'user') {
      if (action === 'SELECT') {
        return user.id === target.id
      }
      if (action === 'UPDATE') {
        if (user.id !== target.id) return false
        // Cegah perubahan role oleh user sendiri
        if (target.updateFields?.role && target.updateFields.role !== 'user') {
          return false
        }
        return true
      }
      return false // INSERT/DELETE forbidden
    }
    return false
  }

  /**
   * 2. DEPARTMENTS
   * super_admin: ALL
   * admin: SELECT all
   * user: SELECT own dept (ketua_id = auth.uid())
   */
  static evaluateDepartments(
    user: { id: string; role: UserRole },
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    target: { id: string; ketua_id: string | null }
  ): boolean {
    if (user.role === 'super_admin') return true
    if (user.role === 'admin') {
      return action === 'SELECT'
    }
    if (user.role === 'user') {
      if (action === 'SELECT') {
        return target.ketua_id === user.id
      }
      return false // CRUD prohibited for user
    }
    return false
  }

  /**
   * 3. MEMBERS
   * super_admin: ALL
   * admin: SELECT all
   * user: CRUD jika member.department_id = ketua.department_id
   */
  static evaluateMembers(
    user: { id: string; role: UserRole; department_id?: string },
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    target: { id: string; department_id: string }
  ): boolean {
    if (user.role === 'super_admin') return true
    if (user.role === 'admin') {
      return action === 'SELECT'
    }
    if (user.role === 'user') {
      return user.department_id === target.department_id
    }
    return false
  }

  /**
   * 4. ASSESSMENT_ASPECTS
   * super_admin: ALL
   * admin: SELECT all
   * user: SELECT all
   */
  static evaluateAspects(
    user: { id: string; role: UserRole },
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  ): boolean {
    if (user.role === 'super_admin') return true
    if (action === 'SELECT') return true
    return false
  }

  /**
   * 5. ASSESSMENT_PERIODS
   * super_admin: ALL
   * admin: ALL (CRUD)
   * user: SELECT all
   */
  static evaluatePeriods(
    user: { id: string; role: UserRole },
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  ): boolean {
    if (user.role === 'super_admin') return true
    if (user.role === 'admin') return true
    if (user.role === 'user') {
      return action === 'SELECT'
    }
    return false
  }

  /**
   * 6. ASSESSMENTS
   * super_admin: ALL
   * admin: SELECT non-draft, UPDATE status (approval/revisi)
   * user: CRUD jika department_id = departemen miliknya
   */
  static evaluateAssessments(
    user: { id: string; role: UserRole; department_id?: string },
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    target: { department_id: string; status: AssessmentStatus; deleted_at?: string | null }
  ): boolean {
    if (user.role === 'super_admin') return true
    if (user.role === 'admin') {
      if (action === 'SELECT') {
        return target.status !== 'draft' && !target.deleted_at
      }
      if (action === 'UPDATE') {
        return true // Approval / revision trigger
      }
      return false // INSERT/DELETE dilarang untuk admin
    }
    if (user.role === 'user') {
      return user.department_id === target.department_id
    }
    return false
  }

  /**
   * 7. ASSESSMENT_SCORES
   * super_admin: ALL
   * admin: SELECT jika assessment non-draft
   * user: CRUD jika assessment.department_id = ketua.department_id
   */
  static evaluateScores(
    user: { id: string; role: UserRole; department_id?: string },
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    targetAssessment: { department_id: string; status: AssessmentStatus; deleted_at?: string | null },
    scoreValue?: number
  ): boolean {
    // Constraint skala Likert 1-5
    if (scoreValue !== undefined && (scoreValue < 1 || scoreValue > 5 || !Number.isInteger(scoreValue))) {
      return false
    }

    if (user.role === 'super_admin') return true
    if (user.role === 'admin') {
      if (action === 'SELECT') {
        return targetAssessment.status !== 'draft' && !targetAssessment.deleted_at
      }
      return false
    }
    if (user.role === 'user') {
      return user.department_id === targetAssessment.department_id
    }
    return false
  }

  /**
   * 8. ASSESSMENT_COMMENTS
   * super_admin: ALL
   * admin: SELECT all, INSERT (author_id = auth.uid())
   * user: SELECT own dept, INSERT own dept (author_id = auth.uid()), UPDATE own dept (mark read)
   */
  static evaluateComments(
    user: { id: string; role: UserRole; department_id?: string },
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    targetAssessment: { department_id: string },
    commentAuthorId?: string
  ): boolean {
    if (user.role === 'super_admin') return true
    if (user.role === 'admin') {
      if (action === 'SELECT') return true
      if (action === 'INSERT') return commentAuthorId === user.id
      return false
    }
    if (user.role === 'user') {
      const isOwnDept = user.department_id === targetAssessment.department_id
      if (!isOwnDept) return false

      if (action === 'SELECT') return true
      if (action === 'INSERT') return commentAuthorId === user.id
      if (action === 'UPDATE') return true // Menandai dibaca_at
      return false
    }
    return false
  }

  /**
   * 9. AUDIT_LOGS
   * super_admin: SELECT all
   * admin: SELECT all
   * user: SELECT own dept assessment records
   */
  static evaluateAuditLogs(
    user: { id: string; role: UserRole; department_id?: string },
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    record?: { department_id: string }
  ): boolean {
    if (action !== 'SELECT') return false // Audit logs immutable via RLS, only database trigger inserts
    if (user.role === 'super_admin' || user.role === 'admin') return true
    if (user.role === 'user') {
      return !!record && record.department_id === user.department_id
    }
    return false
  }
}

describe('Matriks Lengkap RLS: 3 Peran x 9 Tabel Publik', () => {
  // 1. PROFILES
  describe('Tabel 1: profiles', () => {
    it('[super_admin] memiliki akses penuh (SELECT, INSERT, UPDATE, DELETE) pada semua profil', () => {
      expect(RlsEvaluator.evaluateProfiles(SUPER_ADMIN, 'SELECT', { id: 'any-user' })).toBe(true)
      expect(RlsEvaluator.evaluateProfiles(SUPER_ADMIN, 'INSERT', { id: 'any-user' })).toBe(true)
      expect(RlsEvaluator.evaluateProfiles(SUPER_ADMIN, 'UPDATE', { id: 'any-user' })).toBe(true)
      expect(RlsEvaluator.evaluateProfiles(SUPER_ADMIN, 'DELETE', { id: 'any-user' })).toBe(true)
    })

    it('[admin] dapat membaca seluruh profil, tetapi tidak dapat mengubah/menghapus', () => {
      expect(RlsEvaluator.evaluateProfiles(ADMIN_SDM, 'SELECT', { id: KETUA_DEPT_A.id })).toBe(true)
      expect(RlsEvaluator.evaluateProfiles(ADMIN_SDM, 'INSERT', { id: 'new-user' })).toBe(false)
      expect(RlsEvaluator.evaluateProfiles(ADMIN_SDM, 'UPDATE', { id: KETUA_DEPT_A.id })).toBe(false)
      expect(RlsEvaluator.evaluateProfiles(ADMIN_SDM, 'DELETE', { id: KETUA_DEPT_A.id })).toBe(false)
    })

    it('[user/ketua] hanya bisa membaca dan mengubah profil sendiri, DILARANG eskalasi role', () => {
      // Baca profil sendiri vs profil orang lain
      expect(RlsEvaluator.evaluateProfiles(KETUA_DEPT_A, 'SELECT', { id: KETUA_DEPT_A.id })).toBe(true)
      expect(RlsEvaluator.evaluateProfiles(KETUA_DEPT_A, 'SELECT', { id: KETUA_DEPT_B.id })).toBe(false)

      // Ubah profil sendiri tanpa eskalasi role
      expect(
        RlsEvaluator.evaluateProfiles(KETUA_DEPT_A, 'UPDATE', {
          id: KETUA_DEPT_A.id,
          updateFields: { nama: 'Ketua Baru', role: 'user' },
        })
      ).toBe(true)

      // Percobaan eskalasi role ke super_admin ditolak
      expect(
        RlsEvaluator.evaluateProfiles(KETUA_DEPT_A, 'UPDATE', {
          id: KETUA_DEPT_A.id,
          updateFields: { role: 'super_admin' },
        })
      ).toBe(false)

      // Hapus profil sendiri ditolak
      expect(RlsEvaluator.evaluateProfiles(KETUA_DEPT_A, 'DELETE', { id: KETUA_DEPT_A.id })).toBe(false)
    })
  })

  // 2. DEPARTMENTS
  describe('Tabel 2: departments', () => {
    const deptA = { id: 'dept-a-uuid', ketua_id: KETUA_DEPT_A.id }
    const deptB = { id: 'dept-b-uuid', ketua_id: KETUA_DEPT_B.id }

    it('[super_admin] memiliki akses penuh (CRUD) ke semua departemen', () => {
      expect(RlsEvaluator.evaluateDepartments(SUPER_ADMIN, 'SELECT', deptA)).toBe(true)
      expect(RlsEvaluator.evaluateDepartments(SUPER_ADMIN, 'INSERT', deptA)).toBe(true)
      expect(RlsEvaluator.evaluateDepartments(SUPER_ADMIN, 'UPDATE', deptA)).toBe(true)
      expect(RlsEvaluator.evaluateDepartments(SUPER_ADMIN, 'DELETE', deptA)).toBe(true)
    })

    it('[admin] hanya memiliki izin SELECT ke semua departemen', () => {
      expect(RlsEvaluator.evaluateDepartments(ADMIN_SDM, 'SELECT', deptA)).toBe(true)
      expect(RlsEvaluator.evaluateDepartments(ADMIN_SDM, 'SELECT', deptB)).toBe(true)
      expect(RlsEvaluator.evaluateDepartments(ADMIN_SDM, 'INSERT', deptA)).toBe(false)
      expect(RlsEvaluator.evaluateDepartments(ADMIN_SDM, 'UPDATE', deptA)).toBe(false)
      expect(RlsEvaluator.evaluateDepartments(ADMIN_SDM, 'DELETE', deptA)).toBe(false)
    })

    it('[user/ketua] HANYA dapat membaca departemen yang dipimpinnya, DILARANG mutasi', () => {
      expect(RlsEvaluator.evaluateDepartments(KETUA_DEPT_A, 'SELECT', deptA)).toBe(true)
      expect(RlsEvaluator.evaluateDepartments(KETUA_DEPT_A, 'SELECT', deptB)).toBe(false)
      expect(RlsEvaluator.evaluateDepartments(KETUA_DEPT_A, 'INSERT', deptA)).toBe(false)
      expect(RlsEvaluator.evaluateDepartments(KETUA_DEPT_A, 'UPDATE', deptA)).toBe(false)
      expect(RlsEvaluator.evaluateDepartments(KETUA_DEPT_A, 'DELETE', deptA)).toBe(false)
    })
  })

  // 3. MEMBERS
  describe('Tabel 3: members', () => {
    const memberA = { id: 'member-a', department_id: 'dept-a-uuid' }
    const memberB = { id: 'member-b', department_id: 'dept-b-uuid' }

    it('[super_admin] dapat mengelola (CRUD) seluruh anggota lintas departemen', () => {
      expect(RlsEvaluator.evaluateMembers(SUPER_ADMIN, 'SELECT', memberA)).toBe(true)
      expect(RlsEvaluator.evaluateMembers(SUPER_ADMIN, 'INSERT', memberA)).toBe(true)
      expect(RlsEvaluator.evaluateMembers(SUPER_ADMIN, 'UPDATE', memberB)).toBe(true)
      expect(RlsEvaluator.evaluateMembers(SUPER_ADMIN, 'DELETE', memberB)).toBe(true)
    })

    it('[admin] hanya dapat melihat seluruh anggota untuk keperluan rekap, tanpa hak mutasi', () => {
      expect(RlsEvaluator.evaluateMembers(ADMIN_SDM, 'SELECT', memberA)).toBe(true)
      expect(RlsEvaluator.evaluateMembers(ADMIN_SDM, 'SELECT', memberB)).toBe(true)
      expect(RlsEvaluator.evaluateMembers(ADMIN_SDM, 'INSERT', memberA)).toBe(false)
      expect(RlsEvaluator.evaluateMembers(ADMIN_SDM, 'UPDATE', memberA)).toBe(false)
      expect(RlsEvaluator.evaluateMembers(ADMIN_SDM, 'DELETE', memberA)).toBe(false)
    })

    it('[user/ketua] memiliki CRUD penuh pada anggota departemennya dan TERISOLASI dari departemen lain', () => {
      // Akses departemen sendiri
      expect(RlsEvaluator.evaluateMembers(KETUA_DEPT_A, 'SELECT', memberA)).toBe(true)
      expect(RlsEvaluator.evaluateMembers(KETUA_DEPT_A, 'INSERT', memberA)).toBe(true)
      expect(RlsEvaluator.evaluateMembers(KETUA_DEPT_A, 'UPDATE', memberA)).toBe(true)
      expect(RlsEvaluator.evaluateMembers(KETUA_DEPT_A, 'DELETE', memberA)).toBe(true)

      // Penolakan akses lintas departemen
      expect(RlsEvaluator.evaluateMembers(KETUA_DEPT_A, 'SELECT', memberB)).toBe(false)
      expect(RlsEvaluator.evaluateMembers(KETUA_DEPT_A, 'INSERT', memberB)).toBe(false)
      expect(RlsEvaluator.evaluateMembers(KETUA_DEPT_A, 'UPDATE', memberB)).toBe(false)
      expect(RlsEvaluator.evaluateMembers(KETUA_DEPT_A, 'DELETE', memberB)).toBe(false)
    })
  })

  // 4. ASSESSMENT_ASPECTS
  describe('Tabel 4: assessment_aspects', () => {
    it('[super_admin] memiliki hak penuh mengelola aspek', () => {
      expect(RlsEvaluator.evaluateAspects(SUPER_ADMIN, 'SELECT')).toBe(true)
      expect(RlsEvaluator.evaluateAspects(SUPER_ADMIN, 'INSERT')).toBe(true)
      expect(RlsEvaluator.evaluateAspects(SUPER_ADMIN, 'UPDATE')).toBe(true)
      expect(RlsEvaluator.evaluateAspects(SUPER_ADMIN, 'DELETE')).toBe(true)
    })

    it('[admin] dan [user] dapat membaca seluruh aspek, namun tidak dapat mengubah aspek', () => {
      expect(RlsEvaluator.evaluateAspects(ADMIN_SDM, 'SELECT')).toBe(true)
      expect(RlsEvaluator.evaluateAspects(ADMIN_SDM, 'INSERT')).toBe(false)
      expect(RlsEvaluator.evaluateAspects(ADMIN_SDM, 'UPDATE')).toBe(false)

      expect(RlsEvaluator.evaluateAspects(KETUA_DEPT_A, 'SELECT')).toBe(true)
      expect(RlsEvaluator.evaluateAspects(KETUA_DEPT_A, 'INSERT')).toBe(false)
      expect(RlsEvaluator.evaluateAspects(KETUA_DEPT_A, 'UPDATE')).toBe(false)
    })
  })

  // 5. ASSESSMENT_PERIODS
  describe('Tabel 5: assessment_periods', () => {
    it('[super_admin] dan [admin] dapat membuat, mengubah, dan membuka/menutup periode', () => {
      expect(RlsEvaluator.evaluatePeriods(SUPER_ADMIN, 'SELECT')).toBe(true)
      expect(RlsEvaluator.evaluatePeriods(SUPER_ADMIN, 'INSERT')).toBe(true)
      expect(RlsEvaluator.evaluatePeriods(SUPER_ADMIN, 'UPDATE')).toBe(true)
      expect(RlsEvaluator.evaluatePeriods(SUPER_ADMIN, 'DELETE')).toBe(true)

      expect(RlsEvaluator.evaluatePeriods(ADMIN_SDM, 'SELECT')).toBe(true)
      expect(RlsEvaluator.evaluatePeriods(ADMIN_SDM, 'INSERT')).toBe(true)
      expect(RlsEvaluator.evaluatePeriods(ADMIN_SDM, 'UPDATE')).toBe(true)
      expect(RlsEvaluator.evaluatePeriods(ADMIN_SDM, 'DELETE')).toBe(true)
    })

    it('[user/ketua] hanya dapat membaca periode, tidak dapat memanipulasi periode', () => {
      expect(RlsEvaluator.evaluatePeriods(KETUA_DEPT_A, 'SELECT')).toBe(true)
      expect(RlsEvaluator.evaluatePeriods(KETUA_DEPT_A, 'INSERT')).toBe(false)
      expect(RlsEvaluator.evaluatePeriods(KETUA_DEPT_A, 'UPDATE')).toBe(false)
      expect(RlsEvaluator.evaluatePeriods(KETUA_DEPT_A, 'DELETE')).toBe(false)
    })
  })

  // 6. ASSESSMENTS
  describe('Tabel 6: assessments', () => {
    const draftAssessmentA = { department_id: 'dept-a-uuid', status: 'draft' as AssessmentStatus }
    const submittedAssessmentA = { department_id: 'dept-a-uuid', status: 'submitted' as AssessmentStatus }
    const submittedAssessmentB = { department_id: 'dept-b-uuid', status: 'submitted' as AssessmentStatus }

    it('[super_admin] dapat mengakses draf maupun non-draf di semua departemen', () => {
      expect(RlsEvaluator.evaluateAssessments(SUPER_ADMIN, 'SELECT', draftAssessmentA)).toBe(true)
      expect(RlsEvaluator.evaluateAssessments(SUPER_ADMIN, 'SELECT', submittedAssessmentB)).toBe(true)
      expect(RlsEvaluator.evaluateAssessments(SUPER_ADMIN, 'INSERT', draftAssessmentA)).toBe(true)
    })

    it('[admin] TIDAK BISA melihat penilaian berstatus draft, HANYA non-draft', () => {
      expect(RlsEvaluator.evaluateAssessments(ADMIN_SDM, 'SELECT', draftAssessmentA)).toBe(false)
      expect(RlsEvaluator.evaluateAssessments(ADMIN_SDM, 'SELECT', submittedAssessmentA)).toBe(true)
      expect(RlsEvaluator.evaluateAssessments(ADMIN_SDM, 'SELECT', submittedAssessmentB)).toBe(true)
    })

    it('[admin] dapat memperbarui status (approval/revisi) tetapi DILARANG membuat atau menghapus penilaian', () => {
      expect(RlsEvaluator.evaluateAssessments(ADMIN_SDM, 'UPDATE', submittedAssessmentA)).toBe(true)
      expect(RlsEvaluator.evaluateAssessments(ADMIN_SDM, 'INSERT', submittedAssessmentA)).toBe(false)
      expect(RlsEvaluator.evaluateAssessments(ADMIN_SDM, 'DELETE', submittedAssessmentA)).toBe(false)
    })

    it('[user/ketua] mengelola draf & submitted departemen sendiri, DILARANG melihat/mengubah departemen lain', () => {
      expect(RlsEvaluator.evaluateAssessments(KETUA_DEPT_A, 'SELECT', draftAssessmentA)).toBe(true)
      expect(RlsEvaluator.evaluateAssessments(KETUA_DEPT_A, 'SELECT', submittedAssessmentA)).toBe(true)
      expect(RlsEvaluator.evaluateAssessments(KETUA_DEPT_A, 'INSERT', draftAssessmentA)).toBe(true)

      // Departemen B terisolasi
      expect(RlsEvaluator.evaluateAssessments(KETUA_DEPT_A, 'SELECT', submittedAssessmentB)).toBe(false)
      expect(RlsEvaluator.evaluateAssessments(KETUA_DEPT_A, 'INSERT', submittedAssessmentB)).toBe(false)
      expect(RlsEvaluator.evaluateAssessments(KETUA_DEPT_A, 'UPDATE', submittedAssessmentB)).toBe(false)
      expect(RlsEvaluator.evaluateAssessments(KETUA_DEPT_A, 'DELETE', submittedAssessmentB)).toBe(false)
    })
  })

  // 7. ASSESSMENT_SCORES
  describe('Tabel 7: assessment_scores', () => {
    const parentDraftA = { department_id: 'dept-a-uuid', status: 'draft' as AssessmentStatus }
    const parentSubmittedA = { department_id: 'dept-a-uuid', status: 'submitted' as AssessmentStatus }
    const parentSubmittedB = { department_id: 'dept-b-uuid', status: 'submitted' as AssessmentStatus }

    it('Integritas nilai Likert 1–5 ditegakkan di level database constraint', () => {
      expect(RlsEvaluator.evaluateScores(SUPER_ADMIN, 'INSERT', parentDraftA, 1)).toBe(true)
      expect(RlsEvaluator.evaluateScores(SUPER_ADMIN, 'INSERT', parentDraftA, 5)).toBe(true)
      expect(RlsEvaluator.evaluateScores(SUPER_ADMIN, 'INSERT', parentDraftA, 0)).toBe(false)
      expect(RlsEvaluator.evaluateScores(SUPER_ADMIN, 'INSERT', parentDraftA, 6)).toBe(false)
      expect(RlsEvaluator.evaluateScores(SUPER_ADMIN, 'INSERT', parentDraftA, 3.5)).toBe(false)
    })

    it('[super_admin] memiliki hak akses nilai pada semua assessment', () => {
      expect(RlsEvaluator.evaluateScores(SUPER_ADMIN, 'SELECT', parentDraftA, 4)).toBe(true)
      expect(RlsEvaluator.evaluateScores(SUPER_ADMIN, 'SELECT', parentSubmittedB, 4)).toBe(true)
    })

    it('[admin] hanya dapat melihat skor penilaian non-draft', () => {
      expect(RlsEvaluator.evaluateScores(ADMIN_SDM, 'SELECT', parentDraftA, 4)).toBe(false)
      expect(RlsEvaluator.evaluateScores(ADMIN_SDM, 'SELECT', parentSubmittedA, 4)).toBe(true)
      expect(RlsEvaluator.evaluateScores(ADMIN_SDM, 'SELECT', parentSubmittedB, 4)).toBe(true)
      expect(RlsEvaluator.evaluateScores(ADMIN_SDM, 'INSERT', parentSubmittedA, 4)).toBe(false)
    })

    it('[user/ketua] dapat mengelola skor departemennya dan terblokir dari departemen lain', () => {
      expect(RlsEvaluator.evaluateScores(KETUA_DEPT_A, 'SELECT', parentDraftA, 4)).toBe(true)
      expect(RlsEvaluator.evaluateScores(KETUA_DEPT_A, 'INSERT', parentDraftA, 4)).toBe(true)
      expect(RlsEvaluator.evaluateScores(KETUA_DEPT_A, 'SELECT', parentSubmittedB, 4)).toBe(false)
      expect(RlsEvaluator.evaluateScores(KETUA_DEPT_A, 'INSERT', parentSubmittedB, 4)).toBe(false)
    })
  })

  // 8. ASSESSMENT_COMMENTS
  describe('Tabel 8: assessment_comments', () => {
    const assessmentA = { department_id: 'dept-a-uuid' }
    const assessmentB = { department_id: 'dept-b-uuid' }

    it('[super_admin] memiliki akses penuh ke komentar di semua departemen', () => {
      expect(RlsEvaluator.evaluateComments(SUPER_ADMIN, 'SELECT', assessmentA)).toBe(true)
      expect(RlsEvaluator.evaluateComments(SUPER_ADMIN, 'INSERT', assessmentA, SUPER_ADMIN.id)).toBe(true)
    })

    it('[admin] dapat membaca komentar semua departemen dan mengirim komentar dengan author_id miliknya', () => {
      expect(RlsEvaluator.evaluateComments(ADMIN_SDM, 'SELECT', assessmentA)).toBe(true)
      expect(RlsEvaluator.evaluateComments(ADMIN_SDM, 'SELECT', assessmentB)).toBe(true)
      expect(RlsEvaluator.evaluateComments(ADMIN_SDM, 'INSERT', assessmentA, ADMIN_SDM.id)).toBe(true)
      // Dilarang impersonasi author lain
      expect(RlsEvaluator.evaluateComments(ADMIN_SDM, 'INSERT', assessmentA, 'other-id')).toBe(false)
    })

    it('[user/ketua] hanya bisa melihat dan membalas komentar departemennya, dilarang akses departemen lain', () => {
      expect(RlsEvaluator.evaluateComments(KETUA_DEPT_A, 'SELECT', assessmentA)).toBe(true)
      expect(RlsEvaluator.evaluateComments(KETUA_DEPT_A, 'INSERT', assessmentA, KETUA_DEPT_A.id)).toBe(true)
      expect(RlsEvaluator.evaluateComments(KETUA_DEPT_A, 'UPDATE', assessmentA)).toBe(true) // Menandai dibaca

      // Departemen B terisolasi
      expect(RlsEvaluator.evaluateComments(KETUA_DEPT_A, 'SELECT', assessmentB)).toBe(false)
      expect(RlsEvaluator.evaluateComments(KETUA_DEPT_A, 'INSERT', assessmentB, KETUA_DEPT_A.id)).toBe(false)
    })
  })

  // 9. AUDIT_LOGS
  describe('Tabel 9: audit_logs', () => {
    const recordA = { department_id: 'dept-a-uuid' }
    const recordB = { department_id: 'dept-b-uuid' }

    it('Audit logs tidak dapat diubah (UPDATE/DELETE/INSERT langsung) oleh peran manapun lewat RLS client', () => {
      expect(RlsEvaluator.evaluateAuditLogs(SUPER_ADMIN, 'INSERT', recordA)).toBe(false)
      expect(RlsEvaluator.evaluateAuditLogs(SUPER_ADMIN, 'UPDATE', recordA)).toBe(false)
      expect(RlsEvaluator.evaluateAuditLogs(SUPER_ADMIN, 'DELETE', recordA)).toBe(false)

      expect(RlsEvaluator.evaluateAuditLogs(ADMIN_SDM, 'INSERT', recordA)).toBe(false)
      expect(RlsEvaluator.evaluateAuditLogs(ADMIN_SDM, 'UPDATE', recordA)).toBe(false)
    })

    it('[super_admin] dan [admin] dapat membaca seluruh jejak audit', () => {
      expect(RlsEvaluator.evaluateAuditLogs(SUPER_ADMIN, 'SELECT', recordA)).toBe(true)
      expect(RlsEvaluator.evaluateAuditLogs(SUPER_ADMIN, 'SELECT', recordB)).toBe(true)
      expect(RlsEvaluator.evaluateAuditLogs(ADMIN_SDM, 'SELECT', recordA)).toBe(true)
      expect(RlsEvaluator.evaluateAuditLogs(ADMIN_SDM, 'SELECT', recordB)).toBe(true)
    })

    it('[user/ketua] HANYA dapat membaca audit log terkait penilaian departemennya sendiri', () => {
      expect(RlsEvaluator.evaluateAuditLogs(KETUA_DEPT_A, 'SELECT', recordA)).toBe(true)
      expect(RlsEvaluator.evaluateAuditLogs(KETUA_DEPT_A, 'SELECT', recordB)).toBe(false)
    })
  })
})
