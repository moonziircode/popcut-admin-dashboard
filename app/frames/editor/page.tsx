'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Save,
  Send,
  Plus,
  Trash2,
  Move,
  Layers,
  Sparkles,
  Eye,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FrameSlot } from '@/types/database.types';

export default function FrameEditorPage() {
  // Initial frame slots in percentage relative to frame canvas (width: 100%, height: 100%)
  const [slots, setSlots] = useState<FrameSlot[]>([
    {
      id: 'slot-1',
      frame_version_id: 'fv-001',
      slot_index: 1,
      x_coord: 10,
      y_coord: 8,
      width: 80,
      height: 24,
      rotation: 0,
      fit_mode: 'cover',
      created_at: new Date().toISOString(),
    },
    {
      id: 'slot-2',
      frame_version_id: 'fv-001',
      slot_index: 2,
      x_coord: 10,
      y_coord: 36,
      width: 80,
      height: 24,
      rotation: 0,
      fit_mode: 'cover',
      created_at: new Date().toISOString(),
    },
    {
      id: 'slot-3',
      frame_version_id: 'fv-001',
      slot_index: 3,
      x_coord: 10,
      y_coord: 64,
      width: 80,
      height: 24,
      rotation: 0,
      fit_mode: 'cover',
      created_at: new Date().toISOString(),
    },
  ]);

  const [selectedSlotId, setSelectedSlotId] = useState<string>('slot-1');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isPreviewActive, setIsPreviewActive] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || slots[0];

  // Update selected slot properties
  const updateSelectedSlot = (updates: Partial<FrameSlot>) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === selectedSlotId ? { ...s, ...updates } : s))
    );
  };

  const handleAddSlot = () => {
    const newIndex = slots.length + 1;
    const newSlot: FrameSlot = {
      id: `slot-${Date.now()}`,
      frame_version_id: 'fv-001',
      slot_index: newIndex,
      x_coord: 15,
      y_coord: 15 + slots.length * 5,
      width: 70,
      height: 20,
      rotation: 0,
      fit_mode: 'cover',
      created_at: new Date().toISOString(),
    };
    setSlots([...slots, newSlot]);
    setSelectedSlotId(newSlot.id);
  };

  const handleDeleteSlot = (id: string) => {
    if (slots.length <= 1) return;
    const remaining = slots.filter((s) => s.id !== id);
    setSlots(remaining);
    setSelectedSlotId(remaining[0].id);
  };

  const handleSaveDraft = () => {
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  return (
    <div className="h-screen flex flex-col bg-canvas text-content-primary select-none overflow-hidden">
      {/* 1. TOP TOOLBAR */}
      <header className="h-14 bg-surface border-b border-border px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/frames">
            <button className="text-content-secondary hover:text-content-primary p-1 rounded hover:bg-canvas transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold font-headline text-content-primary">
                Retro Pastel 4-Grid v2.1
              </h1>
              <Badge variant="warning" dot>DRAFT</Badge>
            </div>
            <p className="text-[10px] text-content-secondary font-mono">Format: 2x6 Strip (1200 x 3600 px)</p>
          </div>
        </div>

        {/* Toolbar Center: Zoom & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-canvas border border-border rounded p-0.5 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1 hover:text-content-primary text-content-secondary"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1 hover:text-content-primary text-content-secondary"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsPreviewActive(!isPreviewActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
              isPreviewActive
                ? 'bg-content-primary text-white border-content-primary'
                : 'bg-surface text-content-secondary border-border hover:text-content-primary hover:bg-canvas'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {isPreviewActive ? 'Mode Edit' : 'Simulasi Foto'}
          </button>
        </div>

        {/* Toolbar Right: Save & Publish */}
        <div className="flex items-center gap-2">
          {isSavedToast && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tersimpan!
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={handleSaveDraft}>
            <Save className="w-3.5 h-3.5" />
            Simpan Draf
          </Button>
          <Button size="sm" onClick={() => setIsPublishModalOpen(true)}>
            <Send className="w-3.5 h-3.5" />
            Terbitkan Versi
          </Button>
        </div>
      </header>

      {/* 2. THREE-PANEL EDITOR WORKSPACE */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT PANEL: Layer / Photo Slots List */}
        <div className="w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Daftar Slot Foto ({slots.length})
              </h2>
              <button
                onClick={handleAddSlot}
                className="p-1 rounded bg-canvas hover:bg-canvas-alt text-content-primary text-xs"
                title="Tambah Slot Foto Baru"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {slots.map((slot) => {
                const isSelected = slot.id === selectedSlotId;
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`p-2.5 rounded border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-brand bg-brand-light/60 text-content-primary font-semibold shadow-xs'
                        : 'border-border bg-surface hover:bg-canvas text-content-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center font-mono text-[10px]">
                        #{slot.slot_index}
                      </span>
                      <span>Pose Foto Ke-{slot.slot_index}</span>
                    </div>
                    {slots.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlot(slot.id);
                        }}
                        className="text-content-muted hover:text-status-error p-1"
                        title="Hapus Slot"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-border bg-canvas/30 text-[11px] text-content-muted">
            Tip: Klik slot pada canvas atau gunakan panel kanan untuk mengubah posisi X & Y secara presisi.
          </div>
        </div>

        {/* CENTER CANVAS: Large Visual Frame Viewport */}
        <div className="flex-1 bg-canvas flex items-center justify-center p-8 overflow-auto relative">
          {/* Canvas Viewport Frame Container */}
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            className="w-[280px] h-[720px] bg-white rounded-lg shadow-elevation border-2 border-stone-800 relative overflow-hidden transition-transform duration-150"
          >
            {/* Checkerboard transparency background */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[size:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0] opacity-40 pointer-events-none" />

            {/* Photo Slots Layer (Rendered underneath frame artwork overlay) */}
            {slots.map((slot) => {
              const isSelected = slot.id === selectedSlotId;
              return (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  style={{
                    left: `${slot.x_coord}%`,
                    top: `${slot.y_coord}%`,
                    width: `${slot.width}%`,
                    height: `${slot.height}%`,
                    transform: `rotate(${slot.rotation}deg)`,
                  }}
                  className={`absolute rounded flex items-center justify-center cursor-move transition-all ${
                    isSelected
                      ? 'border-2 border-brand ring-2 ring-brand-contrast/20 bg-brand/10 shadow-sm z-20'
                      : 'border border-dashed border-stone-400 bg-stone-100/80 hover:border-brand z-10'
                  }`}
                >
                  {/* Photo Simulation Mode */}
                  {isPreviewActive ? (
                    <div className="w-full h-full bg-stone-300 rounded flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                      <Sparkles className="w-4 h-4 text-stone-500 mb-1" />
                      <span className="text-[10px] font-semibold text-stone-700">Foto Pose #{slot.slot_index}</span>
                      <span className="text-[9px] text-stone-500 font-mono">Rendered Output</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1">
                      <span className="text-[10px] font-bold font-mono text-content-primary">
                        Slot #{slot.slot_index}
                      </span>
                      <span className="text-[9px] text-content-secondary font-mono">
                        {slot.width}% × {slot.height}%
                      </span>
                    </div>
                  )}

                  {/* Corner Resize Handles for Selected Slot */}
                  {isSelected && !isPreviewActive && (
                    <>
                      <span className="w-2.5 h-2.5 bg-brand-contrast border border-white rounded-full absolute -top-1 -left-1" />
                      <span className="w-2.5 h-2.5 bg-brand-contrast border border-white rounded-full absolute -top-1 -right-1" />
                      <span className="w-2.5 h-2.5 bg-brand-contrast border border-white rounded-full absolute -bottom-1 -left-1" />
                      <span className="w-2.5 h-2.5 bg-brand-contrast border border-white rounded-full absolute -bottom-1 -right-1" />
                    </>
                  )}
                </div>
              );
            })}

            {/* Frame Artwork PNG Overlay (Branding Header & Footer) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
              <div className="text-center">
                <span className="font-headline font-extrabold text-[11px] tracking-wider text-stone-900 bg-white/90 px-2 py-0.5 rounded shadow-xs">
                  POPCUT.ID PHOTOBOOTH
                </span>
              </div>
              <div className="text-center">
                <span className="font-mono text-[9px] text-stone-700 bg-white/90 px-2 py-0.5 rounded">
                  JAKARTA • 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Slot Coordinates & Geometric Properties */}
        <div className="w-72 bg-surface border-l border-border flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="p-4 space-y-5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Properti Slot #{selectedSlot.slot_index}
              </h2>
              <p className="text-[11px] text-content-muted mt-0.5">
                Sesuaikan koordinat dan ukuran slot foto pada frame.
              </p>
            </div>

            {/* Coordinates Grid */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                    Posisi X (%)
                  </label>
                  <input
                    type="number"
                    value={selectedSlot.x_coord}
                    onChange={(e) => updateSelectedSlot({ x_coord: Number(e.target.value) })}
                    className="w-full h-8 bg-surface border border-border rounded px-2 text-xs font-mono"
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                    Posisi Y (%)
                  </label>
                  <input
                    type="number"
                    value={selectedSlot.y_coord}
                    onChange={(e) => updateSelectedSlot({ y_coord: Number(e.target.value) })}
                    className="w-full h-8 bg-surface border border-border rounded px-2 text-xs font-mono"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                    Lebar W (%)
                  </label>
                  <input
                    type="number"
                    value={selectedSlot.width}
                    onChange={(e) => updateSelectedSlot({ width: Number(e.target.value) })}
                    className="w-full h-8 bg-surface border border-border rounded px-2 text-xs font-mono"
                    min={10}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                    Tinggi H (%)
                  </label>
                  <input
                    type="number"
                    value={selectedSlot.height}
                    onChange={(e) => updateSelectedSlot({ height: Number(e.target.value) })}
                    className="w-full h-8 bg-surface border border-border rounded px-2 text-xs font-mono"
                    min={10}
                    max={100}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                  Rotasi (Derajat °)
                </label>
                <input
                  type="number"
                  value={selectedSlot.rotation}
                  onChange={(e) => updateSelectedSlot({ rotation: Number(e.target.value) })}
                  className="w-full h-8 bg-surface border border-border rounded px-2 text-xs font-mono"
                  min={-180}
                  max={180}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-content-secondary mb-1">
                  Mode Pengepasan Foto (Fit Mode)
                </label>
                <select
                  value={selectedSlot.fit_mode}
                  onChange={(e) => updateSelectedSlot({ fit_mode: e.target.value as any })}
                  className="w-full h-8 bg-surface border border-border rounded px-2 text-xs"
                >
                  <option value="cover">Cover (Penuhi slot dengan crop proporsional)</option>
                  <option value="contain">Contain (Tampilkan seluruh foto tanpa crop)</option>
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-3 border-t border-border">
              <span className="block text-[11px] font-semibold text-content-secondary mb-2">
                Aksi Cepat Penyamaan:
              </span>
              <button
                onClick={() => {
                  setSlots((prev) =>
                    prev.map((s) => ({ ...s, width: selectedSlot.width, height: selectedSlot.height }))
                  );
                }}
                className="w-full h-7 bg-canvas hover:bg-canvas-alt border border-border rounded text-[11px] text-content-primary font-medium transition-colors"
              >
                Terapkan Ukuran ke Semua Slot
              </button>
            </div>
          </div>

          <div className="p-3 border-t border-border bg-canvas/30 text-[11px] text-content-secondary">
            Semua koordinat dikonversi ke DPI 300 saat proses rendering cetak di booth.
          </div>
        </div>
      </div>

      {/* 3. PUBLISH VERSION CONFIRMATION MODAL */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Terbitkan Versi Frame Baru (Immutable)"
        description="Versi frame yang dipublikasikan akan dibuatkan checksum SHA-256 dan siap dimasukkan ke dalam rilis konfigurasi booth."
        confirmLabel="Konfirmasi & Terbitkan"
        onConfirm={() => {
          setIsPublishModalOpen(false);
          window.location.href = '/frames';
        }}
      >
        <div className="space-y-2 text-xs">
          <p>
            Versi baru <strong>v2.1</strong> akan menggantikan versi aktif sebelumnya untuk sesi foto mendatang. Sesi dan print job lama tetap terhubung ke versi sebelumnya.
          </p>
        </div>
      </Modal>
    </div>
  );
}
