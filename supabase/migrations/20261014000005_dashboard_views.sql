-- ==============================================================================
-- Migration: 20261014000005_dashboard_views.sql
-- Description: Database views dan RPC functions untuk ringkasan metrik dashboard
--              sesuai PRD Bagian 7 (FR-10), 8 (kategori skor), 9, dan 10.1
-- ==============================================================================

-- 1. View Ringkasan Departemen Per Periode (security_invoker = true agar menghormati RLS)
CREATE OR REPLACE VIEW public.v_dashboard_department_summary
WITH (security_invoker = true)
AS
SELECT 
    d.id AS department_id,
    d.nama AS department_nama,
    d.kode AS department_kode,
    d.ketua_id,
    d.is_active AS department_is_active,
    p.id AS period_id,
    p.nama AS period_nama,
    p.status AS period_status,
    p.tanggal_akhir AS period_tanggal_akhir,
    COUNT(DISTINCT m.id) FILTER (WHERE m.deleted_at IS NULL AND m.is_active = TRUE) AS total_members,
    COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND a.status <> 'draft') AS assessed_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND a.status = 'draft') AS draft_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND a.status = 'submitted') AS submitted_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND a.status = 'revision_requested') AS revision_requested_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND a.status = 'approved') AS approved_count,
    ROUND(AVG(a.skor_rata) FILTER (WHERE a.deleted_at IS NULL AND a.status <> 'draft'), 2) AS average_score,
    CASE 
        WHEN COUNT(DISTINCT m.id) FILTER (WHERE m.deleted_at IS NULL AND m.is_active = TRUE) > 0 
        THEN ROUND(
            (COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND a.status <> 'draft')::NUMERIC / 
             COUNT(DISTINCT m.id) FILTER (WHERE m.deleted_at IS NULL AND m.is_active = TRUE)::NUMERIC) * 100, 
            1
        )
        ELSE 0
    END AS completion_percentage,
    CASE 
        WHEN COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND a.status <> 'draft') < 
             COUNT(DISTINCT m.id) FILTER (WHERE m.deleted_at IS NULL AND m.is_active = TRUE) 
        THEN TRUE 
        ELSE FALSE 
    END AS is_incomplete
FROM public.departments d
CROSS JOIN public.assessment_periods p
LEFT JOIN public.members m 
    ON m.department_id = d.id 
    AND m.deleted_at IS NULL 
    AND m.is_active = TRUE
LEFT JOIN public.assessments a 
    ON a.department_id = d.id 
    AND a.period_id = p.id 
    AND a.deleted_at IS NULL
WHERE d.is_active = TRUE
GROUP BY d.id, d.nama, d.kode, d.ketua_id, d.is_active, p.id, p.nama, p.status, p.tanggal_akhir;

-- 2. View Distribusi Kategori Skor (PRD Bagian 8)
CREATE OR REPLACE VIEW public.v_dashboard_score_distribution
WITH (security_invoker = true)
AS
SELECT 
    a.period_id,
    a.department_id,
    COUNT(*) FILTER (WHERE a.skor_rata >= 4.50) AS sangat_baik_count,
    COUNT(*) FILTER (WHERE a.skor_rata >= 3.50 AND a.skor_rata < 4.50) AS baik_count,
    COUNT(*) FILTER (WHERE a.skor_rata >= 2.50 AND a.skor_rata < 3.50) AS cukup_count,
    COUNT(*) FILTER (WHERE a.skor_rata >= 1.50 AND a.skor_rata < 2.50) AS kurang_count,
    COUNT(*) FILTER (WHERE a.skor_rata >= 1.00 AND a.skor_rata < 1.50) AS sangat_kurang_count,
    COUNT(*) AS total_assessed
FROM public.assessments a
WHERE a.deleted_at IS NULL 
  AND a.status <> 'draft' 
  AND a.skor_rata IS NOT NULL
GROUP BY a.period_id, a.department_id;

-- 3. RPC Function: get_dashboard_summary
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(p_period_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_departments', COUNT(DISTINCT department_id),
        'total_members', COALESCE(SUM(total_members), 0),
        'total_assessed', COALESCE(SUM(assessed_count), 0),
        'overall_average_score', ROUND(AVG(average_score) FILTER (WHERE average_score IS NOT NULL), 2),
        'completion_percentage', 
            CASE 
                WHEN COALESCE(SUM(total_members), 0) > 0 
                THEN ROUND((COALESCE(SUM(assessed_count), 0)::NUMERIC / SUM(total_members)::NUMERIC) * 100, 1)
                ELSE 0 
            END
    )
    INTO v_result
    FROM public.v_dashboard_department_summary
    WHERE period_id = p_period_id;

    RETURN v_result;
END;
$$;
