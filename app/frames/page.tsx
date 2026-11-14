'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  UploadCloud,
  Eye,
  Edit3,
  Archive,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Grid,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { initialFrames } from '@/lib/data/mock-data';
import { Frame } from '@/types/database.types';

export default function FramesPage() {
  const [frames, setFrames] = useState<Frame[]>(initialFrames);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFrameName, setNewFrameName] = useState('');
  const [newFrameDimensions, setNewFrameDimensions] = useState('2x6');

  const filteredFrames = selectedCategory === 'all'
    ? frames
    : frames.filter((f) => f.dimensions.includes(selectedCategory));

  return (
    <AppShell
      title="Manajemen Bingkai Foto (Frame Library)"
      breadcrumbs={[{ label: 'Bisnis' }, { label: 'Bingkai & Slot' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Galeri Bingkai Foto (Frame Master)
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Kelola template PNG transparan, versi desain, dan pemetaan slot foto untuk rendering cetak di booth.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/frames/editor">
              <Button size="sm">
                <Plus className="w-3.5 h-3.5" />
                Buka Visual Frame Editor
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
              <UploadCloud className="w-3.5 h-3.5" />
              Unggah PNG Master
            </Button>
          </div>
        </div>

        {/* 2. Category Filter Pills */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
          <span className="text-content-muted font-medium pr-1 text-[11px] uppercase tracking-wider">Format:</span>
          {['all', '2x6', '4x6'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full border transition-all text-xs font-medium ${
                selectedCategory === cat
                  ? 'bg-content-primary text-white border-content-primary shadow-sm'
                  : 'bg-surface text-content-secondary border-border hover:border-border-strong hover:text-content-primary'
              }`}
            >
              {cat === 'all' ? 'Semua Format' : cat === '2x6' ? 'Strip Vertikal (2x6 inci)' : 'Postcard Lebar (4x6 inci)'}
            </button>
          ))}
        </div>

        {/* 3. Visual Frames Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredFrames.map((frame) => (
            <Card key={frame.id} className="p-0 overflow-hidden flex flex-col justify-between hoverable group">
              {/* Thumbnail Display with Alpha Checkerboard Background */}
              <div className="relative aspect-[2/3] bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] flex items-center justify-center p-4 border-b border-border overflow-hidden">
                {/* Simulated Photobooth Frame Overlay */}
                <div className="w-full h-full border-2 border-stone-800 bg-white/95 rounded p-3 flex flex-col justify-between shadow-subtle group-hover:scale-[1.02] transition-transform duration-200">
                  {/* Photo Slots Wireframe */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                    <div className="bg-stone-200 border border-stone-300 rounded h-14 flex items-center justify-center text-[10px] text-stone-500 font-mono">
                      Slot #1 (Pose 1)
                    </div>
                    <div className="bg-stone-200 border border-stone-300 rounded h-14 flex items-center justify-center text-[10px] text-stone-500 font-mono">
                      Slot #2 (Pose 2)
                    </div>
                    <div className="bg-stone-200 border border-stone-300 rounded h-14 flex items-center justify-center text-[10px] text-stone-500 font-mono">
                      Slot #3 (Pose 3)
                    </div>
                  </div>
                  {/* Bottom Logo Strip */}
                  <div className="text-center pt-2">
                    <span className="font-headline font-bold text-[10px] tracking-widest text-stone-800 uppercase">
                      POPCUT.ID
                    </span>
                  </div>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <Badge variant="brand">v2.1 Published</Badge>
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-4 space-y-3">
                <div>
                  <span className="font-mono text-[10px] text-content-muted">{frame.internal_code}</span>
                  <h3 className="text-xs font-bold text-content-primary font-headline mt-0.5 truncate">
                    {frame.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-content-secondary">
                    <span>Format: {frame.dimensions}</span>
                    <span>•</span>
                    <span>Rasio {frame.aspect_ratio}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-1">
                  <Link href={`/frames/editor?id=${frame.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full text-xs gap-1">
                      <Edit3 className="w-3 h-3" />
                      Edit Slot
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" title="Arsipkan">
                    <Archive className="w-3.5 h-3.5 text-content-muted hover:text-status-error" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 4. Upload Frame Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Unggah Master Frame PNG"
          description="Pastikan file berekstensi PNG dengan transparansi alpha untuk slot foto (DPI 300 disarankan)."
          confirmLabel="Unggah & Masuk ke Editor"
          onConfirm={() => {
            setIsUploadModalOpen(false);
            window.location.href = '/frames/editor';
          }}
        >
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border hover:border-brand rounded-lg p-6 text-center cursor-pointer transition-colors bg-canvas/30">
              <UploadCloud className="w-8 h-8 text-content-muted mx-auto mb-2" />
              <p className="text-xs font-semibold text-content-primary">
                Tarik & letakkan file PNG di sini, atau klik untuk memilih
              </p>
              <p className="text-[11px] text-content-secondary mt-1">
                Format yang didukung: PNG transparan (Maks. 25 MB)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Nama Frame
              </label>
              <input
                type="text"
                value={newFrameName}
                onChange={(e) => setNewFrameName(e.target.value)}
                placeholder="e.g. Retro Pastel 4-Grid"
                className="w-full h-9 bg-surface border border-border rounded px-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Ukuran Cetak Kertas Fisik
              </label>
              <select
                value={newFrameDimensions}
                onChange={(e) => setNewFrameDimensions(e.target.value)}
                className="w-full h-9 bg-surface border border-border rounded px-3 text-xs"
              >
                <option value="2x6">2x6 Inci (Photo Strip Vertikal)</option>
                <option value="4x6">4x6 Inci (Postcard Jumbo)</option>
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
