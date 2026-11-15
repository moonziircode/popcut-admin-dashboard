# POPCUT.ID — FULL SYSTEM END-TO-END TEST PLAN
**Document ID:** `E2E_TEST_PLAN.md`  
**Version:** 2.0  
**Target Systems:** Popcut.id Admin Dashboard (Next.js PWA) + Customer Application (Electron Desktop)  
**Backend:** Shared Supabase Cloud PostgreSQL (`hxefecxvforrrbggmvmm`)  
**Deployment:** Production Vercel (`https://popcut-admin-dashboard.vercel.app`)  
**Author:** Senior QA Engineer & System Architect  

---

## 1. Scope & Objectives
Pengujian ini bertujuan memvalidasi seluruh fungsionalitas, alur bisnis, perhitungan finansial, konsistensi data relasional, integritas konfigurasi, serta sinkronisasi dua arah antara **Admin Dashboard** dan **Customer Application**.

### Pengecualian Khusus
- Transaksi riil payment gateway Midtrans dikecualikan dari transaksi moneter nyata (menggunakan adapter simulasi / cash / voucher / prepaid ticket tanpa memicu pemotongan saldo nyata). Kredensial Midtrans di `app_settings` tetap dijaga utuh dan tidak dimodifikasi.

---

## 2. Test Environment & Matrix

| Component | Target Environment | Details |
|---|---|---|
| **Admin Dashboard** | Production Vercel & Local | `https://popcut-admin-dashboard.vercel.app` & `http://localhost:3000` |
| **Customer App** | Local macOS Environment | `~/Downloads/Cust Popcut.id` (Electron v35 + Vite React) |
| **Database** | Supabase Cloud PostgreSQL | Project `hxefecxvforrrbggmvmm` (Region `ap-southeast-1`) |
| **Storage** | Supabase Storage | Bucket `frames`, `sessions`, `gallery` |
| **Test Automation Tool** | Playwright MCP | Chromium Automated Browser & Direct DOM/Accessibility Inspector |

---

## 3. Inventory of Modules & Features Under Test

1. **Authentication & Access Control (`AUTH`)**: Login SSR, JWT session cookie, Route guard middleware, Role-Based Access Control (Owner, Admin, Staff).
2. **Overview Dashboard (`DASHBOARD`)**: Ringkasan omzet (hanya PAID), total sesi sukses, status booth, recent transactions, period filters.
3. **Dynamic Event Management (`EVENT`)**: Pembuatan event, aktivasi event ke booth, deaktivasi ke Standby mode, penghapusan event, update greeting & branding.
4. **Packages & Pricing (`PACKAGE`)**: Pembuatan paket, penyesuaian harga, penentuan jumlah pose foto & strip cetak, konsistensi slot, duplikasi, arsip, validasi negatif.
5. **Additional Print Pricing (`ADDON`)**: Konfigurasi harga lembar cetak tambahan, min/max quantity, increment.
6. **Frame Management (`FRAME_LIB`)**: Galeri frame visual, filter format (2x6 vs 4x6), upload master PNG, deteksi transparansi alpha, AI auto-slot.
7. **Frame Editor (`FRAME_EDITOR`)**: Visual slot editor, dragging, resizing, input koordinat presisi (X, Y, W, H), slot order, fit_mode (cover/contain), slot count 1, 2, 3, dan 4 slots.
8. **Frame Categories (`FRAME_CAT`)**: Kategori frame (classic, wedding, corporate, postcard), order display, aktivasi.
9. **Promotions & Vouchers (`PROMO`)**: Kode voucher (FREE_100, PERCENTAGE, FIXED_AMOUNT), kuota penggunaan, validasi kode, pencegahan double-claim.
10. **Prepaid Tickets (`TICKET`)**: Batch tiket prabayar, generate kode tiket unik, masa berlaku, validasi status (AVAILABLE, USED, EXPIRED).
11. **Booth Management (`BOOTH`)**: Monitoring armada Mobile Rig #1, status online/offline, heartbeat, telemetri kamera & printer.
12. **Config Delivery & Sync (`SYNC`)**: Endpoint `/api/booth/config`, snapshot manifest, checksum SHA-256, asset delivery.
13. **Transactions (`TRANSACTION`)**: Riwayat transaksi, status pembayaran (PAID, PENDING, CANCELLED), metode bayar (QRIS, CASH, TICKET, VOUCHER), ekspor CSV.
14. **Sessions Monitoring (`SESSION`)**: Kronologi sesi pelanggan, durasi, snapshot paket & frame immutability, proteksi privasi foto.
15. **Print Jobs (`PRINT_JOB`)**: Antrean cetak fisik, status (QUEUED, PRINTING, COMPLETED, UNKNOWN, FAILED), reprint request dengan alasan wajib.
16. **Digital Gallery (`GALLERY`)**: Status upload aset ke cloud, QR code token, link unduhan foto & strip, masa berlaku 14 hari.
17. **Reports & Analytics (`REPORT`)**: Perhitungan ATV (Average Ticket Value), performa paket, komposisi metode bayar, ekspor CSV.
18. **Settings (`SETTING`)**: Profil bisnis Popcut, parameter aplikasi kiosk, konfigurasi Midtrans terenkripsi, retensi data.
19. **Users & Access (`USERS`)**: Manajemen staf & admin, pengaturan role.
20. **Activity Log (`AUDIT`)**: Pencatatan audit trail (Create, Update, Delete, Publish, Reprint) dengan actor dan timestamp.
21. **Customer App Integration (`INTEGRATION`)**: End-to-end sync, 4-slot frame loading, slot photo composition, 4R sheet generation, session completion.

