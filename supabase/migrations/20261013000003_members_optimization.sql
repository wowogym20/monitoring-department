-- ==============================================================================
-- Migration: Members Optimization, NIP Uniqueness, and Indexes
-- Description: Indeks pencarian nama, filter soft delete, dan constraint unik
--              NIP per departemen untuk anggota aktif (deleted_at IS NULL)
-- ==============================================================================

-- 1. Partial Unique Index untuk NIP per departemen (hanya berlaku jika NIP terisi dan belum soft-deleted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_dept_nip 
ON public.members(department_id, nip) 
WHERE deleted_at IS NULL AND nip IS NOT NULL AND nip <> '';

-- 2. Indeks untuk pencarian nama anggota (mendukung ILIKE / prefix scan)
CREATE INDEX IF NOT EXISTS idx_members_nama 
ON public.members(nama);

-- 3. Indeks untuk filter soft-delete dan gabungan departemen
CREATE INDEX IF NOT EXISTS idx_members_deleted_at 
ON public.members(deleted_at);

CREATE INDEX IF NOT EXISTS idx_members_dept_deleted 
ON public.members(department_id, deleted_at);
