'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  Monitor,
  CreditCard,
  HardDrive,
  Save,
  CheckCircle2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'business' | 'kiosk' | 'payment' | 'storage'>('business');
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Business Form State
  const [bizName, setBizName] = useState('Popcut.id Photobooth');
  const [bizEmail, setBizEmail] = useState('hello@popcut.id');
  const [bizPhone, setBizPhone] = useState('+6281234567890');
  const [bizTimezone, setBizTimezone] = useState('Asia/Jakarta');

  // Customer App Kiosk Form State
  const [welcomeText, setWelcomeText] = useState('Selamat Datang di Popcut.id — Sentuh Layar untuk Mulai');
  const [idleTimeout, setIdleTimeout] = useState(60);
  const [sessionDuration, setSessionDuration] = useState(10); // PRD specifies max 10 minutes

  // Payment Form State
  const [merchantId, setMerchantId] = useState('MID-POPCUT-PRODUCTION-01');
  const [isSandbox, setIsSandbox] = useState(false);

  // Storage Form State
  const [retentionDays, setRetentionDays] = useState(14);
  const [maxUploadMb, setMaxUploadMb] = useState(25);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  return (
    <AppShell
      title="Pengaturan Sistem & Konfigurasi Bisnis"
      breadcrumbs={[{ label: 'Sistem' }, { label: 'Pengaturan' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Pengaturan Sistem
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Konfigurasi identitas bisnis, parameter aplikasi kiosk booth, gateway pembayaran, dan retensi penyimpanan cloud.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSavedToast && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pengaturan Tersimpan!
              </span>
            )}
            <Button size="sm" type="submit" form="settings-form">
              <Save className="w-3.5 h-3.5" />
              Simpan Perubahan
            </Button>
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { id: 'business', label: 'Profil Bisnis', icon: Building2 },
            { id: 'kiosk', label: 'Aplikasi Booth / Kiosk', icon: Monitor },
            { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
            { id: 'storage', label: 'Penyimpanan & Retensi', icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                  isActive
                    ? 'bg-surface border-content-primary text-content-primary font-bold shadow-sm'
                    : 'bg-surface/50 border-border text-content-secondary hover:bg-surface hover:text-content-primary'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-contrast' : 'text-content-muted'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Settings Forms */}
        <form id="settings-form" onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: Profil Bisnis */}
          {activeSection === 'business' && (
            <Card>
              <CardHeader>
                <CardTitle>Identitas & Operasional Bisnis</CardTitle>
              </CardHeader>
              <div className="space-y-4 max-w-xl">
                <Input
                  label="Nama Bisnis Resmi"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email Dukungan Operasional"
                    type="email"
                    value={bizEmail}
                    onChange={(e) => setBizEmail(e.target.value)}
                    required
                  />
                  <Input
                    label="WhatsApp / Telepon Helpline"
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-primary mb-1">
                      Zona Waktu Bisnis
                    </label>
                    <select
                      value={bizTimezone}
                      onChange={(e) => setBizTimezone(e.target.value)}
                      className="w-full h-9 bg-surface border border-border rounded px-3 text-xs"
                    >
                      <option value="Asia/Jakarta">WIB (Asia/Jakarta, UTC+7)</option>
                      <option value="Asia/Makassar">WITA (Asia/Makassar, UTC+8)</option>
                      <option value="Asia/Jayapura">WIT (Asia/Jayapura, UTC+9)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-primary mb-1">
                      Mata Uang Default
                    </label>
                    <input
                      type="text"
                      value="IDR (Rupiah Indonesia)"
                      disabled
                      className="w-full h-9 bg-canvas border border-border rounded px-3 text-xs font-mono text-content-muted"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 2: Customer App / Kiosk Settings */}
          {activeSection === 'kiosk' && (
            <Card>
              <CardHeader>
                <CardTitle>Parameter Aplikasi Kiosk Booth (Customer App)</CardTitle>
              </CardHeader>
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Teks Sambutan di Layar Utama Booth
                  </label>
                  <input
                    type="text"
                    value={welcomeText}
                    onChange={(e) => setWelcomeText(e.target.value)}
                    className="w-full h-9 bg-surface border border-border rounded px-3 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Idle Timeout Layar (Detik)"
                    type="number"
                    value={idleTimeout}
                    onChange={(e) => setIdleTimeout(Number(e.target.value))}
                    helperText="Otomatis kembali ke layar awal jika tak tersentuh."
                  />
                  <Input
                    label="Maksimum Durasi Sesi Foto (Menit)"
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    max={10}
                    helperText="Maksimum 10 menit sesuai kebijakan PRD v2.0."
                  />
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 3: Payment Gateway */}
          {activeSection === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle>Konfigurasi Pembayaran QRIS & Gateway</CardTitle>
              </CardHeader>
              <div className="space-y-4 max-w-xl">
                <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Keamanan Rahasia Kredensial:</strong> Secret API key dan Webhook signature disimpan secara terenkripsi dan tidak pernah ditampilkan ulang di antarmuka web.
                  </span>
                </div>

                <Input
                  label="Merchant Reference / ID"
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between p-3 rounded border border-border bg-canvas/30 text-xs">
                  <div>
                    <span className="font-semibold text-content-primary block">Lingkungan Gateway (Environment)</span>
                    <span className="text-content-secondary">
                      {isSandbox ? 'Sandbox (Uji coba simulasi pembayaran)' : 'Production (Transaksi uang riil)'}
                    </span>
                  </div>
                  <Badge variant={isSandbox ? 'warning' : 'success'}>
                    {isSandbox ? 'SANDBOX' : 'PRODUCTION LIVE'}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 4: Storage & Retensi */}
          {activeSection === 'storage' && (
            <Card>
              <CardHeader>
                <CardTitle>Kebijakan Retensi Cloud Storage & File</CardTitle>
              </CardHeader>
              <div className="space-y-4 max-w-xl">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Masa Aktif Tautan Galeri Cloud (Hari)"
                    type="number"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                    helperText="Setelah masa ini berakhir, link QR tidak dapat dibuka."
                  />
                  <Input
                    label="Maksimum Ukuran File Frame (MB)"
                    type="number"
                    value={maxUploadMb}
                    onChange={(e) => setMaxUploadMb(Number(e.target.value))}
                    helperText="Standar format PNG DPI 300 (maks. 25 MB)."
                  />
                </div>

                <div className="p-3 rounded bg-canvas border border-border text-xs text-content-secondary">
                  Catatan Arsitektur: Penyimpanan lokal di MacBook booth diatur oleh retensi hard drive 90 hari independen dari durasi cloud.
                </div>
              </div>
            </Card>
          )}
        </form>
      </div>
    </AppShell>
  );
}
