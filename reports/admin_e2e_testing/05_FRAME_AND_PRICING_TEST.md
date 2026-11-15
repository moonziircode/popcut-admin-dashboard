# LAPORAN PENGUJIAN FRAME MANAGEMENT 4R & LOGIKA PENETAPAN HARGA

**Target Modul:** Modul Frame Management (`/frames`), 4R Frame Editor (`/frames/editor`), dan Sinkronisasi Paket  
**Standar Bingkai:** Wajib 4R (1200 × 1800 px pada 300 DPI / 10,16 × 15,24 cm)  
**Layout Teruji:** 2 Slot, 3 Slot, 4 Slot, 6 Slot, dan 8 Slot  
**Audit Date:** 16 November 2026  
**Status Pengujian:** **100% PASS (Standarisasi 4R & Persistensi Koordinat Terpenuhi)**

---

## 1. Aturan Fundamental Standarisasi 4R

Sesuai dengan ketentuan inti sistem Popcut.id:
1. **Dimensi Tunggal 4R:** Seluruh desain bingkai yang diunggah dan dikelola sistem wajib berukuran 4R (resolusi acuan **1200 × 1800 piksel** untuk orientasi Portrait atau **1800 × 1200 piksel** untuk Landscape).
2. **Tidak Ada Ukuran Lain:** Sistem menolak ukuran 2R, 3R, 5R, atau A4.
3. **Canvas Bounds Restriction:** Semua slot foto wajib berada seutuhnya di dalam batas kanvas 4R `(0, 0, 1200, 1800)`.
4. **Output Cetak Konsisten:** Jumlah slot tidak mengubah ukuran kanvas cetak. Lembar hasil cetak fisik selalu berupa satu lembar foto 4R.

---

## 2. Diagram Visualisasi Layout Slot 4R (Portrait: 1200 × 1800 px)

```
+-------------------------------------------------------------+
|                     CANVAS 4R (1200 x 1800)                 |
|                                                             |
|  [2-SLOT POSTCARD]      [3-SLOT STRIP]     [4-SLOT GRID]    |
|  +---------------+      +------------+     +-----+ +-----+  |
|  |    SLOT 1     |      |   SLOT 1   |     | SL 1| | SL 2|  |
|  |  (1000 x 750) |      | (1000 x 480|     | (480 x 680) |  |
|  +---------------+      +------------+     +-----+ +-----+  |
|  |    SLOT 2     |      |   SLOT 2   |     | SL 3| | SL 4|  |
|  |  (1000 x 750) |      | (1000 x 480|     | (480 x 680) |  |
|  +---------------+      +------------+     +-----+ +-----+  |
|                         |   SLOT 3   |                      |
|                         +------------+                      |
|                                                             |
|  [6-SLOT COLLAGE]             [8-SLOT MINI-GRID]            |
|  +---+ +---+ +---+            +----+ +----+ +----+ +----+   |
|  | 1 | | 2 | | 3 |            | 1  | | 2  | | 3  | | 4  |   |
|  +---+ +---+ +---+            +----+ +----+ +----+ +----+   |
|  | 4 | | 5 | | 6 |            | 5  | | 6  | | 7  | | 8  |   |
|  +---+ +---+ +---+            +----+ +----+ +----+ +----+   |
+-------------------------------------------------------------+
```

---

## 3. Hasil Pengujian Koordinat Slot (FRM-01 & FRM-02)

Pengujian dilakukan secara langsung dengan membuat record bingkai 4R dan menyimpan variasi koordinat slot melalui API `PUT /api/frames/[id]`, kemudian memverifikasi datanya langsung di tabel `frame_slots` Supabase:

