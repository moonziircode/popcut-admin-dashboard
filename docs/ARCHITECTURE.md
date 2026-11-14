# SYSTEM ARCHITECTURE — POPCUT.ID PLATFORM

> **Status:** Production Architecture Blueprint  
> **Source of Truth:** `Popcut_id_Admin_Dashboard_PRD_v2.0_Supabase_Vercel.md`

---

## 1. Top-Level Architectural Boundary

```text
                  ADMINISTRATOR / OWNER
                            |
                            v
             POPCUT.ID ADMIN DASHBOARD (PWA)
               Next.js App Router + TypeScript
                            |
                            v (HTTPS / Signed Tokens)
               SUPABASE SHARED BACKEND
       +---------------------------------------------+
       | - PostgreSQL (39 Core Tables)               |
       | - Row Level Security (RLS) & RBAC           |
       | - Supabase Auth (Staff & Owner)             |
       | - Supabase Storage (Private Customer Media) |
       | - Database Functions / Atomic RPCs          |
       | - Realtime Telemetry Broadcasts             |
       +---------------------------------------------+
                            |
                            v (Versioned API Contract)
                 POPCUT PHOTOBOOTH FLEET
                  (MacBook Desktop Kiosk)
                   Electron Application
                            |
       +--------------------+------------------------+
       | - SQLite Local Database                     |
       | - SSD Local Master Frame Cache              |
       | - Camera Adapter (DSLR Capture & Retakes)   |
       | - Print Adapter (DNP / Citizen Thermal)     |
       +---------------------------------------------+
```

---

## 2. Key Architectural Guarantees

1. **Hardware Isolation:** The Admin Dashboard NEVER sends direct low-level commands to the DSLR camera or printer mechanisms. It only monitors status reported via heartbeat and issues high-level authorized jobs (e.g. reprint requests).
2. **Local-First Execution at Booth:** Customer photo sessions and print rendering run 100% locally from the booth's SSD and SQLite database, ensuring that internet lag does not affect the physical photobooth experience.
3. **Cloud-Managed Configuration:** All prices, packages, frames, and promotional vouchers are managed centrally in the cloud and distributed as immutable versioned manifests.
4. **Resilient Dual-Configuration:** If an asset download or network error occurs while a booth is syncing, the booth continues executing on its `LAST_KNOWN_VALID` configuration version without interruption.
5. **Zero Secrets in Client:** All service role keys and payment secrets reside strictly on the server side.