---

## 4. Test Cases Specification (`E2E_TEST_*`)

### Module 1: Authentication & Access Control
- **`E2E_TEST_AUTH_01`**: Login dengan kredensial sah (`moonziircode` / Supabase auth) mengarahkan pengguna ke dashboard dan menyetel session cookie aman.
- **`E2E_TEST_AUTH_02`**: Percobaan akses rute terproteksi (`/settings`, `/events`, `/packages`) tanpa session dialihkan ke `/login`.
- **`E2E_TEST_AUTH_03`**: Logout membersihkan session cookie dan mengarahkan kembali ke `/login`.

### Module 2: Overview Dashboard
- **`E2E_TEST_DASH_01`**: Metrik omzet hanya menghitung transaksi dengan status `PAID`; transaksi `PENDING` atau voucher 100% gratis tidak menambah omzet tunai.
- **`E2E_TEST_DASH_02`**: Tampilan empty state bersih saat data belum ada (tidak menampilkan NaN atau undefined).
- **`E2E_TEST_DASH_03`**: Filter periode (Hari Ini, 7 Hari, 30 Hari) mengubah rentang kalkulasi metrik secara dinamis.

### Module 3: Dynamic Event Management
- **`E2E_TEST_EVT_01`**: Membuat event baru dengan prefix `E2E_TEST_Wedding_Event` menyimpan data ke tabel `public.events` di Supabase.
- **`E2E_TEST_EVT_02`**: Mengaktifkan event mengalihkan status booth secara atomik dan memperbarui manifest aktif `/api/booth/config`.
- **`E2E_TEST_EVT_03`**: Menonaktifkan event yang sedang berjalan mengembalikan armada booth ke **Mode Siaga (Standby Mode)** tanpa menghapus riwayat event.
- **`E2E_TEST_EVT_04`**: Menghapus event melalui modal konfirmasi menghapus baris dari Supabase secara aman.

### Module 4: Packages & Pricing (Critical Consistency)
- **`E2E_TEST_PKG_01`**: Membuat paket 2-slot foto (`E2E_TEST_Duo_Strip`, 2 pose, 2 strip, Rp 35.000) tersimpan di Supabase.
- **`E2E_TEST_PKG_02`**: Membuat paket 4-slot foto (`E2E_TEST_Quad_Strip`, 4 pose, 2 strip, Rp 45.000) tersimpan di Supabase.
- **`E2E_TEST_PKG_03`**: Verifikasi konsistensi: Membuka kembali detail paket 4-slot memastikan harga tetap Rp 45.000 dan pose foto tetap 4 (tidak tertimpa default 2 slot).
- **`E2E_TEST_PKG_04`**: Validasi input negatif: Harga negatif (< 0) atau photo_count 0 ditolak oleh validasi sistem.
- **`E2E_TEST_PKG_05`**: Mengedit harga paket berhasil memperbarui data di Supabase dan segera terefleksi pada manifest kiosk.

