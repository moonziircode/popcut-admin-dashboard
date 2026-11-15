'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Ticket,
  Plus,
  Download,
  Copy,
  Calendar,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Power,
  Trash2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatRupiah, formatDateId } from '@/lib/utils';

interface PromotionItem {
  id: string;
  name: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_100';
  discount_value: number;
  usage_count: number;
  max_uses: number;
  valid_until: string;
  is_active: boolean;
}

interface PrepaidBatchItem {
  id: string;
  batch_name: string;
  package_name: string;
  total_quantity: number;
  available_quantity: number;
  used_quantity: number;
  valid_until: string;
  tickets?: { id: string; ticket_code: string; status: string }[];
}

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'tickets'>('vouchers');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Vouchers state
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);

  // Prepaid Batches state
  const [batches, setBatches] = useState<PrepaidBatchItem[]>([]);

  // Create Voucher Modal state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [promoName, setPromoName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_100'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxUses, setMaxUses] = useState<number>(50);

  // Create Ticket Batch Modal state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState<number>(25);

  // 1. Fetch Promos and Batches from Supabase API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch vouchers
      const resPromos = await fetch('/api/promotions');
      const promoJson = await resPromos.json();
      if (promoJson.success && Array.isArray(promoJson.promotions)) {
        const formatted: PromotionItem[] = promoJson.promotions.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code || (p.promotion_codes && p.promotion_codes[0]?.code) || 'POPCUT',
          discount_type: p.discount_type,
          discount_value: Number(p.discount_value),
          usage_count: Number(p.usage_count) || 0,
          max_uses: Number(p.max_uses) || 100,
          valid_until: p.valid_until || p.end_date,
          is_active: Boolean(p.is_active),
        }));
        setPromotions(formatted);
      }

      // Fetch ticket batches
      const resBatches = await fetch('/api/tickets');
      const batchJson = await resBatches.json();
      if (batchJson.success && Array.isArray(batchJson.batches)) {
        const formattedBatches: PrepaidBatchItem[] = batchJson.batches.map((b: any) => {
          const tickets = b.prepaid_tickets || [];
          const used = tickets.filter((t: any) => t.status === 'CLAIMED' || t.status === 'USED').length;
          const available = tickets.filter((t: any) => t.status === 'AVAILABLE' || t.status === 'ACTIVE').length;
          const pkgName = b.packages?.name ? `${b.packages.name} (Rp${formatRupiah(b.packages.price)})` : 'Paket Photobooth';

          return {
            id: b.id,
            batch_name: b.batch_name,
            package_name: pkgName,
            total_quantity: b.total_quantity,
            available_quantity: available,
            used_quantity: used,
            valid_until: b.valid_until,
            tickets: tickets,
          };
        });
        setBatches(formattedBatches);
      }
    } catch (err) {
      console.error('Failed to load promotions & tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Create Voucher Handler
  const handleCreateVoucher = async () => {
    if (!promoName.trim() || !promoCode.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: promoName.trim(),
          code: promoCode.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: discountType === 'FREE_100' ? 0 : Number(discountValue),
          max_uses: Number(maxUses),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVoucherModalOpen(false);
        setPromoName('');
        setPromoCode('');
        await fetchData();
      } else {
        alert(data.message || 'Gagal menyimpan voucher ke database Supabase.');
      }
    } catch (err: any) {
      alert(`Terjadi error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Toggle Voucher Active/Inactive
  const handleToggleVoucher = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_active: !currentStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPromotions(prev =>
          prev.map(p => (p.id === id ? { ...p, is_active: !currentStatus } : p))
        );
      } else {
        alert(data.message || 'Gagal memperbarui status.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // 4. Create Ticket Batch Handler
  const handleCreateTicketBatch = async () => {
    if (!batchName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_name: batchName.trim(),
          total_quantity: Number(ticketQuantity),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsTicketModalOpen(false);
        setBatchName('');
        await fetchData();
      } else {
        alert(data.message || 'Gagal membuat batch tiket di Supabase.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Export Tickets CSV
  const handleExportCSV = (batch: PrepaidBatchItem) => {
    if (!batch.tickets || batch.tickets.length === 0) {
      alert('Tidak ada tiket yang dapat diekspor.');
      return;
    }
    const header = 'Kode Tiket,Status\n';
    const rows = batch.tickets.map(t => `${t.ticket_code},${t.status}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${batch.batch_name.replace(/\s+/g, '_')}_tickets.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <AppShell
      title="Promosi, Kode Voucher & Tiket Prabayar"
      breadcrumbs={[{ label: 'Bisnis' }, { label: 'Promo & Voucher' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Promosi & Tiket Prabayar
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Kelola voucher potongan harga, voucher gratis 100%, serta pembuatan batch tiket prabayar yang tersimpan langsung di Supabase.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {activeTab === 'vouchers' ? (
              <Button size="sm" onClick={() => setIsVoucherModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                Buat Kode Voucher Baru
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsTicketModalOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                Buat Batch Tiket Prabayar
              </Button>
            )}
          </div>
        </div>

        {/* 2. Tabs Navigation */}
        <div className="border-b border-border flex items-center gap-6 text-xs">
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`pb-3 font-semibold transition-colors relative ${
              activeTab === 'vouchers' ? 'text-content-primary' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Voucher & Diskon Promosi ({promotions.length})
            {activeTab === 'vouchers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`pb-3 font-semibold transition-colors relative ${
              activeTab === 'tickets' ? 'text-content-primary' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            Batch Tiket Prabayar ({batches.length})
            {activeTab === 'tickets' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
            )}
          </button>
        </div>

        {/* 3. TAB 1: Vouchers Table */}
        {activeTab === 'vouchers' && (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                    <th className="py-3 px-4">Nama Kampanye</th>
                    <th className="py-3 px-4">Kode Voucher</th>
                    <th className="py-3 px-4">Tipe Diskon</th>
                    <th className="py-3 px-4">Nilai Potongan</th>
                    <th className="py-3 px-4">Kuota Terpakai</th>
                    <th className="py-3 px-4">Berlaku Sampai</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-content-muted text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-brand" />
                          <span>Memuat daftar voucher dari Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : promotions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-content-muted text-xs">
                        Belum ada kode voucher aktif di Supabase. Klik tombol di atas untuk membuat voucher baru.
                      </td>
                    </tr>
                  ) : (
                    promotions.map((p) => (
                      <tr key={`${p.id}-${p.code}`} className="hover:bg-canvas/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-content-primary">
                          {p.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-canvas border border-border px-2 py-0.5 rounded">
                              {p.code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(p.code)}
                              className="text-content-muted hover:text-content-primary p-0.5"
                              title="Salin Kode"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {copiedCode === p.code && (
                              <span className="text-[10px] text-emerald-600 font-sans">Tersalin!</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-content-secondary">
                          {p.discount_type === 'FREE_100'
                            ? '100% Gratis'
                            : p.discount_type === 'PERCENTAGE'
                            ? 'Persentase (%)'
                            : 'Nominal Tetap (Rp)'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                          {p.discount_type === 'FREE_100'
                            ? 'Gratis Sesi'
                            : p.discount_type === 'PERCENTAGE'
                            ? `${p.discount_value}%`
                            : `Rp${formatRupiah(p.discount_value)}`}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-content-primary font-semibold">{p.usage_count}</span>
                          <span className="text-content-muted"> / {p.max_uses}</span>
                        </td>
                        <td className="py-3.5 px-4 text-content-secondary text-[11px]">
                          {formatDateId(p.valid_until)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={p.is_active ? 'success' : 'neutral'} dot>
                            {p.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant={p.is_active ? 'secondary' : 'primary'}
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => handleToggleVoucher(p.id, p.is_active)}
                          >
                            <Power className="w-3 h-3" />
                            {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 4. TAB 2: Prepaid Tickets Table */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                      <th className="py-3 px-4">Nama Batch Tiket</th>
                      <th className="py-3 px-4">Paket Ditugaskan</th>
                      <th className="py-3 px-4">Total Tiket</th>
                      <th className="py-3 px-4">Tersedia</th>
                      <th className="py-3 px-4">Sudah Klaim</th>
                      <th className="py-3 px-4">Berlaku Sampai</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-content-muted text-xs">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-brand" />
                            <span>Memuat batch tiket dari Supabase...</span>
                          </div>
                        </td>
                      </tr>
                    ) : batches.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-content-muted text-xs">
                          Belum ada batch tiket prabayar yang diterbitkan di Supabase.
                        </td>
                      </tr>
                    ) : (
                      batches.map((b) => (
                        <tr key={b.id} className="hover:bg-canvas/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-content-primary">
                            {b.batch_name}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-content-primary">
                            {b.package_name}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                            {b.total_quantity}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">
                            {b.available_quantity}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-content-secondary">
                            {b.used_quantity}
                          </td>
                          <td className="py-3.5 px-4 text-content-secondary text-[11px]">
                            {formatDateId(b.valid_until)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => handleExportCSV(b)}
                            >
                              <Download className="w-3 h-3" />
                              Ekspor CSV
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* 5. CREATE VOUCHER MODAL */}
        <Modal
          isOpen={isVoucherModalOpen}
          onClose={() => setIsVoucherModalOpen(false)}
          title="Buat Kode Voucher Promosi"
          description="Kode voucher akan disimpan langsung ke database Supabase dan langsung aktif untuk Customer Application."
          confirmLabel={isSaving ? "Menyimpan ke Supabase..." : "Simpan & Rilis Voucher"}
          onConfirm={handleCreateVoucher}
        >
          <div className="space-y-4">
            <Input
              label="Nama Kampanye Promosi"
              value={promoName}
              onChange={(e) => setPromoName(e.target.value)}
              placeholder="e.g. Promo Pembukaan Senopati"
              required
            />
            <Input
              label="Kode Unik Voucher (Huruf Kapital)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="e.g. POPCUTSENOPATI"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Jenis Diskon
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full h-9 bg-surface border border-border rounded px-3 text-xs"
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED_AMOUNT">Nominal Tetap (Rp)</option>
                  <option value="FREE_100">100% Gratis</option>
                </select>
              </div>
              <Input
                label={discountType === 'PERCENTAGE' ? 'Nilai Diskon (%)' : 'Nilai Potongan (Rp)'}
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                disabled={discountType === 'FREE_100'}
              />
            </div>
            <Input
              label="Maksimum Kuota Pemakaian"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              min={1}
            />
          </div>
        </Modal>

        {/* 6. CREATE TICKET BATCH MODAL */}
        <Modal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          title="Buat Batch Tiket Prabayar"
          description="Tiket prabayar disimpan ke Supabase dan dapat dibagikan kepada klien event untuk langsung dipakai di layar kiosk."
          confirmLabel={isSaving ? "Membuat di Supabase..." : "Hasilkan Tiket & Batch"}
          onConfirm={handleCreateTicketBatch}
        >
          <div className="space-y-4">
            <Input
              label="Nama Batch / Klien Event"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g. Tiket Wedding Diana & Reza"
              required
            />
            <Input
              label="Jumlah Tiket yang Dibuat"
              type="number"
              value={ticketQuantity}
              onChange={(e) => setTicketQuantity(Number(e.target.value))}
              min={1}
              max={500}
            />
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
