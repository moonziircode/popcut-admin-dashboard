'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  PieChart,
  MonitorDot,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRupiah } from '@/lib/utils';
import { Transaction } from '@/types/database.types';

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7days' | 'month'>('today');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        console.error('Failed to load report data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrx();
  }, []);

  // PRD Revenue Calculations:
  // ONLY PAID transactions count toward actual revenue
  const paidTrx = transactions.filter((t) => t.payment_status === 'PAID');
  const totalRevenue = paidTrx.reduce((acc, t) => acc + t.payable_amount, 0);
  const totalSessions = paidTrx.length;
  const avgTicketSize = totalSessions > 0 ? Math.round(totalRevenue / totalSessions) : 0;
  const additionalPrintRevenue = paidTrx.reduce((acc, t) => acc + (t.additional_print_amount || 0), 0);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Metrik,Nilai\n' +
      `Omzet Terverifikasi (PAID),${totalRevenue}\n` +
      `Total Sesi Berhasil,${totalSessions}\n` +
      `Rata-rata Transaksi,${avgTicketSize}\n` +
      `Pendapatan Kertas Tambahan,${additionalPrintRevenue}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-popcut-${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell
      title="Laporan Bisnis & Analitik Pendapatan"
      breadcrumbs={[{ label: 'Insights' }, { label: 'Laporan Bisnis' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Export Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Laporan Kinerja Bisnis
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Analisis pendapatan terverifikasi, komposisi metode bayar, dan performa paket sesuai aturan keuangan PRD.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded border border-border p-0.5 bg-surface text-xs">
              <button
                onClick={() => setSelectedPeriod('today')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  selectedPeriod === 'today' ? 'bg-brand text-brand-contrast font-semibold' : 'text-content-secondary'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setSelectedPeriod('7days')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  selectedPeriod === '7days' ? 'bg-brand text-brand-contrast font-semibold' : 'text-content-secondary'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  selectedPeriod === 'month' ? 'bg-brand text-brand-contrast font-semibold' : 'text-content-secondary'
                }`}
              >
                Bulan Ini
              </button>
            </div>

            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </Button>
          </div>
        </div>

        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              Omzet Terverifikasi (PAID)
            </span>
            <div className="text-2xl font-bold font-headline text-content-primary mt-2">
              {formatRupiah(totalRevenue)}
            </div>
            <p className="text-[11px] text-content-secondary mt-1">
              Tidak termasuk voucher gratis & pending
            </p>
          </Card>

          <Card>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              Total Sesi Sukses
            </span>
            <div className="text-2xl font-bold font-headline text-content-primary mt-2">
              {totalSessions} Sesi
            </div>
            <p className="text-[11px] text-content-secondary mt-1">
              Tercetak & selesai di booth
            </p>
          </Card>

          <Card>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              Rata-rata Nilai Transaksi (ATV)
            </span>
            <div className="text-2xl font-bold font-headline text-content-primary mt-2">
              {formatRupiah(avgTicketSize)}
            </div>
            <p className="text-[11px] text-content-secondary mt-1">
              Per transaksi berbayar
            </p>
          </Card>

          <Card>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">
              Omzet Kertas Tambahan
            </span>
            <div className="text-2xl font-bold font-headline text-content-primary mt-2">
              {formatRupiah(additionalPrintRevenue)}
            </div>
            <p className="text-[11px] text-content-secondary mt-1">
              Kontribusi add-on cetak
            </p>
          </Card>
        </div>

        {/* 3. Breakdown Grid: Package Performance & Payment Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Package Performance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Performa Penjualan Paket</CardTitle>
            </CardHeader>
            <div className="space-y-4 text-xs">
              {transactions.length === 0 ? (
                <p className="text-content-muted py-8 text-center">Belum ada data transaksi penjualan paket.</p>
              ) : (
                [
                  { name: 'Regular Duo (2x6)', count: 0, pct: 0 },
                ].map((pkg) => (
                  <div key={pkg.name} className="space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-content-primary font-semibold">{pkg.name}</span>
                      <span className="font-mono text-content-secondary">
                        {pkg.count} sesi ({pkg.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-canvas-alt rounded-full h-2 overflow-hidden border border-border">
                      <div className="bg-brand h-full rounded-full" style={{ width: `${pkg.pct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Payment Method Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Komposisi Metode Pembayaran</CardTitle>
            </CardHeader>
            <div className="space-y-4 text-xs">
              {transactions.length === 0 ? (
                <p className="text-content-muted py-8 text-center">Belum ada transaksi pembayaran tercatat.</p>
              ) : (
                [
                  { name: 'QRIS (Gopay, BCA, ShopeePay)', share: '0%', count: '0 Transaksi', color: 'bg-emerald-500' },
                  { name: 'Tunai di Kasir Booth', share: '0%', count: '0 Transaksi', color: 'bg-blue-500' },
                  { name: 'Tiket Prabayar (Event / Korporat)', share: '0%', count: '0 Klaim', color: 'bg-amber-500' },
                  { name: 'Voucher Promosi 100% Free', share: '0%', count: '0 Sesi', color: 'bg-purple-500' },
                ].map((item) => (
                  <div key={item.name} className="p-3 rounded border border-border bg-canvas/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="font-semibold text-content-primary">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-content-primary block">{item.share}</span>
                      <span className="text-[10px] text-content-muted">{item.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
