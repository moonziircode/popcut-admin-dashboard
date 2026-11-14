# CONFIGURATION PUBLISHING & ASSET SYNCHRONIZATION

> **Spesifikasi Alur Penerbitan Konfigurasi dan Sinkronisasi Aset Popcut.id**

---

## 1. Siklus Hidup Rilis Konfigurasi (10 Tahap)

```text
[1. Edit Bisnis] -> [2. Simpan Draf] -> [3. Validasi Konsistensi] -> [4. Pratinjau Kiosk]
         |
         v
[5. Pilih Booth Target] -> [6. Terbitkan (Publish)] -> [7. Buat Versi Immutable]
         |
         v
[8. Kirim Manifest ke Booth] -> [9. Unduh di Background & Cek SHA-256] -> [10. Booth ACK: APPLIED]
```

---

## 2. Status Sinkronisasi Booth

| Status | Makna | Perilaku Sistem |
|---|---|---|
| `PENDING` | Rilis baru dibuat, booth belum menerima sinyal | Booth tetap menjalankan konfigurasi aktif lama |
| `DOWNLOADING` | Booth sedang mengunduh master frame PNG | Berjalan di latar belakang tanpa mengganggu sesi aktif |
| `VERIFYING` | Booth memeriksa integritas SHA-256 | Validasi kesesuaian ukuran file dan hash |
| `APPLIED` | Konfigurasi aktif dan terverifikasi di SSD | Sesi baru otomatis memakai rilis ini |
| `FAILED` | Gagal unduh karena jaringan atau checksum salah | **Fail-safe:** Booth tetap menggunakan versi valid sebelumnya |
| `OUTDATED` | Booth offline saat rilis baru terbit | Otomatis sinkron saat booth online kembali |
