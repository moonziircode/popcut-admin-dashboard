'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  X,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatRupiah, formatDateId } from '@/lib/utils';
import { Transaction, PaymentStatusType, PaymentMethodType } from '@/types/database.types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Detail Drawer state
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

  // Correction Modal state
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');

  useEffect(() => {
    const fetchTrx = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/transactions');
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrx();
  }, []);

  // Filtering
  const filteredTrx = transactions.filter((trx) => {
    const matchesSearch =
      trx.transaction_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trx.customer_ref && trx.customer_ref.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || trx.payment_status === statusFilter;
    const matchesMethod = methodFilter === 'all' || trx.payment_method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handleExportCSV = () => {
    const headers = ['ID Transaksi', 'Waktu', 'Ref Pelanggan', 'Metode Bayar', 'Status', 'Nominal Bayar', 'Booth'];
    const rows = filteredTrx.map((t) => [
      t.transaction_number,
      t.created_at,
      t.customer_ref || '-',
      t.payment_method,
      t.payment_status,
      t.payable_amount,
      t.booth_id || 'Mobile Rig #1',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `popcut-transaksi-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmCorrection = () => {
    if (!selectedTrx || !correctionReason.trim()) return;
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === selectedTrx.id
          ? {
              ...t,
              payment_status: 'CANCELLED',
              correction_reason: correctionReason,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );
    setSelectedTrx((prev) => (prev ? { ...prev, payment_status: 'CANCELLED', correction_reason: correctionReason } : null));
    setIsCorrectionModalOpen(false);
    setCorrectionReason('');
  };

  return (
    <AppShell
      title="Manajemen Transaksi & Pembayaran"
      breadcrumbs={[{ label: 'Operasional' }, { label: 'Transaksi' }]}
    >
      <div className="space-y-6">
        {/* 1. Page Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Daftar Transaksi Pembayaran
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Pemantauan transaksi QRIS, tunai di kasir, klaim tiket prabayar, dan voucher diskon secara terpadu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </Button>
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <Card className="p-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID Transaksi (TRX-...) atau Ref Pelanggan..."
                className="w-full h-9 bg-canvas border border-border rounded pl-9 pr-3 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 bg-canvas border border-border rounded px-3 text-xs text-content-primary"
              >
                <option value="all">Semua Status</option>
                <option value="PAID">PAID (Lunas)</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="FAILED">FAILED</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-9 bg-canvas border border-border rounded px-3 text-xs text-content-primary"
              >
                <option value="all">Semua Metode</option>
                <option value="QRIS">QRIS</option>
                <option value="CASH">Tunai</option>
                <option value="PREPAID_TICKET">Tiket Prabayar</option>
                <option value="VOUCHER_100">Voucher 100%</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 3. Transactions Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                  <th className="py-3 px-4">ID Transaksi</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Ref Pelanggan</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Nominal Bayar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-content-muted">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-6 h-6 text-brand animate-spin mb-2" />
                        <span>Memuat data transaksi...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTrx.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-content-muted text-xs">
                      Belum ada riwayat transaksi di sistem.
                    </td>
                  </tr>
                ) : (
                  filteredTrx.map((trx) => (
                    <tr
                      key={trx.id}
                      className={`hover:bg-canvas/40 transition-colors cursor-pointer ${
                        selectedTrx?.id === trx.id ? 'bg-canvas-alt' : ''
                      }`}
                      onClick={() => setSelectedTrx(trx)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                        {trx.transaction_number}
                      </td>
                      <td className="py-3.5 px-4 text-content-secondary">
                        {formatDateId(trx.created_at)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-content-muted">
                        {trx.customer_ref || 'ANONYMOUS'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-content-primary">
                        {trx.payment_method === 'PREPAID_TICKET'
                          ? 'Tiket Prabayar'
                          : trx.payment_method === 'VOUCHER_100'
                          ? 'Voucher 100%'
                          : trx.payment_method}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            trx.payment_status === 'PAID'
                              ? 'success'
                              : trx.payment_status === 'PENDING'
                              ? 'warning'
                              : 'error'
                          }
                          dot
                        >
                          {trx.payment_status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-content-primary">
                        {formatRupiah(trx.payable_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrx(trx);
                          }}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 4. DETAIL INSPECTOR DRAWER */}
        {selectedTrx && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-surface h-full shadow-elevation border-l border-border flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="p-6 space-y-6">
                {/* Drawer Header */}
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div>
                    <span className="font-mono text-[11px] text-content-muted">Rincian Transaksi</span>
                    <h3 className="text-base font-bold text-content-primary font-headline mt-0.5">
                      {selectedTrx.transaction_number}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTrx(null)}
                    className="text-content-muted hover:text-content-primary p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-border">
                  <span className="text-xs font-semibold text-content-secondary">Status Pembayaran</span>
                  <Badge variant={selectedTrx.payment_status === 'PAID' ? 'success' : 'warning'} dot>
                    {selectedTrx.payment_status}
                  </Badge>
                </div>

                {/* Financial Breakdown Card */}
                <div className="p-4 rounded-lg border border-border bg-surface space-y-2.5 text-xs">
                  <h4 className="font-semibold text-content-primary font-headline mb-2">
                    Rincian Finansial Sesi
                  </h4>
                  <div className="flex justify-between text-content-secondary">
                    <span>Harga Paket Awal:</span>
                    <span className="font-mono font-medium text-content-primary">
                      {formatRupiah(selectedTrx.original_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-content-secondary">
                    <span>Cetak Tambahan (Add-on):</span>
                    <span className="font-mono font-medium text-content-primary">
                      +{formatRupiah(selectedTrx.additional_print_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-content-secondary">
                    <span>Potongan Diskon Promo:</span>
                    <span className="font-mono font-medium text-emerald-700">
                      -{formatRupiah(selectedTrx.discount_amount)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between font-bold text-content-primary text-sm">
                    <span>Total Yang Dibayar:</span>
                    <span className="font-mono text-brand-contrast">
                      {formatRupiah(selectedTrx.payable_amount)}
                    </span>
                  </div>
                </div>

                {/* Payment Provider & Verification Metadata */}
                <div className="space-y-2 text-xs text-content-secondary">
                  <h4 className="font-semibold text-content-primary font-headline">
                    Metadata Transaksi
                  </h4>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded bg-canvas border border-border text-[11px]">
                    <div>
                      <span className="text-content-muted">Metode: </span>
                      <strong className="text-content-primary block">{selectedTrx.payment_method}</strong>
                    </div>
                    <div>
                      <span className="text-content-muted">Ref Provider: </span>
                      <strong className="text-content-primary font-mono block truncate">
                        {selectedTrx.provider_ref || '-'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-content-muted">Waktu Dibuat: </span>
                      <strong className="text-content-primary block">
                        {formatDateId(selectedTrx.created_at)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-content-muted">Waktu Lunas: </span>
                      <strong className="text-content-primary block">
                        {formatDateId(selectedTrx.paid_at)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Correction Reason if Cancelled */}
                {selectedTrx.correction_reason && (
                  <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    <strong>Alasan Koreksi Pembatalan:</strong> {selectedTrx.correction_reason}
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-border bg-canvas/50 flex items-center justify-between gap-2">
                <Link href="/sessions">
                  <Button variant="secondary" size="sm">
                    Buka Sesi Terkait
                  </Button>
                </Link>

                {selectedTrx.payment_status === 'PAID' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsCorrectionModalOpen(true)}
                  >
                    Koreksi Transaksi
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. TRANSACTION CORRECTION MODAL */}
        <Modal
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
          title="Koreksi Transaksi (Supervisor Approval)"
          description="Aksi ini akan membatalkan status pembayaran transaksi dan tercatat secara permanen di Audit Log."
          confirmLabel="Konfirmasi Koreksi"
          confirmVariant="destructive"
          onConfirm={handleConfirmCorrection}
        >
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-content-primary">
              Alasan Koreksi Wajib
            </label>
            <textarea
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              rows={3}
              className="w-full bg-surface border border-border rounded p-2 text-xs focus:ring-1 focus:ring-status-error"
              placeholder="Contoh: Kesalahan input nominal kasir tunai / diskrepansi fisik QRIS..."
              required
            />
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
