import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('SQL Migration & Seed Verification', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../supabase/migrations/20261013000001_initial_schema.sql'
  )
  const seedPath = path.resolve(__dirname, '../supabase/seed.sql')

  const migrationSql = fs.readFileSync(migrationPath, 'utf-8')
  const seedSql = fs.readFileSync(seedPath, 'utf-8')

  it('harus memuat seluruh tabel yang disyaratkan PRD', () => {
    const requiredTables = [
      'public.profiles',
      'public.departments',
      'public.members',
      'public.assessment_aspects',
      'public.assessment_periods',
      'public.assessments',
      'public.assessment_scores',
      'public.assessment_comments',
      'public.audit_logs',
    ]

    for (const table of requiredTables) {
      expect(migrationSql).toContain(`CREATE TABLE ${table}`)
    }
  })

  it('harus memuat 3 enum types (user_role, assessment_status, period_status)', () => {
    expect(migrationSql).toContain("CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'user')")
    expect(migrationSql).toContain("CREATE TYPE public.assessment_status AS ENUM ('draft', 'submitted', 'revision_requested', 'approved')")
    expect(migrationSql).toContain("CREATE TYPE public.period_status AS ENUM ('open', 'closed')")
  })

  it('harus mengaktifkan Row-Level Security (RLS) di ke-9 tabel', () => {
    const tables = [
      'public.profiles',
      'public.departments',
      'public.members',
      'public.assessment_aspects',
      'public.assessment_periods',
      'public.assessments',
      'public.assessment_scores',
      'public.assessment_comments',
      'public.audit_logs',
    ]

    for (const table of tables) {
      expect(migrationSql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`)
    }
  })

  it('harus memiliki fungsi SECURITY DEFINER dengan search_path terkunci', () => {
    expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION public.current_role()')
    expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION public.current_department_id()')
    expect(migrationSql).toContain('SET search_path = public, pg_temp')
  })

  it('harus memiliki constraint CHECK nilai BETWEEN 1 AND 5 dan UNIQUE', () => {
    expect(migrationSql).toContain('CHECK (nilai >= 1 AND nilai <= 5)')
    expect(migrationSql).toContain('CONSTRAINT uq_assessments_period_member UNIQUE (period_id, member_id)')
    expect(migrationSql).toContain('CONSTRAINT uq_scores_assessment_aspect UNIQUE (assessment_id, aspect_id)')
    expect(migrationSql).toContain('ketua_id UUID UNIQUE REFERENCES public.profiles(id)')
  })

  it('harus memuat trigger skor_rata, audit logs, dan auto-revert status approved ke submitted', () => {
    expect(migrationSql).toContain('CREATE TRIGGER trg_calculate_average_score')
    expect(migrationSql).toContain('CREATE TRIGGER trg_validate_assessment_rules')
    expect(migrationSql).toContain('CREATE TRIGGER trg_audit_assessments')
    expect(migrationSql).toContain('CREATE TRIGGER trg_audit_assessment_scores')
    expect(migrationSql).toContain("OLD.status = 'approved' AND caller_role = 'user'")
    expect(migrationSql).toContain("NEW.status := 'submitted'")
  })

  it('seed.sql harus memuat 14 departemen resmi dan 7 aspek penilaian', () => {
    const departments = [
      'PEND-AJAR',
      'LITBANG-GURU',
      'ASUH-SANTRI',
      'LAZIS',
      'WAKAF',
      'AMAL-USAHA',
      'TI',
      'SDM',
      'SEKRETARIAT',
      'KEUANGAN',
      'HUMAS',
      'KERJASAMA-LN',
      'PT',
      'PU',
    ]

    for (const dept of departments) {
      expect(seedSql).toContain(`'${dept}'`)
    }

    const aspects = [
      'Kinerja Kerja',
      'Kerajinan',
      'Ibadah',
      'Kebersihan',
      'Kerja Sama Tim',
      'Inisiatif & Tanggung Jawab',
      'Akhlak & Adab',
    ]

    for (const aspect of aspects) {
      expect(seedSql).toContain(`'${aspect}'`)
    }

    expect(seedSql).toContain("'open'")
  })
})
