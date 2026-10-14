-- ==============================================================================
-- Migration: Allow Soft-Delete of Assessments in Closed Periods
-- Description: Memperbarui trigger fn_validate_assessment_rules agar mengizinkan
--              penandaan soft-delete (deleted_at IS NOT NULL) pada lembar penilaian
--              meskipun periode penilaian sudah berstatus closed.
--              Hal ini mendukung cascade delete saat data anggota dihapus.
-- ==============================================================================

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
    -- 0. Jika operasi adalah soft delete (penandaan deleted_at), izinkan tanpa memvalidasi periode tutup
    IF TG_OP = 'UPDATE' AND (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
        RETURN NEW;
    END IF;

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
