# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Popcut.id — Admin Dashboard

**Versi:** 2.0  
**Status:** Spesifikasi produk dan teknis untuk implementasi  
**Tanggal:** 15 November 2026  
**Platform:** Progressive Web Application (PWA)  
**Deployment:** Vercel  
**Backend:** Supabase  
**Database:** Supabase PostgreSQL  
**Storage:** Supabase Storage  
**Produk terintegrasi:** Popcut.id Customer Application (Electron Desktop App)

---

# 1. Ringkasan Produk

Popcut.id Admin Dashboard adalah aplikasi internal untuk mengelola konfigurasi, aset, transaksi, dan operasional bisnis photobooth Popcut.id.

Admin Dashboard merupakan aplikasi terpisah dari Customer Application. Keduanya menggunakan satu backend Supabase dan satu model data yang terintegrasi.

- **Admin Dashboard:** mengelola paket, harga, frame, promosi, voucher, prepaid ticket, booth, transaksi, sesi, print job, laporan, dan pengaturan.
- **Customer Application:** menjalankan sesi foto, mengendalikan kamera dan printer melalui integrasi lokal di MacBook, merender frame, menyimpan file, serta mengelola proses cetak.
- **Supabase:** menjadi sumber data utama untuk akun, konfigurasi, katalog, transaksi, metadata sesi, metadata file, dan sinkronisasi.
- **Local Booth Storage:** menyimpan konfigurasi dan frame aktif, foto, hasil editing, antrean cetak, serta data pemulihan agar booth tetap berjalan saat internet terputus.
- **Vercel:** melakukan hosting dan deployment Admin Dashboard PWA.

Prinsip utama: dashboard harus terasa ringan, sederhana, cepat dipahami, dan tidak dipenuhi tulisan. Kompleksitas sistem ditangani di backend; pengguna hanya melihat informasi dan tindakan yang diperlukan.

## 1.1 Tujuan

1. Mengelola seluruh katalog paket dan harga yang digunakan Customer Application.
2. Mengelola frame PNG secara visual, termasuk slot foto dan versi desain.
3. Mengelola promosi, voucher, dan prepaid ticket.
4. Mengelola satu atau beberapa booth.
5. Memantau transaksi, sesi, galeri digital, dan print job.
6. Menerbitkan konfigurasi yang dapat diunduh dan digunakan Customer Application.
7. Memantau status sinkronisasi konfigurasi dan aset pada setiap booth.
8. Mengelola file master frame di cloud dan mendistribusikannya ke penyimpanan lokal booth.
9. Menyediakan laporan bisnis yang konsisten.
10. Menjadi fondasi integrasi Customer Application tanpa perlu mengubah struktur database secara besar.

## 1.2 Prinsip Produk

- Minimal: hanya tampilkan informasi yang relevan.
- Simple: label pendek, bahasa jelas, form seperlunya.
- Fast: tugas umum dapat dilakukan dalam sedikit langkah.
- Visual-first: gunakan thumbnail dan preview untuk aset visual.
- Local-first at booth: sesi foto dan cetak tidak bergantung pada kecepatan cloud.
- Cloud-managed: konfigurasi dan aset dikelola dari dashboard.
- Safe by default: perubahan penting tervalidasi, berversi, dan tercatat.
- Customer-ready: setiap data yang dibutuhkan Customer Application memiliki kontrak yang jelas.
- Scalable: mulai dari satu booth, tanpa mengunci desain untuk satu perangkat saja.

---

# 2. Ruang Lingkup

## 2.1 Termasuk

1. Authentication dan user management.
2. Role-based access control.
3. Overview dashboard.
4. Packages & Pricing.
5. Additional Print Pricing.
6. Frame Management.
7. Frame Editor dan photo-slot mapping.
8. Frame Categories.
9. Promotions & Vouchers.
10. Prepaid Tickets.
11. Booth Management.
12. Configuration Management dan Publishing.
13. Asset Sync Management.
14. Transactions.
15. Sessions.
16. Print Jobs.
17. Digital Gallery Monitoring.
18. Reports.
19. Settings.
20. Activity Log dan Audit Trail.
21. Supabase Storage management.
22. PWA installability dan offline shell.
23. Deployment melalui Vercel.

## 2.2 Tidak Termasuk

- Customer-facing photo session.
- Live View atau kontrol kamera.
- Pengambilan foto dan retake.
- Editing foto pelanggan.
- Kontrol langsung printer.
- Pengiriman perintah hardware dari browser Admin.
- Sistem akuntansi lengkap.
- Payroll, inventory umum, atau CRM umum.
- Payment gateway tertentu sebelum provider dipilih.
- Pengelolaan file lokal MacBook secara langsung dari Admin Dashboard.

Admin Dashboard memantau proses kamera dan printer melalui status yang dilaporkan Customer Application/Local Runtime. Perintah kamera dan cetak dijalankan di booth, bukan di browser Admin.

---

# 3. Arsitektur Sistem

## 3.1 Gambaran Arsitektur

```text
                    ADMIN / OWNER
                         |
                         v
              Popcut.id Admin Dashboard
                    Next.js PWA
                         |
                  HTTPS / Supabase SDK
                         |
                         v
              SUPABASE PROJECT (SHARED)
       +--------------------------------------+
       | Supabase Auth                        |
       | PostgreSQL Database                  |
       | Row Level Security                   |
       | Storage: frames / assets / galleries |
       | Edge Functions / Database RPC        |
       | Realtime (status & notifications)    |
       +--------------------------------------+
                         |
               Versioned API / Sync Contract
                         |
                         v
               POPCUT BOOTH (MACBOOK)
                Customer Desktop App
                    Electron
                         |
             Local SQLite + Local Files
                         |
             Camera Adapter / Print Adapter
                         |
                 DSLR + Printer
```

## 3.2 Prinsip Arsitektur

- Admin Dashboard dan Customer Application menggunakan Supabase project yang sama.
- Kedua aplikasi tidak boleh membuat skema database masing-masing yang saling berbeda.
- PostgreSQL menjadi sumber data utama untuk data bisnis dan konfigurasi terpublikasi.
- Customer Application menyimpan salinan lokal untuk operasional booth.
- Supabase Storage menyimpan master frame dan file cloud yang memang perlu tersedia online.
- Frame aktif diunduh ke MacBook dan dirender dari disk lokal; jangan mengambil frame dari cloud setiap sesi.
- Data sensitif dan operasi kritis harus melewati backend, database function, atau Edge Function.
- Perangkat booth hanya menerima konfigurasi dan aset yang ditujukan untuk Booth ID tersebut.
- Admin PWA tidak berkomunikasi langsung dengan kamera/printer.

## 3.3 Sumber Kebenaran Data

| Jenis data | Sumber utama | Salinan lokal |
|---|---|---|
| User dan role | Supabase | Session cache seperlunya |
| Paket dan harga terpublikasi | Supabase | SQLite booth |
| Frame master dan versi | Supabase Storage + DB | SSD booth |
| Config version | Supabase | SQLite booth |
| Transaksi | Supabase | Local queue untuk transaksi yang belum tersinkron, sesuai aturan |
| Sesi | Supabase metadata | SQLite booth |
| Foto asli dan hasil render | Storage/local policy | SSD booth sebagai penyimpanan kerja |
| Print job | Supabase metadata | Local print queue |
| Status perangkat | Heartbeat dari booth | Status terakhir |
| Audit log | Supabase | Tidak menjadi sumber utama di lokal |

---

# 4. Teknologi dan Standar Implementasi

## 4.1 Frontend Admin

- Next.js dengan App Router.
- React.
- TypeScript strict mode.
- Tailwind CSS.
- shadcn/ui atau komponen setara.
- React Hook Form untuk form.
- Zod untuk validasi schema.
- TanStack Table untuk tabel data jika diperlukan.
- Library image preview/canvas yang mendukung drag dan resize untuk Frame Editor.
- Supabase JavaScript Client.
- PWA manifest dan service worker melalui solusi yang kompatibel dengan versi Next.js yang dipilih.

