'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  Clock,
  Printer,
  Image as ImageIcon,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  X,
  FileCheck,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateId, formatRupiah } from '@/lib/utils';
import { initialSessions, initialBooths } from '@/lib/data/mock-data';
import { Session } from '@/types/database.types';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isPhotoUnlocked, setIsPhotoUnlocked] = useState(false);

  return (
    <AppShell
      title="Monitoring Sesi Foto Pelanggan"
      breadcrumbs={[{ label: 'Operasional' }, { label: 'Sesi Foto' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Monitoring Sesi Foto Pelanggan
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Pemantauan kronologi alur sesi pelanggan, status capture foto, antrean cetak, dan proteksi privasi.
            </p>
          </div>
        </div>

        {/* 2. Sessions List Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                  <th className="py-3 px-4">ID Sesi</th>
                  <th className="py-3 px-4">Waktu Mulai</th>
                  <th className="py-3 px-4">Paket Dipilih</th>
                  <th className="py-3 px-4">Lokasi Booth</th>
                  <th className="py-3 px-4">Status Sesi</th>
                  <th className="py-3 px-4">Status Cetak</th>
                  <th className="py-3 px-4">Status Galeri</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((ses) => (
                  <tr
                    key={ses.id}
                    className="hover:bg-canvas/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedSession(ses);
                      setIsPhotoUnlocked(false);
                    }}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                      {ses.session_number}
                    </td>
                    <td className="py-3.5 px-4 text-content-secondary">
                      {formatDateId(ses.started_at)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-content-primary">
                      {ses.package_snapshot.name}
                    </td>
                    <td className="py-3.5 px-4 text-content-secondary">
                      {initialBooths.find((b) => b.id === ses.booth_id)?.name || ses.booth_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={ses.session_status === 'COMPLETED' ? 'success' : 'warning'} dot>
                        {ses.session_status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 font-medium text-content-primary">
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                        {ses.print_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-content-secondary">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        {ses.gallery_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(ses);
                          setIsPhotoUnlocked(false);
                        }}
                      >
                        Timeline
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 3. SESSION TIMELINE & PRIVACY DRAWER */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-surface h-full shadow-elevation border-l border-border flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <span className="font-mono text-[11px] text-content-muted">Kronologi Sesi</span>
                    <h3 className="text-base font-bold text-content-primary font-headline mt-0.5">
                      {selectedSession.session_number}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="text-content-muted hover:text-content-primary p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Session Snapshot Meta */}
                <div className="p-3.5 rounded-lg bg-canvas border border-border grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-content-muted">Paket:</span>
                    <strong className="text-content-primary block">{selectedSession.package_snapshot.name}</strong>
                  </div>
                  <div>
                    <span className="text-content-muted">Nominal:</span>
                    <strong className="text-content-primary block font-mono">
                      {formatRupiah(selectedSession.package_snapshot.price)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-content-muted">Status Cetak:</span>
                    <strong className="text-emerald-700 block">{selectedSession.print_status}</strong>
                  </div>
                  <div>
                    <span className="text-content-muted">Durasi Sesi:</span>
                    <strong className="text-content-primary block font-mono">5 menit 00 detik</strong>
                  </div>
                </div>

                {/* Chronological Timeline Trail */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-content-primary font-headline uppercase tracking-wider">
                    Jejak Peristiwa (Event Timeline)
                  </h4>

                  <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {/* Event 1 */}
                    <div className="relative text-xs">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-600 absolute -left-6 top-0 flex items-center justify-center" />
                      <div className="flex justify-between items-baseline">
                        <strong className="text-content-primary font-semibold">Sesi Dimulai di Booth</strong>
                        <span className="text-[10px] text-content-muted font-mono">14:32:10 WIB</span>
                      </div>
                      <p className="text-content-secondary text-[11px] mt-0.5">
                        Pelanggan memilih paket {selectedSession.package_snapshot.name} di layar kiosk.
                      </p>
                    </div>

                    {/* Event 2 */}
                    <div className="relative text-xs">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-600 absolute -left-6 top-0" />
                      <div className="flex justify-between items-baseline">
                        <strong className="text-content-primary font-semibold">Pembayaran Terverifikasi</strong>
                        <span className="text-[10px] text-content-muted font-mono">14:33:04 WIB</span>
                      </div>
                      <p className="text-content-secondary text-[11px] mt-0.5">
                        Pembayaran QRIS Rp35.000 dinyatakan PAID oleh server.
                      </p>
                    </div>

                    {/* Event 3 */}
                    <div className="relative text-xs">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-600 absolute -left-6 top-0" />
                      <div className="flex justify-between items-baseline">
                        <strong className="text-content-primary font-semibold">Pengambilan Foto Selesai</strong>
                        <span className="text-[10px] text-content-muted font-mono">14:34:15 WIB</span>
                      </div>
                      <p className="text-content-secondary text-[11px] mt-0.5">
                        4 pose tersimpan di SSD MacBook booth (1x retake pose #3 dicatat).
                      </p>
                    </div>

                    {/* Event 4 */}
                    <div className="relative text-xs">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-600 absolute -left-6 top-0" />
                      <div className="flex justify-between items-baseline">
                        <strong className="text-content-primary font-semibold">Pencetakan Fisik Sukses</strong>
                        <span className="text-[10px] text-content-muted font-mono">14:36:45 WIB</span>
                      </div>
                      <p className="text-content-secondary text-[11px] mt-0.5">
                        Printer DNP menyelesaikan 2 lembar strip 2x6 tanpa kendala mekanik.
                      </p>
                    </div>

                    {/* Event 5 */}
                    <div className="relative text-xs">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-600 absolute -left-6 top-0" />
                      <div className="flex justify-between items-baseline">
                        <strong className="text-content-primary font-semibold">Galeri Aktif & QR Ditampilkan</strong>
                        <span className="text-[10px] text-content-muted font-mono">14:37:10 WIB</span>
                      </div>
                      <p className="text-content-secondary text-[11px] mt-0.5">
                        Asset digital & Live Photo terunggah ke Cloud Storage. Sesi selesai sempurna.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Restricted Customer Photo Preview Box */}
                <div className="p-4 rounded-lg border border-border bg-canvas/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-content-primary">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Proteksi Privasi Foto Pelanggan</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPhotoUnlocked(!isPhotoUnlocked)}
                      className="text-xs gap-1"
                    >
                      {isPhotoUnlocked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {isPhotoUnlocked ? 'Kunci Kembali' : 'Buka Otorisasi'}
                    </Button>
                  </div>

                  {isPhotoUnlocked ? (
                    <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in">
                      {[1, 2, 3, 4].map((idx) => (
                        <div
                          key={idx}
                          className="aspect-[3/4] bg-stone-800 rounded border border-border flex flex-col items-center justify-center p-1 text-center text-white"
                        >
                          <Camera className="w-4 h-4 text-stone-400 mb-1" />
                          <span className="text-[9px] font-mono">Pose #{idx}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-content-secondary leading-relaxed">
                      Sesuai aturan keamanan PRD, thumbnail foto pelanggan diblur/dikunci untuk melindungi privasi pengunjung dan hanya dapat dibuka oleh peran Supervisor terotorisasi.
                    </p>
                  )}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-border bg-canvas/50 flex items-center justify-between gap-2">
                <Link href="/print-jobs">
                  <Button variant="secondary" size="sm">
                    Lihat Print Job
                  </Button>
                </Link>
                <Link href="/galleries">
                  <Button variant="secondary" size="sm">
                    Periksa Galeri Digital
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
