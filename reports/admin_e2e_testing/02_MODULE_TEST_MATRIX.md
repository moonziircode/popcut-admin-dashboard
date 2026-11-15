# MATRIKS PENGUJIAN LENGKAP: POPCUT.ID ADMIN DASHBOARD (15 MODUL)

**Target Base URL:** `https://popcut-admin-dashboard.vercel.app`  
**Backend:** Supabase PostgreSQL (`https://hxefecxvforrrbggmvmm.supabase.co`)  
**Test Suite:** `scripts/full-admin-e2e-test.js`  
**Execution Timestamp:** 16 November 2026 00:10:30 UTC+7  
**Total Test Cases:** 24  
**Status Akhir:** **24 PASS / 0 FAIL (100% SUKSES)**

---

## 1. Matriks Rinci Seluruh Modul & Skenario

| Test ID | Modul | Skenario Pengujian | Input / Payload Uji | Kriteria Hasil yang Diharapkan | Hasil Aktual (Observed) | Durasi | Status |
|---|---|---|---|---|---|---|:---:|
| **AUTH-01** | A. Auth & RBAC | Login dengan kredensial Admin valid | Email: `admin@popcut.id`, Password valid | Mendapatkan Supabase session token, cookie auth tersimpan, redirect ke `/` | HTTP 200, Session tersimpan, access token valid | 2711ms | **PASS** |
| **AUTH-02** | A. Auth & RBAC | Penolakan kredensial login tidak valid | Email: `hacker@evil.com`, Password: `wrongpassword` | Autentikasi ditolak dengan pesan error yang aman, tidak ada session dibuat | HTTP 400/401, pesan kredensial tidak valid diterima | 1732ms | **PASS** |
| **AUTH-03** | A. Auth & RBAC | Verifikasi tabel Role & Permission di Supabase | Query tabel `roles`, `permissions`, `role_permissions` | Skema RBAC PostgreSQL utuh, role admin memiliki hak akses penuh | Ditemukan 3 roles dasar (`admin`, `operator`, `finance`), relasi permission utuh | 164ms | **PASS** |
| **DASH-01** | B. Overview | Kalkulasi metrik agregat dashboard dari database | Agregasi SQL `SUM(payable_amount)`, `COUNT(sessions)` pada Supabase | Total pendapatan dan sesi terhitung akurat sesuai record aktual | Total kalkulasi DB: Sesi aktif dan omzet harian terhitung real-time | 166ms | **PASS** |
| **EVT-01** | C. Event Mgmt | Pembuatan event baru via API dan verifikasi Supabase | Name: `E2E Gala Launch 2026`, Dates: Now to +7d, Active: true | Record tersimpan di tabel `events` dengan slug unik dan status active | Event berhasil di-insert ke DB dengan ID UUID valid | 1190ms | **PASS** |
| **EVT-02** | C. Event Mgmt | Aktivasi event & sinkronisasi konfigurasi booth | Update status event -> `ACTIVE`, tautkan ke `testBoothId` | Booth mendeteksi event aktif melalui API manifest config | Booth ID otomatis tersinkronisasi ke event yang sedang berjalan | 2274ms | **PASS** |
| **EVT-03** | C. Event Mgmt | Deaktivasi event (Booth masuk ke Standby Mode) | Deactivate event / Unlink booth | Booth melepaskan event dan kembali ke default catalog/standby | Booth config merespons status `STANDBY` saat tidak ada event aktif | 953ms | **PASS** |
| **PKG-01** | D. Packages | Buat paket foto baru & verifikasi di Supabase | Name: `Premium Quad 4R`, Price: 50.000, Photos: 4, Strips: 2 | Data tersimpan di tabel `packages` dengan aturan cetak dan harga valid | Paket tersimpan di Supabase dengan ID, photo_count=4, included_strips=2 | 2073ms | **PASS** |
| **FRM-01** | E. Frame Mgmt | Buat bingkai 4R dengan layout 4-slot dan verifikasi koordinat | Canvas: 1200x1800 px, 4 slot foto simetris dengan batas margin | Tabel `frames`, `frame_versions`, dan `frame_slots` tersimpan presisi | Bingkai 4R 1200x1800 tersimpan, 4 slot tersimpan di `frame_slots` | 4356ms | **PASS** |
| **FRM-02** | E. Frame Mgmt | Verifikasi persistensi variasi slot (2, 3, 6, 8 slots) di kanvas 4R | Loop pembuatan layout 2, 3, 6, dan 8 slot dengan tinggi proporsional | Semua slot tersimpan dalam batas canvas 4R tanpa overflow | Keempat variasi slot (2, 3, 6, 8) tersimpan dan terverifikasi di Supabase | 14056ms | **PASS** |
| **FRM-03** | E. Frame Mgmt | Verifikasi formula penetapan harga berbasis slot | Base Package (4-slot): Rp50.000, Extra Prints: 2 @ Rp25.000 | Total harga terhitung Rp100.000 secara konsisten | Konsistensi perhitungan lolos uji: Base + Extra Prints = Total tagihan | 0ms | **PASS** |
| **VOUCH-01** | F. Vouchers | Buat voucher promosi di Admin dan verifikasi Supabase | Code: `E2EVOUCH...`, Diskon 20%, Min order Rp40.000 | Record tersimpan di tabel `vouchers` / `promotions` | Voucher aktif tersimpan di Supabase dengan batas penggunaan terdefinisi | 2296ms | **PASS** |
| **VOUCH-02** | F. Vouchers | Validasi kelayakan voucher via API sebelum checkout | Panggilan `POST /api/voucher/validate` dengan subtotal Rp50.000 | API merespons diskon yang dihitung tanpa mengubah stok penggunaan | API mengembalikan `valid: true`, potongan nilai terhitung Rp10.000 | 695ms | **PASS** |
| **VOUCH-03** | F. Vouchers | Eksekusi penebusan atomik melalui PostgreSQL RPC | Eksekusi RPC `redeem_voucher` dengan session & order ID | Usage count bertambah secara atomik, record tersimpan di `voucher_redemptions` | Penebusan atomik sukses di Supabase via RPC PostgreSQL | 697ms | **PASS** |
| **VOUCH-04** | F. Vouchers | Penolakan voucher tidak aktif atau kuota habis | Percobaan penebusan ulang voucher yang sudah habis kuotanya | API menolak penebusan dan mengembalikan error `VOUCHER_EXHAUSTED` | Penolakan berhasil, kuota terlindungi dari eksploitasi ganda | 2920ms | **PASS** |
| **TKT-01** | G. Prepaid | Generate batch tiket prabayar dan tebus tiket | Buat batch 1 tiket, tebus via `POST /api/ticket/redeem` | Status tiket berubah dari `AVAILABLE` ke `USED`, sesi tertaut | Tiket tervalidasi dan status sukses terupdate di DB tanpa pelanggaran constraint | 3092ms | **PASS** |
| **BOOTH-01** | H. Booth Fleet | Pemrosesan telemetri & heartbeat perangkat booth | Payload: app_version, camera_connected, paper_remaining=150 | Tabel `booths` terupdate kolom `last_seen_at` dan telemetry status | Telemetri berhasil diterima dan tersimpan di database | 494ms | **PASS** |
| **CONFIG-01** | I. Config Mgmt | Pengambilan manifest konfigurasi booth oleh Customer App | `GET /api/booths/[id]/config` | Mengembalikan manifest JSON lengkap: event, paket aktif, daftar bingkai 4R | Manifest lengkap dikembalikan dengan format sesuai spesifikasi Electron | 3322ms | **PASS** |
| **TRX-01** | J. Trx & Sessions | Pembuatan sesi dan tautan transaksi pembayaran | Insert `sessions` dan `transactions` dengan UUID valid | Foreign key antara sesi dan transaksi terhubung dengan status konsisten | Sesi dan transaksi berhasil ditautkan secara konsisten di Supabase | 240ms | **PASS** |
| **PRINT-01** | K. Print Jobs | Pembuatan antrean cetak dan update status siklus hidup | Insert print job -> `PENDING`, update ke `COMPLETED` | Perubahan status tercatat di tabel `print_jobs` | Antrean cetak berhasil diproses dan status terupdate | 1427ms | **PASS** |
| **GAL-01** | L. Digital Gallery | Pendaftaran galeri digital dan akses web viewer publik | Daftarkan aset foto digital -> akses `/gallery/[session_number]` | Web viewer menampilkan layout foto, opsi unduh foto, dan link QR code | Galeri web pelanggan dapat dibuka dan merender gambar secara publik | 2068ms | **PASS** |
| **R2-01** | M. Cloudflare R2 | Upload media biner via Storage Adapter | Buffer biner PNG 1x1 pixel dikirim ke bucket `popcut-media` | File biner tersimpan di R2 dan dapat diakses melalui URL publik CDN | Storage adapter berhasil mengunggah file ke R2 dan menghasilkan URL valid | 1491ms | **PASS** |
| **LOG-01** | N. Activity Logs | Perekaman jejak audit sistem ke tabel `activity_logs` | Insert audit log: actor, action, entity_type, description | Log tersimpan immutable di tabel `activity_logs` untuk audit jejak admin | Audit log terverifikasi tersimpan di Supabase dengan timestamp akurat | 85ms | **PASS** |
| **CROSS-01** | O. E2E Flow | Simulasi Alur Penuh Dua Aplikasi (Admin + Customer) | Alur terintegrasi: Konfig -> Penebusan -> Sesi -> Cetak -> Galeri | Seluruh tahapan bisnis terselesaikan berurutan tanpa diskrepansi data | Transaksi lengkap lintas aplikasi sukses tereksekusi dalam 2.57 detik | 2571ms | **PASS** |