### Module 5: Additional Print Pricing
- **`E2E_TEST_ADDON_01`**: Pengaturan harga cetak tambahan (Rp 15.000 per 2 strip) tersimpan dan terkirim dalam payload `additional_print_pricing` ke Customer App.
- **`E2E_TEST_ADDON_02`**: Validasi kalkulasi kelipatan cetak tambahan (`Total Cetak = Included + Additional`).

### Module 6: Frame Management & Visual Frame Editor (Critical)
- **`E2E_TEST_FRM_01`**: Upload master PNG transparan tervalidasi (resolusi, rasio, MIME type image/png, checksum SHA-256).
- **`E2E_TEST_FRM_02`**: Pembuatan Frame 1 Slot: Pengaturan koordinat X/Y dan W/H tersimpan ke `frame_slots`.
- **`E2E_TEST_FRM_03`**: Pembuatan Frame 2 Slot: Pengaturan 2 area foto vertikal tersimpan dengan `slot_index` 1 dan 2.
- **`E2E_TEST_FRM_04`**: Pembuatan Frame 3 Slot: Pengaturan 3 area foto vertikal tersimpan dengan urutan index yang benar.
- **`E2E_TEST_FRM_05`**: **PENGUJIAN KRITIS: Frame 4 Slot**: Konfigurasi 4 area foto (`E2E_TEST_Frame_4Grid`), drag/resize koordinat, simpan draft, reload editor, verifikasi seluruh 4 slot tidak bergeser dan identitas slot tetap utuh.
- **`E2E_TEST_FRM_06`**: Publikasi versi frame menghasilkan status `PUBLISHED` dan immutable version ID.

### Module 7: Frame Categories
- **`E2E_TEST_CAT_01`**: Kategori frame (Classic, Wedding, Corporate, Postcard) terbaca dari Supabase dan memfilter daftar frame dengan benar.
- **`E2E_TEST_CAT_02`**: Pembuatan kategori baru dengan slug unik tersimpan di database.

### Module 8: Promotions & Vouchers
- **`E2E_TEST_VOUCH_01`**: Pembuatan voucher diskon nominal `E2E_TEST_DISC10K` (Rp 10.000) tersimpan di Supabase.
- **`E2E_TEST_VOUCH_02`**: Pembuatan voucher gratis 100% `E2E_TEST_FREE100` tersimpan di Supabase.
- **`E2E_TEST_VOUCH_03`**: Validasi server-side mencegah penggunaan voucher yang kuotanya habis atau tanggalnya kedaluwarsa.

### Module 9: Prepaid Tickets
- **`E2E_TEST_TCK_01`**: Pembuatan batch tiket prabayar `E2E_TEST_Batch_01` men-generate kode unik dengan format yang ditentukan.
- **`E2E_TEST_TCK_02`**: Tiket prabayar berstatus `AVAILABLE` dapat diklaim dan statusnya berubah menjadi `USED` secara atomik.
- **`E2E_TEST_TCK_03`**: Pencegahan double-claim: Tiket yang sudah berstatus `USED` ditolak jika diklaim untuk kedua kalinya.

### Module 10: Booth Management & Telemetry
- **`E2E_TEST_BTH_01`**: Mobile Rig #1 terdaftar dengan status `ONLINE`, app version `3.0.0 (Electron Desktop)`, kamera `CONNECTED`, printer `READY`.
- **`E2E_TEST_BTH_02`**: Penerimaan heartbeat memperbarui timestamp `last_seen_at` di database.

### Module 11: Configuration Delivery & Synchronization
- **`E2E_TEST_SYNC_01`**: Endpoint `GET /api/booth/config?booth_id=RIG-M1-01` mengembalikan payload valid yang mencakup `active_event`, `packages`, `frames` beserta slots, `additional_print_pricing`, dan `assets_manifest`.
- **`E2E_TEST_SYNC_02`**: Saat booth dalam Standby (tanpa event aktif), payload mengembalikan event info `evt-standby` dengan selamat datang mode siaga.