Versi dependency harus dikunci melalui lockfile. Jangan menggunakan package yang tidak terpelihara atau menambahkan library besar tanpa kebutuhan.

## 4.2 Backend

Gunakan Supabase sebagai backend utama:

- Supabase PostgreSQL: relational database.
- Supabase Auth: autentikasi pengguna Admin.
- Supabase Storage: file frame dan aset cloud.
- Row Level Security (RLS): otorisasi di level database.
- Database Functions/RPC: operasi atomik dan aturan bisnis yang memerlukan transaksi.
- Supabase Edge Functions: endpoint server-side untuk operasi yang memerlukan secret, integrasi eksternal, signed URL, webhook, atau validasi kompleks.
- Supabase Realtime: notifikasi status booth, sinkronisasi, dan perubahan status yang relevan.

Tidak semua operasi harus memakai Realtime. Gunakan polling ringan untuk data yang tidak membutuhkan pembaruan instan.

## 4.3 Deployment

- Hosting frontend: Vercel.
- Repository: Git.
- Deployment production dari branch production/main yang ditentukan.
- Preview deployment untuk pull request.
- Domain produksi menggunakan HTTPS.
- Environment variables dikelola di Vercel.
- Supabase migration disimpan dalam repository dan diterapkan melalui proses deployment database terpisah/terkontrol.
- Jangan mengandalkan perubahan schema manual langsung di production.

## 4.4 Prinsip Integrasi Supabase

- Gunakan Supabase Auth untuk sesi login.
- Gunakan publishable/anon key pada client hanya dengan RLS aktif dan benar.
- `service_role` key hanya boleh berada di server/Edge Function; tidak boleh masuk bundle browser, localStorage, source map, atau repository.
- Operasi sensitif tidak boleh bergantung pada validasi UI saja.
- Gunakan database constraints, foreign keys, unique constraints, check constraints, dan transaksi.
- Gunakan UUID sebagai primary key untuk entitas utama.
- Simpan waktu dalam `timestamptz` UTC; tampilkan sesuai zona waktu bisnis.
- Harga disimpan sebagai integer Rupiah, bukan floating point.
- Semua tabel operasional memiliki `created_at` dan `updated_at` bila relevan.
- Gunakan soft archive untuk data yang sudah pernah digunakan transaksi.
- Semua perubahan schema melalui SQL migrations yang dapat diulang dan direview.

---

# 5. PWA dan Pengalaman Penggunaan

Admin Dashboard wajib menjadi PWA yang dapat di-install pada browser/perangkat yang mendukung.

## 5.1 Installability

Sediakan `manifest.webmanifest` dengan:
- `name`: Popcut.id Admin.
- `short_name`: Popcut Admin.
- `start_url`.
- `scope`.
- `display: standalone`.
- `theme_color`.
- `background_color`.
- Icon 192×192.
- Icon 512×512.
- Maskable icon.

Tampilkan instruksi instalasi yang sesuai browser jika instalasi tidak dapat dipicu langsung.

## 5.2 Service Worker dan Cache

- Cache application shell, icon, font, CSS, JS, dan aset statis yang versioned.
- Cache-first untuk aset statis dengan hash.
- Network-first untuk data operasional yang perlu aktual.
- Jangan cache response berisi token, secret, data pembayaran sensitif, atau data pribadi yang tidak dibutuhkan.
- Jangan cache respons API privat secara luas.
- Cache memiliki versioning dan invalidasi saat deployment.
- Update aplikasi diberitahukan kepada pengguna dan diterapkan dengan aman.

## 5.3 Offline Mode

Ketika offline:
- Dashboard tetap dapat membuka application shell.
- Tampilkan indikator offline yang jelas.
- Tampilkan timestamp data terakhir tersinkron jika menampilkan data cache.
- Data yang ditampilkan dari cache harus diberi label “Data terakhir tersinkron”.
- Semua operasi publish, perubahan harga, generate voucher, perubahan role, koreksi transaksi, dan tindakan finansial membutuhkan koneksi online.
- Jangan menyatakan perubahan berhasil sebelum server mengonfirmasi.
- Tidak perlu membuat antrean offline untuk tindakan admin yang berisiko tinggi.
- Jika draft form disimpan lokal, beri label Draft lokal dan jangan menyamarkannya sebagai data tersimpan di server.

## 5.4 Acceptance Criteria PWA

1. Bisa diakses melalui browser desktop dan mobile yang didukung.
2. Dapat di-install sebagai PWA.
3. Dapat dibuka dalam mode standalone jika platform mendukung.
4. Application shell terbuka kembali saat offline setelah pernah diakses online.
5. Offline state terlihat jelas.
6. Data cache memiliki timestamp.
7. Tindakan yang memerlukan server tidak dapat diproses offline.
8. Update versi tidak membuat cache lama terus digunakan.
9. Logout membersihkan cache data privat yang relevan.
10. PWA diuji pada browser target sebelum production.

---

# 6. UI/UX dan Design System

## 6.1 Arah Visual

Minimal, modern, profesional, dan tenang. Dashboard adalah alat kerja, bukan landing page promosi.

- Background netral.
- Surface putih/abu terang.
- Border tipis.
- Shadow sangat ringan.
- Aksen brand Popcut.id secukupnya.
- Tidak menggunakan gradient dekoratif berlebihan.
- Tidak menggunakan ilustrasi besar yang tidak membantu tugas.
- Hindari paragraf panjang dan label teknis di layar operasional.

## 6.2 Palet Awal

| Elemen | Token awal |
|---|---|
| Background | `#F7F7F5` |
| Surface | `#FFFFFF` |
| Primary text | `#202020` |
| Secondary text | `#777777` |
| Border | `#E8E8E5` |
| Brand accent | `#D9E83F` (dapat disesuaikan identitas final) |
| Success | Green |
| Warning | Amber |
| Error | Red |

Warna status harus konsisten. Jangan memakai banyak warna untuk dekorasi.

## 6.3 Typography

Gunakan Inter, Geist, atau Plus Jakarta Sans. Pilih satu keluarga font utama.

- Judul halaman singkat.
- Label field singkat.
- Deskripsi maksimal satu kalimat jika memungkinkan.
- Angka penting mudah dipindai.
- Hindari teks kecil yang sulit dibaca.

## 6.4 Layout

- Desktop-first.
- Sidebar ringkas dan dapat diciutkan.
- Header berisi nama halaman, breadcrumb bila perlu, dan menu akun.
- Konten menggunakan lebar yang nyaman.
- Mobile mendukung monitoring dan tindakan sederhana.
- Frame Editor dan tabel kompleks paling optimal di desktop.

## 6.5 Aturan UX

1. Satu halaman memiliki satu tujuan utama.
2. Satu tombol utama per konteks.
3. Aksi sekunder masuk menu overflow atau tombol sekunder.
4. Gunakan default yang masuk akal.
5. Hindari form panjang; pecah menjadi bagian kecil.
6. Gunakan preview sebelum publish.
7. Tampilkan validasi dekat field.
8. Konfirmasi hanya untuk tindakan berdampak besar.
9. Gunakan autosave draft bila aman.
10. Tampilkan empty state dengan satu arahan tindakan.
11. Gunakan tabel untuk data yang perlu dicari/dibandingkan.
12. Gunakan grid untuk frame dan aset visual.
13. Status harus memakai label teks, bukan warna saja.
14. Jangan menampilkan informasi teknis yang tidak dibutuhkan pengguna.
15. Sediakan pencarian/filter untuk daftar yang berkembang.

## 6.6 Komponen

