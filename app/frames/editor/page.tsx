'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  UploadCloud,
  ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FrameSlot } from '@/types/database.types';

function FrameEditorContent() {
  const searchParams = useSearchParams();
  const frameId = searchParams.get('id');

  const [frameData, setFrameData] = useState<{
    id?: string;
    name: string;
    dimensions: string;
    aspect_ratio: string;
    asset_url?: string | null;
    status: string;
  }>({
    name: 'Retro Pastel 4-Grid v2.1',
    dimensions: '2x6',
    aspect_ratio: '1:3',
    asset_url: null,
    status: 'DRAFT',
  });

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
  const [toastMessage, setToastMessage] = useState<string>('Draf berhasil disimpan');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch frame from API if id param provided
  useEffect(() => {
    if (!frameId) return;

    const loadFrame = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/frames/${frameId}`);
        const data = await res.json();
        if (data.success && data.frame) {
          setFrameData({
            id: data.frame.id,
            name: data.frame.name,
            dimensions: data.frame.dimensions,
            aspect_ratio: data.frame.aspect_ratio,
            asset_url: data.asset_url,
            status: data.version?.status || 'DRAFT',
          });

          if (data.slots && data.slots.length > 0) {
            setSlots(data.slots);
            setSelectedSlotId(data.slots[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load frame from API:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFrame();
  }, [frameId]);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || slots[0] || {
    id: 'temp',
    slot_index: 1,
    x_coord: 10,
    y_coord: 10,
    width: 80,
    height: 25,
    rotation: 0,
    fit_mode: 'cover',
  };

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
      frame_version_id: frameData.id || 'fv-001',
      slot_index: newIndex,
      x_coord: 10,
      y_coord: Math.min(80, 10 + (slots.length % 4) * 20),
      width: frameData.dimensions === '4x6' ? 40 : 80,
      height: frameData.dimensions === '4x6' ? 40 : 22,
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

  // Replace or upload local PNG preview directly
  const handleDirectPngUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
        alert('File harus berformat PNG transparan.');
        return;
      }
      const localUrl = URL.createObjectURL(file);
      setFrameData((prev) => ({
        ...prev,
        asset_url: localUrl,
      }));
      setToastMessage('File PNG frame berhasil dimuat ke kanvas editor!');
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);
    }
  };

  // Save Draft to API
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      if (frameId) {
        await fetch(`/api/frames/${frameId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slots, status: 'DRAFT' }),
        });
      }
      setToastMessage('Draf koordinat slot berhasil disimpan!');
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2500);
    } catch (err) {
      console.error('Error saving slots:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Version
  const handlePublish = async () => {
    try {
      setIsSaving(true);
      if (frameId) {
        await fetch(`/api/frames/${frameId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slots, status: 'PUBLISHED' }),
        });
      }
      setFrameData((prev) => ({ ...prev, status: 'PUBLISHED' }));
      setIsPublishModalOpen(false);
      setToastMessage('Versi frame berhasil diterbitkan!');
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);
    } catch (err) {
      console.error('Error publishing frame:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isStrip = frameData.dimensions === '2x6';

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
                {frameData.name}
              </h1>
              <Badge variant={frameData.status === 'PUBLISHED' ? 'brand' : 'warning'} dot>
                {frameData.status}
              </Badge>
            </div>
            <p className="text-[10px] text-content-secondary font-mono">
              Format: {frameData.dimensions} ({isStrip ? '1200 x 3600 px' : '1800 x 1200 px'})
            </p>
          </div>
        </div>

        {/* Toolbar Center: Zoom & Actions */}
        <div className="flex items-center gap-2">
          {/* Hidden file input to replace PNG */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,.png"
            className="hidden"
            onChange={handleDirectPngUpload}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs gap-1"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {frameData.asset_url ? 'Ganti PNG Master' : 'Unggah File PNG'}
          </Button>

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

          <Button
            variant={isPreviewActive ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setIsPreviewActive(!isPreviewActive)}
            className="text-xs gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            {isPreviewActive ? 'Keluar Mode Simulasi' : 'Simulasi Foto'}
          </Button>
        </div>

        {/* Toolbar Right: Save & Publish */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="text-xs gap-1"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan Draf
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPublishModalOpen(true)}
            disabled={isSaving}
            className="text-xs gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            Terbitkan Versi
          </Button>
        </div>
      </header>

      {/* 2. THREE-PANEL EDITOR WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Slot Layers */}
        <div className="w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0">
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Daftar Slot Foto ({slots.length})
              </h2>
              <button
                onClick={handleAddSlot}
                className="p-1 hover:bg-canvas text-content-secondary hover:text-content-primary rounded transition-colors"
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
          {isLoading && (
            <div className="absolute inset-0 bg-canvas/60 z-40 flex items-center justify-center gap-2 text-xs text-content-secondary">
              <Loader2 className="w-5 h-5 animate-spin text-brand" />
              Memuat aset frame...
            </div>
          )}

          {/* Canvas Viewport Frame Container */}
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              width: isStrip ? '280px' : '420px',
              height: isStrip ? '720px' : '630px',
            }}
            className="bg-white rounded-lg shadow-elevation border-2 border-stone-800 relative overflow-hidden transition-transform duration-150 shrink-0"
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
                      ? 'border-2 border-brand ring-2 ring-brand-contrast/20 bg-brand/10 shadow-sm z-30'
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

            {/* Frame Artwork PNG Overlay */}
            {frameData.asset_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={frameData.asset_url}
                alt={frameData.name}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20 select-none"
              />
            ) : (
              /* Simulated Default Frame Overlay if no PNG yet */
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
            )}
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
                    min={1}
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
                    min={1}
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
                  onChange={(e) => updateSelectedSlot({ fit_mode: e.target.value as 'cover' | 'contain' })}
                  className="w-full h-8 bg-surface border border-border rounded px-2 text-xs"
                >
                  <option value="cover">Cover (Penuhi slot dengan crop proporsional)</option>
                  <option value="contain">Contain (Tampilkan seluruh foto tanpa crop)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-[11px] font-semibold text-content-secondary block">
                Aksi Cepat Penyamaan:
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSlots((prev) =>
                    prev.map((s) => ({
                      ...s,
                      width: selectedSlot.width,
                      height: selectedSlot.height,
                    }))
                  );
                }}
                className="w-full text-xs"
              >
                Terapkan Ukuran ke Semua Slot
              </Button>
            </div>
          </div>

          <div className="p-3 border-t border-border bg-canvas/30 text-[11px] text-content-muted">
            Semua koordinat dikonversi ke DPI 300 saat proses rendering cetak di booth.
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {isSavedToast && (
        <div className="fixed bottom-6 right-6 bg-stone-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-elevation flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-brand" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Publish Version Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Terbitkan Versi Frame Baru"
        description="Frame yang diterbitkan akan masuk ke draft manifest konfigurasi untuk kemudian didistribusikan ke armada booth."
        confirmLabel="Ya, Terbitkan Versi"
        cancelLabel="Batal"
        onConfirm={handlePublish}
      >
        <div className="space-y-3 text-xs text-content-secondary">
          <p>
            Apakah Anda yakin ingin menerbitkan desain <strong>{frameData.name}</strong> dengan{' '}
            <strong>{slots.length} slot foto</strong>?
          </p>
          <div className="p-3 bg-brand-light/30 border border-brand/20 rounded-md space-y-1 text-content-primary">
            <span className="font-semibold block text-[11px]">Ringkasan Rilis:</span>
            <ul className="list-disc list-inside text-[11px] space-y-0.5">
              <li>Format: {frameData.dimensions}</li>
              <li>Jumlah Slot: {slots.length} pose</li>
              <li>Status: PUBLISHED</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function FrameEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-canvas">
          <div className="flex items-center gap-2 text-xs text-content-secondary">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
            Memuat Frame Editor...
          </div>
        </div>
      }
    >
      <FrameEditorContent />
    </Suspense>
  );
}
