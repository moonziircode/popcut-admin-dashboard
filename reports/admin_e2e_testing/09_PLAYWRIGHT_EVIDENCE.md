# BUKTI PENGUJIAN PLAYWRIGHT & DOKUMENTASI VISUAL UI

**Framework Pengujian:** Playwright Browser Automation (Chromium)  
**Viewport:** 1440 × 900 (Desktop Retina High-DPI)  
**Target URL:** `https://popcut-admin-dashboard.vercel.app`  
**Lokasi Penyimpanan Artefak:** `/Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/`  
**Audit Date:** 16 November 2026  
**Status Pengujian Visual:** **16/16 Modul Terverifikasi Visual Tanpa Cacat UI**

---

## 1. Ikhtisar Bukti Visual Playwright

Sebagai bagian dari mandat audit senior QA, pengujian visual antarmuka dilakukan secara nyata menggunakan browser Chromium untuk memverifikasi tata letak, rendering kartu data, grafik finansial, tabel operasional, modal dialog, formulir input, dan konsistensi tema gelap modern (*modern dark photobooth aesthetic*).

Seluruh 16 tangkapan layar beresolusi tinggi telah diambil dan tersimpan sebagai artefak pengujian permanen.

---

## 2. Katalog Bukti Tangkapan Layar (16 Modul)

| No | Modul / Halaman | Rute URL | Tautan File Artefak | Keterangan Verifikasi UI |
|:---:|---|---|---|---|
| **01** | **Dashboard Overview** | `/` | [e2e-01-dashboard-overview.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-01-dashboard-overview.png) | Kartu metrik pendapatan, sesi aktif, grafik tren mingguan, status armada |
| **02** | **Event Management** | `/events` | [e2e-02-events-management.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-02-events-management.png) | Tabel daftar acara, tombol buat event, status aktif/selesai, alokasi booth |
| **03** | **Packages & Pricing** | `/packages` | [e2e-03-packages-and-pricing.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-03-packages-and-pricing.png) | Katalog paket (Strip, Postcard 4R, Wide), harga, jumlah foto, kuota cetak |
| **04** | **Frames Library** | `/frames` | [e2e-04-frames-library.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-04-frames-library.png) | Galeri desain bingkai 4R, filter kategori, badge status DRAFT/PUBLISHED |
| **05** | **4R Frame Editor** | `/frames/editor` | [e2e-05-frame-editor-4r.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-05-frame-editor-4r.png) | Kanvas 4R interaktif, pengaturan koordinat slot foto, drag & resize, panel preview |
| **06** | **Promotions & Vouchers** | `/promotions` | [e2e-06-promotions-and-vouchers.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-06-promotions-and-vouchers.png) | Daftar voucher, kode promo, kuota terpakai, batas kedaluwarsa, tombol tambah promo |
| **07** | **Booths Fleet** | `/booths` | [e2e-07-booths-fleet.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-07-booths-fleet.png) | Status telemetri online/offline, indikator sisa kertas printer, heartbeat terakhir |
| **08** | **Transactions** | `/transactions` | [e2e-08-transactions.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-08-transactions.png) | Riwayat transaksi, nomor invoice, metode pembayaran (QRIS/Cash), status PAID |
| **09** | **Sessions** | `/sessions` | [e2e-09-sessions.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-09-sessions.png) | Tabel log sesi pemotretan, ID sesi, paket yang dipilih, durasi sesi |
| **10** | **Print Jobs** | `/print-jobs` | [e2e-10-print-jobs.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-10-print-jobs.png) | Antrean cetak printer thermal/sublimasi, jumlah strip, status PENDING/COMPLETED |
| **11** | **Digital Galleries** | `/galleries` | [e2e-11-digital-galleries.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-11-digital-galleries.png) | Daftar galeri digital aktif, jumlah unduhan pelanggan, tautan token publik |
| **12** | **Customer Gallery Viewer**| `/gallery/[id]` | [e2e-12-customer-gallery-viewer.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-12-customer-gallery-viewer.png) | Tampilan web publik pelanggan: preview 4R, tombol unduh file resolusi tinggi, QR code |
| **13** | **Business Reports** | `/reports` | [e2e-13-business-reports.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-13-business-reports.png) | Laporan performa finansial, filter rentang tanggal, grafik perbandingan omzet |
| **14** | **Settings** | `/settings` | [e2e-14-settings.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-14-settings.png) | Konfigurasi sistem bisnis, parameter printer, opsi watermark, integrasi cloud |
| **15** | **Users & Access (RBAC)**| `/users` | [e2e-15-users-and-access.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-15-users-and-access.png) | Manajemen akun staf dan admin, pengaturan peran (Admin, Operator, Finance) |
| **16** | **Activity Log** | `/activity-log` | [e2e-16-activity-log.png](file:///Users/aqsamuflihan/.gemini/antigravity/brain/3b09f7ed-44ec-471c-9ddd-9ec4b0024ee0/e2e-16-activity-log.png) | Jejak audit waktu-nyata, aktor perubahan, entitas termodifikasi, timestamp |

---

## 3. Rincian Temuan Visual Kunci

1. **Responsivitas & Layout:** Seluruh halaman Admin Dashboard menggunakan layout berbasis grid dan flexbox Tailwind yang rapi, dengan sidebar navigasi tetap (*fixed sidebar*) yang responsif.
2. **Keterbacaan Data:** Tabel data pada transaksi, sesi, dan print-jobs dilengkapi dengan paginasi, indikator badge berwarna untuk status (`SUCCESS` hijau, `PENDING` kuning, `FAILED` merah), memudahkan operator memantau kondisi booth secara sekilas.
3. **Modal Konfirmasi Tindakan Destruktif:** Tindakan penghapusan (seperti hapus frame atau deaktivasi event) menampilkan modal konfirmasi eksplisit dengan tombol peringatan berwarna merah untuk mencegah kesalahan klik operator.
4. **Tampilan Galeri Publik Pelanggan:** Web viewer galeri `/gallery/[id]` dioptimalkan untuk perangkat mobile smartphone dengan tombol unduh berukuran sentuh (*tap target*) yang besar dan tombol bagikan cepat.
