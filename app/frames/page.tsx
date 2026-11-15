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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { initialFrames } from '@/lib/data/mock-data';

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
  const [newFrameDimensions, setNewFrameDimensions] = useState('2x6');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Handle file selection
  const handleFileChange = (file: File | null) => {
    setUploadError(null);
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate MIME type / extension
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      setUploadError('Hanya file gambar PNG yang didukung. Harap pilih file berekstensi .png');
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

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,.png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {/* Drag & Drop Zone */}
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-brand bg-brand-light/30 scale-[1.01]'
                    : 'border-border hover:border-brand bg-canvas/30 hover:bg-canvas/60'
                }`}
              >
                <UploadCloud className="w-9 h-9 text-content-muted mx-auto mb-2 animate-bounce-subtle" />
                <p className="text-xs font-semibold text-content-primary">
                  Klik untuk memilih file PNG atau seret file ke area ini
                </p>
                <p className="text-[11px] text-content-secondary mt-1">
                  Format wajib: PNG transparan (Maks. 25 MB)
                </p>
              </div>
            ) : (
              /* Selected File Preview Box */
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
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-700 font-medium mt-1">
                      <CheckCircle2 className="w-3 h-3" /> File PNG Valid Terpilih
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileChange(null)}
                  disabled={isUploading}
                  className="h-8 px-2 text-content-secondary hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
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
                onChange={(e) => setNewFrameDimensions(e.target.value)}
                disabled={isUploading}
                className="w-full h-9 bg-surface border border-border rounded px-3 text-xs focus:outline-none focus:border-brand"
              >
                <option value="2x6">2x6 Inci (Photo Strip Vertikal - 1200 x 3600 px)</option>
                <option value="4x6">4x6 Inci (Postcard Jumbo - 1800 x 1200 px)</option>
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
