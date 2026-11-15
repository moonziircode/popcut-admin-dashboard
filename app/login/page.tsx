'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Brute force protection state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (lockoutCountdown > 0) {
      timer = setInterval(() => {
        setLockoutCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutCountdown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutCountdown > 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= 5) {
          setLockoutCountdown(60);
          setErrorMessage('Terlalu banyak percobaan gagal. Akun dikunci sementara selama 60 detik.');
        } else {
          setErrorMessage(
            data.message || 'Email atau kata sandi tidak valid. Sisa percobaan: ' + (5 - newAttempts)
          );
        }
        setIsLoading(false);
        return;
      }

      // Success
      setFailedAttempts(0);
      router.push(redirectedFrom);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan jaringan saat menghubungi server autentikasi.');
      setIsLoading(false);
    }
  };

  const handleSelectQuickAccount = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-brand mx-auto flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6 text-brand-contrast" />
          </div>
          <h1 className="text-2xl font-bold font-headline text-content-primary tracking-tight">
            Popcut.id Admin
          </h1>
          <p className="text-xs text-content-secondary max-w-xs mx-auto">
            Sistem manajemen terpadu operasional booth, event photobooth, dan pengaturan bisnis.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border rounded-xl shadow-subtle p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {lockoutCountdown > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Tunggu <strong>{lockoutCountdown} detik</strong> sebelum mencoba kembali.</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Alamat Email Admin *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aqsa@popcut.id"
                  className="w-full h-9 pl-9 pr-3 bg-canvas border border-border rounded text-xs text-content-primary focus:outline-none focus:border-brand"
                  required
                  disabled={isLoading || lockoutCountdown > 0}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-content-primary">
                  Kata Sandi *
                </label>
                <span className="text-[10px] text-content-muted">Minimal 8 karakter</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-9 pl-9 pr-9 bg-canvas border border-border rounded text-xs text-content-primary focus:outline-none focus:border-brand font-mono"
                  required
                  disabled={isLoading || lockoutCountdown > 0}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full bg-brand text-brand-contrast hover:bg-brand-hover font-semibold"
              isLoading={isLoading}
              disabled={lockoutCountdown > 0}
            >
              {isLoading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* 1-Click Quick Fill Role Accounts */}
          <div className="pt-3 border-t border-border space-y-2">
            <span className="text-[10px] font-semibold text-content-muted uppercase tracking-wider block text-center">
              Akses Cepat Pengujian (1-Klik Isi):
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('aqsa@popcut.id')}
                className="p-1.5 rounded border border-border hover:border-brand bg-canvas text-center transition-colors"
                title="Owner: Akses Penuh Sistem"
              >
                <div className="font-bold text-content-primary">👑 Owner</div>
                <div className="text-[9px] text-content-muted truncate">aqsa@...</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('admin@popcut.id')}
                className="p-1.5 rounded border border-border hover:border-brand bg-canvas text-center transition-colors"
                title="Admin: Kelola Katalog & Operasional"
              >
                <div className="font-bold text-content-primary">🛡️ Admin</div>
                <div className="text-[9px] text-content-muted truncate">admin@...</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('staff@popcut.id')}
                className="p-1.5 rounded border border-border hover:border-brand bg-canvas text-center transition-colors"
                title="Staff: Monitoring Booth & Print"
              >
                <div className="font-bold text-content-primary">⚡ Staff</div>
                <div className="text-[9px] text-content-muted truncate">staff@...</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & RLS Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-content-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>Dilindungi Supabase Auth, Row Level Security & Enkripsi HTTPS</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center text-xs text-content-muted">
          Memuat halaman login...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
