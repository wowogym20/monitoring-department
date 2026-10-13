-- ==============================================================================
-- Seed Data: Monitoring Departemen
-- 14 Departemen (PRD Bagian 5), 7 Aspek Penilaian (PRD Bagian 8), 1 Periode Open
-- ==============================================================================

-- 1. DEPARTEMEN RESMI (14 DEPARTEMEN)
INSERT INTO public.departments (nama, kode, is_active) VALUES
    ('Dept. Pendidikan dan Pengajaran', 'PEND-AJAR', TRUE),
    ('Dept. Penelitian dan Pengembangan Akademik (Majelis Guru)', 'LITBANG-GURU', TRUE),
    ('Dept. Pengasuhan Santri', 'ASUH-SANTRI', TRUE),
    ('Dept. Lazis Tazakka', 'LAZIS', TRUE),
    ('Dept. Wakaf Tazakka', 'WAKAF', TRUE),
    ('Dept. Pengembangan Amal Usaha', 'AMAL-USAHA', TRUE),
    ('Dept. Pengembangan TI', 'TI', TRUE),
    ('Dept. SDM', 'SDM', TRUE),
    ('Dept. Kesekretariatan', 'SEKRETARIAT', TRUE),
    ('Dept. Keuangan', 'KEUANGAN', TRUE),
    ('Dept. Kehumasan', 'HUMAS', TRUE),
    ('Dept. Kerjasama Kelembagaan dan Luar Negeri', 'KERJASAMA-LN', TRUE),
    ('Dept. Pengembangan Perguruan Tinggi', 'PT', TRUE),
    ('Dept. Pekerjaan Umum', 'PU', TRUE)
ON CONFLICT (kode) DO UPDATE SET
    nama = EXCLUDED.nama,
    is_active = EXCLUDED.is_active;

-- 2. ASPEK PENILAIAN RESMI (7 ASPEK SKALA LIKERT)
INSERT INTO public.assessment_aspects (nama, deskripsi, urutan, is_active) VALUES
    ('Kinerja Kerja', 'Kualitas, ketepatan, dan penyelesaian tugas', 1, TRUE),
    ('Kerajinan', 'Ketekunan, kehadiran, dan ketepatan waktu', 2, TRUE),
    ('Ibadah', 'Kedisiplinan dan kesungguhan menjalankan ibadah', 3, TRUE),
    ('Kebersihan', 'Kebersihan diri dan lingkungan kerja', 4, TRUE),
    ('Kerja Sama Tim', 'Kolaborasi dan komunikasi dengan rekan', 5, TRUE),
    ('Inisiatif & Tanggung Jawab', 'Proaktif dan menuntaskan amanah', 6, TRUE),
    ('Akhlak & Adab', 'Sikap dan etika dalam bekerja', 7, TRUE)
ON CONFLICT DO NOTHING;

-- 3. PERIODE PENILAIAN CONTOH (STATUS OPEN)
INSERT INTO public.assessment_periods (nama, tanggal_mulai, tanggal_akhir, status) VALUES
    ('Periode Penilaian Semester Ganjil 2026/2027', '2026-10-01', '2026-11-30', 'open')
ON CONFLICT DO NOTHING;
