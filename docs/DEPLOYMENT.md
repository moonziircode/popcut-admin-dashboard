# VERCEL DEPLOYMENT & PRODUCTION READINESS

> **Panduan Deployment Popcut.id Admin Dashboard ke Vercel**

---

## 1. Menghubungkan Git Repository ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com).
2. Klik **Add New Project** dan pilih repository Git Popcut.id Admin Dashboard.
3. Framework Preset akan otomatis terdeteksi sebagai **Next.js**.

---

## 2. Environment Variables di Vercel

Tambahkan variabel berikut pada project settings Vercel:

| Nama Variabel | Target Environment | Deskripsi |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | URL endpoint Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Anon/public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | **Secret** service role key (Server-only) |
| `SUPABASE_WEBHOOK_SECRET` | Production, Preview, Development | **Secret** webhook validator |
| `NEXT_PUBLIC_APP_URL` | Production | `https://admin.popcut.id` |
| `NEXT_PUBLIC_BUSINESS_TIMEZONE` | Production, Preview, Development | `Asia/Jakarta` |
| `NEXT_PUBLIC_CURRENCY` | Production, Preview, Development | `IDR` |

---

## 3. Production Build & Verification

Jalankan build lokal sebelum push:

```bash
npm run typecheck
npm run build
```

Pastikan tidak ada peringatan TypeScript strict mode atau bundle errors.
