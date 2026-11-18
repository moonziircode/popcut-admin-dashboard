'use client';

import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Copy,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'business' | 'kiosk' | 'payment' | 'storage'>('business');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Business Form State
  const [bizName, setBizName] = useState('Popcut.id Photobooth');
  const [bizEmail, setBizEmail] = useState('hello@popcut.id');
  const [bizPhone, setBizPhone] = useState('+6281234567890');
  const [bizTimezone, setBizTimezone] = useState('Asia/Jakarta');

  // Customer App Kiosk Form State
  const [welcomeText, setWelcomeText] = useState('Selamat Datang di Popcut.id — Sentuh Layar untuk Mulai');
  const [countdownTimer, setCountdownTimer] = useState(5);
  const [idleTimeout, setIdleTimeout] = useState(60);
  const [sessionDuration, setSessionDuration] = useState(10); // PRD specifies max 10 minutes

  // Payment Form State
  const [paymentProvider, setPaymentProvider] = useState<'MIDTRANS' | 'XENDIT' | 'MOCK'>('MIDTRANS');
  const [merchantId, setMerchantId] = useState('Popcut.id');
  const [clientKey, setClientKey] = useState('Mid-client-2aA4MHqiqjjWz7V8');
  const [serverKey, setServerKey] = useState('••••••••••••••••••••••••••••••••');
  const [sandboxServerKey, setSandboxServerKey] = useState('••••••••••••••••••••••••••••••••');
  const [webhookSecret, setWebhookSecret] = useState('••••••••••••••••••••••••••••••••');
  const [isSandbox, setIsSandbox] = useState(false);
  const [allowCashPayment, setAllowCashPayment] = useState(true);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string } | null>(null);

  // Storage Form State
  const [retentionDays, setRetentionDays] = useState(14);
  const [maxUploadMb, setMaxUploadMb] = useState(25);

  // Load initial settings from real API
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          const s = data.settings;
          if (s.business_name) setBizName(s.business_name);
          if (s.contact_email) setBizEmail(s.contact_email);
          if (s.contact_phone) setBizPhone(s.contact_phone);
          if (s.operating_city) setBizTimezone('Asia/Jakarta');
          if (s.countdown_timer_seconds !== undefined) setCountdownTimer(Number(s.countdown_timer_seconds));
          if (s.idle_timeout_seconds !== undefined) setIdleTimeout(Number(s.idle_timeout_seconds));
          if (s.session_duration_minutes !== undefined) setSessionDuration(Number(s.session_duration_minutes));
          if (s.welcome_title) setWelcomeText(s.welcome_title);
          if (s.retention_days !== undefined) setRetentionDays(Number(s.retention_days));
          if (s.max_upload_mb !== undefined) setMaxUploadMb(Number(s.max_upload_mb));
        }
      })
      .catch((err) => console.error('[Settings] Load settings warning:', err));

    fetch('/api/payment/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.merchantId) setMerchantId(data.merchantId);
        if (data.clientKey) setClientKey(data.clientKey);
        if (data.serverKeyMasked) setServerKey(data.serverKeyMasked);
        if (data.sandboxServerKeyMasked) setSandboxServerKey(data.sandboxServerKeyMasked);
        if (data.isProduction !== undefined) setIsSandbox(!data.isProduction);
      })
      .catch(() => {});
  }, []);

  const handleTestPing = async () => {
    setIsTestingPing(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/payment/test-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isProduction: !isSandbox }),
      });
      const data = await res.json();
      setPingResult({
        success: data.success,
        message: data.message,
      });
    } catch (err: any) {
      setPingResult({
        success: false,
        message: err.message || 'Gagal menghubungi server.',
      });
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: bizName,
          contact_email: bizEmail,
          contact_phone: bizPhone,
          countdown_timer_seconds: countdownTimer,
          idle_timeout_seconds: idleTimeout,
          session_duration_minutes: sessionDuration,
          welcome_title: welcomeText,
          retention_days: retentionDays,
          max_upload_mb: maxUploadMb,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSavedToast(true);
        setTimeout(() => setIsSavedToast(false), 2500);
      } else {
        setSaveError(data.error || 'Gagal menyimpan pengaturan ke database.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
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
            {saveError && (
              <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {saveError}
              </span>
            )}
            {isSavedToast && (
              <span className="text-xs text-emerald-500 font-medium flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Perubahan tersimpan permanen
              </span>
            )}
            <Button size="sm" type="submit" form="settings-form" disabled={isSubmitting}>
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                      Zona Waktu Operasional
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

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Countdown Timer Kamera (Detik)"
                    type="number"
                    value={countdownTimer}
                    onChange={(e) => setCountdownTimer(Number(e.target.value))}
                    min={3}
                    max={15}
                    helperText="Waktu jeda pose sebelum jepret."
                  />
                  <Input
                    label="Idle Timeout Layar (Detik)"
                    type="number"
                    value={idleTimeout}
                    onChange={(e) => setIdleTimeout(Number(e.target.value))}
                    helperText="Otomatis kembali ke layar awal."
                  />
                  <Input
                    label="Maks. Durasi Sesi (Menit)"
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
                    max={10}
                    helperText="Maks. 10 menit (PRD)."
                  />
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 3: Payment Gateway */}
          {activeSection === 'payment' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Konfigurasi Pembayaran QRIS & Payment Gateway</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestPing}
                    disabled={isTestingPing}
                    className="text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isTestingPing ? 'animate-spin' : ''}`} />
                    {isTestingPing ? 'Menguji Gateway...' : 'Test Ping Webhook / API'}
                  </Button>
                </div>
              </CardHeader>
              <div className="space-y-4 max-w-xl">
                {pingResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2 animate-in fade-in ${
                      pingResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {pingResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    )}
                    <div>
                      <span className="font-bold block">
                        {pingResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}
                      </span>
                      <span>{pingResult.message}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Penyedia Gateway
                  </label>
                  <select
                    value={paymentProvider}
                    onChange={(e) => setPaymentProvider(e.target.value as any)}
                    className="w-full h-9 bg-surface border border-border rounded px-3 text-xs"
                  >
                    <option value="MIDTRANS">Midtrans (Snap QRIS, GoPay, ShopeePay)</option>
                    <option value="XENDIT" disabled>Xendit (Segera Hadir)</option>
                    <option value="MOCK" disabled>Simulasi Offline (Khusus Testing)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Merchant ID"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    required
                  />
                  <Input
                    label="Client Key"
                    value={clientKey}
                    onChange={(e) => setClientKey(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3 p-3 bg-canvas border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-brand" />
                      Kredensial Server Terproteksi (Read-Only)
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      Server-Side Only
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-content-muted block mb-0.5">Production Server Key:</span>
                      <input
                        type="text"
                        readOnly
                        value={serverKey}
                        className="w-full h-7 bg-surface border border-border rounded px-2 text-xs font-mono text-content-secondary"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-content-muted block mb-0.5">Sandbox Server Key:</span>
                      <input
                        type="text"
                        readOnly
                        value={sandboxServerKey}
                        className="w-full h-7 bg-surface border border-border rounded px-2 text-xs font-mono text-content-secondary"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-content-muted leading-relaxed">
                    Kunci server dienkripsi dan disimpan eksklusif pada variabel lingkungan Vercel. Kunci tidak dapat diubah melalui antarmuka web untuk mencegah kebocoran kredensial.
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-canvas border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-content-primary">
                      URL Endpoint Notifikasi Webhook (Midtrans)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('https://popcut-admin-dashboard.vercel.app/api/webhooks/payment');
                      }}
                      className="text-[11px] text-content-secondary hover:text-content-primary flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Salin URL
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value="https://popcut-admin-dashboard.vercel.app/api/webhooks/payment"
                    className="w-full h-8 bg-canvas border border-border rounded px-3 text-xs font-mono text-content-secondary"
                  />
                  <div>
                    <label className="block text-[11px] font-semibold text-content-primary mb-1">
                      Webhook Signature / HMAC SHA-512 Secret
                    </label>
                    <input
                      type="password"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      className="w-full h-8 bg-surface border border-border rounded px-3 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Environment Mode Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-canvas/30 text-xs">
                  <div>
                    <span className="font-semibold text-content-primary block">Lingkungan Gateway (Environment)</span>
                    <span className="text-content-secondary">
                      {isSandbox ? 'Sandbox (Uji coba simulasi pembayaran)' : 'Production (Transaksi uang riil)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSandbox(!isSandbox)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                        isSandbox
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {isSandbox ? 'SANDBOX MODE' : 'PRODUCTION LIVE'}
                    </button>
                  </div>
                </div>

                {/* Cashier Payment Setting */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface text-xs">
                  <div>
                    <span className="font-semibold text-content-primary block">
                      Konfirmasi Tunai Kasir di Booth
                    </span>
                    <span className="text-content-secondary">
                      Izinkan operator mengonfirmasi pembayaran tunai secara manual di MacBook Customer App.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowCashPayment(!allowCashPayment)}
                    className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      allowCashPayment ? 'bg-brand' : 'bg-canvas-alt border border-border'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                        allowCashPayment ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
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
