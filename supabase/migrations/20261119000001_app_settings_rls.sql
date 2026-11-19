-- =====================================================================
-- POPCUT.ID MIGRATION: 20261119000001_app_settings_rls.sql
-- Description: Row Level Security (RLS) policies for app_settings table
-- =====================================================================

-- 1. Aktifkan RLS pada tabel app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 2. Berikan izin BACA untuk peran anon (Kiosk Booth) dan authenticated
DROP POLICY IF EXISTS "Allow public read access for app_settings" ON public.app_settings;
CREATE POLICY "Allow public read access for app_settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- 3. Batasi izin TULIS dan MUTASI hanya untuk peran authenticated (Admin Dashboard)
DROP POLICY IF EXISTS "Allow authenticated staff to update app_settings" ON public.app_settings;
CREATE POLICY "Allow authenticated staff to update app_settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated staff to insert app_settings" ON public.app_settings;
CREATE POLICY "Allow authenticated staff to insert app_settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (true);