- Sidebar.
- Header.
- Page title.
- Search.
- Filter bar.
- Data table.
- Card.
- Status badge.
- Modal.
- Drawer.
- Form field.
- Upload dropzone.
- Image preview.
- Frame canvas.
- Pagination.
- Toast.
- Skeleton.
- Empty state.
- Offline banner.
- Confirmation dialog.

---

# 7. Navigasi

```text
POPCUT.ID
│
├── Overview
│
├── BUSINESS
│   ├── Packages
│   ├── Frames
│   ├── Promotions
│   └── Prepaid Tickets
│
├── OPERATIONS
│   ├── Transactions
│   ├── Sessions
│   ├── Print Jobs
│   └── Booths
│
├── INSIGHTS
│   └── Reports
│
└── SYSTEM
    ├── Settings
    ├── Users & Access
    └── Activity Log
```

Menu Configuration & Sync dapat ditempatkan di Booths atau System agar navigasi tidak terlalu panjang.

Ketentuan:
- Sidebar dapat diciutkan.
- Gunakan ikon konsisten dan label pendek.
- Breadcrumb hanya pada halaman bertingkat.
- Jangan menampilkan menu yang belum aktif.
- Global search dapat ditambahkan setelah jumlah data cukup besar.

---

# 8. Authentication, Users, Roles, dan Permission

## 8.1 Authentication

- Supabase Auth email/password untuk tahap awal.
- Email invitation atau pembuatan user oleh Owner.
- Password reset melalui alur resmi Supabase.
- Session refresh ditangani Supabase client.
- Logout harus mengakhiri sesi dan membersihkan data privat lokal yang relevan.
- MFA dapat diaktifkan untuk Owner ketika siap production.
- Jangan membuat login Admin sendiri yang menyimpan password plaintext.

## 8.2 Roles

Role awal:
- Owner.
- Admin.
- Staff.

## 8.3 Matriks Hak Akses

| Modul | Owner | Admin | Staff |
|---|---|---|---|
| Overview | Full | View | View terbatas |
| Packages | Full | Manage | View |
| Frames | Full | Manage | View |
| Promotions | Full | Manage sesuai izin | View |
| Prepaid Tickets | Full | Manage sesuai izin | View |
| Transactions | Full | View/operasional | View terbatas |
| Sessions | Full | View/manage terbatas | View |
| Print Jobs | Full | View/reprint sesuai izin | View |
| Booths | Full | Manage | View |
| Reports | Full | View/export sesuai izin | View terbatas |
| Settings | Full | Terbatas | No |
| Users & Access | Full | No/terbatas | No |
| Activity Log | Full | View | No |

Permission harus dapat diperluas tanpa mengubah seluruh frontend.

## 8.4 Audit Log

Catat:
- actor user ID.
- action.
- entity/table.
- record ID.
- before/after untuk perubahan yang relevan.
- reason untuk tindakan sensitif.
- timestamp.
- request/correlation ID.
- sumber tindakan jika diketahui.

Audit log append-only untuk pengguna aplikasi. Pengguna biasa tidak boleh mengubah atau menghapus log.

---

# 9. Overview Dashboard

## 9.1 Tujuan

Menampilkan kondisi bisnis dan operasional secara singkat.

## 9.2 KPI

- Revenue hari ini.
- Sesi hari ini.
- Transaksi berhasil.
- Transaksi pending/bermasalah.
- Strip/lembar cetak.
- Booth online/offline.

## 9.3 Bagian Tambahan

- Grafik revenue berdasarkan periode.
- Transaksi terbaru.
- Sesi terbaru.
- Status booth.
- Peringatan sinkronisasi.
- Print job bermasalah.
- Galeri yang gagal di-upload jika metrik tersedia.

## 9.4 Filter

- Hari ini.
- 7 hari terakhir.
- Bulan ini.
- Custom date range.
- Booth.

## 9.5 Aturan

- Angka berasal dari query/view backend yang terdefinisi.
- Tampilkan last updated.
- Pending/failed tidak dihitung sebagai paid revenue.
- Voucher gratis tidak dihitung sebagai penerimaan uang.
- Jika data gagal dimuat, tampilkan error; jangan menampilkan nol seolah tidak ada transaksi.

---

# 10. Packages & Pricing

## 10.1 Tujuan

Mengelola paket yang ditampilkan pada Customer Application.

## 10.2 Field Paket

| Field | Tipe/Keterangan |
|---|---|
| id | UUID |
| code | Kode unik internal |
| name | Nama paket |
| description | Deskripsi pendek |
| price_idr | Harga integer Rupiah |
| photo_count | Jumlah foto |
| included_strip_count | Strip termasuk |
| includes_live_photo | Boolean |
| includes_digital_files | Boolean |
| frame_category_ids | Kategori frame yang diizinkan |
| frame_ids | Opsional: frame spesifik |
| display_order | Urutan tampilan |
| is_active | Status penjualan |
| published_version | Versi konfigurasi |

## 10.3 Fitur

- Create.
- Edit.
- Duplicate.
- Preview customer card.
- Publish.
- Archive.
- Reorder.
- Aktif/nonaktif.

## 10.4 Aturan

- Harga tidak boleh negatif.
- Jumlah foto dan strip harus integer valid.
- Paket yang pernah dipakai tidak dihapus permanen.
- Perubahan paket berlaku untuk sesi baru setelah publish dan sync.
- Sesi yang sudah dibuat menyimpan snapshot paket, harga, fasilitas, dan frame eligibility.
- Perubahan harga tidak mengubah transaksi lama.
- Customer Application hanya menerima paket aktif yang ditargetkan untuk booth tersebut.

## 10.5 Additional Print Pricing

Konfigurasi:
- Harga per strip atau per unit tambahan.
- Minimum quantity.
- Quantity increment.
- Maximum quantity (opsional).
- Package eligibility.
- Active period jika dibutuhkan.

Contoh: paket mengizinkan tambahan 2 strip per pembelian. Perhitungan harga dilakukan backend dan disimpan sebagai snapshot transaksi tambahan.

---

# 11. Frame Management

## 11.1 Tujuan

Mengelola frame yang digunakan Customer Application.

## 11.2 Daftar Frame

Gunakan grid visual. Setiap kartu menampilkan:
- Thumbnail.
- Nama.
- Kategori.
- Rasio/dimensi ringkas.
- Jumlah slot.
- Status Draft/Published/Archived.
- Menu tindakan.

Filter kategori, status, dan pencarian nama.

## 11.3 Upload

Format utama PNG dengan alpha transparency.

Validasi:
- MIME type dan ekstensi.
- Ukuran file maksimum yang dapat dikonfigurasi.
- Dimensi gambar.
- File dapat dibaca.
- Alpha channel jika frame mensyaratkannya.
- Rasio sesuai canvas output.
- Nama file dinormalisasi dan tidak menjadi path bebas.

Flow:
1. Pilih atau drop file.
2. Upload ke Storage bucket privat.
3. Validasi metadata.
4. Generate thumbnail.
5. Simpan metadata frame.
6. Buka Frame Editor.
7. Simpan sebagai Draft.
8. Preview.
9. Publish sebagai versi baru.

Upload yang gagal tidak boleh meninggalkan frame Published tanpa file yang valid.

## 11.4 Frame Editor

Fitur:
- Canvas sesuai ukuran/rasio output.
- Add/select photo slot.
- Drag posisi.
- Resize slot.
- Input koordinat presisi.
- Set fit mode: cover/contain.
- Atur slot order.
- Preview dengan foto contoh.
- Zoom/pan canvas.
- Undo/redo dasar jika memungkinkan.
- Save Draft.
- Publish.

## 11.5 Slot Schema

Setiap slot memiliki:
- slot_id.
- frame_version_id.
- order_index.
- x.
- y.
- width.
- height.
- rotation (default 0).
- fit_mode.
- optional crop parameters.

Koordinat dinormalisasi terhadap canvas (0–1) atau menggunakan satu sistem koordinat resolusi desain yang dikonversi secara konsisten. Rekomendasi: normalized coordinates agar editor responsif.

