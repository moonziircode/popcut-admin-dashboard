'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MonitorDot,
  Plus,
  RefreshCw,
  Send,
  Camera,
  Printer,
  HardDrive,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatDateId } from '@/lib/utils';
import { initialBooths, initialEvents } from '@/lib/data/mock-data';
import { Booth } from '@/types/database.types';

export default function BoothsPage() {
  const [booths, setBooths] = useState<Booth[]>(initialBooths);
  const [activeTab, setActiveTab] = useState<'fleet' | 'sync'>('fleet');
  const activeEvent = initialEvents.find((e) => e.is_active) || null;

  // Register & Pairing Modal
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [pairingStep, setPairingStep] = useState<1 | 2>(1);
  const [newBoothName, setNewBoothName] = useState('');
  const [newBoothLocation, setNewBoothLocation] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  // Publish Config Modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishVersion, setPublishVersion] = useState('v2.4.2');

  const handleStartPairing = () => {
    setPairingStep(1);
    setNewBoothName('');
    setNewBoothLocation('');
    setGeneratedToken('');
    setIsPairingModalOpen(true);
  };

  const handleGeneratePairingToken = () => {
    if (!newBoothName.trim() || !newBoothLocation.trim()) return;
    const token = `POPCUT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    setGeneratedToken(token);
    setPairingStep(2);
  };

  const handlePublishConfig = () => {
    // Simulate updating all booths target config
    setBooths((prev) =>
      prev.map((b) => ({
        ...b,
        target_config_version_id: publishVersion,
        updated_at: new Date().toISOString(),
      }))
    );
    setIsPublishModalOpen(false);
  };

  return (
    <AppShell
      title="Manajemen Armada Booth & Sinkronisasi"
      breadcrumbs={[{ label: 'Operasional' }, { label: 'Armada Booth' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Armada Booth & Sinkronisasi
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Pantau status real-time perangkat MacBook, kesehatan kamera DSLR, printer fisik, dan distribusi konfigurasi rilis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsPublishModalOpen(true)}>
              <Send className="w-3.5 h-3.5" />
              Terbitkan Rilis Konfigurasi
            </Button>
            <Button size="sm" onClick={handleStartPairing}>
              <Plus className="w-3.5 h-3.5" />
              Registrasi Booth Baru
            </Button>
          </div>
        </div>

        {/* Dynamic Event Mobile Rig Active Banner */}
        {activeEvent ? (
          <div className="p-4 bg-surface border-2 border-brand/40 rounded-xl shadow-xs relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand text-brand-contrast">
                    UNIT RIG UTAMA AKTIF
                  </span>
                  <span className="text-xs font-mono text-content-secondary">
                    Hardware: MacBook Pro M1 Pro (16-inch, 2021)
                  </span>
                </div>
                <h3 className="text-base font-bold text-content-primary font-headline flex items-center gap-2">
                  <span>🎪 Event Aktif:</span>
                  <span className="text-brand-contrast underline decoration-brand">
                    {activeEvent.name}
                  </span>
                </h3>
                <p className="text-xs text-content-secondary">
                  Venue: {activeEvent.venue} • Seluruh paket, frame, dan voucher otomatis diselaraskan ke Customer App booth ini.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href="/events">
                  <Button variant="primary" size="sm" className="bg-brand text-brand-contrast hover:bg-brand-hover">
                    <CalendarDays className="w-4 h-4 mr-1.5" />
                    Kelola / Ganti Event
                  </Button>
                </Link>
                <Link href="/frames">
                  <Button variant="outline" size="sm" className="border-border hover:bg-canvas">
                    Atur Frame Event
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-surface border-2 border-dashed border-border-strong rounded-xl shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-content-muted text-white">
                    STATUS RIG: STANDBY (SIAGA)
                  </span>
                  <span className="text-xs font-mono text-content-secondary">
                    Hardware: MacBook Pro M1 Pro (Online)
                  </span>
                </div>
                <h3 className="text-base font-bold text-content-primary font-headline">
                  Tidak Ada Event yang Aktif — Kiosk Siaga
                </h3>
                <p className="text-xs text-content-secondary">
                  Layar Customer Application menampilkan standby screen default. Pilih event untuk mengaktifkan sesi photobooth di rig ini.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href="/events">
                  <Button variant="primary" size="sm" className="bg-brand text-brand-contrast hover:bg-brand-hover">
                    <Sparkles className="w-4 h-4 mr-1.5 text-brand-dark" />
                    Aktifkan Event ke Rig
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 2. Tabs Navigation */}
        <div className="border-b border-border flex items-center gap-6 text-xs">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`pb-3 font-semibold transition-colors relative ${
              activeTab === 'fleet' ? 'text-content-primary' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Daftar Armada ({booths.length})
            {activeTab === 'fleet' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 font-semibold transition-colors relative ${
              activeTab === 'sync' ? 'text-content-primary' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Status Sinkronisasi Aset & Konfigurasi
            {activeTab === 'sync' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
            )}
          </button>
        </div>

        {/* 3. TAB 1: Fleet Overview Table */}
        {activeTab === 'fleet' && (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                    <th className="py-3 px-4">Nama & Kode Booth</th>
                    <th className="py-3 px-4">Lokasi</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">DSLR Kamera</th>
                    <th className="py-3 px-4">Printer</th>
                    <th className="py-3 px-4">Penyimpanan SSD</th>
                    <th className="py-3 px-4">Versi Konfig</th>
                    <th className="py-3 px-4">Heartbeat Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {booths.map((booth) => (
                    <tr key={booth.id} className="hover:bg-canvas/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-content-primary font-headline">
                          {booth.name}
                        </div>
                        <span className="font-mono text-[10px] text-content-muted">
                          {booth.booth_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-content-secondary">{booth.location}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            booth.status === 'ONLINE'
                              ? 'success'
                              : booth.status === 'NEEDS_ATTENTION'
                              ? 'warning'
                              : 'neutral'
                          }
                          dot
                        >
                          {booth.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1.5 font-medium text-content-primary">
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                          {booth.camera_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`flex items-center gap-1.5 font-medium ${
                            booth.printer_status === 'READY' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          {booth.printer_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-content-secondary">
                        <span className="text-content-primary font-bold">
                          {booth.storage_health.free_gb} GB
                        </span>{' '}
                        bebas
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-content-primary">
                        <span className="bg-canvas px-2 py-0.5 rounded border border-border">
                          {booth.current_config_version_id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-content-secondary text-[11px]">
                        {formatDateId(booth.last_seen_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 4. TAB 2: Asset & Config Sync Monitoring */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <Card className="p-0 overflow-hidden">
              <CardHeader className="p-4 border-b border-border m-0">
                <div>
                  <CardTitle>Distribusi Manifest Konfigurasi & Master Frame</CardTitle>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Frame foto dieksekusi secara lokal di SSD MacBook booth. Admin Dashboard memantau status unduhan dan verifikasi integritas SHA-256.
                  </p>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                      <th className="py-3 px-4">Booth Target</th>
                      <th className="py-3 px-4">Versi Aktif di Booth</th>
                      <th className="py-3 px-4">Target Rilis</th>
                      <th className="py-3 px-4">Status Sinkron</th>
                      <th className="py-3 px-4">Progres Aset</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {booths.map((booth) => {
                      const isUpToDate = booth.current_config_version_id === booth.target_config_version_id;
                      return (
                        <tr key={booth.id} className="hover:bg-canvas/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-content-primary">
                            {booth.name}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                              {booth.current_config_version_id}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="bg-canvas border border-border px-2 py-0.5 rounded text-[11px]">
                              {booth.target_config_version_id}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={isUpToDate ? 'success' : 'warning'} dot>
                              {isUpToDate ? 'APPLIED (Sinkron)' : 'DOWNLOADING (Dalam Proses)'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="w-32 bg-canvas-alt rounded-full h-2 overflow-hidden border border-border">
                              <div
                                className="bg-brand h-full rounded-full transition-all"
                                style={{ width: isUpToDate ? '100%' : '65%' }}
                              />
                            </div>
                            <span className="text-[10px] text-content-muted font-mono mt-1 block">
                              {isUpToDate ? '4/4 frame terverifikasi' : '2/4 frame terunduh (65%)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button variant="ghost" size="sm" className="text-xs">
                              <RefreshCw className="w-3 h-3" />
                              Cek Ulang
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* 5. BOOTH PAIRING & PROVISIONING WIZARD MODAL */}
        <Modal
          isOpen={isPairingModalOpen}
          onClose={() => setIsPairingModalOpen(false)}
          title={pairingStep === 1 ? 'Registrasi Booth Baru' : 'Token Aktivasi Booth'}
          description={
            pairingStep === 1
              ? 'Masukkan identitas dan lokasi booth sebelum menghasilkan token provisioning.'
              : 'Salin token berikut dan masukkan pada menu Setup Kiosk di MacBook booth.'
          }
          confirmLabel={pairingStep === 1 ? 'Hasilkan Token Aktivasi' : 'Selesai'}
          onConfirm={pairingStep === 1 ? handleGeneratePairingToken : () => setIsPairingModalOpen(false)}
        >
          {pairingStep === 1 ? (
            <div className="space-y-4">
              <Input
                label="Nama Booth"
                value={newBoothName}
                onChange={(e) => setNewBoothName(e.target.value)}
                placeholder="e.g. Popcut Kota Kasablanka Lt. 1"
                required
              />
              <Input
                label="Lokasi Fisik / Venue"
                value={newBoothLocation}
                onChange={(e) => setNewBoothLocation(e.target.value)}
                placeholder="e.g. Kota Kasablanka Mall, Jakarta Selatan"
                required
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-canvas rounded border border-border space-y-2 text-center">
                <span className="text-[11px] text-content-muted uppercase tracking-wider font-semibold">
                  One-Time Provisioning Token:
                </span>
                <div className="font-mono text-base font-bold text-content-primary bg-surface p-2.5 rounded border border-border select-all">
                  {generatedToken}
                </div>
                <p className="text-[11px] text-content-secondary mt-1">
                  Token ini berlaku selama 60 menit. Setelah dipasangkan, booth akan menerima kredensial perangkat yang aman.
                </p>
              </div>
            </div>
          )}
        </Modal>

        {/* 6. PUBLISH CONFIGURATION MODAL */}
        <Modal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          title="Terbitkan Rilis Konfigurasi ke Seluruh Booth"
          description="Rilis ini mencakup katalog paket terbaru, frame foto aktif, dan aturan harga cetak tambahan."
          confirmLabel="Terbitkan Rilis Sekarang"
          onConfirm={handlePublishConfig}
        >
          <div className="space-y-3">
            <Input
              label="Nomor Versi Rilis Baru"
              value={publishVersion}
              onChange={(e) => setPublishVersion(e.target.value)}
              helperText="Format: vX.Y.Z (immutable manifest)"
            />
            <div className="p-3 rounded bg-canvas border border-border text-xs text-content-secondary">
              Setelah diterbitkan, Customer Application pada setiap booth yang sedang online akan otomatis mengunduh aset frame terbaru di latar belakang tanpa mengganggu sesi foto yang sedang berjalan.
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
