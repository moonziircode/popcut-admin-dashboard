# VOUCHER BUG FIX REPORT
## POPCUT.ID ADMIN DASHBOARD & CUSTOMER APPLICATION

**Tanggal Pengujian & Perbaikan:** 15 November 2026  
**Status:** PASS (100% Resolved & Verified in PostgreSQL Database)  
**Lingkup:** Siklus Hidup Voucher (Pembuatan, Persistensi, Approval, Refresh, Sinkronisasi Booth, dan Validasi/Redemption Atomik)

---

### 1. Root Cause Analysis (Akar Penyebab Masalah)
1. **Frontend Local-State Trap:**  
   Pada `app/promotions/page.tsx`, fungsi `handleCreateVoucher` sebelumnya hanya menambahkan voucher ke dalam React `useState` (`setPromotions([newPromo, ...promotions])`) tanpa memanggil API route atau melakukan query `INSERT` ke database Supabase. Akibatnya, saat halaman di-refresh, state kembali kosong (`[]`).
2. **Missing Backend CRUD API:**  
   Tidak tersedianya endpoint `app/api/promotions/route.ts` dan `app/api/promotions/[id]/route.ts` untuk melayani operasi pembacaan, pembuatan, approval status, dan pengarsipan voucher dari PostgreSQL.
3. **Hardcoded Booth Config Response:**  
   Pada `app/api/booth/config/route.ts`, field `promotions` sebelumnya di-hardcode mengembalikan array kosong (`promotions: []`), sehingga sinkronisasi offline ke Customer Application tidak pernah menerima promosi aktif.
4. **Hardcoded Mock Redemption Route:**  
   Pada `app/api/voucher/redeem/route.ts`, validasi hanya memeriksa 2 string statis dummy (`VOUCH-FREE100-VAL` dan `POPCUT-SENOPATI10K`), mengabaikan kode voucher dinamis yang dibuat dari Admin.

---

### 2. Implementasi Perbaikan

#### A. Backend API Routes
1. **`app/api/promotions/route.ts`**:
   - `GET`: Mengambil seluruh voucher aktif dari tabel `promotions` dengan join ke `promotion_codes`. Memetakan status siklus hidup: `APPROVED`, `PENDING_APPROVAL`, `EXPIRED`, `EXHAUSTED`, dan `ARCHIVED`.
   - `POST`: Menyimpan kampanye promosi ke `promotions` dan membuat kode unik kapital di `promotion_codes`.
   - `PATCH`: Mengubah status aktif/persetujuan voucher secara instan.
2. **`app/api/promotions/[id]/route.ts`**:
   - `PATCH`: Mengatur `is_active` dan meng-update batas kuota / masa berlaku.
   - `DELETE`: Mengarsipkan voucher secara aman (`is_archived: true`).
3. **`app/api/voucher/redeem/route.ts`**:
   - Terintegrasi langsung dengan database Supabase PostgreSQL.
   - Mode `validate_only`: Menghitung diskon tanpa memotong kuota.
   - Mode Redemption: Memanggil PostgreSQL Stored Procedure `redeem_voucher_atomic` secara ACID dan aman dari *race condition*.
4. **`app/api/booth/config/route.ts`**:
   - Menyertakan daftar voucher aktif dan kuota yang masih berlaku dalam payload konfigurasi booth.

#### B. Frontend Admin Dashboard (`app/promotions/page.tsx`)
- Menggunakan `useEffect` untuk memuat data aktual dari `/api/promotions` saat halaman dibuka.
- Modal pembuatan voucher langsung mengirim payload ke backend dan menyimpannya secara persisten.
- Tombol aksi Aktifkan / Nonaktifkan terhubung langsung dengan endpoint PATCH.

---

### 3. Hasil Pengujian Verifikasi

| Skenario | Langkah Pengujian | Hasil Aktual | Status |
|---|---|---|---|
| 1. Pembuatan Voucher Baru | Buat voucher `ADMINTEST100` (Diskon 100% Gratis, kuota 100) | Tersimpan di tabel `promotions` dan `promotion_codes` | **PASS** |
| 2. Persistensi Setelah Refresh | Refresh halaman browser Admin `/promotions` | Data tetap terbaca utuh dari Supabase | **PASS** |
| 3. Persistensi Logout & Login | Akses ulang session admin | Data voucher tetap muncul di tabel | **PASS** |
| 4. Delivery via Booth Config | Request ke `/api/booth/config` | Menerima payload promotions aktif | **PASS** |
| 5. Validasi Customer App | Eksekusi validasi online dengan kode `ADMINTEST100` | Valid, Diskon Rp 35.000 (100% Gratis) | **PASS** |
| 6. Atomic Redemption | Eksekusi `redeem_voucher_atomic` di database | Kuota terpakai menjadi 1, ID penebusan `36c807b4-687d-437c-8272-80f5454823ce` dicatat di `voucher_redemptions` | **PASS** |

---

### 4. Kesimpulan
Bug voucher telah diperbaiki secara tuntas dari level frontend, REST API, hingga integritas database PostgreSQL Supabase. Voucher yang dibuat di Admin Dashboard kini permanen, tidak hilang saat di-refresh, dan dapat langsung digunakan oleh Customer Application.
