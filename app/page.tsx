'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Receipt,
  Camera,
  Printer,
  MonitorDot,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRupiah, formatDateId } from '@/lib/utils';
import { Transaction, Session, Booth } from '@/types/database.types';

export default function OverviewPage() {
  const [period, setPeriod] = useState<'today' | '7days' | 'month'>('today');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [printJobs, setPrintJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [trxRes, sesRes, bthRes, prnRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/sessions'),
          fetch('/api/booths'),
          fetch('/api/print-jobs'),
        ]);
        const trxData = await trxRes.json();
        const sesData = await sesRes.json();
        const bthData = await bthRes.json();
        const prnData = await prnRes.json();
        if (trxData.success && Array.isArray(trxData.transactions)) {
          setTransactions(trxData.transactions);
        }
        if (sesData.success && Array.isArray(sesData.sessions)) {
          setSessions(sesData.sessions);
        }
        if (bthData.success && Array.isArray(bthData.booths)) {
          setBooths(bthData.booths);
        }
        if (prnData.success && Array.isArray(prnData.print_jobs)) {
          setPrintJobs(prnData.print_jobs);
        }
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Operational metrics according to PRD financial rules:
  // ONLY PAID transactions count toward revenue
  const paidTransactions = transactions.filter((t) => t.payment_status === 'PAID');
  const totalRevenue = paidTransactions.reduce((acc, t) => acc + t.payable_amount, 0);
  const pendingTransactions = transactions.filter((t) => t.payment_status === 'PENDING');
  const completedSessions = sessions.filter((s) => s.session_status === 'COMPLETED');
  const unknownPrintJobs = printJobs.filter(
    (pj) => pj.status === 'UNKNOWN' || pj.status === 'FAILED'
  );
  const onlineBooths = booths.filter((b) => b.status === 'ONLINE');

  return (
    <AppShell
      title="Ringkasan Operasional & Bisnis"
      breadcrumbs={[{ label: 'Dashboard' }, { label: 'Ringkasan' }]}
    >
      <div className="space-y-6">
        {/* 1. Header Bar with Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Ringkasan Hari Ini
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Data konsolidasi seluruh armada photobooth terverifikasi real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded border border-border p-0.5 bg-surface text-xs">
              <button
                onClick={() => setPeriod('today')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  period === 'today' ? 'bg-brand text-brand-contrast font-semibold' : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setPeriod('7days')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  period === '7days' ? 'bg-brand text-brand-contrast font-semibold' : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  period === 'month' ? 'bg-brand text-brand-contrast font-semibold' : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Bulan Ini
              </button>
            </div>
            <Link href="/reports">
              <Button variant="secondary" size="sm">
                Lihat Laporan Lengkap
              </Button>
            </Link>
          </div>
        </div>

        {/* 2. Critical Operational Warning Banner (if UNKNOWN jobs or warnings exist) */}
        {unknownPrintJobs.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3 shadow-subtle">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold text-amber-900">
                Peringatan Operasional: {unknownPrintJobs.length} Print Job Membutuhkan Rekonsiliasi Fisik
              </p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Job <strong>{unknownPrintJobs[0].print_job_number}</strong> di {booths.find(b => b.id === unknownPrintJobs[0].booth_id)?.name} berstatus <strong>UNKNOWN</strong> (printer timeout). Sesuai SOP, mohon cek fisik lembar cetak di booth sebelum menyetujui cetak ulang agar kertas tidak terbuang.
              </p>
            </div>
            <Link href="/print-jobs">
              <Button variant="secondary" size="sm" className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100">
                Periksa Antrean
              </Button>
            </Link>
          </div>
        )}

        {/* 3. Business & Operational KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <Card>
            <div className="flex items-center justify-between text-content-secondary text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Omzet Terverifikasi</span>
              <span className="p-1.5 rounded bg-brand-light text-brand-contrast">
                <Receipt className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-headline text-content-primary">
                {formatRupiah(totalRevenue)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700">
                <TrendingUp className="w-3 h-3" />
                <span>+14.2% dibanding kemarin</span>
              </div>
            </div>
          </Card>

          {/* Sesi Foto */}
          <Card>
            <div className="flex items-center justify-between text-content-secondary text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Sesi Selesai</span>
              <span className="p-1.5 rounded bg-blue-50 text-blue-700">
                <Camera className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-headline text-content-primary">
                {completedSessions.length} Sesi
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-content-secondary">
                <Clock className="w-3 h-3" />
                <span>Rata-rata durasi: 4m 32s</span>
              </div>
            </div>
          </Card>

          {/* Transaksi Status */}
          <Card>
            <div className="flex items-center justify-between text-content-secondary text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Transaksi Pembayaran</span>
              <span className="p-1.5 rounded bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-headline text-content-primary">
                {paidTransactions.length} Berhasil
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px]">
                {pendingTransactions.length > 0 ? (
                  <span className="text-amber-700 font-medium">{pendingTransactions.length} pending QRIS</span>
                ) : (
                  <span className="text-content-muted">0 pending</span>
                )}
              </div>
            </div>
          </Card>

          {/* Armada Booth Status */}
          <Card>
            <div className="flex items-center justify-between text-content-secondary text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Kesiapan Armada</span>
              <span className="p-1.5 rounded bg-canvas text-content-primary">
                <MonitorDot className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-headline text-content-primary">
                {onlineBooths.length} / {booths.length} Online
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
                <span>Semua sinkron manifest v2.4</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 4. Split Overview: Recent Transactions & Active Booth Fleet */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions Table (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Transaksi Terakhir</CardTitle>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Transaksi pembayaran real-time dari seluruh photobooth.
                  </p>
                </div>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    Semua Transaksi <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/30">
                      <th className="py-2.5 px-3">ID Transaksi</th>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Metode</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-content-muted text-xs">
                          Belum ada transaksi tercatat di sistem.
                        </td>
                      </tr>
                    ) : (
                      transactions.slice(0, 5).map((trx) => (
                        <tr key={trx.id} className="hover:bg-canvas/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-medium text-content-primary">
                            {trx.transaction_number}
                          </td>
                          <td className="py-3 px-3 text-content-secondary">
                            {formatDateId(trx.created_at)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-content-primary">
                              {trx.payment_method === 'PREPAID_TICKET'
                                ? 'Tiket Prabayar'
                                : trx.payment_method === 'VOUCHER_100'
                                ? 'Voucher 100%'
                                : trx.payment_method}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={trx.payment_status === 'PAID' ? 'success' : 'warning'}
                              dot
                            >
                              {trx.payment_status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-content-primary">
                            {formatRupiah(trx.payable_amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Booth Fleet Status Overview (1 col) */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Status Armada Booth</CardTitle>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Telemetri perangkat MacBook & hardware.
                  </p>
                </div>
                <Link href="/booths">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Kelola
                  </Button>
                </Link>
              </CardHeader>

              <div className="space-y-3">
                {booths.map((booth) => (
                  <div
                    key={booth.id}
                    className="p-3 rounded border border-border bg-canvas/30 space-y-2 hover:border-border-strong transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-content-primary">
                          {booth.name}
                        </h4>
                        <p className="text-[11px] text-content-secondary mt-0.5">{booth.location}</p>
                      </div>
                      <Badge
                        variant={booth.status === 'ONLINE' ? 'success' : 'warning'}
                        dot
                      >
                        {booth.status}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-[11px] text-content-secondary">
                      <div>
                        <span>Kamera: </span>
                        <strong className="text-content-primary">{booth.camera_status}</strong>
                      </div>
                      <div>
                        <span>Printer: </span>
                        <strong className={booth.printer_status === 'READY' ? 'text-emerald-700' : 'text-amber-700'}>
                          {booth.printer_status}
                        </strong>
                      </div>
                      <div>
                        <span>Penyimpanan: </span>
                        <strong className="text-content-primary">{booth.storage_health.free_gb} GB free</strong>
                      </div>
                      <div>
                        <span>Versi App: </span>
                        <strong className="text-content-primary font-mono">{booth.app_version}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
