# CLOUDFLARE R2 INTEGRATION REPORT
## POPCUT.ID MEDIA STORAGE & ADAPTER SUBSYSTEM

**Tanggal Pengujian:** 15 November 2026  
**Status Integrasi:** PASS (Fully Integrated with Unified Adapter & Fallback)  
**Lingkup:** Integrasi Cloudflare R2 S3-Compatible API, Bucket Routing, dan Storage Fallback

---

### 1. Komponen yang Diterapkan

#### A. Backend Storage Adapter (`lib/storage/r2-storage-adapter.ts`)
1. **S3Client Implementation:**
   - Dikonfigurasi menggunakan `@aws-sdk/client-s3` dengan endpoint `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`.
   - Menggunakan region `auto` sesuai standar Cloudflare R2.
2. **Unified API Methods:**
   - `uploadObject(bucket, key, body, contentType)`
   - `getObject(bucket, key)`
   - `getSignedUrl(bucket, key, expiresIn)`
   - `deleteObject(bucket, key)`
3. **Resilient Dual-Mode Fallback:**
   - Ketika kredensial Cloudflare R2 (`CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`) aktif di environment, adapter mengirimkan berkas langsung ke bucket Cloudflare R2.
   - Ketika variabel R2 belum dikonfigurasi, adapter secara otomatis dan transparan mengalihkan penyimpanan ke Supabase Storage (bucket `media`, `assets`, `backups`) tanpa mengubah path atau merusak alur aplikasi.

#### B. API Upload Proxy (`app/api/storage/upload/route.ts`)
- Menerima request `multipart/form-data` dari antrean aplikasi Electron customer.
- Memproses buffer biner dan memvalidasi checksum.
- Menyusun penamaan hierarkis:
  `events/{eventId}/booths/{boothId}/sessions/{sessionId}/final/photo-final.jpg`
- Memperbarui status galeri digital di tabel Supabase `digital_galleries` menjadi `AVAILABLE`.

#### C. Local SQLite Upload Queue (`Cust Popcut.id/.../r2-storage-service.ts`)
- Antrean penyimpanan lokal berbasis tabel `r2_upload_queue`.
- Menangani retry otomatis hingga 5 kali dengan backoff bertahap.
- Menjamin tidak ada thread UI yang terhambat saat proses upload berlangsung.

---

### 2. Parameter Pengujian & Hasil

| Uji Komponen | Ekspektasi | Hasil Pengujian | Status |
|---|---|---|---|
| Inisialisasi S3 Adapter | Membentuk instance S3Client dengan endpoint R2 | S3Client berhasil diinisialisasi | **PASS** |
| Fallback Supabase Storage | Mengalihkan ke Supabase jika R2 keys absent | Berkas dialihkan ke Supabase Storage secara seamless | **PASS** |
| Penataan Hirarki Kunci | Kunci objek mengikuti format event/booth/session | Path objek terformat rapi sesuai spesifikasi | **PASS** |
| Perhitungan Hash SHA-256 | Menghasilkan hash identik dengan digest berkas lokal | Hash SHA-256 akurat tercatat di metadata | **PASS** |
| Antrean Latar Belakang | Background worker memproses antrean tanpa lag pada UI | Background timer memproses antrean non-blocking | **PASS** |

---

### 3. Konfigurasi Environment Produksi

Untuk menghubungkan Cloudflare R2 di Vercel / Production:
```env
# Cloudflare R2 Credentials
CLOUDFLARE_R2_ACCOUNT_ID="your_account_id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your_access_key_id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your_secret_access_key"
CLOUDFLARE_R2_PUBLIC_URL="https://media.popcut.id"

# Buckets (Default)
R2_BUCKET_MEDIA="popcut-media"
R2_BUCKET_ASSETS="popcut-assets"
R2_BUCKET_BACKUPS="popcut-backups"
```
Jika variabel di atas belum diatur, sistem secara otomatis beroperasi menggunakan Supabase Storage bawaan tanpa interupsi.
