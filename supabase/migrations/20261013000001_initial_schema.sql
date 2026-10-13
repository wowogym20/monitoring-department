-- ==============================================================================
-- Migration: Initial Schema for Monitoring Departemen
-- Description: Tabel, Enum, Constraint, Helper Functions (SECURITY DEFINER), 
--              RLS Policies, dan Triggers (skor rata-rata, audit log, revert status)
-- ==============================================================================

-- 1. ENUMS
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'user');
CREATE TYPE public.assessment_status AS ENUM ('draft', 'submitted', 'revision_requested', 'approved');
CREATE TYPE public.period_status AS ENUM ('open', 'closed');

-- 2. TABEL: PROFILES
-- Menyimpan data profil akun pengguna yang terhubung ke auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    no_hp TEXT,
    foto_url TEXT,
    role public.user_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABEL: DEPARTMENTS
-- Menyimpan 14 departemen dan penetapan ketua departemen (1 ketua = 1 departemen)
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    kode TEXT NOT NULL UNIQUE,
    ketua_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL: MEMBERS
-- Menyimpan anggota departemen yang dinilai (anggota tidak memiliki akun login)
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    nama TEXT NOT NULL,
    nip TEXT,
    jabatan TEXT NOT NULL,
    no_hp TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL: ASSESSMENT_ASPECTS
-- Menyimpan 7 aspek penilaian resmi beserta deskripsi rubrik
CREATE TABLE public.assessment_aspects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    deskripsi TEXT,
    urutan INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABEL: ASSESSMENT_PERIODS
-- Menyimpan periode penilaian (bulanan/semesteran) dan status buka/tutup
CREATE TABLE public.assessment_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_akhir DATE NOT NULL,
    status public.period_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABEL: ASSESSMENTS
-- Menyimpan header lembar penilaian anggota per periode
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES public.assessment_periods(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status public.assessment_status NOT NULL DEFAULT 'draft',
    catatan TEXT,
    skor_rata NUMERIC(3, 2),
    submitted_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_assessments_period_member UNIQUE (period_id, member_id)
);

-- 8. TABEL: ASSESSMENT_SCORES
-- Menyimpan nilai aspek 1-5 (skala Likert) untuk tiap penilaian
CREATE TABLE public.assessment_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    aspect_id UUID NOT NULL REFERENCES public.assessment_aspects(id) ON DELETE RESTRICT,
    nilai INTEGER NOT NULL CHECK (nilai >= 1 AND nilai <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scores_assessment_aspect UNIQUE (assessment_id, aspect_id)
);

-- 9. TABEL: ASSESSMENT_COMMENTS
-- Komentar SDM untuk ketua dan balasan dari ketua departemen
CREATE TABLE public.assessment_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.assessment_comments(id) ON DELETE CASCADE,
    isi TEXT NOT NULL,
    dibaca_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABEL: AUDIT_LOGS
-- Riwayat jejak audit (siapa, aksi, tabel, data lama & data baru, waktu)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aktor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    aksi TEXT NOT NULL,
    tabel TEXT NOT NULL,
    record_id UUID,
    data_lama JSONB,
    data_baru JSONB,
    waktu TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEKS PERFORMA FILTER & PENCARIAN
