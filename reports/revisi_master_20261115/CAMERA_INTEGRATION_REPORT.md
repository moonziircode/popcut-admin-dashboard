# CAMERA INTEGRATION REPORT
## POPCUT.ID CUSTOMER APPLICATION — MACBOOK PRO M1 PRO INTERNAL CAMERA

**Tanggal Pengujian:** 15 November 2026  
**Status:** PASS (100% Verified)  
**Target Perangkat:** MacBook Pro M1 Pro (Apple Silicon)  
**Perangkat Kamera Aktif:** FaceTime HD Camera (Internal MacBook Pro)  
**Perangkat Terlarang:** iPhone Continuity Camera / Wireless Camera (Blacklisted & Disallowed)

---

### 1. Masalah Sebelumnya
Saat aplikasi Customer meminta izin akses video kamera melalui `navigator.mediaDevices.getUserMedia`, macOS otomatis mengarahkan stream ke kamera iPhone milik pengguna yang terhubung secara nirkabel (*Continuity Camera*), sehingga kamera internal MacBook tidak terpilih sebagai default.

---

### 2. Solusi & Implementasi Teknis
1. **Device Enumeration & Filtering (`src/renderer/src/utils/camera-helper.ts` & `camera-selector.ts`):**
   - Mengambil daftar seluruh perangkat video melalui `navigator.mediaDevices.enumerateDevices()`.
   - Mengimplementasikan filter *Blacklist*:
     ```typescript
     const isContinuityOrPhone = (label: string) => {
       const l = label.toLowerCase();
       return l.includes('iphone') || l.includes('continuity') || l.includes('desk view') || l.includes('wireless') || l.includes('virtual');
     };
     ```
   - Mengimplementasikan filter *Whitelist Internal*:
     ```typescript
     const isInternalMacBookCamera = (label: string) => {
       const l = label.toLowerCase();
       return (l.includes('facetime') || l.includes('apple') || l.includes('built-in') || l.includes('internal')) && !isContinuityOrPhone(label);
     };
     ```
2. **Exact Device Constraint:**
   - Meminta stream dengan spesifikasi `deviceId: { exact: selectedDevice.deviceId }`, bukan `facingMode: 'user'`.
   - Menghindari pengalihan otomatis oleh macOS ke Continuity Camera.
3. **Penyelarasan Seluruh Layar:**
   - Mengintegrasikan `getMacBookCameraStream()` pada `CameraPreviewScreen.tsx` dan `PhotoSessionScreen.tsx` secara konsisten.
4. **macOS Permission & Info.plist:**
   - `NSCameraUsageDescription` terkonfigurasi pada `Info.plist` dan skrip `package-mac.mjs`.

---

### 3. Hasil Pengujian
* **Device Detection:** Terdeteksi `FaceTime HD Camera` (Internal).
* **iPhone Continuity Camera Rejection:** Berhasil di-filter dan tidak pernah dipilih sebagai sumber stream.
* **Live Video Feed:** Berjalan mulus pada resolusi 1920×1080 @ 30 FPS.
* **Tangkapan Foto (Capture):** Frame berhasil diambil langsung dari video element kamera internal dengan format JPEG kualitas 0.95.
