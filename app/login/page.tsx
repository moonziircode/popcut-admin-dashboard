'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth & redirect to dashboard
    setTimeout(() => {
      window.location.href = '/';
    }, 600);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-brand mx-auto flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-brand-contrast" />
          </div>
          <h1 className="text-xl font-bold font-headline text-content-primary tracking-tight">
            Popcut.id Admin
          </h1>
          <p className="text-xs text-content-secondary">
            Masuk untuk mengelola operasional photobooth & katalog rilis.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border rounded-lg shadow-subtle p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@popcut.id"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-content-primary">
                  Kata Sandi
                </label>
                <a href="#" className="text-[11px] text-content-secondary hover:text-content-primary">
                  Lupa sandi?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 w-full bg-surface border border-border rounded px-3 pr-9 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:border-content-primary focus:ring-1 focus:ring-brand"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-content-muted hover:text-content-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="md" className="w-full" isLoading={isLoading}>
              Masuk ke Dashboard
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-content-muted">
          Akses terbatas hanya untuk staf & pengelola resmi Popcut.id.
        </div>
      </div>
    </div>
  );
}
