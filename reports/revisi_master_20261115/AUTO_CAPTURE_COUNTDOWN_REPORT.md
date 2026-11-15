# AUTOMATIC CAPTURE & COUNTDOWN 5 DETIK REPORT
## POPCUT.ID CUSTOMER APPLICATION — STUDIO SESSION

**Tanggal Pengujian:** 15 November 2026  
**Status:** PASS (100% Verified)  
**Lingkup:** Hitung Mundur Otomatis 5 Detik, Urutan Pengambilan Foto Tanpa Klik Manual, Penanganan Retake Slot Tunggal

---

### 1. Masalah Sebelumnya
* Hitung mundur sebelumnya berdurasi 3 detik (terlalu singkat bagi pengunjung untuk berganti pose).
* Setiap kali selesai mengambil satu foto, customer atau operator harus menekan tombol "Ambil Foto Sekarang" atau "Lanjut ke Pose Berikutnya" secara manual untuk melanjutkan ke slot berikutnya.

---

### 2. Implementasi Otomatisasi
1. **Durasi Hitung Mundur 5 Detik (`PhotoSessionScreen.tsx`):**
   - Urutan: `5 → 4 → 3 → 2 → 1 → 0 (Shutter Flash & Capture)`.
   - Menggunakan animasi HUD lingkaran besar di tengah viewfinder dengan angka yang jelas dan kontras tinggi.
2. **Urutan Otomatis (Hands-Free Multi-Slot Sequence):**
   - Setelah kamera live aktif pada slot 1, countdown 5 detik dimulai otomatis (setelah jeda persiapan 1,5 detik).
   - Saat countdown mencapai 0, shutter flash menyala dan foto disimpan ke slot.
   - Sistem berpindah ke slot 2 secara otomatis dan langsung memulai countdown 5 detik berikutnya.
   - Pola berulang secara otomatis untuk seluruh slot (misal: 2 slot, 4 slot, 6 slot, 8 slot).
   - Setelah seluruh slot terisi penuh, aplikasi otomatis beralih ke tahap review & editing foto tanpa perlu menekan tombol Next.
3. **Mekanisme Jeda & Retake:**
   - Disediakan tombol "Jeda Auto / Lanjutkan Auto" jika customer membutuhkan waktu istirahat sejenak di tengah sesi.
   - Retake pose tertentu hanya mengulang pengambilan foto pada slot yang dipilih dengan countdown 5 detik tersendiri tanpa mereset slot lain yang sudah berhasil diambil.

---

### 3. Hasil Pengujian
* **Siklus 4 Slot:** Berjalan otomatis 4 kali berturut-turut dengan countdown 5 detik per pose.
* **Integrasi Frame Slots:** Mengikuti konfigurasi jumlah slot dari frame yang dipilih di Admin Dashboard.
* **Hands-Free Experience:** Customer tidak perlu menyentuh layar atau mouse selama sesi foto berlangsung.