### Module 12: Transactions & Financials
- **`E2E_TEST_TRX_01`**: Pencatatan transaksi baru dengan status `PAID`, nominal, metode bayar, dan referensi sesi.
- **`E2E_TEST_TRX_02`**: Filter transaksi berdasarkan metode bayar (QRIS, CASH, TICKET) dan status (PAID, PENDING) berfungsi akurat.
- **`E2E_TEST_TRX_03`**: Ekspor laporan transaksi ke format CSV menghasilkan data yang valid dan lengkap.

### Module 13: Sessions Lifecycle & Snapshot Immutability
- **`E2E_TEST_SES_01`**: Sesi foto baru mencatat `package_snapshot` dan `frame_version_id`.
- **`E2E_TEST_SES_02`**: Immutability test: Mengubah harga paket di Admin setelah sesi dibuat TIDAK mengubah `package_snapshot` pada sesi aktif.

### Module 14: Print Jobs & Hardware Verification
- **`E2E_TEST_PRN_01`**: Print job mencatat `requested_strips`, `sheet_count` (misal 2 strip = 1 sheet 4R fisik), printer model, dan status.
- **`E2E_TEST_PRN_02`**: Permintaan reprint job mewajibkan input alasan reprint dan mencatat `parent_print_job_id`.

### Module 15: Digital Gallery
- **`E2E_TEST_GAL_01`**: Pendaftaran galeri foto menghasilkan QR code token dan URL publik galeri.
- **`E2E_TEST_GAL_02`**: Akses galeri memverifikasi masa berlaku file aset digital (retensi 14 hari).

### Module 16: Reports & Business Analytics
- **`E2E_TEST_REP_01`**: Metrik omzet, total sesi, dan Average Ticket Value (ATV) terhitung konsisten dari transaksi `PAID`.
- **`E2E_TEST_REP_02`**: Distribusi metode bayar dan performa paket terhitung proporsional sesuai data riil.

### Module 17: Settings & Security
- **`E2E_TEST_SET_01`**: Konfigurasi Midtrans di `app_settings` diverifikasi tetap utuh, terenkripsi, dan server key tidak bocor ke client-side.

### Module 18: Users & Access Control
- **`E2E_TEST_USR_01`**: Daftar pengguna menampilkan role Owner (`aqsa@popcut.id`) dan Staff.
- **`E2E_TEST_USR_02`**: Role permission enforcement membatasi akses konfigurasi sensitif.

### Module 19: Audit Activity Log
- **`E2E_TEST_LOG_01`**: Setiap tindakan kritis (pembuatan event, perubahan paket, publikasi konfigurasi, reprint) tercatat di activity log dengan actor dan timestamp.

### Module 20: End-to-End Customer Application Integration
- **`E2E_TEST_INT_01`**: **Lengkap**: Admin membuat Event + Branding -> Paket 4 Foto -> Frame 4 Slot -> Publish -> Customer App fetch remote config -> Verifikasi event aktif dan bingkai 4 slot tersedia -> Proses foto 4 slot -> Compositor me-render photostrip 300 DPI -> Output 4R sheet -> Transaksi & sesi tercatat di database -> Admin Dashboard memantau sesi dan transaksi secara konsisten.

---

## 5. Execution Strategy
1. Eksekusi pengujian UI Admin Dashboard via **Playwright MCP** terhadap live URL `https://popcut-admin-dashboard.vercel.app`.
2. Eksekusi inspeksi langsung ke Supabase PostgreSQL menggunakan `@supabase/supabase-js` dengan service role key.
3. Eksekusi pengujian unit & integrasi Customer Application melalui Node test runner dan Vite/Electron suite.
4. Dokumentasikan setiap bukti screenshot dan log eksekusi.
5. Bila ditemukan cacat sistem, tentukan root cause, lakukan perbaikan kode, dan jalankan uji regresi ulang.