## 11.6 Validasi

Sebelum publish:
- Semua slot berada di dalam canvas.
- Width/height lebih besar dari nol.
- Tidak ada slot yang tidak sengaja berada di luar area.
- Asset valid.
- Preview berhasil dirender.
- Output dimensions/aspect ratio sesuai format yang didukung Customer Application.
- Frame memiliki konfigurasi slot yang lengkap.

## 11.7 Kategori

Admin dapat membuat, mengubah, mengurutkan, mengaktifkan, dan mengarsipkan kategori. Kategori yang masih digunakan tidak dihapus permanen.

## 11.8 Versioning

- Setiap publish menghasilkan immutable Frame Version.
- Asset file pada versi Published tidak boleh ditimpa.
- Perubahan dilakukan dengan membuat versi baru.
- Sesi menyimpan frame_version_id.
- Booth hanya mengunduh versi yang dipublikasikan dan ditargetkan.
- Versi lama tetap tersedia sesuai kebijakan retensi dan referensi sesi.

---

# 12. Promotions & Vouchers

## 12.1 Jenis

- Percentage discount.
- Fixed amount discount.
- 100% free.

## 12.2 Field

- name.
- code atau code batch.
- discount_type.
- discount_value.
- start_at.
- end_at.
- total_usage_limit.
- per_customer_limit.
- applicable_package_ids.
- applicable_booth_ids (opsional).
- minimum_purchase_idr.
- stacking_allowed (default false).
- status.

## 12.3 Fitur

- Buat kode manual.
- Generate kode otomatis.
- Generate batch.
- Tentukan periode.
- Tentukan kuota.
- Tentukan batas per customer.
- Pilih paket dan booth.
- Enable/disable.
- Lihat redemption.
- Export daftar kode dengan permission.

## 12.4 Aturan

- Kode unik dan dinormalisasi.
- Validasi periode dan kuota dilakukan server-side.
- Diskon tidak melebihi batas harga transaksi.
- Diskon gratis 100% menghasilkan payable amount Rp0.
- Default satu voucher per transaksi.
- Perubahan promo tidak mengubah transaksi yang sudah confirmed.
- Redemption harus atomik menggunakan database transaction/RPC.
- Race condition tidak boleh menyebabkan kuota terpakai melebihi limit.
- Simpan snapshot aturan diskon pada transaksi.

---

# 13. Prepaid Tickets

## 13.1 Tujuan

Mengelola kode sesi yang telah dibayar sebelumnya melalui penjualan tiket, event, partnership, atau giveaway.

## 13.2 Data

- ticket_id.
- batch_id.
- code_hash atau token aman.
- package_id.
- valid_from.
- valid_until.
- usage_limit (default 1).
- used_count.
- status.
- claimed_session_id.
- claimed_at.
- applicable_booth_ids jika diperlukan.

Kode yang dapat dilihat/export harus dibatasi dan tidak disimpan sebagai plaintext jika desain token memungkinkan hashing.

## 13.3 Fitur

- Create batch.
- Generate code.
- Pilih paket.
- Atur masa berlaku.
- Atur jumlah penggunaan.
- Pilih booth.
- Export daftar kode saat dibuat.
- Lihat available/used/expired/disabled.
- Disable kode yang belum digunakan.

## 13.4 Aturan

- Kode unik.
- Default single-use.
- Claim atomik.
- Satu ticket tidak boleh diklaim oleh dua sesi.
- Setiap claim terhubung ke Session ID.
- Offline redemption default tidak diizinkan sampai mekanisme signed entitlement, anti-replay, dan conflict resolution dirancang serta diuji.
- Redemption tidak boleh dihitung sebagai pendapatan baru pada saat digunakan jika pembayaran sudah diterima saat tiket dijual.

---

# 14. Booth Management

## 14.1 Tujuan

Mengelola dan memantau setiap unit booth.

## 14.2 Data Booth

- booth_id.
- booth_code.
- name.
- location_label.
- status.
- app_version.
- last_seen_at.
- last_sync_at.
- current_config_version_id.
- target_config_version_id.
- camera_status.
- printer_status.
- local_storage_status.
- pending_upload_count.
- pending_print_count.
- device_reported_at.

## 14.3 Status

- ONLINE.
- OFFLINE.
- DEGRADED.
- NEEDS_ATTENTION.
- DISABLED.

Status harus diturunkan dari heartbeat dan device report dengan batas waktu yang dapat dikonfigurasi. Jangan menganggap booth online hanya karena record pernah dibuat.

## 14.4 Fitur

- Create booth.
- Edit nama/lokasi.
- Activate/deactivate.
- Assign config.
- Assign frame/package availability.
- View device status.
- View app version.
- View last seen.
- View last sync.
- View pending asset sync.
- View local storage warning.
- Regenerate/revoke device credential dengan alur aman.

## 14.5 Pairing Booth

- Setiap booth memiliki identitas unik.
- Provisioning token hanya berlaku satu kali atau dalam periode pendek.
- Token ditukar melalui endpoint server menjadi credential perangkat.
- Credential booth tidak boleh menggunakan Supabase service_role key.
- Credential dapat direvoke.
- Heartbeat ditandatangani atau diautentikasi.
- Jangan menyimpan device secret dalam log.

---

# 15. Configuration Management & Publishing

## 15.1 Tujuan

Menjamin Customer Application menggunakan konfigurasi bisnis yang benar dan berversi.

## 15.2 Objek Konfigurasi

Konfigurasi yang dapat dipublikasikan meliputi:
- Paket aktif.
- Harga.
- Additional print pricing.
- Frame dan Frame Version.
- Kategori frame.
- Promotion yang ditargetkan.
- Prepaid rules.
- Customer-facing labels.
- Gallery settings yang aman untuk customer app.
- Print layout options yang didukung.
- Booth-specific availability.

## 15.3 Status

- DRAFT.
- PUBLISHED.
- ARCHIVED.

Status sinkronisasi per booth:
- PENDING.
- DOWNLOADING.
- APPLIED.
- FAILED.
- OUTDATED.

## 15.4 Publish Flow

1. Admin mengubah data.
2. Perubahan disimpan sebagai Draft.
3. Sistem memvalidasi relasi dan asset.
4. Admin melihat preview.
5. Admin memilih target booth atau semua booth.
6. Admin menekan Publish.
7. Backend membuat immutable Config Version.
8. Booth menerima notifikasi atau memeriksa versi terbaru.
9. Booth mengunduh manifest dan aset yang diperlukan.
10. Booth memverifikasi checksum dan ukuran file.
11. Booth menyimpan versi baru secara lokal.
12. Booth mengaktifkan konfigurasi baru secara atomik.
13. Booth mengirim acknowledgement ke backend.
14. Admin melihat status APPLIED.

## 15.5 Snapshot Sesi

- Sesi baru mengacu pada config_version_id yang berlaku saat sesi dimulai.
- Snapshot menyimpan nilai paket, harga, fasilitas, frame version, dan aturan yang memengaruhi sesi.
- Perubahan publish tidak mengubah sesi aktif.
- Booth offline tetap memakai versi terakhir yang berhasil diterapkan.
- Config baru tidak boleh menghapus aset versi lama yang masih direferensikan sesi/print job.

## 15.6 Asset Manifest

Setiap config version menyediakan manifest dengan:
- asset_id.
- storage path.
- version.
- content_type.
- file_size.
- checksum SHA-256.
- dimensions jika image.
- required/optional.
- target booth.

Booth dapat mengunduh hanya aset yang belum ada atau checksum-nya berbeda. Aset diaktifkan hanya setelah verifikasi selesai.

---

# 16. Transactions

## 16.1 Tujuan

Menelusuri transaksi pelanggan dan status pembayaran.

## 16.2 List View

