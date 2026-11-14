# CUSTOMER APPLICATION INTEGRATION CONTRACT

> **Kontrak Integrasi Resmi Antara Admin Dashboard / Supabase dengan Popcut.id Customer Application (Electron Desktop App)**

---

## 1. Operasi Perangkat Booth

### A. Booth Heartbeat (`POST /api/booth/heartbeat`)
Dikirim setiap 30-60 detik oleh Customer App untuk melaporkan kesehatan hardware.
```json
{
  "booth_id": "uuid",
  "camera_state": "CONNECTED",
  "printer_state": "READY",
  "storage_free_bytes": 184000000000,
  "pending_uploads": 0,
  "pending_prints": 0,
  "app_version": "2.0.4",
  "current_config_version_id": "cfg-v2.4.1",
  "local_timestamp": "2026-11-15T01:45:00Z"
}
```

### B. Booth Config Delivery (`GET /api/booth/config?booth_id=:id`)
Mengambil manifest rilis yang ditargetkan untuk booth tersebut.
```json
{
  "schema_version": 1,
  "config_version_id": "uuid",
  "version_number": "v2.4.1",
  "packages": [],
  "frames": [],
  "assets_manifest": [
    {
      "asset_type": "FRAME_MASTER",
      "asset_id": "uuid",
      "download_url": "https://storage.popcut.id/...",
      "checksum_sha256": "sha256-hash",
      "target_relative_path": "frames/uuid.png"
    }
  ]
}
```

---

## 2. Operasi Sesi & Pembayaran

### A. Session Create (`POST /api/session/create`)
```json
{
  "idempotency_key": "uuid",
  "booth_id": "uuid",
  "package_id": "uuid",
  "payment_method": "QRIS",
  "additional_strips_count": 0
}
```

### B. Voucher Redeem (`POST /api/voucher/redeem`)
Klaim kode promosi secara atomik.
```json
{
  "code": "POPCUTSENOPATI",
  "subtotal": 35000
}
```

### C. Ticket Redeem (`POST /api/ticket/redeem`)
Klaim tiket prabayar secara atomik.
```json
{
  "ticket_code": "TKT-2026-X8912"
}
```
