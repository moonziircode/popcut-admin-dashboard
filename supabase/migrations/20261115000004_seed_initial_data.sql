-- =====================================================================
-- POPCUT.ID ADMIN DASHBOARD & CUSTOMER APPLICATION SHARED DATABASE
-- Migration: 20261115000004_seed_initial_data.sql
-- Description: Standard seed data for roles, permissions, categories, packages
-- =====================================================================

-- 1. SEED ROLES
INSERT INTO public.roles (id, name, description)
VALUES 
    ('owner', 'Owner', 'Akses penuh ke seluruh operasional, keuangan, pengaturan, dan user management.'),
    ('admin', 'Admin', 'Akses pengelolaan katalog bisnis, operasional booth, monitoring, dan laporan.'),
    ('staff', 'Staff Operasional', 'Akses monitoring booth, investigasi print job, dan konfirmasi transaksi tunai.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. SEED PERMISSIONS
INSERT INTO public.permissions (id, module, name, description)
VALUES 
    -- Packages & Pricing
    ('packages.view', 'packages', 'Lihat Paket', 'Melihat daftar paket dan harga.'),
    ('packages.manage', 'packages', 'Kelola Paket', 'Menambah, mengedit, dan mengarsipkan paket.'),
    ('packages.publish', 'packages', 'Terbitkan Paket', 'Menerbitkan paket ke konfigurasi booth.'),

    -- Frames
    ('frames.view', 'frames', 'Lihat Frame', 'Melihat daftar frame dan slot.'),
    ('frames.manage', 'frames', 'Kelola Frame', 'Upload frame, edit visual slots, dan arsipkan.'),
    ('frames.publish', 'frames', 'Terbitkan Frame', 'Menerbitkan versi frame baru.'),

    -- Booths & Fleet
    ('booths.view', 'booths', 'Lihat Booth', 'Melihat status armada booth dan kesehatan perangkat.'),
    ('booths.manage', 'booths', 'Kelola Booth', 'Registrasi booth baru, ubah lokasi, dan kelola kredensial.'),

    -- Config & Sync
    ('config.publish', 'config', 'Terbitkan Konfigurasi', 'Menerbitkan versi rilis baru ke booth.'),
    ('config.sync', 'config', 'Monitoring Sinkronisasi', 'Memantau dan memicu ulang sinkronisasi aset.'),

    -- Transactions & Payments
    ('transactions.view', 'transactions', 'Lihat Transaksi', 'Melihat daftar transaksi pembayaran.'),
    ('transactions.confirm_cash', 'transactions', 'Konfirmasi Tunai', 'Memverifikasi pembayaran tunai di kasir.'),
    ('transactions.correct', 'transactions', 'Koreksi Transaksi', 'Melakukan koreksi transaksi jika terjadi diskrepansi.'),

    -- Sessions & Printing
    ('sessions.view', 'sessions', 'Lihat Sesi', 'Melihat riwayat sesi foto pelanggan.'),
    ('sessions.photos_view', 'sessions', 'Akses Foto Privat', 'Melihat preview foto pelanggan yang dibatasi izin.'),
    ('print.view', 'print', 'Lihat Antrean Cetak', 'Memantau status antrean print job.'),
    ('print.reprint', 'print', 'Otorisasi Cetak Ulang', 'Menyetujui dan meminta cetak ulang lembar foto.'),

    -- Marketing
    ('promotions.manage', 'promotions', 'Kelola Promo & Voucher', 'Membuat promosi dan generate voucher.'),
    ('tickets.manage', 'tickets', 'Kelola Tiket Prabayar', 'Membuat batch tiket dan export kode.'),

    -- Reports & Settings
    ('reports.view', 'reports', 'Lihat Laporan', 'Melihat ringkasan metrik dan analitik omzet.'),
    ('reports.export', 'reports', 'Ekspor Laporan', 'Mengunduh laporan finansial ke format CSV.'),
    ('settings.manage', 'settings', 'Kelola Pengaturan', 'Mengubah konfigurasi bisnis, payment, dan retensi.'),
    ('users.manage', 'users', 'Kelola Pengguna', 'Mengundang staff, mengubah role, dan menonaktifkan akun.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. ASSIGN PERMISSIONS TO ROLES
-- Admin Role Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'admin', id FROM public.permissions
WHERE id NOT IN ('settings.manage', 'users.manage')
ON CONFLICT DO NOTHING;

-- Staff Role Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
VALUES 
    ('staff', 'packages.view'),
    ('staff', 'frames.view'),
    ('staff', 'booths.view'),
    ('staff', 'transactions.view'),
    ('staff', 'transactions.confirm_cash'),
    ('staff', 'sessions.view'),
    ('staff', 'print.view')
ON CONFLICT DO NOTHING;

-- 4. SEED DEFAULT FRAME CATEGORIES
INSERT INTO public.frame_categories (slug, name, description, display_order)
VALUES 
    ('classic', 'Classic', 'Tata letak strip vertikal klasik dengan nuansa timeless.', 1),
    ('minimal', 'Minimalist', 'Desain monokrom bersih dengan border tipis elegan.', 2),
    ('retro', 'Retro Pastel', 'Warna-warna ceria dan estetika vintage film.', 3),
    ('couple', 'Couple Special', 'Tema romantis dan aksen manis khusus pasangan.', 4),
    ('celebration', 'Celebration', 'Tema ulang tahun, kelulusan, dan momen selebrasi.', 5),
    ('seasonal', 'Seasonal & Holiday', 'Edisi terbatas hari raya dan musiman.', 6)
ON CONFLICT (slug) DO NOTHING;

-- 5. SEED INITIAL APP SETTINGS
INSERT INTO public.app_settings (section, key, value)
VALUES 
    ('business', 'business_profile', '{
        "name": "Popcut.id Photobooth",
        "tagline": "Capture Every Moment Beautifully",
        "contact_email": "hello@popcut.id",
        "contact_phone": "+6281234567890",
        "timezone": "Asia/Jakarta",
        "currency": "IDR"
    }'::jsonb),
    ('customer_app', 'kiosk_defaults', '{
        "welcome_title": "Selamat Datang di Popcut.id",
        "idle_timeout_seconds": 60,
        "payment_timeout_seconds": 180,
        "session_duration_minutes": 10,
        "allow_retakes": true,
        "max_retakes_per_pose": 2,
        "enable_live_photo": true
    }'::jsonb),
    ('storage', 'retention_policy', '{
        "cloud_gallery_expiry_days": 14,
        "max_upload_size_mb": 25,
        "allowed_mime_types": ["image/png", "image/jpeg", "image/webp", "video/mp4"]
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. SEED INITIAL PACKAGES
INSERT INTO public.packages (internal_code, name, description, price, photo_count, included_strips, include_live_photo, include_digital_files, allowed_categories, display_order)
VALUES 
    ('PKG-BSC-01', 'Basic Strip', 'Paket hemat untuk 1-2 orang dengan 3 pose foto dan 1 strip cetak.', 25000, 3, 1, false, true, ARRAY['classic', 'minimal'], 1),
    ('PKG-REG-02', 'Regular Duo', 'Paket paling populer dengan 4 pose, 2 strip cetak glossy, dan Live Photo motion.', 35000, 4, 2, true, true, ARRAY['classic', 'minimal', 'retro', 'couple', 'celebration'], 2),
    ('PKG-PRM-03', 'Premium Postcard', 'Format lebar jumbo (4x6) dengan 6 pose foto dan kualitas cetak studio.', 50000, 6, 1, true, true, ARRAY['classic', 'minimal', 'retro', 'celebration', 'seasonal'], 3),
    ('PKG-CPL-04', 'Couple Special', 'Paket edisi romantis dengan 4 pose, 2 strip custom couple, dan filter B&W otomatis.', 45000, 4, 2, true, true, ARRAY['couple', 'retro'], 4)
ON CONFLICT (internal_code) DO NOTHING;

-- 7. SEED INITIAL ADDITIONAL PRINT PRICING
INSERT INTO public.additional_print_pricing (price_per_unit, min_quantity, quantity_increment, max_quantity, is_active)
VALUES 
    (15000, 1, 1, 6, true);