Kolom:
- Transaction ID.
- Created at.
- Customer reference yang disamarkan.
- Package.
- Amount.
- Payment method.
- Status.
- Booth.

Filter:
- Date range.
- Payment method.
- Status.
- Booth.
- Search ID/reference.

## 16.3 Detail

- Transaction summary.
- Package snapshot.
- Original price.
- Discount.
- Additional print.
- Payable amount.
- Payment method.
- Provider reference.
- Payment status.
- Paid timestamp.
- Related session.
- Redemption reference.
- Status history.

## 16.4 Payment Methods

- QRIS.
- Cash.
- Prepaid Ticket.
- 100% Voucher.

## 16.5 Status

- CREATED.
- PENDING.
- PAID.
- FAILED.
- EXPIRED.
- CANCELLED.
- REFUNDED (jika refund diimplementasikan).

## 16.6 Aturan

- QRIS hanya menjadi PAID setelah verifikasi server-side dari provider.
- Webhook signature harus diverifikasi.
- Webhook diproses idempotent menggunakan provider event/reference ID.
- Jangan pernah mempercayai status pembayaran yang dikirim browser/Customer App.
- Cash dapat dikonfirmasi oleh user/booth berizin dengan actor dan timestamp.
- Voucher dan ticket redemption harus memiliki record terpisah.
- Transaksi tidak dihapus permanen.
- Koreksi memerlukan permission, alasan, dan audit log.
- Nilai harga/diskon/total disimpan sebagai snapshot.
- Payment provider belum ditentukan; integrasi dibuat melalui adapter agar provider dapat diganti.

---

# 17. Sessions

## 17.1 Tujuan

Memantau siklus hidup sesi photobooth.

## 17.2 Data List

- Session ID.
- Created at.
- Customer reference tersamarkan.
- Package snapshot.
- Booth.
- Session status.
- Payment status.
- Print status.
- Gallery upload status.

## 17.3 Status Sesi

- CREATED.
- AWAITING_PAYMENT.
- READY.
- IN_PROGRESS.
- PROCESSING.
- COMPLETED.
- CANCELLED.
- FAILED.
- RECOVERY_REQUIRED.

## 17.4 Detail dan Timeline

Event yang dapat ditampilkan:
1. Session created.
2. Payment confirmed.
3. Package/config snapshot assigned.
4. Frame selected.
5. Photo captured.
6. Retake recorded.
7. Editing completed.
8. Print requested.
9. Print completed/failed/unknown.
10. Gallery uploaded.
11. QR/gallery activated.
12. Session completed.

Tidak semua event wajib ada pada setiap sesi.

## 17.5 Foto dan Privasi

- Foto pelanggan tidak ditampilkan pada tabel daftar sesi.
- Preview foto hanya tersedia untuk role yang diizinkan.
- Akses file menggunakan signed URL berumur pendek.
- Akses preview/download dicatat jika kebijakan privasi mengharuskan.
- Jangan menampilkan public Storage URL untuk file privat.
- Retensi cloud dan local retention adalah kebijakan terpisah.

---

# 18. Print Jobs

## 18.1 Data

- print_job_id.
- session_id.
- booth_id.
- printer_model.
- layout.
- requested_strip_count.
- sheet_count.
- print_ready_asset_path.
- status.
- submitted_at.
- completed_at.
- error_code.
- error_message.
- parent_print_job_id untuk reprint.

## 18.2 Status

- QUEUED.
- PREPARING.
- SUBMITTING.
- PROCESSING.
- COMPLETED.
- FAILED.
- UNKNOWN.
- CANCELLED.

## 18.3 Fitur Admin

- List dan filter print jobs.
- Detail job.
- Lihat error.
- Lihat jumlah cetak.
- Lihat job parent/reprint.
- Request reprint jika permission tersedia.
- Catat alasan reprint.
- Monitor job yang UNKNOWN.

## 18.4 Aturan

- Admin Dashboard tidak mengirim print command langsung ke printer.
- Request reprint dikirim ke booth sebagai authorized command.
- Booth membuat job baru yang terkait dengan job sebelumnya.
- UNKNOWN wajib diperiksa secara fisik sebelum retry.
- Partial reprint hanya mencetak kekurangan.
- Jangan mengubah status COMPLETED hanya dari UI Admin.
- Status final berasal dari laporan booth dan rekonsiliasi operasional.
- Semua tindakan reprint tercatat di audit log.

---

# 19. Digital Gallery Monitoring

## 19.1 Tujuan

Memantau ketersediaan hasil digital yang dapat dibuka pelanggan melalui QR Code.

## 19.2 Konsep

- Customer Application membuat gallery/session record.
- File hasil foto di-upload ke Supabase Storage.
- Backend mengaktifkan gallery setelah file wajib berhasil di-upload dan diverifikasi.
- QR Code berisi URL halaman galeri Popcut.id, bukan direct public file URL.
- Halaman galeri memvalidasi token akses.
- File privat diberikan melalui signed URL atau endpoint akses aman.

## 19.3 Status

- LOCAL_ONLY.
- UPLOAD_PENDING.
- UPLOADING.
- AVAILABLE.
- UPLOAD_FAILED.
- EXPIRED.
- DELETED.

## 19.4 Data Admin

- Session ID.
- Gallery ID.
- Created at.
- Available at.
- Expiry at.
- File count.
- Upload status.
- Last upload error.
- Download count jika dilacak.

## 19.5 Aturan

- Bucket foto pelanggan bersifat private.
- Token akses harus acak dan tidak mudah ditebak.
- Token disimpan dengan aman; hindari menyimpan token mentah jika hashing dapat diterapkan.
- QR tidak boleh memuat Supabase secret atau Storage service credential.
- Signed URL memiliki masa berlaku terbatas.
- QR/link dapat dinonaktifkan atau expired.
- Upload gagal tidak boleh menghalangi penyelesaian cetak lokal.
- Retensi cloud dapat dikonfigurasi terpisah dari retensi lokal booth.

---

# 20. Reports

## 20.1 Laporan

- Revenue.
- Jumlah sesi.
- Jumlah transaksi.
- Paket terlaris.
- Frame terpopuler.
- Jumlah strip/lembar cetak.
- Pendapatan additional print.
- Penggunaan promosi/voucher.
- Prepaid ticket sold dan redeemed.
- Payment method breakdown.
- Performa per booth.
- Gallery upload success/failure.

## 20.2 Filter

- Today.
- Last 7 days.
- This month.
- Custom date range.
- Booth.
- Package.
- Payment method.

## 20.3 Export

- CSV untuk data terfilter.
- Export harus mematuhi permission.
- Export sensitif dicatat di audit log.
- File export memiliki masa akses terbatas bila disimpan sementara di Storage.

## 20.4 Definisi Revenue

- Hanya transaksi PAID yang dihitung sebagai paid revenue.
- Pending/failed/expired tidak dihitung.
- 100% voucher adalah sesi gratis, bukan cash revenue.
- Prepaid ticket dihitung pada saat penjualan tiket; redemption tidak dihitung sebagai revenue kedua.
- Additional print dihitung sesuai transaksi pembayarannya.
- Refund mengurangi revenue jika fitur refund diaktifkan.
- Definisi harus diterapkan konsisten di dashboard dan laporan.

---

# 21. Settings

## 21.1 Business

- Business name.
- Logo.
- Contact information.
- Website.
- Timezone.
- Currency: IDR.

## 21.2 Customer Application

- Customer-facing business name.
- Welcome screen text singkat.
- Idle timeout.
- Payment timeout bila relevan.
- Default photo session duration: maksimum 10 menit sesuai kebijakan produk.
- Gallery availability duration.
- Digital download options.
- Available print layouts.
- Customer consent text jika diperlukan.

Pengaturan yang berdampak pada sesi aktif hanya berlaku untuk sesi baru setelah publish.

## 21.3 Payment Provider

- Provider name.
- Environment: sandbox/production.
- Connection status.
- Webhook status.
- Merchant reference.