| Layout Slot | Jumlah Slot | Skema Koordinat Uji (x, y, w, h) | Constraint Bounds Check | Status DB |
|:---:|:---:|---|:---:|:---:|
| **2 Slot** | 2 | Slot 1: `(100, 100, 1000, 780)`<br>Slot 2: `(100, 900, 1000, 780)` | Memenuhi batas 1200x1800 | **PASS** |
| **3 Slot** | 3 | Slot 1: `(100, 100, 1000, 513)`<br>Slot 2: `(100, 633, 1000, 513)`<br>Slot 3: `(100, 1166, 1000, 513)` | Memenuhi batas 1200x1800 | **PASS** |
| **4 Slot (Grid)** | 4 | Slot 1: `(80, 120, 480, 680)`<br>Slot 2: `(640, 120, 480, 680)`<br>Slot 3: `(80, 880, 480, 680)`<br>Slot 4: `(640, 880, 480, 680)` | Memenuhi batas 1200x1800 | **PASS** |
| **6 Slot** | 6 | 2 Kolom x 3 Baris: Tiap slot `(w: 480, h: 480)` tersusun rapi dengan margin 40px | Memenuhi batas 1200x1800 | **PASS** |
| **8 Slot** | 8 | 2 Kolom x 4 Baris: Tiap slot `(w: 480, h: 360)` tersusun simetris | Memenuhi batas 1200x1800 | **PASS** |

### Perbaikan Khusus Normalisasi Indeks Slot:
Pada skema `frame_slots`, terdapat batasan `UNIQUE (frame_version_id, slot_index)`. Diperbaiki penanganan normalisasi 1-based index (`typeof s.slot_index === 'number' && s.slot_index > 0 ? s.slot_index : idx + 1`) pada API `PUT /api/frames/[id]` sehingga menjamin tidak pernah terjadi tabrakan indeks (`1, 2, 3, ..., N`).

---

## 4. Logika Penetapan Harga Berbasis Slot & Cetak Ekstra (FRM-03)

Sistem Popcut.id menerapkan kalkulasi harga berjenjang (*tiered pricing*) yang mempertimbangkan:
1. **Base Package Price:** Harga paket dasar yang mencakup jumlah foto tertentu dan kuota cetak bawaan (misal: 2 lembar strip).
2. **Additional Prints Rate:** Biaya cetak tambahan per lembar yang dipilih pelanggan di layar review photobooth.
3. **Diskon Promosi:** Potongan harga dari voucher yang divalidasi.

### Rumus Kalkulasi Tagihan Transaksi:
$$\text{Total Tagihan} = \text{Harga Paket} + (\text{Lembar Cetak Tambahan} \times \text{Tarif Cetak Ekstra}) - \text{Diskon}$$

### Kasus Uji Validasi Matematika:
- **Paket:** Standard 4-Slot Quad (Rp50.000, termasuk 2 lembar cetak)
- **Tambahan Cetak:** 2 lembar ekstra (@ Rp25.000/lembar = Rp50.000)
- **Voucher Diskon:** 20% dari subtotal (Rp100.000 × 20% = Rp20.000)
- **Kalkulasi Sistem:**
  $$\text{Subtotal} = 50.000 + 50.000 = 100.000$$
  $$\text{Payable Amount} = 100.000 - 20.000 = 80.000$$
- **Hasil Pengujian:** Kalkulasi tervalidasi 100% konsisten antara Admin Dashboard, Supabase Database, dan Customer Application.

---

## 5. Ringkasan Kepatuhan Frame

| Aspek Pengujian | Parameter Acuan | Status Audit |
|---|---|:---:|
| **Rasio Aspek** | 2:3 (Portrait) atau 3:2 (Landscape) | **PATUH** |
| **Resolusi Baku** | 1200 × 1800 piksel (DPI: 300) | **PATUH** |
| **Integritas Slot** | Bounded in canvas, no negative coordinates | **PATUH** |
| **Penyimpanan Storage** | Supabase Storage (`frames`) & Cloudflare R2 | **PATUH** |
| **Sinkronisasi Booth** | Terkirim via manifest `/api/booths/[id]/config` | **PATUH** |
