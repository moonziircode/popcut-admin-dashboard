'use client';

import React, { useState, useEffect } from 'react';
import {
  Package as PackageIcon,
  Plus,
  Eye,
  Copy,
  Archive,
  Edit2,
  Printer,
  Sparkles,
  Check,
  Video,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah, formatDateId } from '@/lib/utils';
import { Package } from '@/types/database.types';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'addon-prints'>('packages');

  // Modal / Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPackage, setPreviewPackage] = useState<Package | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [packageToArchive, setPackageToArchive] = useState<Package | null>(null);

  // Form State for Create / Edit
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(35000);
  const [formPhotoCount, setFormPhotoCount] = useState<number>(4);
  const [formIncludedStrips, setFormIncludedStrips] = useState<number>(2);
  const [formIncludeLivePhoto, setFormIncludeLivePhoto] = useState(true);
  const [formIncludeDigitalFiles, setFormIncludeDigitalFiles] = useState(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState(true);

  // Additional print pricing state
  const [addonPrice, setAddonPrice] = useState<number>(15000);
  const [addonMinQty, setAddonMinQty] = useState<number>(1);
  const [addonMaxQty, setAddonMaxQty] = useState<number>(6);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/packages');
      const data = await res.json();
      if (data.success && Array.isArray(data.packages)) {
        setPackages(data.packages);
      }
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenCreate = () => {
    setSelectedPackage(null);
    setFormName('');
    setFormCode(`PKG-${Date.now().toString().slice(-4)}`);
    setFormDescription('');
    setFormPrice(35000);
    setFormPhotoCount(4);
    setFormIncludedStrips(2);
    setFormIncludeLivePhoto(true);
    setFormIncludeDigitalFiles(true);
    setFormDisplayOrder(packages.length + 1);
    setFormIsActive(true);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormName(pkg.name);
    setFormCode(pkg.internal_code);
    setFormDescription(pkg.description || '');
    setFormPrice(pkg.price);
    setFormPhotoCount(pkg.photo_count);
    setFormIncludedStrips(pkg.included_strips);
    setFormIncludeLivePhoto(pkg.include_live_photo);
    setFormIncludeDigitalFiles(pkg.include_digital_files);
    setFormDisplayOrder(pkg.display_order);
    setFormIsActive(pkg.is_active);
    setIsDrawerOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    try {
      if (selectedPackage) {
        // Update existing in backend
        const res = await fetch('/api/packages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedPackage.id,
            name: formName,
            internal_code: formCode,
            description: formDescription,
            price: Number(formPrice),
            photo_count: Number(formPhotoCount),
            included_strips: Number(formIncludedStrips),
            include_live_photo: formIncludeLivePhoto,
            include_digital_files: formIncludeDigitalFiles,
            display_order: Number(formDisplayOrder),
            is_active: formIsActive,
          }),
        });
        const data = await res.json();
        if (data.success && data.package) {
          setPackages((prev) =>
            prev.map((p) => (p.id === selectedPackage.id ? data.package : p))
          );
        }
      } else {
        // Create new in backend
        const res = await fetch('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            internal_code: formCode,
            name: formName,
            description: formDescription,
            price: Number(formPrice),
            photo_count: Number(formPhotoCount),
            included_strips: Number(formIncludedStrips),
            include_live_photo: formIncludeLivePhoto,
            include_digital_files: formIncludeDigitalFiles,
            display_order: Number(formDisplayOrder),
            is_active: formIsActive,
          }),
        });
        const data = await res.json();
        if (data.success && data.package) {
          setPackages((prev) => [...prev, data.package]);
        }
      }
    } catch (err) {
      console.error('Failed to save package:', err);
    }
    setIsDrawerOpen(false);
  };

  const handleDuplicate = async (pkg: Package) => {
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internal_code: `${pkg.internal_code}-COPY`,
          name: `${pkg.name} (Salinan)`,
          description: pkg.description,
          price: pkg.price,
          photo_count: pkg.photo_count,
          included_strips: pkg.included_strips,
          include_live_photo: pkg.include_live_photo,
          include_digital_files: pkg.include_digital_files,
          display_order: packages.length + 1,
          is_active: false,
        }),
      });
      const data = await res.json();
      if (data.success && data.package) {
        setPackages((prev) => [...prev, data.package]);
      }
    } catch (err) {
      console.error('Failed to duplicate package:', err);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!packageToArchive) return;
    try {
      await fetch(`/api/packages?id=${packageToArchive.id}`, { method: 'DELETE' });
      setPackages((prev) => prev.filter((p) => p.id !== packageToArchive.id));
    } catch (err) {
      console.error('Failed to delete package:', err);
    }
    setIsArchiveModalOpen(false);
    setPackageToArchive(null);
  };

  return (
    <AppShell
      title="Katalog Paket & Harga Layanan"
      breadcrumbs={[{ label: 'Bisnis' }, { label: 'Paket & Harga' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Katalog Paket & Harga
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Kelola paket foto, strip fisik, fitur Live Photo, dan harga cetak tambahan untuk aplikasi booth.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setActiveTab(activeTab === 'packages' ? 'addon-prints' : 'packages')}>
              <Printer className="w-3.5 h-3.5" />
              {activeTab === 'packages' ? 'Atur Cetak Tambahan' : 'Daftar Paket'}
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-3.5 h-3.5" />
              Tambah Paket Baru
            </Button>
          </div>
        </div>

        {/* 2. Tabs Navigation */}
        <div className="border-b border-border flex items-center gap-6 text-xs">
          <button
            onClick={() => setActiveTab('packages')}
            className={`pb-3 font-semibold transition-colors relative ${
              activeTab === 'packages' ? 'text-content-primary' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Daftar Paket ({packages.length})
            {activeTab === 'packages' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('addon-prints')}
            className={`pb-3 font-semibold transition-colors relative ${
              activeTab === 'addon-prints' ? 'text-content-primary' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Harga Cetak Tambahan (Add-on Prints)
            {activeTab === 'addon-prints' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
            )}
          </button>
        </div>

        {/* 3. TAB 1: Packages Grid & Empty State */}
        {activeTab === 'packages' && (
          isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-brand animate-spin mb-3" />
              <p className="text-xs text-content-secondary">Memuat katalog paket...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="py-16 px-4 bg-surface border-2 border-dashed border-border rounded-xl text-center max-w-lg mx-auto flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-canvas border border-border flex items-center justify-center mb-4 text-content-muted">
                <PackageIcon className="w-7 h-7 text-content-muted" />
              </div>
              <h3 className="text-sm font-bold text-content-primary font-headline">
                Belum Ada Paket Foto di Sistem
              </h3>
              <p className="text-xs text-content-secondary mt-1 leading-relaxed max-w-md">
                Seluruh data paket telah dibersihkan. Buat paket foto pertama Anda untuk menentukan harga layanan, jumlah pose foto, dan jumlah cetak strip yang berlaku di booth.
              </p>
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="mt-5 bg-brand text-brand-contrast hover:bg-brand-hover text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Buat Paket Pertama Sekarang
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="flex flex-col justify-between hoverable">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-content-muted">{pkg.internal_code}</span>
                        <h3 className="text-base font-bold text-content-primary font-headline mt-0.5">
                          {pkg.name}
                        </h3>
                      </div>
                      <Badge variant={pkg.is_active ? 'success' : 'neutral'} dot>
                        {pkg.is_active ? 'Aktif' : 'Draft'}
                      </Badge>
                    </div>

                    <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed">
                      {pkg.description || 'Tanpa deskripsi tambahan.'}
                    </p>

                    <div className="text-xl font-bold font-headline text-content-primary">
                      {formatRupiah(pkg.price)}
                      <span className="text-xs font-normal text-content-secondary"> / sesi</span>
                    </div>

                    {/* Feature Badges */}
                    <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-[11px] text-content-secondary">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{pkg.photo_count} Pose Foto</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{pkg.included_strips} Strip Cetak</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Video className={`w-3.5 h-3.5 ${pkg.include_live_photo ? 'text-emerald-600' : 'text-content-muted'} shrink-0`} />
                        <span className={pkg.include_live_photo ? 'text-content-primary' : 'text-content-muted line-through'}>
                          Live Photo
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Download className={`w-3.5 h-3.5 ${pkg.include_digital_files ? 'text-emerald-600' : 'text-content-muted'} shrink-0`} />
                        <span>QR Galeri</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setPreviewPackage(pkg);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Kiosk Preview
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(pkg)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDuplicate(pkg)} title="Duplikasi">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPackageToArchive(pkg);
                        setIsArchiveModalOpen(true);
                      }}
                      title="Arsipkan"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* 4. TAB 2: Additional Print Pricing */}
        {activeTab === 'addon-prints' && (
          <div className="max-w-xl space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Pengaturan Harga Cetak Tambahan (Add-on Prints)</CardTitle>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Konfigurasi opsi cetak lembar tambahan yang ditawarkan kepada pelanggan saat sesi foto di booth.
                  </p>
                </div>
              </CardHeader>

              <div className="space-y-4">
                <Input
                  label="Harga Tambahan Per Lembar / Strip (Rupiah)"
                  type="number"
                  value={addonPrice}
                  onChange={(e) => setAddonPrice(Number(e.target.value))}
                  helperText="Contoh: Rp15.000 per strip tambahan."
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Minimum Kuantitas"
                    type="number"
                    value={addonMinQty}
                    onChange={(e) => setAddonMinQty(Number(e.target.value))}
                  />
                  <Input
                    label="Maksimum Kuantitas"
                    type="number"
                    value={addonMaxQty}
                    onChange={(e) => setAddonMaxQty(Number(e.target.value))}
                    helperText="Membatasi agar waktu antrean booth tidak menumpuk."
                  />
                </div>

                {/* Live Preview Box */}
                <div className="p-4 rounded-lg bg-canvas border border-border space-y-2">
                  <h4 className="text-xs font-semibold text-content-primary">Simulasi Tambahan Kertas:</h4>
                  <p className="text-xs text-content-secondary">
                    Jika pelanggan memilih <strong>2 lembar tambahan</strong>, biaya tambahan otomatis dihitung:{' '}
                    <strong className="text-content-primary">{formatRupiah(addonPrice * 2)}</strong>.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm">Simpan Aturan Cetak Tambahan</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 5. CREATE / EDIT PACKAGE DRAWER */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-surface h-full shadow-elevation border-l border-border flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h3 className="text-base font-bold text-content-primary font-headline">
                      {selectedPackage ? `Edit Paket: ${selectedPackage.name}` : 'Buat Paket Baru'}
                    </h3>
                    <p className="text-xs text-content-secondary mt-0.5">
                      Konfigurasi parameter paket sebelum didistribusikan ke booth.
                    </p>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="text-content-muted hover:text-content-primary p-1">
                    ✕
                  </button>
                </div>

                <form id="package-form" onSubmit={handleSavePackage} className="space-y-4">
                  <Input
                    label="Nama Paket"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Regular Duo"
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Kode Internal"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="PKG-REG-02"
                      required
                    />
                    <Input
                      label="Harga Sesi (Rupiah)"
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-primary mb-1">
                      Deskripsi Singkat
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-surface border border-border rounded p-2.5 text-xs text-content-primary focus:outline-none focus:ring-1 focus:ring-brand"
                      placeholder="Deskripsi fitur yang tampil di layar booth..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Jumlah Pose Foto"
                      type="number"
                      value={formPhotoCount}
                      onChange={(e) => setFormPhotoCount(Number(e.target.value))}
                      min={1}
                      max={12}
                      required
                    />
                    <Input
                      label="Lembar Strip Cetak"
                      type="number"
                      value={formIncludedStrips}
                      onChange={(e) => setFormIncludedStrips(Number(e.target.value))}
                      min={1}
                      max={6}
                      required
                    />
                  </div>

                  {/* Feature Toggles */}
                  <div className="p-3 rounded border border-border bg-canvas/30 space-y-3">
                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <span className="font-semibold text-content-primary">Sertakan Live Photo (Motion)</span>
                      <input
                        type="checkbox"
                        checked={formIncludeLivePhoto}
                        onChange={(e) => setFormIncludeLivePhoto(e.target.checked)}
                        className="rounded border-border text-brand focus:ring-brand w-4 h-4"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <span className="font-semibold text-content-primary">Sertakan File Digital via QR</span>
                      <input
                        type="checkbox"
                        checked={formIncludeDigitalFiles}
                        onChange={(e) => setFormIncludeDigitalFiles(e.target.checked)}
                        className="rounded border-border text-brand focus:ring-brand w-4 h-4"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs cursor-pointer">
                      <span className="font-semibold text-content-primary">Status Paket Aktif</span>
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="rounded border-border text-brand focus:ring-brand w-4 h-4"
                      />
                    </label>
                  </div>

                  <Input
                    label="Urutan Tampilan di Kiosk"
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    min={1}
                  />
                </form>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-canvas/50 flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" form="package-form" size="sm">
                  Simpan Paket
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 6. CUSTOMER KIOSK PREVIEW MODAL */}
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Simulasi Layar Kiosk: ${previewPackage?.name}`}
          description="Visual representasi bagaimana kartu paket dirender pada aplikasi MacBook booth."
        >
          {previewPackage && (
            <div className="p-6 bg-stone-900 rounded-lg text-white space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Layar Pemilihan Paket Kiosk</span>
                <span className="bg-lime-400/20 text-lime-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  POPCUT BOOTH UI
                </span>
              </div>

              <div className="border border-stone-800 bg-stone-850 p-5 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold font-headline">{previewPackage.name}</h4>
                    <p className="text-xs text-stone-400 mt-1">{previewPackage.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-lime-400">
                      {formatRupiah(previewPackage.price)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-800 text-xs text-stone-300">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-lime-400" />
                    <span>{previewPackage.photo_count} Pose Foto</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-lime-400" />
                    <span>{previewPackage.included_strips} Strip Fisik</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-lime-400" />
                    <span>{previewPackage.include_live_photo ? 'Termasuk Live Photo' : 'Foto Statis'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-lime-400" />
                    <span>QR Download Cepat</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-[11px] text-stone-500">
                Ukuran tombol dan kontras telah disesuaikan dengan standar pencahayaan booth.
              </div>
            </div>
          )}
        </Modal>

        {/* 7. ARCHIVE CONFIRMATION MODAL */}
        <Modal
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          title="Konfirmasi Pengarsipan Paket"
          description={`Apakah Anda yakin ingin mengarsipkan paket ${packageToArchive?.name}?`}
          confirmLabel="Arsipkan Paket"
          confirmVariant="destructive"
          onConfirm={handleArchiveConfirm}
        >
          <p>
            Paket yang diarsipkan tidak akan tampil di booth untuk sesi baru. Sesi dan transaksi terdahulu yang menggunakan paket ini tetap aman dan tidak terpengaruh.
          </p>
        </Modal>
      </div>
    </AppShell>
  );
}