Secret key dan private credential hanya disimpan sebagai environment secret atau secret backend. Dashboard tidak boleh menampilkan ulang secret setelah disimpan.

## 21.4 Storage & Retention

- Frame asset storage.
- Gallery cloud retention.
- Maximum upload size.
- Allowed file types.
- Gallery link expiry.
- Cloud backup status.

Local booth retention mengikuti kebijakan lokal terpisah. Target retensi lokal 90 hari harus diimplementasikan oleh Customer Application/local storage manager, bukan Admin PWA.

---

# 22. Supabase Database Design

Skema berikut adalah rancangan awal yang harus diwujudkan melalui SQL migrations. Nama tabel dapat menggunakan `snake_case`. Semua tabel bisnis menggunakan UUID primary key kecuali ada alasan teknis yang kuat.

## 22.1 Core Tables

| Tabel | Tujuan |
|---|---|
| profiles | Profil user yang terhubung ke auth.users |
| roles | Daftar role |
| permissions | Daftar permission |
| user_roles | Relasi user-role |
| role_permissions | Relasi role-permission |
| booths | Identitas booth |
| booth_credentials | Metadata credential perangkat, tanpa menyimpan secret mentah |
| booth_heartbeats | Riwayat heartbeat/status |
| packages | Master paket |
| package_versions | Versi paket terpublikasi |
| additional_print_pricing | Aturan harga tambahan |
| frame_categories | Kategori frame |
| frames | Identitas frame |
| frame_versions | Versi immutable frame |
| frame_slots | Slot foto per frame version |
| promotions | Master promo |
| promotion_codes | Kode voucher |
| voucher_redemptions | Riwayat redemption |
| prepaid_batches | Batch prepaid |
| prepaid_tickets | Tiket individual |
| prepaid_redemptions | Riwayat claim |
| config_versions | Versi konfigurasi booth |
| config_items | Relasi item dalam config |
| config_booth_assignments | Target booth |
| booth_sync_status | Status sync per booth/version |
| transactions | Header transaksi |
| transaction_items | Detail item transaksi |
| payment_events | Event dari provider |
| sessions | Sesi customer |
| session_events | Timeline event |
| session_config_snapshots | Snapshot konfigurasi sesi |
| photos | Metadata file foto |
| digital_galleries | Metadata galeri |
| gallery_assets | File yang termasuk galeri |
| print_jobs | Pekerjaan cetak |
| print_job_events | Timeline print |
| activity_logs | Audit log |
| app_settings | Pengaturan bisnis |
| storage_assets | Metadata aset cloud |

## 22.2 Relasi Utama

```text
auth.users
   └── profiles
        └── user_roles
             └── roles
                  └── role_permissions

booths
   ├── booth_heartbeats
   ├── config_booth_assignments
   ├── booth_sync_status
   ├── sessions
   └── print_jobs

packages
   ├── package_versions
   ├── additional_print_pricing
   └── sessions

frames
   └── frame_versions
        └── frame_slots

promotions
   └── promotion_codes
        └── voucher_redemptions

prepaid_batches
   └── prepaid_tickets
        └── prepaid_redemptions

transactions
   ├── transaction_items
   ├── payment_events
   └── sessions

sessions
   ├── session_events
   ├── session_config_snapshots
   ├── photos
   ├── digital_galleries
   └── print_jobs
```

## 22.3 Data Rules

- Gunakan foreign key untuk relasi.
- Gunakan unique constraint untuk code, booth_code, dan provider reference yang harus unik.
- Gunakan check constraint untuk nilai harga dan quantity.
- Gunakan `timestamptz` untuk timestamp.
- Gunakan integer/bigint untuk nominal Rupiah.
- Gunakan enum atau constrained text untuk status yang dikontrol.
- Tambahkan index untuk kolom pencarian/filter: `created_at`, `booth_id`, `status`, `session_id`, `transaction_id`, `code`.
- Tambahkan index pada foreign key yang sering dipakai.
- Hindari menyimpan array relasional sebagai JSON jika perlu query/constraint; gunakan join table.
- JSONB hanya untuk snapshot atau payload fleksibel yang memang membutuhkan bentuk dokumen.
- Snapshot transaksi dan sesi harus immutable setelah finalisasi, kecuali koreksi terkontrol.

## 22.4 RLS

RLS wajib aktif pada semua tabel yang dapat diakses melalui client Supabase.

Prinsip:
- Admin hanya dapat membaca/mengubah data sesuai role dan permission.
- Staff tidak boleh mengubah pengaturan sensitif.
- Customer Application tidak boleh memperoleh akses Admin.
- Booth hanya dapat membaca konfigurasi yang ditugaskan ke booth tersebut dan mengirim status untuk identitasnya sendiri.
- Customer gallery hanya dapat mengakses file melalui token/flow server-side yang valid.
- Public anonymous tidak boleh membaca tabel transaksi, sesi, user, atau file privat.
- Policy diuji menggunakan role yang berbeda sebelum production.

Untuk tabel kritis, jangan memberi hak insert/update langsung ke client. Gunakan Edge Function atau RPC yang memvalidasi otorisasi dan menjalankan operasi atomik.

---

# 23. Supabase Storage Design

## 23.1 Buckets

Gunakan bucket privat terpisah sesuai kebutuhan:

| Bucket | Visibility | Isi |
|---|---|---|
| `frame-assets` | Private | Master frame PNG dan versi |
| `frame-thumbnails` | Private atau public terbatas sesuai desain | Thumbnail frame |
| `gallery-originals` | Private | Foto original pelanggan |
| `gallery-outputs` | Private | Hasil akhir/strip |
| `print-assets` | Private | File print-ready bila perlu cloud |
| `brand-assets` | Public terbatas atau private | Logo dan aset bisnis |

Jangan membuat bucket foto pelanggan public.

## 23.2 Path Convention

```text
frame-assets/
  {frame_id}/{version_id}/frame.png

frame-thumbnails/
  {frame_id}/{version_id}/thumbnail.webp

gallery-originals/
  {booth_id}/{session_id}/{photo_id}.jpg

gallery-outputs/
  {booth_id}/{session_id}/final-strip.jpg

print-assets/
  {booth_id}/{session_id}/{print_job_id}.jpg

brand-assets/
  {business_id}/logo.png
```

## 23.3 Upload Requirements

- Validasi ukuran dan MIME type di server.
- Nama/path file dibuat sistem, bukan path bebas dari user.
- Simpan metadata file di database.
- Simpan checksum SHA-256 untuk frame dan aset yang disinkronkan.
- Gunakan upload resumable/multipart untuk file besar jika dibutuhkan dan didukung.
- Upload ulang harus idempotent atau menggunakan object key/version baru.
- Jangan menghapus file yang masih direferensikan oleh sesi, frame version, atau print job.

## 23.4 Signed URL

- File privat diakses menggunakan signed URL jangka pendek.
- Signed URL dibuat server-side setelah otorisasi.
- Jangan menyimpan signed URL permanen di database sebagai satu-satunya referensi.
- Database menyimpan bucket dan object path.
- QR gallery berisi route Popcut.id, bukan signed URL file.

---

# 24. API dan Integration Contract untuk Customer Application

Bagian ini wajib disiapkan sejak Admin Dashboard dibangun agar Customer Application nantinya dapat menggunakan backend yang sama.

## 24.1 Prinsip

- Customer Application tidak mengambil data dari tabel Admin secara bebas.
- Customer Application menggunakan API/contract yang terdokumentasi.
- Data yang dikirim ke booth hanya data yang diperlukan untuk operasional.
- Konfigurasi memiliki schema version.
- Semua request penting memiliki request ID/idempotency key.
- Semua respons memiliki bentuk error yang konsisten.
- Operasi yang membutuhkan secret dilakukan melalui Edge Function/server-side.

