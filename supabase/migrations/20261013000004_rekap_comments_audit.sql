-- ==============================================================================
-- Migration: 20261013000004_rekap_comments_audit.sql
-- Description: Kebijakan RLS untuk riwayat audit log ketua dan update dibaca_at
-- ==============================================================================

-- 1. Izin SELECT audit_logs untuk ketua departemen (hanya penilaian departemennya)
DROP POLICY IF EXISTS "audit_logs_user_select_own_dept" ON public.audit_logs;

CREATE POLICY "audit_logs_user_select_own_dept"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    public.current_role() = 'user'
    AND (
        (tabel = 'assessments' AND EXISTS (
            SELECT 1 FROM public.assessments a 
            WHERE a.id = audit_logs.record_id 
              AND a.department_id = public.current_department_id()
        ))
        OR
        (tabel = 'assessment_scores' AND (
            EXISTS (
                SELECT 1 FROM public.assessments a 
                WHERE a.id = (audit_logs.data_baru->>'assessment_id')::uuid 
                  AND a.department_id = public.current_department_id()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.assessments a 
                WHERE a.id = (audit_logs.data_lama->>'assessment_id')::uuid 
                  AND a.department_id = public.current_department_id()
            )
        ))
    )
);

-- 2. Perbaikan kebijakan RLS assessment_comments untuk Ketua
-- Memisahkan SELECT, INSERT, dan UPDATE agar ketua dapat menandai komentar sebagai dibaca (dibaca_at)
DROP POLICY IF EXISTS "comments_user_select_insert_own_dept" ON public.assessment_comments;
DROP POLICY IF EXISTS "comments_user_select_own_dept" ON public.assessment_comments;
DROP POLICY IF EXISTS "comments_user_insert_own_dept" ON public.assessment_comments;
DROP POLICY IF EXISTS "comments_user_update_read_own_dept" ON public.assessment_comments;

CREATE POLICY "comments_user_select_own_dept"
ON public.assessment_comments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_comments.assessment_id
          AND a.department_id = public.current_department_id()
    )
);

CREATE POLICY "comments_user_insert_own_dept"
ON public.assessment_comments FOR INSERT
TO authenticated
WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_comments.assessment_id
          AND a.department_id = public.current_department_id()
    )
);

CREATE POLICY "comments_user_update_read_own_dept"
ON public.assessment_comments FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_comments.assessment_id
          AND a.department_id = public.current_department_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_comments.assessment_id
          AND a.department_id = public.current_department_id()
    )
);
