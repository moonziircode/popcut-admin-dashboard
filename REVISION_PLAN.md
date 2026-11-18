# POPCUT.ID ADMIN DASHBOARD — FULL-STACK REVISION & INTEGRATION PLAN
**Document ID:** POPCUT-REVISION-PLAN-20261118  
**Target:** Admin System (`Admin Popcut.id`)  
**Audit Reference:** `POPCUT_ID_FULL_STACK_INTEGRATION_AUDIT_MASTER.md`  
**Branch:** `fix/admin-fullstack-integration-revision`  
**Execution Lead:** Lead Full-Stack Systems Architect & Principal Software Engineer  

---

## 1. Executive Summary & Goals
Tujuan dari rencana kerja ini adalah mengeliminasi seluruh implementasi mock, memperbaiki celah integrasi backend, memperbaiki skema database, memperkuat keamanan middleware, dan membuktikan keandalan sistem melalui pengujian E2E (Playwright) nyata dan mutation testing.

---

## 2. Peta File & Komponen yang Dimodifikasi

| No | File Path | Kategori | Temuan Terkait | Tindakan |
|---|---|---|---|---|
| 1 | `supabase/migrations/20261118000001_fix_integration_schema.sql` | Database | INT-001, INT-010, INT-011 | DDL migration: kolom `device_identifier`, `event_id`, index, dan views kompatibilitas |
| 2 | `app/api/payment/verify/route.ts` | Backend API | INT-007 | Pembuatan endpoint verifikasi status pembayaran QRIS |
| 3 | `app/api/webhooks/payment/route.ts` | Webhook | INT-008 | Mengaktifkan update status `transactions`, catat `payment_events`, update `sessions` |
| 4 | `app/api/session/create/route.ts` | Backend API | INT-009 | Hapus mock data, query `packages`, resolve `booth_id`, real `INSERT` ke `sessions` & `transactions` |
| 5 | `app/api/booth/config/route.ts` | Backend API | INT-003, INT-005, INT-006 | Fallback cerdas `allowed_package_ids`, normalisasi path frame, normalisasi slot coords |
| 6 | `app/api/galleries/route.ts` | Backend API | INT-010 | Perbaiki join query tanpa relasi tidak sah `sessions.events` |
| 7 | `app/api/settings/route.ts` | Backend API | INT-012 | Pembuatan endpoint `GET` dan `POST/PUT` untuk persistensi `app_settings` |
| 8 | `app/settings/page.tsx` | Frontend UI | INT-012 | Menghubungkan form ke `GET/POST /api/settings`, persistensi nyata, UI state |
| 9 | `app/sessions/page.tsx` | Frontend UI | Mock Elimination | Verifikasi query Supabase riil, status badge dinamis |
| 10 | `app/transactions/page.tsx` | Frontend UI | Mock Elimination | Verifikasi riwayat transaksi riil, format IDR akuntansi |
| 11 | `app/print-jobs/page.tsx` | Frontend UI | Mock Elimination | Verifikasi tabel `print_jobs` dan RPC `request_reprint_job` |
| 12 | `app/galleries/page.tsx` | Frontend UI | INT-010, INT-011 | Hapus fallback gambar Unsplash, tampilkan aset asli |
| 13 | `middleware.ts` | Security | INT-014 | Hapus wildcard insecure, otorisasi berlapis (Public, Kiosk M2M, Admin SSR Auth) |
| 14 | `playwright.config.ts` | Testing | Verification | Konfigurasi browser testing E2E |
| 15 | `tests/e2e/admin-full-integration.spec.ts` | Testing | Anti-Verification | 5 Flow E2E terpadu dengan asersi mutasi data riil |
| 16 | `CURRENT_STATUS.md` | Dokumentasi | Audit Compliance | Pembaruan status temuan INT-001 s/d INT-015 |

---

## 3. Rencana Bertahap (Execution Phases)

### Fase 1: Database Schema Migration & Backend Alignment
- Buat migration file `supabase/migrations/20261118000001_fix_integration_schema.sql`.
- Tambahkan kolom `device_identifier TEXT UNIQUE` pada tabel `public.booths`.
- Tambahkan kolom `event_id UUID REFERENCES public.events(id)` pada tabel `public.sessions`.
- Tambahkan index performa pada `idx_sessions_event_id`, `idx_sessions_booth_id`, `idx_transactions_booth_id`.
- Buat view kompatibilitas `public.galleries` dan `public.gallery_items`.
- Eksekusi DDL via skrip migrasi terproteksi dan verifikasi skema aktif di Supabase.

### Fase 2: Backend API Route Handlers & Webhooks
- **2.1 Endpoint Verifikasi Pembayaran:** Implementasi `app/api/payment/verify/route.ts`.
- **2.2 Webhook Midtrans:** Aktifkan update status transaksi di `app/api/webhooks/payment/route.ts`, insert `payment_events`, dan update `sessions` menjadi `PAID`/`READY`.
- **2.3 Eliminasi Mock Sesi:** Rombak `app/api/session/create/route.ts` menjadi 100% data-driven dengan Supabase.
- **2.4 Pengiriman Konfigurasi Kiosk:** Perbaiki `app/api/booth/config/route.ts` dengan smart fallback `allowed_package_ids` dan normalisasi koordinat slot.
- **2.5 Relasi Galeri:** Refactor `app/api/galleries/route.ts` untuk menghilangkan invalid relation join.
- **2.6 API Pengaturan Sistem:** Implementasi `app/api/settings/route.ts`.

### Fase 3: Frontend UI/UX & Data Persistence Fixes
- Integrasikan form `app/settings/page.tsx` dengan `GET` dan `POST /api/settings`.
- Audit dan eliminasi data mock di halaman `sessions`, `transactions`, `print-jobs`, dan `galleries`.
- Pastikan semua tampilan menggunakan data riil Supabase tanpa fallback dummy.

### Fase 4: Security Hardening & Middleware Authorization
- Perbarui `middleware.ts`:
  - Kategori A: Rute publik bebas autentikasi.
  - Kategori B: Rute kiosk M2M dengan validasi token.
  - Kategori C: Rute admin internal dengan validasi sesi Supabase Auth.
- Pastikan API internal tidak bocor ke publik tanpa token/sesi.

### Fase 5: End-to-End Testing & Mutation Validation
- Konfigurasi Playwright E2E.
- Tulis dan jalankan test suite `tests/e2e/admin-full-integration.spec.ts` (5 flow wajib).
- Lakukan Mutation Testing pada Webhook Midtrans untuk membuktikan test suite benar-benar mendeteksi kegagalan logic.
- Kembalikan kode dan pastikan test suite kembali PASS 100%.

### Fase 6: Code Review, Build Validation & Definition of Done
- `npm run lint` -> 0 error.
- `npm run build` -> 100% clean production build.
- Perbarui `CURRENT_STATUS.md`.
- Buat Git commits atomik pada branch `fix/admin-fullstack-integration-revision`.
