# HYBRID STORAGE IMPLEMENTATION PLAN
## POPCUT.ID — LOCAL-FIRST OPERATIONAL HUB + CLOUD STORAGE SYNCHRONIZATION

**Tanggal:** 15 November 2026  
**Dokumen:** Arsitektur & Rencana Implementasi Hybrid Cloud Storage  
**Status:** IMPLEMENTED & OPERATIONAL  

---

### 1. Prinsip & Arsitektur Sistem

Popcut.id mengadopsi arsitektur **Hybrid Offline-First + Cloud Storage**. Prinsip utama arsitektur ini memisahkan secara tegas antara:
1. **Kecepatan & Keandalan Operasional Photobooth:** Berjalan sepenuhnya di perangkat lokal (MacBook Pro M1 Pro), bebas latency internet, dan tetap dapat melayani pemotretan meskipun koneksi internet terputus.
2. **Kekayaan Data Bisnis & Sentralisasi:** Dikelola secara terpusat oleh Supabase (PostgreSQL, Auth, Realtime).
3. **Penyimpanan Media Skala Besar:** Dikelola oleh Cloudflare R2 (S3-compatible, zero egress fee) dengan fallback adaptif ke Supabase Storage.

```
+-------------------------------------------------------------------------------+
|                    MACBOOK PRO M1 PRO (OPERATIONAL HUB)                       |
|                                                                               |
|  [Electron Customer App]                                                      |
|          |                                                                    |
|          +---> [Local SQLite Engine]                                          |
|          |         - Sesi & transaksi offline                                 |
|          |         - r2_upload_queue (antrean lokal)                          |
|          |         - sync_queue (sinkronisasi bisnis)                         |
|          |                                                                    |
|          +---> [Local File System]                                            |
|                    - Raw photos (pose 1..N)                                   |
|                    - 4R digital preview & composite                           |
|                    - Final print job ready files                              |
+-------------------------------------------------------------------------------+
                               |
             (Background Worker / Resilient Sync)
                               |
                               v
+-------------------------------------------------------------------------------+
|                            CLOUD INFRASTRUCTURE                               |
|                                                                               |
|  [Cloudflare R2 Object Storage]          [Supabase PostgreSQL & Auth]         |
|  - popcut-media (Foto final & raw)       - Pusat database bisnis & transaksi  |
|  - popcut-assets (Frame SVG/PNG, logo)   - Master events, packages, vouchers  |
|  - popcut-backups (Arsip harian)         - Stored procedures & atomic RPC     |
|                                          - storage_assets & digital_galleries |
|                                                                               |
|                         [Admin Dashboard (Next.js)]                           |
|                         - PWA di Vercel Hosting                               |
|                         - Monitoring sesi, perangkat & galeri                 |
|                         - /api/storage/upload proxy adapter                   |
|                         - /gallery/[sessionId] customer web viewer            |
+-------------------------------------------------------------------------------+
```

---

### 2. Struktur Bucket & Hirarki Penyimpanan Objek

Popcut.id membagi penyimpanan Cloudflare R2 ke dalam 3 bucket terisolasi:

#### A. Bucket `popcut-media` (Public Read via CDN)
Menyimpan seluruh output foto hasil sesi photobooth dan foto mentah untuk galeri digital.
- **Hirarki Penamaan Kunci Objek (Object Key Path):**
  `events/{event_id}/booths/{booth_id}/sessions/{session_id}/[type]/[filename]`
- **Sub-kategori:**
  - `final/photostrip_4R.png`: Komposit akhir beresolusi cetak 4R (1200x1800 px).
  - `originals/pose-{slot_index}.jpg`: Foto asli mentah tiap pose.
  - `thumbnails/thumb-preview.webp`: Kompresi ringan untuk loading cepat galeri mobile.

#### B. Bucket `popcut-assets` (Public Read with Cache-Control)
Menyimpan aset desain statis yang dikonsumsi oleh Admin dan di-cache oleh Booth lokal.
- `frames/{frame_id}/master-4R.png`: Template bingkai transparan 4R.
- `frames/{frame_id}/preview.webp`: Thumbnail katalog pemilihan bingkai.
- `branding/{tenant_id}/watermark.png`: Logo dan identitas tenant/sponsor.

#### C. Bucket `popcut-backups` (Private)
Menyimpan cadangan terenkripsi dari SQLite lokal booth pada setiap pergantian shift atau penutupan sesi harian.
- `booth-backups/{booth_id}/{date}/db-snapshot.sqlite.gz`

---

### 3. Alur Unggah Lokal-Pertama (Local-First Upload Flow)

1. **Pemotretan & Komposisi Lokal:**
   - Foto diambil dan disimpan secara instan di storage SSD MacBook (`~/Library/Application Support/popcut-cust/photos/`).
   - Sesi tidak pernah diblokir atau tertahan menunggu upload internet.
2. **Pencatatan Antrean (Enqueue):**
   - File didaftarkan ke tabel SQLite `r2_upload_queue` dengan status `PENDING`, mencatat path lokal, ukuran byte, checksum SHA-256, dan target object key.
3. **Background Worker:**
   - Worker berjalan secara asinkron di latar belakang.
   - Mengambil batch 5 file teratas berstatus `PENDING` atau `FAILED` (dengan retry < 5).
4. **Metode Unggah Cerdas & Fallback:**
   - Jika kredensial S3 Cloudflare R2 aktif, unggah langsung via AWS SDK v3 S3 client ke endpoint Cloudflare R2.
   - Jika kredensial R2 belum terpasang atau mengalami hambatan jaringan luar, file dialirkan melalui endpoint `/api/storage/upload` Admin Dashboard di Vercel, yang memiliki adapter otomatis ke Supabase Storage.
5. **Pencatatan Metadata:**
   - Setelah berkas terunggah, entri metadata dicatat pada tabel Supabase `storage_assets` dan status galeri di `digital_galleries` diperbarui menjadi `AVAILABLE`.

---

### 4. Strategi Deduplikasi & Verifikasi Integritas

- **SHA-256 Verification:** Setiap berkas dihitung hash SHA-256 sebelum diunggah dan disimpan di metadata objek (`x-checksum-sha256`).
- **Idempotency:** Jika unggahan terputus di tengah jalan, worker memeriksa apakah berkas dengan key dan checksum yang sama sudah ada sebelum mengunggah ulang.
- **Zero-Data Loss Guarantee:** Berkas lokal tidak pernah dihapus sampai konfirmasi upload dan sinkronisasi tuntas.
