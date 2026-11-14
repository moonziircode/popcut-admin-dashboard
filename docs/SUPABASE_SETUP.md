# SUPABASE SETUP & CONFIGURATION GUIDE

> **Petunjuk Integrasi Backend Supabase untuk Popcut.id**

---

## 1. Menghubungkan Project Supabase

1. Buka dashboard [Supabase](https://supabase.com) dan buat project baru: **Popcut.id Production / Staging**.
2. Salin kredensial berikut ke dalam file `.env.local` di folder root project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   SUPABASE_WEBHOOK_SECRET=<your-webhook-secret>
   ```

---

## 2. Menjalankan Database Migrations

Jalankan seluruh migration SQL yang telah disediakan secara berurutan:

```bash
# Menggunakan Supabase CLI
supabase db push

# Atau copy-paste SQL secara berurutan di Supabase SQL Editor:
1. supabase/migrations/20261115000001_initial_schema.sql
2. supabase/migrations/20261115000002_rls_and_permissions.sql
3. supabase/migrations/20261115000003_atomic_rpc_functions.sql
4. supabase/migrations/20261115000004_seed_initial_data.sql
```

---

## 3. Konfigurasi Supabase Storage Buckets

Buat 6 Storage Buckets di menu Storage Supabase:

| Nama Bucket | Public / Private | Catatan |
|---|---|---|
| `frame-assets` | **Private** | Master PNG template frame |
| `frame-thumbnails` | **Private** | WebP thumbnail |
| `gallery-originals` | **Private** | Foto mentah pelanggan (Strict RLS) |
| `gallery-outputs` | **Private** | Strip cetak rendered JPEG |
| `print-assets` | **Private** | File siap cetak thermal |
| `brand-assets` | **Public** | Logo dan ikon publik |

---

## 4. Akun Default Owner Pertama

Buat akun pengguna pertama di Supabase Auth (Email & Password), lalu berikan peran `owner`:

```sql
-- Dijalankan di Supabase SQL Editor setelah mendaftar di auth.users:
INSERT INTO public.user_roles (user_id, role_id)
SELECT id, 'owner' FROM auth.users WHERE email = 'your-email@popcut.id';
```