## 24.2 Endpoint/Function Konseptual

Nama berikut adalah kontrak logis; implementasi dapat berupa Supabase Edge Function, RPC, atau Next.js server route sesuai kebutuhan.

| Operation | Fungsi |
|---|---|
| `booth-provision` | Mengaktifkan booth pertama kali |
| `booth-heartbeat` | Mengirim status booth |
| `booth-get-config` | Mengambil config version untuk booth |
| `booth-ack-config` | Mengonfirmasi config berhasil diterapkan |
| `booth-get-assets` | Mendapatkan manifest aset |
| `session-create` | Membuat sesi baru |
| `session-update-event` | Mencatat event sesi |
| `payment-create` | Membuat permintaan pembayaran |
| `payment-verify` | Memeriksa status pembayaran |
| `voucher-redeem` | Mengklaim voucher secara atomik |
| `ticket-redeem` | Mengklaim prepaid ticket secara atomik |
| `transaction-confirm-cash` | Mencatat cash oleh actor berizin |
| `print-job-create` | Membuat metadata print job |
| `print-job-update` | Mengirim status dari booth |
| `gallery-register` | Mendaftarkan galeri |
| `gallery-upload-complete` | Menandai upload selesai setelah verifikasi |
| `gallery-access` | Validasi akses galeri customer |
| `booth-report-error` | Mengirim error perangkat/sistem |

## 24.3 Config Response

Contoh bentuk data:

```json
{
  "schema_version": 1,
  "config_version_id": "uuid",
  "booth_id": "uuid",
  "published_at": "2026-11-15T10:00:00Z",
  "packages": [],
  "additional_print_pricing": [],
  "frames": [],
  "promotions": [],
  "print_options": [],
  "gallery_settings": {},
  "assets_manifest": []
}
```

Response produksi harus menggunakan tipe TypeScript yang dibagikan atau dihasilkan dari schema. Jangan membuat dua definisi yang berbeda antara Admin dan Customer App.

## 24.4 Error Contract

Format error konsisten:
- `code`
- `message`
- `retryable`
- `request_id`
- `details` yang aman untuk ditampilkan/log

Jangan mengirim stack trace, secret, SQL detail, atau informasi internal ke aplikasi customer.

## 24.5 Version Compatibility

- Customer Application mengirim `app_version` dan `supported_config_schema`.
- Backend tidak mengirim config schema yang tidak didukung booth.
- Config schema version memiliki migration/compatibility policy.
- Jika versi aplikasi terlalu lama, booth ditandai NEEDS_UPDATE atau menerima konfigurasi kompatibel terakhir.
- Jangan memaksa config baru aktif pada booth yang tidak kompatibel.

---

# 25. Sync dan Local-first Asset Delivery

## 25.1 Tujuan

Frame dan konfigurasi dikelola di cloud tetapi dijalankan dari penyimpanan lokal MacBook agar pemilihan frame dan rendering tidak menunggu internet.

## 25.2 Alur Frame

1. Admin upload frame melalui dashboard.
2. Frame disimpan sebagai versi baru di Supabase Storage.
3. Metadata dan slot disimpan di PostgreSQL.
4. Admin publish frame/config.
5. Backend membuat asset manifest.
6. Booth menerima informasi versi terbaru.
7. Booth mengunduh file yang belum tersedia.
8. Booth memverifikasi checksum.
9. Booth menyimpan file di local frame storage.
10. Booth mengirim acknowledgement.
11. Frame menjadi available untuk sesi baru.

## 25.3 Aturan

- Customer Application menggunakan frame lokal.
- Jangan download frame berulang setiap sesi.
- Download berjalan di background.
- Jangan mengganti frame aktif di tengah sesi.
- Versi lama tetap ada selama masih digunakan sesi/print job.
- Jika download gagal, booth tetap menggunakan versi terakhir yang valid.
- Sync dapat dilanjutkan setelah internet kembali.
- Tampilkan progress dan error sync di Admin Dashboard.

## 25.4 Sync Status

Per booth dan per config version:
- Pending.
- Downloading.
- Verifying.
- Applied.
- Failed.
- Outdated.

---

# 26. Security Requirements

1. HTTPS wajib untuk production.
2. RLS aktif pada seluruh tabel yang terekspos ke client.
3. `service_role` hanya di server.
4. Payment webhook diverifikasi.
5. Secret tidak masuk ke frontend.
6. Validasi input di frontend dan backend.
7. Rate limit endpoint sensitif.
8. Gunakan idempotency key untuk payment, voucher, ticket, session creation, dan print command.
9. Batasi file upload: MIME, size, extension, dan content validation.
10. File customer bersifat private.
11. Signed URL memiliki expiry.
12. Admin action penting dicatat.
13. Role/permission divalidasi server-side.
14. CORS dibatasi pada origin yang diperlukan.
15. CSP dan security headers dikonfigurasi di Vercel.
16. Error response tidak membocorkan detail internal.
17. MFA direkomendasikan untuk Owner.
18. Device credential dapat direvoke.
19. Backup dan recovery diuji.
20. Audit log tidak dapat diubah pengguna biasa.

---

# 27. Performance dan Reliability

## 27.1 UI

- Navigasi halaman terasa responsif.
- Hindari bundle frontend berlebihan.
- Gunakan lazy loading untuk editor dan modul berat.
- Gunakan thumbnail untuk daftar frame.
- Pagination untuk tabel besar.
- Optimalkan gambar preview.
- Gunakan skeleton untuk loading, bukan spinner tanpa konteks.
- Debounce pencarian.

## 27.2 Database

- Query hanya mengambil kolom yang diperlukan.
- Pagination server-side untuk data besar.
- Index sesuai pola query.
- Hindari N+1 query.
- Gunakan view/materialized view atau RPC untuk agregasi dashboard bila diperlukan.
- Pantau query lambat.

## 27.3 Reliability

- Retry hanya untuk operasi yang aman dan idempotent.
- Jangan retry pembayaran atau print job secara membabi buta.
- Tampilkan error dan request ID untuk investigasi.
- Gunakan transaksi database untuk operasi multi-record.
- Simpan event penting agar status dapat direkonstruksi.
- Admin Dashboard tidak boleh menghapus status terakhir yang valid ketika sync gagal.

---

# 28. Vercel Deployment Requirements

## 28.1 Project Setup

- Next.js App Router.
- Build dan deploy melalui Vercel.
- Set environment variables per Development, Preview, dan Production.
- Gunakan custom domain Popcut.id.
- HTTPS aktif.
- Preview deployment tidak menggunakan data production kecuali secara eksplisit dan aman.
- Branch protection untuk production.

## 28.2 Environment Variables

Contoh nama variabel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

Catatan:
- `NEXT_PUBLIC_*` dapat masuk bundle browser.
- `SUPABASE_SERVICE_ROLE_KEY` dan secret lainnya hanya boleh digunakan pada server/Edge Function.
- Jangan pernah menggunakan prefix `NEXT_PUBLIC_` untuk secret.
- Gunakan secret manager/environment variable Vercel.
- Jangan commit `.env` berisi credential ke Git.

## 28.3 Database Migrations

- SQL migrations disimpan dalam repository.
- Migration diuji pada development/staging.
- Production migration dijalankan secara terkontrol.
- Seed data hanya untuk environment development.
- Jangan menghapus/rename kolom production tanpa migration strategy.
- Backup sebelum perubahan berisiko.

## 28.4 PWA Deployment

- Manifest dan icon tersedia di URL yang benar.
- Service worker scope sesuai aplikasi.
- Cache version berubah saat release.
- Preview deployment tidak mengganggu cache production.
- Uji install, update, offline shell, dan logout.
- PWA tidak boleh menyimpan secret atau response privat di Cache Storage.

---

# 29. Error Handling dan Recovery

