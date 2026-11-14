# PROJECT ANALYSIS — POPCUT.ID ADMIN DASHBOARD

> **Tanggal:** 15 November 2026  
> **Target Aplikasi:** Popcut.id Admin Dashboard (PWA)  
> **Target Deployment:** Vercel  
> **Target Backend:** Supabase (PostgreSQL, Auth, RLS, Storage, Edge Functions / RPC, Realtime)  
> **Source of Truth:** `Popcut_id_Admin_Dashboard_PRD_v2.0_Supabase_Vercel.md`

---

## 1. Kondisi Awal Project
- **Workspace:** `/Users/aqsamuflihan/Downloads/Admin Popcut.id/`
- **File Awal:** `Popcut_id_Admin_Dashboard_PRD_v2.0_Supabase_Vercel.md` (PRD versi 2.0 lengkap, 1.895 baris).
- **Environment:**
  - Node.js: `v26.8.1`
  - NPM: `11.19.0`
  - Git: Initialized repository di dalam folder workspace.
  - Stitch Project: `16319772870922518033` ("Popcut Admin Dashboard System") dengan Design System `Popcut Engine` (`assets/2f17f2248d504a1783eefe19bac178b6`).

---

## 2. Analisis Kebutuhan Arsitektur & Teknologi

### 2.1 Frontend & PWA
- **Framework:** Next.js (App Router), React 19 / 18, TypeScript (Strict Mode).
- **Styling & UI:** Tailwind CSS, shadcn/ui component patterns, Lucide React icons.
- **Design Tokens (Popcut Engine):**
  - Background: `#F7F7F5` (Warm off-white)
  - Surface: `#FFFFFF`
  - Border: `#E8E8E5`
  - Brand Accent: `#CCDE2A` / `#D9E83F` (Electric lime dengan teks kontras tinggi `#141704`)
  - Primary Text: `#202020`
  - Secondary Text: `#777777`
  - Status Colors: Emerald `#10B981` (Success/Online), Amber `#F59E0B` (Warning/Pending), Rose `#EF4444` (Error/Failed), Blue `#3B82F6` (Info).
  - Tipografi: Manrope (Headlines/Display) + Hanken Grotesk / Inter (Body & Data).
- **PWA:** Web App Manifest (`manifest.webmanifest`), Service Worker, Cache Versioning, Offline Fallback Shell, Install prompt UI.
- **Form & Validation:** React Hook Form, Zod schema validation.
- **Visual Editor:** Interactive HTML5 Canvas / SVG Frame Slot Editor dengan drag, resize, koordinat X/Y/Width/Height, slot reordering, dan live preview.

### 2.2 Backend & Database (Supabase)
- **Supabase PostgreSQL:**
  - 35+ core tables dengan UUID primary key, foreign keys, unique constraints, check constraints, dan timestamps UTC (`timestamptz`).
  - Nominal Rupiah disimpan sebagai `integer` / `bigint` (bukan float).
  - Versioned & immutable records untuk `config_versions`, `package_versions`, `frame_versions`, `session_config_snapshots`.
- **Supabase Auth:** Email/password session management, user invitation, role assignment (`owner`, `admin`, `staff`).
- **Supabase Row Level Security (RLS):**
  - RLS aktif di seluruh tabel.
  - Role-based policy (`owner` full access, `admin` business/operations, `staff` restricted view/cash confirm only).
  - Customer Application booth scoped access via device token.
- **Supabase Storage:**
  - 6 Buckets: `frame-assets`, `frame-thumbnails`, `gallery-originals`, `gallery-outputs`, `print-assets`, `brand-assets`.
  - Customer photos bucket bersifat private; hanya dapat diakses melalui short-lived signed URLs.
- **Database Functions & RPC:** Operasi atomik untuk voucher redemption, ticket redemption, cash confirmation, configuration publishing, dan reprint request.

### 2.3 Shared Contract dengan Customer Application
- Electron MacBook Desktop App mengakses endpoint terstandarisasi:
  - `booth-provision`, `booth-heartbeat`, `booth-get-config`, `booth-ack-config`, `booth-get-assets`.
  - `session-create`, `session-update-event`, `payment-create`, `payment-verify`.
  - `voucher-redeem`, `ticket-redeem`, `transaction-confirm-cash`.
  - `print-job-create`, `print-job-update`, `gallery-register`, `gallery-upload-complete`, `booth-report-error`.
- TypeScript Shared Types didefinisikan terpusat di `types/shared-contract.ts`.

