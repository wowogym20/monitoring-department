-- ==============================================================================
-- MIGRASI: TABEL SYSTEM_SETTINGS & ROW LEVEL SECURITY (KHUSUS SUPER ADMIN)
-- ==============================================================================

-- 1. Buat tabel penyimpanan pengaturan sistem berbasis key-value JSONB
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    deskripsi TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policy RLS:
-- Seluruh pengguna terautentikasi (super_admin, admin, user) diizinkan membaca konfigurasi umum (branding, threshold, pengumuman, maintenance)
CREATE POLICY "authenticated_select_system_settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- HANYA role super_admin yang berhak menambah atau memodifikasi pengaturan sistem
CREATE POLICY "super_admin_insert_system_settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (
    public.current_role() = 'super_admin'
);

CREATE POLICY "super_admin_update_system_settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (
    public.current_role() = 'super_admin'
)
WITH CHECK (
    public.current_role() = 'super_admin'
);

CREATE POLICY "super_admin_delete_system_settings"
ON public.system_settings
FOR DELETE
TO authenticated
USING (
    public.current_role() = 'super_admin'
);

-- 4. Inisialisasi Data Default Pengaturan Sistem
INSERT INTO public.system_settings (key, value, deskripsi)
VALUES 
(
    'general',
    '{
        "appName": "Monitoring Departemen",
        "appTagline": "Sistem Penilaian Kinerja",
        "institutionName": "Pondok Modern Tazakka",
        "appDescription": "Platform evaluasi dan monitoring kinerja berkala seluruh departemen dan asatidz di lingkungan Pondok Modern Tazakka.",
        "footerText": "© 2026 Pondok Modern Tazakka. All rights reserved.",
        "logoUrl": "/Logo.jpeg",
        "supportEmail": "sdm@tazakka.or.id",
        "supportPhone": "+62 812-3456-7890",
        "supportHours": "Senin - Jumat, 08:00 - 16:00 WIB",
        "officeAddress": "Jl. Bandar-Batang km. 9, Desa Sidayu, Kec. Bandar, Batang, Jawa Tengah"
    }'::jsonb,
    'Identitas aplikasi, branding, dan informasi kontak bantuan'
),
(
    'content',
    '{
        "announcement": {
            "isActive": false,
            "type": "info",
            "title": "Pengumuman Penting",
            "message": "Pastikan seluruh evaluasi kinerja departemen diselesaikan sebelum batas waktu periode berakhir.",
            "targetRoles": ["all"]
        },
        "leaderMessage": {
            "leaderName": "KH. Anang Rikza Masyhadi, M.A.",
            "leaderTitle": "Pimpinan Pondok Modern Tazakka",
            "messageText": "Kinerja adalah cerminan dedikasi dan keikhlasan dalam berkhidmah. Lakukan evaluasi secara objektif, amanah, dan membangun demi kemajuan pondok."
        },
        "externalLinks": {
            "manualUrl": ""
        }
    }'::jsonb,
    'Konten dinamis, pengumuman dashboard, dan amanat pimpinan'
),
(
    'scoring',
    '{
        "minScore": 1.0,
        "maxScore": 5.0,
        "thresholds": {
            "sangatBaik": 4.50,
            "baik": 3.50,
            "cukup": 2.50,
            "kurang": 1.50
        },
        "requireCommentBelowThreshold": true,
        "requireCommentThreshold": 2.50,
        "allowEvaluatorEditDraft": true,
        "autoLockOnClose": true,
        "allowBulkApproval": true
    }'::jsonb,
    'Kebijakan rubrik penilaian kinerja, ambang predikat nilai, dan validasi komentar'
),
(
    'system',
    '{
        "maintenance": {
            "isActive": false,
            "message": "Sistem sedang dalam proses pemeliharaan berkala. Mode baca-saja aktif sementara.",
            "allowSuperAdminBypass": true
        },
        "trash": {
            "retentionDays": 30,
            "autoPurgeEnabled": true
        }
    }'::jsonb,
    'Status mode pemeliharaan dan kebijakan retensi tempat sampah'
),
(
    'notifications',
    '{
        "remindH7": true,
        "remindH3": true,
        "remindH1": true,
        "commentBadge": true
    }'::jsonb,
    'Preferensi pengingat penutupan periode dan alert komentar'
)
ON CONFLICT (key) DO NOTHING;
