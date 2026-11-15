'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Pipette,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Eye,
  Layers,
  HelpCircle,
  AlertTriangle,
  ZoomIn,
  Square,
  Maximize2,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  DetectedSlot,
  removeBackgroundColor,
  detectPhotoSlotsFromAlpha,
  canvasToFile,
} from '@/lib/utils/image-transparency';

interface SmartTransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  originalFileName?: string;
  expectedDimensions?: '2x6' | '4x6';
  onApply: (processedFile: File, processedUrl: string, detectedSlots: DetectedSlot[]) => void;
}

export function SmartTransparencyModal({
  isOpen,
  onClose,
  imageUrl,
  originalFileName = 'frame-master.png',
  expectedDimensions = '2x6',
  onApply,
}: SmartTransparencyModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Tool state
  const [mode, setMode] = useState<'white' | 'color' | 'corners'>('white');
  const [tolerance, setTolerance] = useState<number>(22);
  const [featherEdges, setFeatherEdges] = useState<boolean>(true);
  const [targetColor, setTargetColor] = useState<{ r: number; g: number; b: number }>({
    r: 255,
    g: 255,
    b: 255,
  });
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [autoDetectSlots, setAutoDetectSlots] = useState<boolean>(true);

  // Result stats
  const [detectedSlots, setDetectedSlots] = useState<DetectedSlot[]>([]);
  const [removedPixelCount, setRemovedPixelCount] = useState<number>(0);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load image when modal opens or imageUrl changes
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      originalImageRef.current = img;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      processImage(img, mode, tolerance, targetColor, featherEdges, autoDetectSlots);
    };
  }, [isOpen, imageUrl]);

  // Main processing function
  const processImage = useCallback(
    (
      img: HTMLImageElement | null,
      currentMode: 'white' | 'color' | 'corners',
      currentTolerance: number,
      currentTargetRgb: { r: number; g: number; b: number },
      currentFeather: boolean,
      currentAutoSlots: boolean
    ) => {
      if (!img || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw original image first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Apply background removal
      const result = removeBackgroundColor(ctx, canvas.width, canvas.height, {
        mode: currentMode,
        targetRgb: currentTargetRgb,
        tolerance: currentTolerance,
        featherEdges: currentFeather,
      });

      setRemovedPixelCount(result.removedPixels);

      // Auto-detect slots if enabled
      if (currentAutoSlots) {
        const slots = detectPhotoSlotsFromAlpha(ctx, canvas.width, canvas.height, expectedDimensions);
        setDetectedSlots(slots);
      } else {
        setDetectedSlots([]);
      }
    },
    [expectedDimensions]
  );

  // Re-run processing when controls change
  const handleControlChange = (
    newMode = mode,
    newTolerance = tolerance,
    newColor = targetColor,
    newFeather = featherEdges,
    newSlots = autoDetectSlots
  ) => {
    setMode(newMode);
    setTolerance(newTolerance);
    setTargetColor(newColor);
    setFeatherEdges(newFeather);
    setAutoDetectSlots(newSlots);

    if (originalImageRef.current) {
      processImage(originalImageRef.current, newMode, newTolerance, newColor, newFeather, newSlots);
    }
  };

  // Canvas click for Eyedropper
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive || !canvasRef.current || !originalImageRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = Math.floor((e.clientX - rect.left) * scaleX);
    const clickY = Math.floor((e.clientY - rect.top) * scaleY);

    // Ambil warna dari gambar asli
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(originalImageRef.current, 0, 0);
    const pixel = tempCtx.getImageData(clickX, clickY, 1, 1).data;

    const pickedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    setTargetColor(pickedColor);
    setMode('color');
    setIsEyedropperActive(false);

    handleControlChange('color', tolerance, pickedColor, featherEdges, autoDetectSlots);
  };

  // Apply & Export Clean PNG
  const handleApply = async () => {
    if (!canvasRef.current) return;

    try {
      setIsProcessing(true);
      const cleanFileName = originalFileName.replace(/\.[^/.]+$/, '') + '-transparent.png';
      const file = await canvasToFile(canvasRef.current, cleanFileName);
      const processedUrl = URL.createObjectURL(file);

      onApply(file, processedUrl, detectedSlots);
      onClose();
    } catch (err) {
      console.error('Failed to export transparent PNG:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const targetColorHex = `#${targetColor.r.toString(16).padStart(2, '0')}${targetColor.g
    .toString(16)
    .padStart(2, '0')}${targetColor.b.toString(16).padStart(2, '0')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🪄 AI Smart Transparency & Auto-Slot Detector"
      description="Bersihkan latar belakang atau lubang foto solid (non-transparan) secara otomatis untuk kebutuhan photobooth."
      maxWidth="4xl"
      cancelLabel="Batal"
      confirmLabel={isProcessing ? 'Memproses...' : '✨ Terapkan & Buat PNG Transparan'}
      onConfirm={handleApply}
      isLoading={isProcessing}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-2">
        {/* Left Column: Canvas Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Preview Controls Bar */}
          <div className="flex items-center justify-between bg-canvas px-3 py-2 rounded-lg border border-border text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-content-primary">Preview:</span>
              <button
                type="button"
                onClick={() => setShowOriginal(false)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  !showOriginal
                    ? 'bg-content-primary text-white'
                    : 'bg-surface text-content-secondary hover:text-content-primary'
                }`}
              >
                Hasil Transparan
              </button>
              <button
                type="button"
                onClick={() => setShowOriginal(true)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  showOriginal
                    ? 'bg-content-primary text-white'
                    : 'bg-surface text-content-secondary hover:text-content-primary'
                }`}
              >
                Gambar Asli
              </button>
            </div>

            {isEyedropperActive && (
              <span className="text-[11px] text-amber-700 font-medium animate-pulse flex items-center gap-1">
                <Pipette className="w-3.5 h-3.5" /> Klik warna di kanvas
              </span>
            )}

            <div className="text-[11px] text-content-muted">
              {imageSize.width > 0 && `${imageSize.width} × ${imageSize.height} px`}
            </div>
          </div>

          {/* Interactive Canvas Container with Checkerboard */}
          <div
            className={`relative w-full h-[400px] rounded-lg border border-border overflow-hidden flex items-center justify-center p-3 select-none ${
              !showOriginal
                ? 'bg-[linear-gradient(45deg,#e5e5e5_25%,transparent_25%),linear-gradient(-45deg,#e5e5e5_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e5e5_75%),linear-gradient(-45deg,transparent_75%,#e5e5e5_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]'
                : 'bg-zinc-800'
            }`}
          >
            {/* Real Processed Canvas */}
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`max-w-full max-h-full object-contain transition-opacity duration-150 shadow-sm ${
                showOriginal ? 'hidden' : 'block'
              } ${isEyedropperActive ? 'cursor-crosshair ring-2 ring-amber-500' : 'cursor-default'}`}
            />

            {/* Original Image View Toggle */}
            {showOriginal && originalImageRef.current && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={originalImageRef.current.src}
                alt="Original frame"
                className="max-w-full max-h-full object-contain shadow-sm"
              />
            )}

            {/* Slot Bounding-box Overlay Markers (Only visible in transparent mode) */}
            {!showOriginal && autoDetectSlots && detectedSlots.length > 0 && (
              <div className="absolute inset-0 pointer-events-none p-3 flex items-center justify-center">
                <div
                  className="relative"
                  style={{
                    width: canvasRef.current?.clientWidth || '100%',
                    height: canvasRef.current?.clientHeight || '100%',
                  }}
                >
                  {detectedSlots.map((slot) => (
                    <div
                      key={slot.slot_index}
                      className="absolute border-2 border-cyan-400 bg-cyan-400/10 rounded flex items-start justify-start p-1 transition-all duration-300"
                      style={{
                        left: `${slot.x_coord}%`,
                        top: `${slot.y_coord}%`,
                        width: `${slot.width}%`,
                        height: `${slot.height}%`,
                      }}
                    >
                      <span className="bg-cyan-500 text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded shadow">
                        Slot #{slot.slot_index} ({slot.width}×{slot.height}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Notice Info */}
          <div className="flex items-center gap-2 text-[11px] text-content-secondary bg-canvas/60 p-2.5 rounded border border-border">
            <Info className="w-4 h-4 text-brand-dark shrink-0" />
            <span>
              Area bermotif kotak-kotak catur abu-abu menunjukkan area yang sudah{' '}
              <strong>transparan sempurna (tembus pandang)</strong> untuk penempatan foto pelanggan.
            </span>
          </div>
        </div>

        {/* Right Column: Settings & Auto-Detection Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* 1. Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1.5">
              Metode Penghapusan Background:
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleControlChange('white')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  mode === 'white'
                    ? 'border-brand bg-brand-light/30 shadow-sm'
                    : 'border-border bg-surface hover:bg-canvas/40'
                }`}
              >
                <div className="p-1.5 rounded bg-brand/20 text-brand-dark mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                    Hapus Putih / Terang
                    <Badge variant="brand">Rekomendasi</Badge>
                  </div>
                  <div className="text-[11px] text-content-secondary mt-0.5">
                    Otomatis membersihkan kotak slot putih solid hasil ekspor Canva / Photoshop.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEyedropperActive(true);
                  handleControlChange('color');
                }}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  mode === 'color'
                    ? 'border-brand bg-brand-light/30 shadow-sm'
                    : 'border-border bg-surface hover:bg-canvas/40'
                }`}
              >
                <div className="p-1.5 rounded bg-blue-100 text-blue-700 mt-0.5">
                  <Pipette className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-content-primary flex items-center justify-between">
                    <span>Eyedropper (Pilih Warna)</span>
                    <div
                      className="w-4 h-4 rounded border border-border shrink-0"
                      style={{ backgroundColor: targetColorHex }}
                    />
                  </div>
                  <div className="text-[11px] text-content-secondary mt-0.5">
                    Klik bagian mana saja pada gambar untuk menghapus warna solid tertentu.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleControlChange('corners')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  mode === 'corners'
                    ? 'border-brand bg-brand-light/30 shadow-sm'
                    : 'border-border bg-surface hover:bg-canvas/40'
                }`}
              >
                <div className="p-1.5 rounded bg-zinc-100 text-zinc-700 mt-0.5">
                  <Square className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-content-primary">Deteksi Sudut (Corners)</div>
                  <div className="text-[11px] text-content-secondary mt-0.5">
                    Menghapus warna latar berdasarkan 4 sudut tepi gambar.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Tolerance Slider */}
          <div className="bg-canvas p-3 rounded-lg border border-border space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-content-muted" />
                Toleransi Sensitivitas Warna:
              </label>
              <span className="text-xs font-mono font-bold text-content-primary bg-surface px-2 py-0.5 rounded border border-border">
                {tolerance}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="65"
              step="1"
              value={tolerance}
              onChange={(e) => handleControlChange(mode, parseInt(e.target.value, 10))}
              className="w-full accent-brand-dark cursor-pointer h-1.5 bg-border rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-content-muted">
              <span>Hati-hati (5%)</span>
              <span>Standar (22%)</span>
              <span>Agresif (65%)</span>
            </div>
          </div>

          {/* 3. Smooth Edges / Feathering */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-content-primary">
            <input
              type="checkbox"
              checked={featherEdges}
              onChange={(e) => handleControlChange(mode, tolerance, targetColor, e.target.checked)}
              className="rounded border-border text-brand focus:ring-brand w-4 h-4"
            />
            <span>Haluskan Tepi Potongan (Anti-Aliasing Feather)</span>
          </label>

          {/* 4. Auto-Slot Recognition Box */}
          <div className="bg-surface rounded-lg border border-border p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-content-primary">
                <Layers className="w-4 h-4 text-cyan-600" />
                <span>Auto-Slot Recognition</span>
              </div>
              <input
                type="checkbox"
                checked={autoDetectSlots}
                onChange={(e) => handleControlChange(mode, tolerance, targetColor, featherEdges, e.target.checked)}
                className="rounded border-border text-brand focus:ring-brand w-4 h-4 cursor-pointer"
              />
            </div>

            <p className="text-[11px] text-content-secondary leading-relaxed">
              Secara otomatis memetakan koordinat posisi lubang foto (slot X, Y, W, H) dari area transparan yang
              terbentuk.
            </p>

            {autoDetectSlots && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-content-secondary">Status Deteksi:</span>
                  <Badge variant={detectedSlots.length > 0 ? 'brand' : 'warning'}>
                    {detectedSlots.length > 0 ? `✨ ${detectedSlots.length} Slot Ditemukan` : 'Belum Terdeteksi'}
                  </Badge>
                </div>

                {detectedSlots.length > 0 && (
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {detectedSlots.map((slot) => (
                      <div
                        key={slot.slot_index}
                        className="flex items-center justify-between text-[10px] font-mono bg-canvas px-2 py-1 rounded border border-border"
                      >
                        <span className="font-semibold text-cyan-700">Slot #{slot.slot_index}</span>
                        <span className="text-content-muted">
                          X:{slot.x_coord}% Y:{slot.y_coord}% W:{slot.width}% H:{slot.height}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reset Action */}
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTolerance(22);
                setMode('white');
                setFeatherEdges(true);
                setAutoDetectSlots(true);
                if (originalImageRef.current) {
                  processImage(originalImageRef.current, 'white', 22, { r: 255, g: 255, b: 255 }, true, true);
                }
              }}
              className="text-[11px] text-content-secondary hover:text-content-primary"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Pengaturan
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
