'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Save,
  Send,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Eye,
  Sliders,
  CheckCircle2,
  UploadCloud,
  Loader2,
  RotateCcw,
  LayoutGrid,
  Grid2X2,
  Rows,
  Columns,
  GripHorizontal,
  GripVertical,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FrameSlot } from '@/types/database.types';
import { DetectedSlot, analyzeImageAlpha } from '@/lib/utils/image-transparency';
import { SmartTransparencyModal } from '@/components/frames/SmartTransparencyModal';

type TemplateType = '2_slot_top_bottom' | '2_slot_left_right' | '4_slot_2x2' | '6_slot_2x3' | 'custom';

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
    name: 'Retro Pastel 4R v1.0',
    dimensions: '4x6',
    aspect_ratio: '2:3',
    asset_url: null,
    status: 'DRAFT',
  });

  const [slots, setSlots] = useState<FrameSlot[]>([
    {
      id: 'slot-1',
      frame_version_id: 'fv-001',
      slot_index: 1,
      x_coord: 8,
      y_coord: 6,
      width: 84,
      height: 41,
      rotation: 0,
      fit_mode: 'cover',
      crop_config: { divider_ratio: 0.5, layout_type: '2_slot_vertical' },
      created_at: new Date().toISOString(),
    },
    {
      id: 'slot-2',
      frame_version_id: 'fv-001',
      slot_index: 2,
      x_coord: 8,
      y_coord: 53,
      width: 84,
      height: 41,
      rotation: 0,
      fit_mode: 'cover',
      crop_config: { divider_ratio: 0.5, layout_type: '2_slot_vertical' },
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
  const [isSmartModalOpen, setIsSmartModalOpen] = useState<boolean>(false);

  // 4R Layout & Draggable Divider State
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('2_slot_top_bottom');
  const [dividerRatio, setDividerRatio] = useState<number>(0.5); // 0.20 to 0.80 (50:50 default)
  const [dividerOrientation, setDividerOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isDraggingDivider, setIsDraggingDivider] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLandscape = frameData.aspect_ratio === '3:2';

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
            dimensions: data.frame.dimensions || '4x6',
            aspect_ratio: data.frame.aspect_ratio || '2:3',
            asset_url: data.asset_url,
            status: data.version?.status || 'DRAFT',
          });

          if (data.slots && data.slots.length > 0) {
            setSlots(data.slots);
            setSelectedSlotId(data.slots[0].id);

            // Infer active template & divider state
            if (data.slots.length === 2) {
              const s1 = data.slots[0];
              const ratioFromConfig = s1.crop_config?.divider_ratio;
              if (ratioFromConfig) {
                setDividerRatio(Number(ratioFromConfig));
              }
              if (s1.crop_config?.layout_type === '2_slot_horizontal' || (s1.width < 50 && s1.height > 60)) {
                setDividerOrientation('vertical');
                setActiveTemplate('2_slot_left_right');
              } else {
                setDividerOrientation('horizontal');
                setActiveTemplate('2_slot_top_bottom');
              }
            } else if (data.slots.length === 4) {
              setActiveTemplate('4_slot_2x2');
            } else if (data.slots.length === 6) {
              setActiveTemplate('6_slot_2x3');
            } else {
              setActiveTemplate('custom');
            }
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
    x_coord: 8,
    y_coord: 6,
    width: 84,
    height: 41,
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
      y_coord: Math.min(75, 10 + (slots.length % 4) * 20),
      width: isLandscape ? 40 : 42,
      height: isLandscape ? 42 : 40,
      rotation: 0,
      fit_mode: 'cover',
      created_at: new Date().toISOString(),
    };
    setSlots([...slots, newSlot]);
    setSelectedSlotId(newSlot.id);
    setActiveTemplate('custom');
  };

  const handleDeleteSlot = (id: string) => {
    if (slots.length <= 1) return;
    const remaining = slots.filter((s) => s.id !== id);
    setSlots(remaining);
    setSelectedSlotId(remaining[0].id);
    setActiveTemplate('custom');
  };

  // ===================================================================
  // DRAGGABLE CENTER DIVIDER LOGIC (2-SLOT ONLY)
  // ===================================================================
  const applyDividerRatioToSlots = useCallback(
    (ratio: number, orientation: 'horizontal' | 'vertical') => {
      const clampedRatio = Math.max(0.2, Math.min(0.8, ratio));
      setDividerRatio(clampedRatio);

      setSlots((prev) => {
        if (prev.length < 2) return prev;
        const gap = 3;
        const margin = 6;
        const dividerPercent = clampedRatio * 100;

        if (orientation === 'horizontal') {
          // Top-Bottom Layout
          const s1Height = Math.round((dividerPercent - margin - gap / 2) * 10) / 10;
          const s2Y = Math.round((dividerPercent + gap / 2) * 10) / 10;
          const s2Height = Math.round((100 - dividerPercent - margin - gap / 2) * 10) / 10;

          return prev.map((s, idx) => {
            if (idx === 0) {
              return {
                ...s,
                x_coord: margin,
                y_coord: margin,
                width: 100 - 2 * margin,
                height: Math.max(10, s1Height),
                crop_config: {
                  ...s.crop_config,
                  divider_ratio: clampedRatio,
                  layout_type: '2_slot_vertical',
                },
              };
            }
            if (idx === 1) {
              return {
                ...s,
                x_coord: margin,
                y_coord: s2Y,
                width: 100 - 2 * margin,
                height: Math.max(10, s2Height),
                crop_config: {
                  ...s.crop_config,
                  divider_ratio: clampedRatio,
                  layout_type: '2_slot_vertical',
                },
              };
            }
            return s;
          });
        } else {
          // Left-Right Layout
          const s1Width = Math.round((dividerPercent - margin - gap / 2) * 10) / 10;
          const s2X = Math.round((dividerPercent + gap / 2) * 10) / 10;
          const s2Width = Math.round((100 - dividerPercent - margin - gap / 2) * 10) / 10;

          return prev.map((s, idx) => {
            if (idx === 0) {
              return {
                ...s,
                x_coord: margin,
                y_coord: margin,
                width: Math.max(10, s1Width),
                height: 100 - 2 * margin,
                crop_config: {
                  ...s.crop_config,
                  divider_ratio: clampedRatio,
                  layout_type: '2_slot_horizontal',
                },
              };
            }
            if (idx === 1) {
              return {
                ...s,
                x_coord: s2X,
                y_coord: margin,
                width: Math.max(10, s2Width),
                height: 100 - 2 * margin,
                crop_config: {
                  ...s.crop_config,
                  divider_ratio: clampedRatio,
                  layout_type: '2_slot_horizontal',
                },
              };
            }
            return s;
          });
        }
      });
    },
    []
  );

  const handleResetDivider = () => {
    applyDividerRatioToSlots(0.5, dividerOrientation);
    setToastMessage('Garis pembatas direset ke posisi seimbang 50:50.');
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  // Pointer drag event handlers for interactive center divider
  const handleStartDividerDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      let newRatio = 0.5;
      if (dividerOrientation === 'horizontal') {
        const offsetY = moveEvent.clientY - rect.top;
        newRatio = offsetY / rect.height;
      } else {
        const offsetX = moveEvent.clientX - rect.left;
        newRatio = offsetX / rect.width;
      }

      applyDividerRatioToSlots(newRatio, dividerOrientation);
    };

    const onPointerUp = () => {
      setIsDraggingDivider(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // ===================================================================
  // TEMPLATE SHORTCUT PRESETS (2-Slot, 4-Slot, 6-Slot, Custom)
  // ===================================================================
  const handleApplyTemplate = (type: TemplateType) => {
    setActiveTemplate(type);

    if (type === '2_slot_top_bottom') {
      setDividerOrientation('horizontal');
      setDividerRatio(0.5);
      const newSlots: FrameSlot[] = [
        {
          id: 'slot-1',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 1,
          x_coord: 8,
          y_coord: 6,
          width: 84,
          height: 41,
          rotation: 0,
          fit_mode: 'cover',
          crop_config: { divider_ratio: 0.5, layout_type: '2_slot_vertical' },
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-2',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 2,
          x_coord: 8,
          y_coord: 53,
          width: 84,
          height: 41,
          rotation: 0,
          fit_mode: 'cover',
          crop_config: { divider_ratio: 0.5, layout_type: '2_slot_vertical' },
          created_at: new Date().toISOString(),
        },
      ];
      setSlots(newSlots);
      setSelectedSlotId(newSlots[0].id);
      setToastMessage('Template 2 Slot (Atas - Bawah) diterapkan.');
    } else if (type === '2_slot_left_right') {
      setDividerOrientation('vertical');
      setDividerRatio(0.5);
      const newSlots: FrameSlot[] = [
        {
          id: 'slot-1',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 1,
          x_coord: 6,
          y_coord: 8,
          width: 41,
          height: 84,
          rotation: 0,
          fit_mode: 'cover',
          crop_config: { divider_ratio: 0.5, layout_type: '2_slot_horizontal' },
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-2',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 2,
          x_coord: 53,
          y_coord: 8,
          width: 41,
          height: 84,
          rotation: 0,
          fit_mode: 'cover',
          crop_config: { divider_ratio: 0.5, layout_type: '2_slot_horizontal' },
          created_at: new Date().toISOString(),
        },
      ];
      setSlots(newSlots);
      setSelectedSlotId(newSlots[0].id);
      setToastMessage('Template 2 Slot (Kiri - Kanan) diterapkan.');
    } else if (type === '4_slot_2x2') {
      const newSlots: FrameSlot[] = [
        {
          id: 'slot-1',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 1,
          x_coord: 6,
          y_coord: 6,
          width: 41,
          height: 41,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-2',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 2,
          x_coord: 53,
          y_coord: 6,
          width: 41,
          height: 41,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-3',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 3,
          x_coord: 6,
          y_coord: 53,
          width: 41,
          height: 41,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-4',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 4,
          x_coord: 53,
          y_coord: 53,
          width: 41,
          height: 41,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
      ];
      setSlots(newSlots);
      setSelectedSlotId(newSlots[0].id);
      setToastMessage('Template 4 Slot (2×2 Grid) diterapkan.');
    } else if (type === '6_slot_2x3') {
      const newSlots: FrameSlot[] = [
        {
          id: 'slot-1',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 1,
          x_coord: 6,
          y_coord: 5,
          width: 41,
          height: 27,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-2',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 2,
          x_coord: 53,
          y_coord: 5,
          width: 41,
          height: 27,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-3',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 3,
          x_coord: 6,
          y_coord: 36,
          width: 41,
          height: 27,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-4',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 4,
          x_coord: 53,
          y_coord: 36,
          width: 41,
          height: 27,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-5',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 5,
          x_coord: 6,
          y_coord: 67,
          width: 41,
          height: 27,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
        {
          id: 'slot-6',
          frame_version_id: frameData.id || 'fv-001',
          slot_index: 6,
          x_coord: 53,
          y_coord: 67,
          width: 41,
          height: 27,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
      ];
      setSlots(newSlots);
      setSelectedSlotId(newSlots[0].id);
      setToastMessage('Template 6 Slot (2×3 Grid) diterapkan.');
    }

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  // Process an uploaded or dropped image file in Editor
  const processEditorFile = (file: File) => {
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!file.type.startsWith('image/') && !hasValidExt) {
      alert('File harus berupa gambar (PNG, JPG, atau WEBP).');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = localUrl;
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ratio = w / h;
      const isPortrait = Math.abs(ratio - 2 / 3) <= 0.04;
      const isLandscapeImg = Math.abs(ratio - 1.5) <= 0.04;

      if (!isPortrait && !isLandscapeImg) {
        alert(
          `File tidak sesuai standar 4R (2:3 Portrait atau 3:2 Landscape). Dimensi file: ${w} × ${h} px (rasio ${ratio.toFixed(2)}).`
        );
        return;
      }

      setFrameData((prev) => ({
        ...prev,
        asset_url: localUrl,
        aspect_ratio: isLandscapeImg ? '3:2' : '2:3',
      }));
      setToastMessage('File master 4R berhasil dimuat ke kanvas editor!');
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const stats = analyzeImageAlpha(ctx, w, h);
          if (!stats.hasAlpha) {
            setIsSmartModalOpen(true);
          }
        }
      } catch (e) {
        console.warn('Alpha check skipped', e);
      }
    };
  };

  const handleDirectPngUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processEditorFile(e.target.files[0]);
    }
  };

  // Callback when Smart Transparency is applied in Editor
  const handleSmartApplyInEditor = (
    processedFile: File,
    processedUrl: string,
    detectedSlots: DetectedSlot[]
  ) => {
    setFrameData((prev) => ({
      ...prev,
      asset_url: processedUrl,
    }));

    if (detectedSlots.length > 0) {
      const newSlots: FrameSlot[] = detectedSlots.map((s) => ({
        id: `slot-${s.slot_index}`,
        frame_version_id: frameData.id || 'fv-001',
        slot_index: s.slot_index,
        x_coord: s.x_coord,
        y_coord: s.y_coord,
        width: s.width,
        height: s.height,
        rotation: 0,
        fit_mode: 'cover',
        created_at: new Date().toISOString(),
      }));
      setSlots(newSlots);
      setSelectedSlotId(newSlots[0].id);
      setActiveTemplate('custom');
      setToastMessage(`✨ Berhasil membersihkan latar & memetakan ${newSlots.length} slot foto otomatis!`);
    } else {
      setToastMessage('Frame transparan 4R berhasil diterapkan!');
    }
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3500);
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
      setToastMessage('Draf koordinat slot 4R berhasil disimpan!');
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
      setToastMessage('Versi frame 4R berhasil diterbitkan!');
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);
    } catch (err) {
      console.error('Error publishing frame:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Exact 4R Canvas Dimensions:
  // Portrait: 380px × 570px (Aspect ratio 2:3, corresponding to 1200 × 1800 px at 300 DPI)
  // Landscape: 570px × 380px (Aspect ratio 3:2, corresponding to 1800 × 1200 px at 300 DPI)
  const canvasWidth = isLandscape ? 570 : 380;
  const canvasHeight = isLandscape ? 380 : 570;

  const isTwoSlotLayout = slots.length === 2;

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
              <Badge variant="brand" className="font-mono text-[9px] uppercase">
                4R STANDAR ({isLandscape ? 'Landscape 3:2' : 'Portrait 2:3'})
              </Badge>
            </div>
            <p className="text-[10px] text-content-secondary font-mono">
              Ukuran Kanvas: {isLandscape ? '1800 × 1200 px' : '1200 × 1800 px'} @ 300 DPI
            </p>
          </div>
        </div>

        {/* Toolbar Center: Zoom & Actions */}
        <div className="flex items-center gap-2">
          {/* Native label file input button */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={handleDirectPngUpload}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs gap-1 pointer-events-none"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {frameData.asset_url ? 'Ganti PNG 4R' : 'Unggah File PNG 4R'}
            </Button>
          </label>

          {frameData.asset_url && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSmartModalOpen(true)}
              className="text-xs gap-1.5 border-brand/60 bg-brand-light/30 hover:bg-brand-light/60 text-brand-dark font-medium shadow-2xs"
              title="Bersihkan background solid dan deteksi otomatis slot foto"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-dark" />
              AI Transparency & Auto-Slots
            </Button>
          )}

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

      {/* 2. SUB-TOOLBAR: TEMPLATE PRESETS BAR */}
      <div className="h-11 bg-surface/90 border-b border-border px-4 flex items-center justify-between text-xs shrink-0 z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-content-secondary uppercase tracking-wider mr-2 flex items-center gap-1">
            <LayoutGrid className="w-3.5 h-3.5 text-brand-dark" />
            Template Slot 4R:
          </span>

          <button
            onClick={() => handleApplyTemplate('2_slot_top_bottom')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTemplate === '2_slot_top_bottom'
                ? 'bg-brand text-brand-contrast shadow-xs'
                : 'bg-canvas hover:bg-surface text-content-secondary hover:text-content-primary border border-border'
            }`}
          >
            <Rows className="w-3 h-3" />
            2 Slot (Atas - Bawah)
          </button>

          <button
            onClick={() => handleApplyTemplate('2_slot_left_right')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTemplate === '2_slot_left_right'
                ? 'bg-brand text-brand-contrast shadow-xs'
                : 'bg-canvas hover:bg-surface text-content-secondary hover:text-content-primary border border-border'
            }`}
          >
            <Columns className="w-3 h-3" />
            2 Slot (Kiri - Kanan)
          </button>

          <button
            onClick={() => handleApplyTemplate('4_slot_2x2')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTemplate === '4_slot_2x2'
                ? 'bg-brand text-brand-contrast shadow-xs'
                : 'bg-canvas hover:bg-surface text-content-secondary hover:text-content-primary border border-border'
            }`}
          >
            <Grid2X2 className="w-3 h-3" />
            4 Slot (2×2 Grid)
          </button>

          <button
            onClick={() => handleApplyTemplate('6_slot_2x3')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTemplate === '6_slot_2x3'
                ? 'bg-brand text-brand-contrast shadow-xs'
                : 'bg-canvas hover:bg-surface text-content-secondary hover:text-content-primary border border-border'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            6 Slot (2×3 Grid)
          </button>

          <button
            onClick={() => setActiveTemplate('custom')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTemplate === 'custom'
                ? 'bg-brand text-brand-contrast shadow-xs'
                : 'bg-canvas hover:bg-surface text-content-secondary hover:text-content-primary border border-border'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Custom
          </button>
        </div>

        {/* 2-Slot Center Divider Quick Controls */}
        {isTwoSlotLayout && (
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <span className="text-[11px] text-content-secondary font-mono font-bold">
              Pembatas: {Math.round(dividerRatio * 100)}% : {Math.round((1 - dividerRatio) * 100)}%
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetDivider}
              className="h-7 text-[11px] px-2 gap-1 border-dashed"
              title="Reset Garis Pembatas ke 50:50"
            >
              <RotateCcw className="w-3 h-3 text-brand-dark" />
              Reset 50:50
            </Button>
          </div>
        )}
      </div>

      {/* 3. THREE-PANEL EDITOR WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Slot Layers & Divider Configuration */}
        <div className="w-68 bg-surface border-r border-border flex flex-col justify-between shrink-0">
          <div className="p-4 space-y-4 overflow-y-auto">
            {/* 2-Slot Draggable Divider Card */}
            {isTwoSlotLayout && (
              <div className="p-3 bg-brand-light/30 border border-brand/40 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
                    {dividerOrientation === 'horizontal' ? (
                      <GripHorizontal className="w-4 h-4 text-brand-dark" />
                    ) : (
                      <GripVertical className="w-4 h-4 text-brand-dark" />
                    )}
                    Garis Pembatas 2-Slot
                  </span>
                  <Badge variant="brand" className="font-mono text-[10px]">
                    {Math.round(dividerRatio * 100)} : {Math.round((1 - dividerRatio) * 100)}
                  </Badge>
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Geser garis pembatas langsung pada kanvas, atau gunakan penggeser berikut:
                </p>
                <div className="space-y-1">
                  <input
                    type="range"
                    min={20}
                    max={80}
                    value={Math.round(dividerRatio * 100)}
                    onChange={(e) =>
                      applyDividerRatioToSlots(Number(e.target.value) / 100, dividerOrientation)
                    }
                    className="w-full accent-brand cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-content-muted font-mono">
                    <span>20% (Min)</span>
                    <span>50:50 (Tengah)</span>
                    <span>80% (Maks)</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetDivider}
                  className="w-full text-xs h-7 gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-brand-dark" />
                  Reset Posisi 50:50
                </Button>
              </div>
            )}

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

          <div className="p-3 border-t border-border bg-canvas/30 text-[11px] text-content-muted flex items-start gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 text-brand-dark mt-0.5" />
            <span>
              Garis pembatas interaktif hanya alat bantu editor dan <strong>tidak akan dicetak</strong> pada output final 4R.
            </span>
          </div>
        </div>

        {/* CENTER CANVAS: Exact 4R Frame Viewport */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              processEditorFile(e.dataTransfer.files[0]);
            }
          }}
          className="flex-1 bg-canvas flex items-center justify-center p-8 overflow-auto relative"
        >
          {isLoading && (
            <div className="absolute inset-0 bg-canvas/60 z-50 flex items-center justify-center gap-2 text-xs text-content-secondary">
              <Loader2 className="w-5 h-5 animate-spin text-brand" />
              Memuat aset frame 4R...
            </div>
          )}

          {/* Canvas Viewport: Exact 4R Proportions (2:3 or 3:2) */}
          <div
            ref={canvasRef}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
            }}
            className="bg-white rounded-lg shadow-elevation border-2 border-stone-800 relative overflow-hidden transition-transform duration-150 shrink-0"
          >
            {/* Checkerboard transparency background */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[size:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0] opacity-40 pointer-events-none" />

            {/* Photo Slots Layer */}
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
                      <span className="text-[9px] text-stone-500 font-mono">Output 4R</span>
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

            {/* DRAGGABLE CENTER DIVIDER (2-Slot Only, Visual Editor Helper Only) */}
            {isTwoSlotLayout && !isPreviewActive && (
              <>
                {dividerOrientation === 'horizontal' ? (
                  /* Horizontal Center Divider (Top-Bottom) */
                  <div
                    style={{ top: `${dividerRatio * 100}%` }}
                    className="absolute left-2 right-2 -translate-y-1/2 z-40 group cursor-row-resize flex items-center justify-center pointer-events-auto select-none"
                    onPointerDown={handleStartDividerDrag}
                  >
                    <div
                      className={`w-full h-1 bg-brand rounded-full shadow-sm transition-all ${
                        isDraggingDivider ? 'ring-2 ring-brand-contrast bg-brand-dark' : 'group-hover:h-1.5'
                      }`}
                    />
                    <div className="absolute px-2.5 py-0.5 bg-stone-900 text-[#F5ED35] rounded-full text-[10px] font-mono font-bold border border-brand/60 shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform">
                      <GripHorizontal className="w-3 h-3" />
                      <span>{Math.round(dividerRatio * 100)} : {Math.round((1 - dividerRatio) * 100)}</span>
                    </div>
                  </div>
                ) : (
                  /* Vertical Center Divider (Left-Right) */
                  <div
                    style={{ left: `${dividerRatio * 100}%` }}
                    className="absolute top-2 bottom-2 -translate-x-1/2 z-40 group cursor-col-resize flex flex-col items-center justify-center pointer-events-auto select-none"
                    onPointerDown={handleStartDividerDrag}
                  >
                    <div
                      className={`h-full w-1 bg-brand rounded-full shadow-sm transition-all ${
                        isDraggingDivider ? 'ring-2 ring-brand-contrast bg-brand-dark' : 'group-hover:w-1.5'
                      }`}
                    />
                    <div className="absolute px-2.5 py-0.5 bg-stone-900 text-[#F5ED35] rounded-full text-[10px] font-mono font-bold border border-brand/60 shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform">
                      <GripVertical className="w-3 h-3" />
                      <span>{Math.round(dividerRatio * 100)} : {Math.round((1 - dividerRatio) * 100)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

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
                    POPCUT.ID PHOTOBOOTH • 4R
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
                Sesuaikan koordinat dan ukuran slot foto pada kanvas 4R.
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
            Semua koordinat dikonversi ke resolusi 4R (1200 × 1800 px) pada 300 DPI saat dicetak.
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
        title="Terbitkan Versi Frame 4R Baru"
        description="Frame 4R yang diterbitkan akan otomatis disinkronkan ke Customer Application saat pembukaan aplikasi berikutnya."
        confirmLabel="Ya, Terbitkan Versi 4R"
        cancelLabel="Batal"
        onConfirm={handlePublish}
      >
        <div className="space-y-3 text-xs text-content-secondary">
          <p>
            Apakah Anda yakin ingin menerbitkan desain 4R <strong>{frameData.name}</strong> dengan{' '}
            <strong>{slots.length} slot foto</strong>?
          </p>
          <div className="p-3 bg-brand-light/30 border border-brand/20 rounded-md space-y-1 text-content-primary">
            <span className="font-semibold block text-[11px]">Ringkasan Rilis 4R:</span>
            <ul className="list-disc list-inside text-[11px] space-y-0.5">
              <li>Standar Ukuran: 4R ({isLandscape ? '1800 × 1200 px Landscape' : '1200 × 1800 px Portrait'})</li>
              <li>Jumlah Slot: {slots.length} pose</li>
              <li>Status: PUBLISHED</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* AI Smart Transparency & Auto-Slot Detector Modal */}
      <SmartTransparencyModal
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        imageUrl={frameData.asset_url || null}
        originalFileName={`${frameData.name}.png`}
        expectedDimensions="4x6"
        onApply={handleSmartApplyInEditor}
      />
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
            Memuat Frame Editor 4R...
          </div>
        </div>
      }
    >
      <FrameEditorContent />
    </Suspense>
  );
}
