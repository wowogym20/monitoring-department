-- ==============================================================================
-- Migration: Avatars Storage Bucket & Policies
-- Description: Membuat bucket privat 'avatars' untuk foto profil dan RLS policy
--              khusus pemilik file.
-- ==============================================================================

-- 1. Buat bucket privat 'avatars' jika belum ada
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  2097152, -- Batas ukuran 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Kebijakan RLS untuk storage.objects
-- Catatan: Pengguna hanya dapat mengakses, mengunggah, dan menghapus foto profil di folder miliknya: avatars/{user_id}/*

DROP POLICY IF EXISTS "Pemilik dapat melihat foto profil sendiri" ON storage.objects;
CREATE POLICY "Pemilik dapat melihat foto profil sendiri"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.current_role() IN ('super_admin', 'admin')
  )
);

DROP POLICY IF EXISTS "Pemilik dapat mengunggah foto profil sendiri" ON storage.objects;
CREATE POLICY "Pemilik dapat mengunggah foto profil sendiri"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Pemilik dapat memperbarui foto profil sendiri" ON storage.objects;
CREATE POLICY "Pemilik dapat memperbarui foto profil sendiri"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Pemilik dapat menghapus foto profil sendiri" ON storage.objects;
CREATE POLICY "Pemilik dapat menghapus foto profil sendiri"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);