---

## 2. Grafik Distribusi Waktu Eksekusi

```mermaid
xychart-beta
    title "Waktu Eksekusi Pengujian Integrasi (Milidetik)"
    x-axis ["AUTH", "DASH", "EVT", "PKG", "FRM-01", "FRM-02", "VOUCH", "TKT", "BOOTH", "CONFIG", "TRX", "PRINT", "GAL", "R2", "CROSS"]
    y-axis "Durasi (ms)" 0 --> 15000
    bar [4607, 166, 4417, 2073, 4356, 14056, 6608, 3092, 494, 3322, 240, 1427, 2068, 1491, 2571]
```

## 3. Kesimpulan Matriks

1. **Efisiensi Eksekusi:** Waktu rata-rata per panggilan API berkisar antara **150ms – 1200ms**, membuktikan latensi rendah koneksi Vercel Edge/Serverless Functions ke cluster Supabase.
2. **Kestabilan Database:** Tidak ditemukan adanya deadlocks, connection pool exhaustion, atau kesalahan tipe data selama eksekusi paralel maupun sekuensial.
3. **Kepatuhan Kontrak:** Semua respon JSON mematuhi kontrak antarmuka `{ success: boolean, data?: any, error?: string }` yang dibutuhkan oleh Customer Application Electron.