---

## 3. Identifikasi Gap & Risiko Teknis

| Kebutuhan PRD | Potensi Risiko / Tantangan | Mitigasi Arsitektur |
|---|---|---|
| Frame Editor interaktif | Kompleksitas drag & resize photo slots | Modul Canvas editor modular murni React & SVG/HTML5 tanpa dependensi berat yang rapuh |
| Double redemption voucher & ticket | Race condition jika diakses bersamaan | PostgreSQL transactional function (`FOR UPDATE`, check kuota secara atomik) |
| Offline mode pada PWA | Inisiasi aksi sensitif saat offline | State management pendeteksi koneksi (`navigator.onLine`), blokir aksi mutasi finansial saat offline, tampilkan label "Data terakhir tersinkron" |
| Storage & URL foto privat | Kebocoran foto pelanggan | RLS ketat pada Storage, signed URL jangka pendek (maks 15 menit), QR Code mengarah ke domain routing Popcut, bukan raw URL Supabase |
| Sync failure pada booth | Booth terhenti jika sinkronisasi konfigurasi gagal | Konsep dual-configuration: booth tetap menjalankan versi `LAST_KNOWN_VALID` sampai versi baru diverifikasi checksumnya |
| Status Print Job UNKNOWN | Admin melakukan auto-reprint membabi buta | Enforce dialog rekonsiliasi fisik wajib bagi operator sebelum reprint diizinkan |

---

## 4. Rencana Kerja Bertahap (Phased Roadmap)

### PHASE 1 — Foundation (Sedang Berjalan)
- [x] Project Analysis & Documentation Setup.
- [ ] Inisialisasi Next.js 15+ App Router, TypeScript strict, Tailwind CSS, shadcn/ui.
- [ ] Konfigurasi Token Desain Popcut Engine (`#F7F7F5`, `#CCDE2A`, `#202020`, dll).
- [ ] Layout Shell Global: Sidebar collapsible, Header dengan indikator status armada, Breadcrumbs, User Profile.
- [ ] Supabase Client (Browser & Server Component SSR).
- [ ] Database Schema & Migrations (`supabase/migrations/`).
- [ ] RLS Policies & Roles/Permissions Foundation.
- [ ] PWA Manifest, Service Worker, Offline Shell.
- [ ] Konfigurasi Vercel Deployment & Security Headers.

### PHASE 2 — Business Configuration
- [ ] Paket & Harga (List, Create, Edit, Duplicate, Archive, Display Order, Kiosk Preview).
- [ ] Additional Print Pricing (Add-on strips rules, tiering, minimum & maximum quantity).
- [ ] Frame Management & Library (Grid aset visual, kategori, versioning).
- [ ] Visual Frame Editor (Canvas drag/resize photo slots, X/Y/W/H coordinates, layer ordering, draft & publish).

### PHASE 3 — Booth Management & Configuration Publishing
- [ ] Booth Management (Device status, pairing wizard, provisioning token, storage/camera/printer telemetry).
- [ ] Configuration Publishing Engine (Draft, Validation, Target Booth Selection, Version Manifest, Checksum calculation).
- [ ] Asset Sync Monitor (Per-booth sync progress, applied status, retry mechanism).
- [ ] Customer Application API Contract & Shared Types.

### PHASE 4 — Promotions & Payments
- [ ] Promosi & Kode Voucher (Percentage, Fixed, 100% Free, Batch generation, Atomic redemption).
- [ ] Tiket Prabayar (Batch creation, Code generator, Available/Used/Expired/Disabled lifecycle).
- [ ] Transaksi (QRIS, Tunai, Tiket, Voucher, Audit trail, Filter, Financial calculations).

### PHASE 5 — Operational Monitoring
- [ ] Monitoring Sesi Pelanggan (Timeline event, snapshot paket/frame, restricted photo preview).
- [ ] Monitoring Print Jobs (Status queue, error handling, UNKNOWN reconciliation, authorized reprint).
- [ ] Monitoring Galeri Digital (Upload status, QR access management, cloud expiry).
- [ ] Audit Trail & Activity Log (Before/after diff view).

### PHASE 6 — Insights, Hardening & Production
- [ ] Overview Dashboard (Real-time business & operational KPIs, revenue charts, alerts).
- [ ] Reports & Analytics (Filtered performance, CSV export).
- [ ] End-to-end testing, RLS verification, PWA audit, build optimization.
- [ ] Deployment Readiness Documentation (`docs/DEPLOYMENT.md`).
