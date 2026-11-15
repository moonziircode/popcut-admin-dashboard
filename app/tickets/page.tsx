'use client';

import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  Tag,
  Check,
  Calendar,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  initialPrepaidBatches,
  initialPrepaidTickets,
  initialPackages,
} from '@/lib/data/mock-data';
import { PrepaidBatch, PrepaidTicket, Package } from '@/types/database.types';

export default function TicketsPage() {
  const [batches, setBatches] = useState<PrepaidBatch[]>(initialPrepaidBatches);
  const [tickets, setTickets] = useState<PrepaidTicket[]>(initialPrepaidTickets);
  const [packages] = useState<Package[]>(initialPackages);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'USED' | 'EXPIRED'>('ALL');
  const [batchFilter, setBatchFilter] = useState<string>('ALL');

  // Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || 'pkg-001');
  const [quantity, setQuantity] = useState(25);
  const [codePrefix, setCodePrefix] = useState('POPCUT-');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );

  // Copy notification state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Handlers
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGenerateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim() || quantity <= 0) return;

    const newBatchId = `batch-${Date.now()}`;
    const newBatch: PrepaidBatch = {
      id: newBatchId,
      batch_name: newBatchName.trim(),
      package_id: selectedPackageId,
      total_quantity: quantity,
      valid_from: new Date(validFrom).toISOString(),
      valid_until: new Date(validUntil).toISOString(),
      created_at: new Date().toISOString(),
    };

    // Generate ticket items
    const generatedTickets: PrepaidTicket[] = Array.from({ length: quantity }, (_, idx) => {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const cleanPrefix = codePrefix.trim().toUpperCase() || 'TKT-';
      return {
        id: `tkt-${Date.now()}-${idx}`,
        batch_id: newBatchId,
        ticket_code: `${cleanPrefix}${randomSuffix}-${idx + 1}`,
        status: 'AVAILABLE',
        claimed_session_id: null,
        claimed_at: null,
        created_at: new Date().toISOString(),
      };
    });

    setBatches([newBatch, ...batches]);
    setTickets([...generatedTickets, ...tickets]);
    setIsGenerateModalOpen(false);

    // Reset Form
    setNewBatchName('');
    setQuantity(25);
  };

  const handleExportCSV = () => {
    const headers = ['Kode Tiket,Nama Batch,Paket,Status,ID Sesi Pengklaim,Waktu Klaim,Tanggal Dibuat'];
    const rows = filteredTickets.map((t) => {
      const batch = batches.find((b) => b.id === t.batch_id);
      const pkg = packages.find((p) => p.id === batch?.package_id);
      return `"${t.ticket_code}","${batch?.batch_name || '-'}","${pkg?.name || '-'}","${t.status}","${t.claimed_session_id || '-'}","${t.claimed_at || '-'}","${t.created_at}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `popcut_prepaid_tickets_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const batch = batches.find((b) => b.id === t.batch_id);
    const matchesSearch =
      t.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (batch && batch.batch_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.claimed_session_id && t.claimed_session_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesBatch = batchFilter === 'ALL' || t.batch_id === batchFilter;

    return matchesSearch && matchesStatus && matchesBatch;
  });

  // Metrics
  const totalCount = tickets.length;
  const availableCount = tickets.filter((t) => t.status === 'AVAILABLE').length;
  const usedCount = tickets.filter((t) => t.status === 'USED').length;
  const expiredCount = tickets.filter((t) => t.status === 'EXPIRED').length;

  return (
    <AppShell
      title="Tiket Prabayar (Prepaid Tokens)"
      subtitle="Kelola voucher pre-printed, tiket undangan VIP, dan kode token acara photobooth"
      breadcrumbs={[{ label: 'Bisnis' }, { label: 'Tiket Prabayar' }]}
    >
      <div className="space-y-6">
        {/* 1. Header Actions & Quick Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand-contrast">
              <Ticket className="w-5 h-5 text-content-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-primary font-headline tracking-tight">
                Katalog Tiket Prabayar
              </h2>
              <p className="text-xs text-content-secondary">
                Dapat dimasukkan langsung oleh pengunjung di layar Customer App tanpa transaksi tunai/QRIS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="border-border text-content-primary hover:bg-canvas"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsGenerateModalOpen(true)}
              className="bg-brand text-brand-contrast hover:bg-brand-hover"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Generate Batch Tiket Baru
            </Button>
          </div>
        </div>

        {/* 2. Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-content-secondary uppercase tracking-wider">
                Total Tiket
              </span>
              <Ticket className="w-4 h-4 text-content-muted" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-headline text-content-primary">
                {totalCount}
              </span>
              <span className="text-xs text-content-muted font-medium">unit tiket</span>
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-content-secondary uppercase tracking-wider">
                Tersedia (Aktif)
              </span>
              <CheckCircle2 className="w-4 h-4 text-status-success" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-headline text-status-success">
                {availableCount}
              </span>
              <span className="text-xs text-content-muted font-medium">siap diklaim</span>
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-content-secondary uppercase tracking-wider">
                Sudah Digunakan
              </span>
              <Clock className="w-4 h-4 text-brand-contrast" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-headline text-content-primary">
                {usedCount}
              </span>
              <span className="text-xs text-content-muted font-medium">telah dipakai sesi</span>
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-content-secondary uppercase tracking-wider">
                Kedaluwarsa
              </span>
              <AlertTriangle className="w-4 h-4 text-status-error" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-headline text-content-muted">
                {expiredCount}
              </span>
              <span className="text-xs text-content-muted font-medium">hangus/expired</span>
            </div>
          </Card>
        </div>

        {/* 3. Search & Filter Bar */}
        <Card className="p-4 bg-surface border-border">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                type="text"
                placeholder="Cari kode tiket, nama batch, atau ID sesi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-canvas border border-border rounded text-xs text-content-primary focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-surface-low border border-border rounded p-1">
                {(['ALL', 'AVAILABLE', 'USED', 'EXPIRED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-surface text-content-primary shadow-xs font-semibold'
                        : 'text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'Semua Status'
                      : st === 'AVAILABLE'
                      ? 'Tersedia'
                      : st === 'USED'
                      ? 'Digunakan'
                      : 'Kedaluwarsa'}
                  </button>
                ))}
              </div>

              {/* Batch Filter Dropdown */}
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="px-3 py-2 bg-canvas border border-border rounded text-xs text-content-primary focus:outline-none focus:border-brand"
              >
                <option value="ALL">Semua Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* 4. Tickets Table */}
        <Card className="bg-surface border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-low border-b border-border text-content-secondary font-medium">
                <tr>
                  <th className="px-4 py-3">KODE TIKET</th>
                  <th className="px-4 py-3">BATCH EVENT</th>
                  <th className="px-4 py-3">PAKET FOTO</th>
                  <th className="px-4 py-3">MASA BERLAKU</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">KLAIM SESI</th>
                  <th className="px-4 py-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-content-muted">
                      Tidak ada tiket yang cocok dengan filter atau pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((tkt) => {
                    const batch = batches.find((b) => b.id === tkt.batch_id);
                    const pkg = packages.find((p) => p.id === batch?.package_id);

                    return (
                      <tr key={tkt.id} className="hover:bg-canvas/50 transition-colors">
                        {/* Kode Tiket */}
                        <td className="px-4 py-3 font-mono font-bold text-content-primary">
                          <div className="flex items-center gap-2">
                            <span>{tkt.ticket_code}</span>
                            <button
                              onClick={() => handleCopyCode(tkt.ticket_code)}
                              className="text-content-muted hover:text-content-primary transition-colors p-1"
                              title="Salin Kode"
                            >
                              {copiedCode === tkt.ticket_code ? (
                                <Check className="w-3.5 h-3.5 text-status-success" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Batch Event */}
                        <td className="px-4 py-3 text-content-primary">
                          <div className="font-medium">{batch?.batch_name || '-'}</div>
                          <div className="text-[10px] text-content-muted">ID: {tkt.batch_id}</div>
                        </td>

                        {/* Paket */}
                        <td className="px-4 py-3">
                          <Badge variant="neutral" className="font-mono text-[11px]">
                            {pkg?.name || 'Paket Standar'}
                          </Badge>
                        </td>

                        {/* Masa Berlaku */}
                        <td className="px-4 py-3 text-content-secondary">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3 text-content-muted" />
                            <span>
                              {batch?.valid_until
                                ? new Date(batch.valid_until).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {tkt.status === 'AVAILABLE' && (
                            <Badge variant="success" className="gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                              Tersedia
                            </Badge>
                          )}
                          {tkt.status === 'USED' && (
                            <Badge variant="info" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Digunakan
                            </Badge>
                          )}
                          {tkt.status === 'EXPIRED' && (
                            <Badge variant="error" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Kedaluwarsa
                            </Badge>
                          )}
                        </td>

                        {/* Klaim Sesi */}
                        <td className="px-4 py-3">
                          {tkt.claimed_session_id ? (
                            <div>
                              <span className="font-mono text-[11px] font-semibold text-content-primary">
                                {tkt.claimed_session_id}
                              </span>
                              {tkt.claimed_at && (
                                <div className="text-[10px] text-content-muted">
                                  {new Date(tkt.claimed_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-content-muted italic">Belum diklaim</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(tkt.ticket_code)}
                              className="text-content-secondary hover:text-content-primary text-[11px] h-7 px-2"
                            >
                              Salin
                            </Button>
                            {tkt.status === 'AVAILABLE' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Invalidate / mark as used simulation
                                  setTickets((prev) =>
                                    prev.map((item) =>
                                      item.id === tkt.id
                                        ? { ...item, status: 'EXPIRED' }
                                        : item
                                    )
                                  );
                                }}
                                className="text-status-error border-status-error/30 hover:bg-status-error/10 text-[11px] h-7 px-2"
                              >
                                Hanguskan
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 5. Generate New Batch Modal */}
        <Modal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          title="Generate Batch Tiket Prabayar Baru"
          maxWidth="lg"
        >
          <form onSubmit={handleGenerateBatch} className="space-y-4">
            <p className="text-xs text-content-secondary">
              Buat kumpulan kode token unik untuk dibagikan ke panitia acara, klien VIP, atau dicetak sebagai kartu voucher fisik.
            </p>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Nama Batch Acara / Klien *
              </label>
              <Input
                placeholder="Contoh: Undangan VIP Pernikahan Bima & Sarah"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Pilihan Paket Foto *
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded text-xs text-content-primary focus:outline-none focus:border-brand"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — Rp {pkg.price.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Jumlah Tiket Ditargetkan *
                </label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Prefix Kode Tiket (Awalan)
              </label>
              <Input
                placeholder="Contoh: WED-VIP- atau BCA-"
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
              />
              <p className="text-[11px] text-content-muted mt-1">
                Format kode yang akan dibuat: <span className="font-mono font-bold text-content-primary">{codePrefix.trim().toUpperCase() || 'POPCUT-'}8812-1</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Mulai Berlaku
                </label>
                <Input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Kedaluwarsa Pada
                </label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 bg-surface-low border border-border rounded-lg text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-brand-contrast shrink-0 mt-0.5" />
              <div className="text-content-secondary text-[11px] leading-relaxed">
                Setiap tiket yang dibuat memiliki kode unik acak 4-digit yang dapat divalidasi langsung oleh Customer App secara offline melalui signed local manifest atau online via RPC Supabase.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsGenerateModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-brand text-brand-contrast hover:bg-brand-hover"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Generate {quantity} Tiket Sekarang
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
