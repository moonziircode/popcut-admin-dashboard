# DATABASE SCHEMA SPECIFICATION — POPCUT.ID

> **Database:** PostgreSQL (Supabase)  
> **Schema Standard:** `snake_case`, UUID Primary Keys, UTC Timestamptz, Integer IDR Currency

---

## 1. Table Groups & Relations

### Group A: Identity & Access Control
- `profiles`: User details bound to `auth.users(id)`.
- `roles`: `owner`, `admin`, `staff`.
- `permissions`: Granular capabilities (e.g. `packages.manage`, `config.publish`, `print.reprint`).
- `user_roles`: Many-to-many user-to-role assignment.
- `role_permissions`: Permission bindings per role.

### Group B: Booth Device Fleet & Telemetry
- `booths`: Identity, location, status (`ONLINE`, `OFFLINE`, `NEEDS_ATTENTION`), active & target config versions.
- `booth_credentials`: Hashed tokens and revocation tracking.
- `booth_heartbeats`: Real-time camera state, printer paper/ink, storage health, and queue counts.

### Group C: Catalog, Packages & Visual Frames
- `packages`: Service catalog with prices in Rupiah, photo pose count, included strips, live photo flags.
- `package_versions`: Immutable published package snapshots.
- `additional_print_pricing`: Strip add-on pricing rules.
- `frame_categories`: Classic, Minimal, Retro Pastel, Couple Special, Celebration, Seasonal.
- `frames`: Visual frame identity, dimensions (2x6 strip, 4x6 postcard), aspect ratio.
- `frame_versions`: Version number, asset Storage path, SHA-256 checksum, dimensions (DPI 300).
- `frame_slots`: X, Y, Width, Height coordinates in percentages, rotation angle, fit mode (`cover`/`contain`).

### Group D: Promotions, Vouchers & Prepaid Tickets
- `promotions`: Discount campaigns (Percentage, Fixed Amount, Free 100%).
- `promotion_codes`: Code string, max uses, expiry date.
- `voucher_redemptions`: Atomic claim audit.
- `prepaid_batches`: Corporate & event prepaid ticket batches.
- `prepaid_tickets`: Individual ticket codes and status (`AVAILABLE`, `USED`, `EXPIRED`, `DISABLED`).
- `prepaid_redemptions`: Atomic ticket claim audit.

### Group E: Configuration Versioning & Booth Distribution
- `config_versions`: Immutable manifest JSON, SHA-256 checksum, schema version.
- `config_items`: Normalized snapshots of catalog entities in a release.
- `config_booth_assignments`: Target fleet bindings.
- `booth_sync_status`: Per-booth sync progress, download percentage, verification state (`APPLIED`).

### Group F: Transactions, Sessions & Print Jobs
- `transactions`: Financial record, payable amount, payment method (`QRIS`, `CASH`, `PREPAID_TICKET`, `VOUCHER_100`), payment status (`PAID`, `PENDING`, `CANCELLED`).
- `transaction_items`: Line items breakdown.
- `payment_events`: Webhook / gateway verification audit.
- `sessions`: Photobooth user session, package snapshot, booth binding, status lifecycle.
- `session_events`: Chronological event trail.
- `photos`: Customer photos metadata, retake flags.
- `digital_galleries`: Access token hash, QR route, cloud retention dates.
- `gallery_assets`: Output strips & Live Photo MP4 videos in private Storage.
- `print_jobs`: Physical thermal print queue, requested strip counts, status (`QUEUED`, `COMPLETED`, `UNKNOWN`), linked reprint parents.
- `print_job_events`: Print status transitions.

### Group G: Audit & App Settings
- `activity_logs`: Immutable before/after JSON diffs of administrator actions.
- `app_settings`: Key-value JSONB settings.
- `storage_assets`: File manifest metadata and SHA-256 checksums.