| Kondisi | Perilaku |
|---|---|
| Supabase tidak dapat diakses | Tampilkan offline/error, jangan klaim save berhasil |
| Upload frame gagal | Draft tetap dapat dicoba ulang; jangan publish |
| Frame rusak | Tolak publish dan tampilkan alasan |
| Config publish gagal | Draft tetap ada |
| Booth offline | Gunakan config lokal terakhir |
| Asset sync gagal | Tetap gunakan asset versi valid sebelumnya |
| Payment webhook duplikat | Idempotent, tidak membuat transaksi ganda |
| Voucher dipakai bersamaan | Hanya satu claim yang berhasil jika kuota satu |
| Ticket dipakai bersamaan | Hanya satu claim berhasil |
| Print job UNKNOWN | Wajib rekonsiliasi fisik sebelum retry |
| Gallery upload gagal | Tandai UPLOAD_FAILED; booth tetap dapat menyelesaikan cetak |
| Session data conflict | Jangan overwrite tanpa aturan rekonsiliasi |

---

# 30. Acceptance Criteria per Modul

## 30.1 Admin & Auth
- Owner dapat login/logout.
- User dapat dibuat/diundang.
- Role membatasi menu dan tindakan.
- RLS mencegah akses tanpa izin.
- Perubahan penting tercatat.

## 30.2 Packages
- Admin dapat create/edit/duplicate/archive.
- Harga dan quantity tervalidasi.
- Paket dapat dipublish.
- Customer config hanya menampilkan paket aktif.
- Sesi lama tidak berubah ketika harga diperbarui.

## 30.3 Frames
- Admin dapat upload PNG.
- Thumbnail tampil.
- Slot dapat ditambah, digeser, dan diubah ukurannya.
- Preview dapat dirender.
- Publish menghasilkan versi baru.
- File versi lama tidak tertimpa.
- Manifest aset tersedia untuk booth.

## 30.4 Promotions & Tickets
- Kode unik.
- Periode dan kuota tervalidasi.
- Redemption atomik.
- Tidak terjadi double redemption.
- Snapshot diskon tercatat pada transaksi.

## 30.5 Booth & Sync
- Booth memiliki ID unik.
- Heartbeat memperbarui last seen.
- Admin dapat melihat config version.
- Booth dapat menerima manifest.
- Checksum diverifikasi.
- Acknowledgement mengubah sync status menjadi APPLIED.
- Booth offline tetap memakai versi terakhir yang valid.

## 30.6 Transactions & Sessions
- Data transaksi dapat dicari/filter.
- Status QRIS hanya berubah setelah verifikasi server.
- Session terhubung ke transaction dan booth.
- Snapshot paket/frame/config tersedia.
- Timeline event tampil dengan urutan benar.

## 30.7 Print Jobs
- Job dapat dipantau.
- Status UNKNOWN terlihat jelas.
- Reprint tercatat sebagai job baru.
- Admin tidak mengirim perintah printer langsung dari browser.

## 30.8 Digital Gallery
- Status upload dapat dipantau.
- QR mengarah ke halaman galeri Popcut.id.
- File privat tidak memiliki public URL.
- Gallery dapat expired sesuai kebijakan.

## 30.9 Reports
- Revenue hanya menghitung transaksi sesuai definisi.
- Filter periode dan booth bekerja.
- Export CSV sesuai filter dan permission.

## 30.10 PWA & Vercel
- Bisa di-install.
- Offline shell tersedia.
- Cache aman.
- Deployment update bekerja.
- Environment production tidak mengekspos secret.

---

# 31. Roadmap Pengembangan

## Phase 1 — Foundation
- Setup repository Next.js + TypeScript.
- Setup Supabase project.
- Database schema dan migrations.
- Auth dan RLS.
- Design system dan layout.
- Vercel preview/production pipeline.
- PWA shell.

## Phase 2 — Business Configuration
- Packages & Pricing.
- Additional Print Pricing.
- Frame Management.
- Frame Editor.
- Frame versioning.
- Configuration draft/publish.

## Phase 3 — Booth Integration Foundation
- Booth Management.
- Device provisioning.
- Heartbeat.
- Config manifest.
- Asset sync status.
- Customer Application API contract.

## Phase 4 — Promotions & Payments
- Promotions.
- Voucher codes.
- Prepaid tickets.
- Transaction schema.
- Payment provider adapter.
- Webhook verification.
- Idempotency.

## Phase 5 — Operations
- Sessions.
- Print Jobs.
- Digital Gallery monitoring.
- Activity Log.
- Error and recovery views.

## Phase 6 — Reports & Production Hardening
- Dashboard metrics.
- Reports and CSV.
- Security review.
- RLS testing.
- Backup/recovery test.
- PWA QA.
- Performance test.
- Multi-booth test.

---

# 32. Definisi MVP

Admin Dashboard MVP dianggap siap untuk diintegrasikan dengan Customer Application ketika Owner dapat:

1. Login dengan aman.
2. Mengelola paket dan harga.
3. Mengatur additional print pricing.
4. Upload frame PNG.
5. Mengelola kategori frame.
6. Mengatur slot foto secara visual.
7. Preview dan publish frame.
8. Membuat config version.
9. Menambahkan dan mengelola booth.
10. Menetapkan konfigurasi untuk booth.
11. Melihat status sinkronisasi booth.
12. Menghasilkan manifest paket, frame, dan aset.
13. Membuat promo dan voucher.
14. Generate prepaid ticket.
15. Melihat transaksi dan status pembayaran.
16. Melihat sesi.
17. Melihat print jobs.
18. Melihat status galeri digital.
19. Memastikan data dapat dibaca Customer Application melalui contract yang terdokumentasi.

Reports lanjutan, multi-role kompleks, dan analitik mendalam dapat menyusul setelah alur utama stabil.

---

# 33. Keputusan Teknis yang Dikunci

| Area | Keputusan |
|---|---|
| Admin frontend | Next.js + React + TypeScript |
| Admin platform | PWA |
| Hosting | Vercel |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | RLS + role/permission |
| File storage | Supabase Storage |
| Server-side logic | Edge Functions / RPC / server routes sesuai kebutuhan |
| Realtime | Supabase Realtime untuk status terpilih |
| Customer app | Electron Desktop App |
| Local booth database | SQLite |
| Local asset storage | SSD MacBook |
| Frame execution | Local-first |
| Config delivery | Versioned manifest + checksum |
| Payment | Provider belum ditetapkan; gunakan adapter |
| Currency | IDR |
| Business timezone | Configurable; default Asia/Jakarta |

---

# 34. Hal yang Belum Dikunci

Hal berikut harus menjadi konfigurasi atau keputusan lanjutan, bukan hardcode:

1. Payment gateway final.
2. Paket dan harga final.
3. Maksimum ukuran file frame.
4. Resolusi master frame dan print output.
5. Masa retensi galeri cloud.
6. Apakah voucher dapat digabung.
7. Aturan multi-use prepaid ticket.
8. Apakah harga/paket berbeda per booth.
9. Persetujuan Owner untuk reprint.
10. Kebijakan refund.
11. Provider/strategi backup database di luar fitur paket Supabase.
12. Batas ukuran dan retensi file lokal booth.
13. Browser dan perangkat target Admin PWA.
14. Daftar konfigurasi yang boleh diubah tanpa update Customer Application.

---

# Penutup

Popcut.id Admin Dashboard harus menjadi pusat pengelolaan bisnis photobooth yang sederhana dan dapat diandalkan.

Admin cukup mengelola paket, harga, frame, promosi, dan booth. Backend menjaga validasi, keamanan, versioning, dan konsistensi data. Customer Application menerima konfigurasi melalui contract yang jelas dan menjalankan sesi secara lokal agar tetap cepat.

**Prinsip akhir: kelola dari cloud, jalankan di booth secara lokal, dan buat pengalaman admin sesederhana mungkin.**

---

*End of Document — Popcut.id Admin Dashboard PRD v2.0*