-- ==============================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_departments_ketua ON public.departments(ketua_id);
CREATE INDEX idx_members_dept_active ON public.members(department_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_period_dept_status ON public.assessments(period_id, department_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_member ON public.assessments(member_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_evaluator ON public.assessments(evaluator_id);
CREATE INDEX idx_scores_assessment ON public.assessment_scores(assessment_id);
CREATE INDEX idx_comments_assessment ON public.assessment_comments(assessment_id);
CREATE INDEX idx_audit_logs_record ON public.audit_logs(tabel, record_id);
CREATE INDEX idx_audit_logs_waktu ON public.audit_logs(waktu DESC);

-- ==============================================================================
-- FUNGSI HELPER (SECURITY DEFINER)
-- ==============================================================================

-- 1. Mengambil role akun pengguna saat ini dari tabel profiles (bukan metadata JWT)
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = TRUE;
$$;

-- 2. Mengambil department_id milik ketua yang sedang login
CREATE OR REPLACE FUNCTION public.current_department_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT id FROM public.departments WHERE ketua_id = auth.uid() AND is_active = TRUE;
$$;

-- ==============================================================================
-- TRIGGER & FUNGSI OTOMATIS
-- ==============================================================================

-- A. Trigger pembaruan timestamp updated_at otomatis
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_assessment_aspects_updated_at
BEFORE UPDATE ON public.assessment_aspects
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_assessment_periods_updated_at
BEFORE UPDATE ON public.assessment_periods
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_assessments_updated_at
BEFORE UPDATE ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_assessment_scores_updated_at
BEFORE UPDATE ON public.assessment_scores
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_assessment_comments_updated_at
BEFORE UPDATE ON public.assessment_comments
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- B. Perhitungan Otomatis skor_rata di assessments (Rata-rata aspek aktif, 2 desimal)
CREATE OR REPLACE FUNCTION public.fn_calculate_average_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_assessment_id UUID;
    avg_score NUMERIC(3, 2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_assessment_id := OLD.assessment_id;
    ELSE
        target_assessment_id := NEW.assessment_id;
    END IF;

    -- Hitung rata-rata nilai untuk aspek yang aktif
    SELECT ROUND(AVG(s.nilai)::numeric, 2)
    INTO avg_score
    FROM public.assessment_scores s
    JOIN public.assessment_aspects a ON a.id = s.aspect_id
    WHERE s.assessment_id = target_assessment_id
      AND a.is_active = TRUE;

    UPDATE public.assessments
    SET skor_rata = avg_score,
        updated_at = NOW()
    WHERE id = target_assessment_id;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_calculate_average_score
AFTER INSERT OR UPDATE OR DELETE ON public.assessment_scores
FOR EACH ROW EXECUTE FUNCTION public.fn_calculate_average_score();

-- C. Validasi Penilaian: Periode Terbuka & Department Cocok dengan Anggota
CREATE OR REPLACE FUNCTION public.fn_validate_assessment_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    member_dept UUID;
    period_stat public.period_status;
    caller_role public.user_role;
BEGIN
    caller_role := public.current_role();

    -- 1. Validasi department_id harus cocok dengan anggota yang dinilai
    SELECT department_id INTO member_dept
    FROM public.members
    WHERE id = NEW.member_id;

    IF member_dept IS NULL OR member_dept <> NEW.department_id THEN
        RAISE EXCEPTION 'Departemen penilaian tidak cocok dengan departemen anggota yang dinilai.';
    END IF;

    -- 2. Validasi status periode (hanya boleh dibuat/diubah pada periode open kecuali super_admin)
    SELECT status INTO period_stat
    FROM public.assessment_periods
    WHERE id = NEW.period_id;

    IF caller_role <> 'super_admin' AND period_stat <> 'open' THEN
        RAISE EXCEPTION 'Penilaian hanya dapat dibuat atau diubah pada periode yang berstatus open.';
    END IF;

    -- 3. Aturan Pasca-Approval: Jika diubah oleh ketua dari status approved, revert ke submitted
    IF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND caller_role = 'user' THEN
        NEW.status := 'submitted';
    END IF;

    -- 4. Rekam submitted_at saat status beralih ke submitted
    IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status <> 'submitted') THEN
        NEW.submitted_at := NOW();
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_assessment_rules
BEFORE INSERT OR UPDATE ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_assessment_rules();

-- D. Trigger Audit Logs Otomatis untuk Assessments dan Assessment Scores
CREATE OR REPLACE FUNCTION public.fn_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    rec_id UUID;
    old_data JSONB := NULL;
    new_data JSONB := NULL;
BEGIN
    IF TG_OP = 'INSERT' THEN
        rec_id := NEW.id;
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        rec_id := NEW.id;
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        rec_id := OLD.id;
        old_data := to_jsonb(OLD);
    END IF;

    INSERT INTO public.audit_logs (
        aktor_id,
        aksi,
        tabel,
        record_id,
        data_lama,
        data_baru,
        waktu
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        rec_id,
        old_data,
        new_data,
        NOW()
    );

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_assessments
AFTER INSERT OR UPDATE OR DELETE ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_mutation();

CREATE TRIGGER trg_audit_assessment_scores
AFTER INSERT OR UPDATE OR DELETE ON public.assessment_scores
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_mutation();

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_super_admin_all"
ON public.profiles FOR ALL
TO authenticated
USING (public.current_role() = 'super_admin')
WITH CHECK (public.current_role() = 'super_admin');

CREATE POLICY "profiles_admin_select"
ON public.profiles FOR SELECT
TO authenticated
USING (public.current_role() = 'admin');

CREATE POLICY "profiles_user_select_self"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_self_update"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Mencegah pergantian role sendiri
);

-- 2. DEPARTMENTS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_super_admin_all"
ON public.departments FOR ALL
TO authenticated
USING (public.current_role() = 'super_admin')
WITH CHECK (public.current_role() = 'super_admin');

CREATE POLICY "departments_admin_select"
ON public.departments FOR SELECT
TO authenticated
USING (public.current_role() = 'admin');

CREATE POLICY "departments_user_select_own"
ON public.departments FOR SELECT
TO authenticated
USING (ketua_id = auth.uid());

-- 3. MEMBERS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_super_admin_all"
ON public.members FOR ALL
TO authenticated
USING (public.current_role() = 'super_admin')
WITH CHECK (public.current_role() = 'super_admin');

CREATE POLICY "members_admin_select"
ON public.members FOR SELECT
TO authenticated
USING (public.current_role() = 'admin');

CREATE POLICY "members_user_crud_own_dept"
ON public.members FOR ALL
TO authenticated
USING (department_id = public.current_department_id())
WITH CHECK (department_id = public.current_department_id());

-- 4. ASSESSMENT_ASPECTS
ALTER TABLE public.assessment_aspects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aspects_super_admin_all"
ON public.assessment_aspects FOR ALL
TO authenticated
USING (public.current_role() = 'super_admin')
WITH CHECK (public.current_role() = 'super_admin');

CREATE POLICY "aspects_read_authenticated"
ON public.assessment_aspects FOR SELECT
TO authenticated
USING (TRUE);

-- 5. ASSESSMENT_PERIODS
ALTER TABLE public.assessment_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "periods_super_admin_all"
ON public.assessment_periods FOR ALL
TO authenticated
USING (public.current_role() = 'super_admin')
WITH CHECK (public.current_role() = 'super_admin');

CREATE POLICY "periods_admin_all"
ON public.assessment_periods FOR ALL
TO authenticated
USING (public.current_role() = 'admin')
WITH CHECK (public.current_role() = 'admin');

CREATE POLICY "periods_user_select"
ON public.assessment_periods FOR SELECT
TO authenticated
USING (TRUE);

-- 6. ASSESSMENTS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessments_super_admin_all"
ON public.assessments FOR ALL
TO authenticated
USING (public.current_role() = 'super_admin')
WITH CHECK (public.current_role() = 'super_admin');

-- Admin SDM: membaca penilaian non-draft dan mengubah status (approval/revisi)
CREATE POLICY "assessments_admin_select_nondraft"
ON public.assessments FOR SELECT
TO authenticated
USING (
    public.current_role() = 'admin' 
    AND status <> 'draft' 
    AND deleted_at IS NULL
);

CREATE POLICY "assessments_admin_update_status"
ON public.assessments FOR UPDATE
TO authenticated
USING (public.current_role() = 'admin')
WITH CHECK (public.current_role() = 'admin');

-- Ketua Departemen: CRUD penilaian hanya untuk departemen miliknya
CREATE POLICY "assessments_user_crud_own_dept"
ON public.assessments FOR ALL
TO authenticated
USING (department_id = public.current_department_id())
WITH CHECK (department_id = public.current_department_id());

-- 7. ASSESSMENT_SCORES
ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_super_admin_all"
ON public.assessment_scores FOR ALL
TO authenticated
USING (public.current_role() = 'super_admin')
WITH CHECK (public.current_role() = 'super_admin');

CREATE POLICY "scores_admin_select_nondraft"
ON public.assessment_scores FOR SELECT
TO authenticated
USING (
    public.current_role() = 'admin'
    AND EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_scores.assessment_id
          AND a.status <> 'draft'
          AND a.deleted_at IS NULL
    )
);

CREATE POLICY "scores_user_crud_own_dept"
ON public.assessment_scores FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_scores.assessment_id
          AND a.department_id = public.current_department_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_scores.assessment_id
          AND a.department_id = public.current_department_id()
    )
);

-- 8. ASSESSMENT_COMMENTS
ALTER TABLE public.assessment_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_super_admin_all"
ON public.assessment_comments FOR ALL
TO authenticated
USING (public.current_role() = 'super_admin')
WITH CHECK (public.current_role() = 'super_admin');

CREATE POLICY "comments_admin_select_insert"
ON public.assessment_comments FOR ALL
TO authenticated
USING (public.current_role() = 'admin')
WITH CHECK (public.current_role() = 'admin' AND author_id = auth.uid());

CREATE POLICY "comments_user_select_insert_own_dept"
ON public.assessment_comments FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_comments.assessment_id
          AND a.department_id = public.current_department_id()
    )
)
WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_comments.assessment_id
          AND a.department_id = public.current_department_id()
    )
);

-- 9. AUDIT_LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_read_leaders"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.current_role() IN ('super_admin', 'admin'));
