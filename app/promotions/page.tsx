'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatRupiah, formatDateId } from '@/lib/utils';
import { initialPackages } from '@/lib/data/mock-data';

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
}

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'tickets'>('vouchers');

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

  const handleCreateVoucher = () => {
    if (!promoName.trim() || !promoCode.trim()) return;
    const newPromo: PromotionItem = {
      id: `p-${Date.now()}`,
      name: promoName,
      code: promoCode.toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      usage_count: 0,
      max_uses: Number(maxUses),
      valid_until: '2026-12-31T23:59:59Z',
      is_active: true,
    };
    setPromotions([newPromo, ...promotions]);
    setIsVoucherModalOpen(false);
  };

  const handleCreateTicketBatch = () => {
    if (!batchName.trim()) return;
    const newBatch: PrepaidBatchItem = {
      id: `pb-${Date.now()}`,
      batch_name: batchName,
      package_name: 'Regular Duo (Rp35.000)',
      total_quantity: ticketQuantity,
      available_quantity: ticketQuantity,
      used_quantity: 0,
      valid_until: '2026-12-31T23:59:59Z',
    };
    setBatches([newBatch, ...batches]);
    setIsTicketModalOpen(false);
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
              Kelola voucher potongan harga, voucher gratis 100%, serta pembuatan batch tiket prabayar untuk event & korporat.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
            Batch Tiket Prabayar (Prepaid Tickets)
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
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {promotions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-content-muted text-xs">
                        Belum ada kode voucher aktif. Klik tombol di atas untuk membuat voucher baru.
                      </td>
                    </tr>
                  ) : (
                    promotions.map((p) => (
                      <tr key={p.id} className="hover:bg-canvas/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-content-primary">
                          {p.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                          <span className="bg-canvas border border-border px-2 py-0.5 rounded">
                            {p.code}
                          </span>
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
                            : formatRupiah(p.discount_value)}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-content-primary font-semibold">{p.usage_count}</span>
                          <span className="text-content-muted"> / {p.max_uses}</span>
                        </td>
                        <td className="py-3.5 px-4 text-content-secondary text-[11px]">
                          {formatDateId(p.valid_until)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge variant={p.is_active ? 'success' : 'neutral'} dot>
                            {p.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
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
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-content-muted text-xs">
                          Belum ada batch tiket prabayar yang diterbitkan.
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
                            <Button variant="secondary" size="sm" className="gap-1 text-xs">
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
          description="Kode voucher divalidasi secara atomik di Supabase PostgreSQL untuk mencegah double-claim."
          confirmLabel="Simpan & Rilis Voucher"
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
          description="Tiket prabayar dapat dibagikan kepada klien event atau rekan korporat untuk langsung dipakai di layar kiosk."
          confirmLabel="Hasilkan Tiket & Batch"
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
