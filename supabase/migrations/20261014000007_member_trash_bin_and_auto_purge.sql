-- ==============================================================================
-- MIGRASI: TEMPAT SAMPAH (TRASH BIN) ANGGOTA & PENGHAPUSAN PERMANEN OTOMATIS 7 HARI
-- ==============================================================================

-- 1. Indeks parsial untuk mempercepat pencarian data tempat sampah dan auto-purge
CREATE INDEX IF NOT EXISTS idx_members_trash_purge 
ON public.members(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- 2. Fungsi SQL: Pembersihan Otomatis Data Tempat Sampah Kedaluwarsa (> 7 Hari)
-- Menghapus seluruh penilaian terkait kaskade dan baris data anggota secara fisik
CREATE OR REPLACE FUNCTION public.purge_expired_trash_members()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    purged_count INTEGER := 0;
    target_member_ids UUID[];
BEGIN
    -- Ambil seluruh ID anggota yang telah dihapus lebih dari 7 hari lalu
    SELECT array_agg(id) INTO target_member_ids
    FROM public.members
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < NOW() - INTERVAL '7 days';

    IF target_member_ids IS NOT NULL AND array_length(target_member_ids, 1) > 0 THEN
        -- 1. Hapus lembar penilaian terkait anggota tersebut (akan kaskade ke scores dan comments)
        DELETE FROM public.assessments
        WHERE member_id = ANY(target_member_ids);

        -- 2. Hapus baris anggota secara permanen dari tabel members
        DELETE FROM public.members
        WHERE id = ANY(target_member_ids);

        GET DIAGNOSTICS purged_count = ROW_COUNT;
    END IF;

    RETURN purged_count;
END;
$$;

-- 3. Beri hak eksekusi ke role authenticated
GRANT EXECUTE ON FUNCTION public.purge_expired_trash_members() TO authenticated;
