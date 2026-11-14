'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  QrCode,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateId } from '@/lib/utils';
import { initialBooths } from '@/lib/data/mock-data';

interface GalleryItem {
  id: string;
  session_number: string;
  booth_name: string;
  qr_token: string;
  file_count: number;
  upload_status: 'AVAILABLE' | 'UPLOADING' | 'UPLOAD_FAILED' | 'EXPIRED';
  download_count: number;
  available_at: string;
  expires_at: string;
}

export default function GalleriesPage() {
  const [galleries, setGalleries] = useState<GalleryItem[]>([
    {
      id: 'gal-001',
      session_number: 'SES-20261115-0044',
      booth_name: 'Popcut Grand Indonesia Lt. 2',
      qr_token: 'popcut-tok-789a2bc4',
      file_count: 5, // 4 photos + 1 rendered strip
      upload_status: 'AVAILABLE',
      download_count: 3,
      available_at: '2026-11-15T01:37:02Z',
      expires_at: '2026-11-29T23:59:59Z',
    },
    {
      id: 'gal-002',
      session_number: 'SES-20261115-0043',
      booth_name: 'Popcut Studio Central',
      qr_token: 'popcut-tok-441f90ee',
      file_count: 7, // 6 photos + 1 postcard
      upload_status: 'AVAILABLE',
      download_count: 1,
      available_at: '2026-11-15T01:26:30Z',
      expires_at: '2026-11-29T23:59:59Z',
    },
    {
      id: 'gal-003',
      session_number: 'SES-20261115-0042',
      booth_name: 'Popcut PIM 3 Lt. LG',
      qr_token: 'popcut-tok-118c77aa',
      file_count: 4,
      upload_status: 'AVAILABLE',
      download_count: 0,
      available_at: '2026-11-15T01:07:45Z',
      expires_at: '2026-11-29T23:59:59Z',
    },
  ]);

  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = (token: string) => {
    navigator.clipboard.writeText(`https://popcut.id/g/${token}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AppShell
      title="Monitoring Galeri Digital & Akses QR"
      breadcrumbs={[{ label: 'Operasional' }, { label: 'Galeri Digital' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Monitoring Galeri Digital & QR Download
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Pantau status pengunggahan file foto hasil photobooth ke cloud storage dan masa berlaku tautan unduh pelanggan.
            </p>
          </div>
        </div>

        {/* 2. Cloud Storage Policy Callout */}
        <div className="bg-canvas border border-border rounded-lg p-4 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-content-secondary leading-relaxed">
            <strong className="text-content-primary">Arsitektur Keamanan Cloud Storage:</strong> Sesuai PRD Section 19, foto pelanggan disimpan dalam private bucket Supabase. Tautan QR mengarah ke domain resmi <code>https://popcut.id/g/:token</code> yang menghasilkan signed URL berdurasi singkat sehingga link tidak dapat ditebak secara publik.
          </div>
        </div>

        {/* 3. Galleries Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                  <th className="py-3 px-4">Sesi Foto Terkait</th>
                  <th className="py-3 px-4">Lokasi Booth</th>
                  <th className="py-3 px-4">Jumlah File Aset</th>
                  <th className="py-3 px-4">Status Cloud</th>
                  <th className="py-3 px-4">Jumlah Unduhan</th>
                  <th className="py-3 px-4">Masa Berlaku Link</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {galleries.map((gal) => (
                  <tr key={gal.id} className="hover:bg-canvas/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                      {gal.session_number}
                    </td>
                    <td className="py-3.5 px-4 text-content-secondary font-medium">
                      {gal.booth_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {gal.file_count} File (Foto & Strip)
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={gal.upload_status === 'AVAILABLE' ? 'success' : 'warning'} dot>
                        {gal.upload_status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-content-primary">
                      {gal.download_count}x diunduh
                    </td>
                    <td className="py-3.5 px-4 text-content-secondary text-[11px]">
                      Hingga {formatDateId(gal.expires_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedGallery(gal)}
                        className="gap-1 text-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Akses QR
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 4. QR ACCESS DETAIL MODAL */}
        <Modal
          isOpen={!!selectedGallery}
          onClose={() => setSelectedGallery(null)}
          title={`Akses QR Galeri: ${selectedGallery?.session_number}`}
          description="Pelanggan memindai QR code ini di layar booth untuk membuka halaman unduhan digital."
        >
          {selectedGallery && (
            <div className="space-y-4 text-center">
              {/* Simulated QR Box */}
              <div className="w-44 h-44 mx-auto bg-white border-2 border-border rounded-lg p-3 flex flex-col items-center justify-center shadow-subtle">
                <QrCode className="w-36 h-36 text-stone-900" />
              </div>

              <div className="p-3 rounded bg-canvas border border-border text-xs text-left space-y-1.5">
                <span className="text-[11px] font-semibold text-content-muted uppercase">Tautan Halaman Galeri:</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-content-primary truncate select-all">
                    https://popcut.id/g/{selectedGallery.qr_token}
                  </span>
                  <button
                    onClick={() => handleCopyLink(selectedGallery.qr_token)}
                    className="p-1.5 rounded hover:bg-canvas-alt text-content-secondary hover:text-content-primary shrink-0"
                    title="Salin Tautan"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isCopied && (
                  <p className="text-[10px] text-emerald-700 font-semibold">Tautan berhasil disalin ke clipboard!</p>
                )}
              </div>

              <div className="text-[11px] text-content-muted">
                Status token: <strong className="text-emerald-700">Valid & Aktif</strong> • Kadaluwarsa otomatis dalam 14 hari.
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
