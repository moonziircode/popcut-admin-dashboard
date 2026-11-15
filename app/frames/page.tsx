'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  FileText,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { initialFrames } from '@/lib/data/mock-data';
import { analyzeImageAlpha, DetectedSlot } from '@/lib/utils/image-transparency';
import { SmartTransparencyModal } from '@/components/frames/SmartTransparencyModal';

interface FrameItem {
  id: string;
  internal_code: string;
  name: string;
  category_id?: string;
  category_name?: string;
  dimensions: string;
  aspect_ratio: string;
  current_version_id?: string;
  current_version_number?: number;
  status: string;
  asset_url?: string | null;
  is_archived?: boolean;
}

export default function FramesPage() {
  const [frames, setFrames] = useState<FrameItem[]>(initialFrames as any);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newFrameName, setNewFrameName] = useState('');
  const [newFrameCategory, setNewFrameCategory] = useState('classic');
  const [newFrameDimensions, setNewFrameDimensions] = useState<'2x6' | '4x6'>('2x6');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Smart Transparency & Auto-Slot Detector State
  const [hasAlpha, setHasAlpha] = useState<boolean | null>(null);
  const [isSmartModalOpen, setIsSmartModalOpen] = useState<boolean>(false);
  const [pendingSlots, setPendingSlots] = useState<DetectedSlot[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real frames from backend
  const fetchFrames = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/frames');
      const data = await res.json();
      if (data.success && data.frames) {
        setFrames(data.frames);
      }
    } catch (err) {
      console.warn('Using initial frames fallback', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  // Listen for Clipboard Paste (Cmd+V / Ctrl+V) when Upload Modal is open
  useEffect(() => {
    if (!isUploadModalOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          handleFileChange(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isUploadModalOpen]);

  // Handle file selection and analyze alpha transparency
  const handleFileChange = (file: File | null) => {
    setUploadError(null);
    setHasAlpha(null);
    setPendingSlots([]);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate MIME type / extension (Support PNG, JPG, JPEG, WEBP)
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    const isImageMime = file.type.startsWith('image/');

    if (!isImageMime && !hasValidExt) {
      setUploadError('Format tidak didukung. Harap pilih file gambar (PNG, JPG, atau WEBP).');
      return;
    }

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Ukuran file melebihi batas maksimum 25 MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-populate name if empty
    if (!newFrameName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewFrameName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Check Alpha Transparency in the background
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const alphaStats = analyzeImageAlpha(ctx, img.naturalWidth, img.naturalHeight);
          setHasAlpha(alphaStats.hasAlpha);
        }
      } catch (e) {
        console.warn('Failed to analyze alpha channel:', e);
      }
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Callback when Smart Transparency is applied
  const handleSmartApply = (processedFile: File, processedUrl: string, detectedSlots: DetectedSlot[]) => {
    setSelectedFile(processedFile);
    setPreviewUrl(processedUrl);
    setPendingSlots(detectedSlots);
    setHasAlpha(true);
  };

  // Submit Upload
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError('Silakan pilih atau tarik file PNG master terlebih dahulu.');
      return;
    }

    if (!newFrameName.trim()) {
      setUploadError('Nama frame tidak boleh kosong.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', newFrameName.trim());
      formData.append('dimensions', newFrameDimensions);
      formData.append('category', newFrameCategory);

      const res = await fetch('/api/frames/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal mengunggah file frame ke sistem.');
      }

      // If smart auto-slots were detected, save them directly to the frame!
      if (pendingSlots.length > 0 && result.frame?.id) {
        try {
          await fetch(`/api/frames/${result.frame.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slots: pendingSlots.map((s) => ({
                id: `slot-${s.slot_index}`,
                frame_version_id: result.version?.id || result.frame.id,
                slot_index: s.slot_index,
                x_coord: s.x_coord,
                y_coord: s.y_coord,
                width: s.width,
                height: s.height,
                rotation: 0,
                fit_mode: 'cover',
              })),
              status: 'DRAFT',
            }),
          });
        } catch (slotErr) {
          console.warn('Failed to auto-save detected slots:', slotErr);
        }
      }

      // Reset and redirect to Frame Editor
      setIsUploadModalOpen(false);
      window.location.href = `/frames/editor?id=${result.frame.id}`;
    } catch (err: any) {
      console.error('Upload frame failed:', err);
      setUploadError(err.message || 'Terjadi gangguan saat mengunggah frame.');
    } finally {
      setIsUploading(false);
    }
  };

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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setUploadError(null);
                setSelectedFile(null);
                setPreviewUrl(null);
                setNewFrameName('');
                setIsUploadModalOpen(true);
              }}
            >
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
              <div className="relative aspect-[2/3] bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] flex items-center justify-center p-3 border-b border-border overflow-hidden">
                {frame.asset_url ? (
                  /* Real PNG Frame Image */
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frame.asset_url}
                      alt={frame.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-sm"
                    />
                  </div>
                ) : (
                  /* Simulated Wireframe Frame */
                  <div className="w-full h-full border-2 border-stone-800 bg-white/95 rounded p-3 flex flex-col justify-between shadow-subtle group-hover:scale-[1.02] transition-transform duration-200">
                    <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                      <div className="bg-stone-200 border border-stone-300 rounded h-12 flex items-center justify-center text-[10px] text-stone-500 font-mono">
                        Slot #1
                      </div>
                      <div className="bg-stone-200 border border-stone-300 rounded h-12 flex items-center justify-center text-[10px] text-stone-500 font-mono">
                        Slot #2
                      </div>
                      <div className="bg-stone-200 border border-stone-300 rounded h-12 flex items-center justify-center text-[10px] text-stone-500 font-mono">
                        Slot #3
                      </div>
                    </div>
                    <div className="text-center pt-2">
                      <span className="font-headline font-bold text-[10px] tracking-widest text-stone-800 uppercase">
                        POPCUT.ID
                      </span>
                    </div>
                  </div>
                )}

                <div className="absolute top-2.5 right-2.5">
                  <Badge variant={frame.status === 'PUBLISHED' ? 'brand' : 'neutral'}>
                    {frame.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </Badge>
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

        {/* 4. Upload Frame Modal (Fully Interactive) */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => !isUploading && setIsUploadModalOpen(false)}
          title="Unggah Master Frame PNG"
          description="Pastikan file berekstensi .PNG dengan latar transparan alpha untuk slot foto (disarankan resolusi 1200x3600 px, DPI 300)."
          confirmLabel={isUploading ? 'Sedang Mengunggah...' : 'Unggah & Masuk ke Editor'}
          cancelLabel="Batal"
          onConfirm={handleUploadSubmit}
        >
          <div className="space-y-4">
            {/* Error Message */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Drag & Drop Zone with Direct Native File Input Overlay */}
            {!selectedFile ? (
              <label
                htmlFor="frame-file-input"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative block border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-all overflow-hidden ${
                  isDragging
                    ? 'border-brand bg-brand-light/40 scale-[1.01]'
                    : 'border-border hover:border-brand bg-canvas/30 hover:bg-canvas/60'
                }`}
              >
                {/* Native Invisible File Input covering the entire drop zone */}
                <input
                  id="frame-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="relative z-10 pointer-events-none flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-3 shadow-2xs">
                    <UploadCloud className="w-6 h-6 text-brand-dark animate-bounce-subtle" />
                  </div>
                  <p className="text-xs font-bold text-content-primary">
                    Tarik & letakkan file PNG di sini, atau klik untuk memilih
                  </p>
                  <p className="text-[11px] text-content-secondary mt-1">
                    Mendukung PNG transparan, PNG solid Canva, JPG & WEBP (Maks. 25 MB)
                  </p>

                  <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-surface hover:bg-canvas border border-border rounded-md text-xs font-semibold text-content-primary shadow-xs">
                    <UploadCloud className="w-3.5 h-3.5 text-brand-dark" />
                    Pilih File dari Komputer
                  </span>
                </div>
              </label>
            ) : (
              /* Selected File Preview Box with Smart Transparency Analysis */
              <div className="space-y-3">
                <div className="border border-border rounded-lg p-3 bg-surface flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Thumbnail Checkerboard */}
                    <div className="w-14 h-16 rounded bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[size:8px_8px] border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {previewUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-content-primary truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-content-secondary mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • PNG Image
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {hasAlpha === true && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-700 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Transparan Sempurna
                          </span>
                        )}
                        {hasAlpha === false && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Gambar Solid (Non-Transparan)
                          </span>
                        )}
                        {hasAlpha === null && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-content-muted">
                            <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa transparansi...
                          </span>
                        )}
                        {pendingSlots.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-cyan-700 font-medium bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                            ✨ {pendingSlots.length} Slot Terdeteksi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileChange(null)}
                      disabled={isUploading}
                      className="h-8 px-2 text-content-secondary hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Smart Transparency Banner (Shown when image is solid or user wants to enhance) */}
                {hasAlpha === false && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded bg-amber-200/60 text-amber-900 shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-950">
                          Slot Foto Masih Tertutup Latar Belakang Solid
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Sistem mendeteksi file PNG ini belum memiliki lubang transparan untuk foto photobooth. Gunakan
                          AI Smart Transparency untuk membersihkannya secara otomatis.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsSmartModalOpen(true)}
                      className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm h-8"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      🪄 Hapus Background & Deteksi Slot
                    </Button>
                  </div>
                )}

                {/* Option to open smart tool even if already has alpha */}
                {hasAlpha === true && (
                  <div className="flex items-center justify-between bg-canvas/60 border border-border rounded-lg px-3 py-2 text-xs">
                    <span className="text-[11px] text-content-secondary">
                      Ingin menyesuaikan transparansi atau mendeteksi ulang slot foto?
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsSmartModalOpen(true)}
                      className="h-7 text-[11px] px-2.5"
                    >
                      <Sparkles className="w-3 h-3 mr-1 text-brand-dark" />
                      Sesuaikan AI Transparency
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Frame Name */}
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Nama Frame <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newFrameName}
                onChange={(e) => setNewFrameName(e.target.value)}
                placeholder="e.g. Retro Pastel 4-Grid"
                disabled={isUploading}
                className="w-full h-9 bg-surface border border-border rounded px-3 text-xs focus:outline-none focus:border-brand"
              />
            </div>

            {/* Frame Category */}
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Kategori Desain
              </label>
              <select
                value={newFrameCategory}
                onChange={(e) => setNewFrameCategory(e.target.value)}
                disabled={isUploading}
                className="w-full h-9 bg-surface border border-border rounded px-3 text-xs focus:outline-none focus:border-brand"
              >
                <option value="classic">Classic</option>
                <option value="minimal">Minimalist</option>
                <option value="retro">Retro Pastel</option>
                <option value="couple">Couple Special</option>
                <option value="celebration">Celebration</option>
                <option value="seasonal">Seasonal & Holiday</option>
              </select>
            </div>

            {/* Frame Dimensions */}
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Ukuran Cetak Kertas Fisik
              </label>
              <select
                value={newFrameDimensions}
                onChange={(e) => setNewFrameDimensions(e.target.value as '2x6' | '4x6')}
                disabled={isUploading}
                className="w-full h-9 bg-surface border border-border rounded px-3 text-xs focus:outline-none focus:border-brand"
              >
                <option value="2x6">2x6 Inci (Photo Strip Vertikal - 1200 x 3600 px)</option>
                <option value="4x6">4x6 Inci (Postcard Jumbo - 1800 x 1200 px)</option>
              </select>
            </div>
          </div>
        </Modal>

        {/* 5. AI Smart Transparency & Auto-Slot Detector Modal */}
        <SmartTransparencyModal
          isOpen={isSmartModalOpen}
          onClose={() => setIsSmartModalOpen(false)}
          imageUrl={previewUrl}
          originalFileName={selectedFile?.name || 'frame-master.png'}
          expectedDimensions={newFrameDimensions}
          onApply={handleSmartApply}
        />
      </div>
    </AppShell>
  );
}
