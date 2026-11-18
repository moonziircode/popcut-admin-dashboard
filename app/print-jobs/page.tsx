'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatDateId } from '@/lib/utils';
import { PrintJob } from '@/types/database.types';

export default function PrintJobsPage() {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [reprintQuantity, setReprintQuantity] = useState<number>(1);
  const [reprintReason, setReprintReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrintJobs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/print-jobs');
        const data = await res.json();
        if (data.success && Array.isArray(data.print_jobs)) {
          setPrintJobs(data.print_jobs);
        }
      } catch (err) {
        console.error('Failed to load print jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrintJobs();
  }, []);

  const handleOpenReprint = (job: PrintJob) => {
    setSelectedJob(job);
    setReprintQuantity(job.requested_strips);
    setReprintReason('');
    setIsReprintModalOpen(true);
  };

  const handleConfirmReprint = () => {
    if (!selectedJob || !reprintReason.trim()) return;

    const newReprintJob: PrintJob = {
      id: `pj-rpr-${Date.now()}`,
      print_job_number: `PJ-RPR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      session_id: selectedJob.session_id,
      booth_id: selectedJob.booth_id,
      printer_model: selectedJob.printer_model,
      print_layout: selectedJob.print_layout,
      requested_strips: reprintQuantity,
      sheet_count: Math.ceil(reprintQuantity / 2),
      status: 'QUEUED',
      parent_print_job_id: selectedJob.id,
      reprint_reason: reprintReason,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPrintJobs([newReprintJob, ...printJobs]);
    setIsReprintModalOpen(false);
  };

  return (
    <AppShell
      title="Monitoring Antrean Cetak & Print Jobs"
      breadcrumbs={[{ label: 'Operasional' }, { label: 'Antrean Cetak' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Monitoring Antrean Cetak Foto (Print Jobs)
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Pemantauan status eksekusi printer fisik di booth, penanganan kendala mekanis, dan permintaan reprint terotorisasi.
            </p>
          </div>
        </div>

        {/* 2. SOP Banner: UNKNOWN Reconciliation Rule */}
        <div className="bg-canvas border border-border rounded-lg p-4 flex items-start gap-3">
          <HelpCircle className="w-4 h-4 text-content-secondary shrink-0 mt-0.5" />
          <div className="text-xs text-content-secondary leading-relaxed">
            <strong className="text-content-primary">Ketentuan Cetak Ulang (SOP Photobooth):</strong> Sesuai PRD, Admin Dashboard tidak mengendalikan head printer secara langsung. Permintaan cetak ulang dikirim sebagai perintah baru ke booth. Untuk status <strong>UNKNOWN</strong>, operator wajib memeriksa fisik hasil cetak di booth sebelum menyetujui cetak ulang untuk menghindari pemborosan kertas foto.
          </div>
        </div>

        {/* 3. Print Jobs Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                  <th className="py-3 px-4">No. Print Job</th>
                  <th className="py-3 px-4">Waktu Dikirim</th>
                  <th className="py-3 px-4">Booth & Printer</th>
                  <th className="py-3 px-4">Layout & Lembar</th>
                  <th className="py-3 px-4">Status Cetak</th>
                  <th className="py-3 px-4">Catatan / Kendala</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {printJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-content-muted text-xs">
                      Belum ada riwayat antrean cetak di sistem.
                    </td>
                  </tr>
                ) : (
                  printJobs.map((job) => (
                    <tr
                      key={job.id}
                      className={`hover:bg-canvas/30 transition-colors ${
                        job.status === 'UNKNOWN' ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                        {job.print_job_number}
                        {job.parent_print_job_id && (
                          <span className="block text-[10px] text-brand-contrast bg-brand-light px-1.5 py-0.2 rounded w-fit mt-0.5 font-sans font-semibold">
                            Reprint Terkait
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-content-secondary">
                        {formatDateId(job.submitted_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-content-primary">
                          {job.booth?.name || job.booth_id}
                        </div>
                        <span className="text-[11px] text-content-muted font-mono">
                          {job.printer_model || 'DNP RX1HS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-content-primary">
                          {job.requested_strips} Strip ({job.print_layout})
                        </span>
                        <span className="block text-[10px] text-content-muted">
                          {job.sheet_count} lembar fisik
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            job.status === 'COMPLETED'
                              ? 'success'
                              : job.status === 'UNKNOWN'
                              ? 'warning'
                              : job.status === 'FAILED'
                              ? 'error'
                              : 'neutral'
                          }
                          dot
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-content-secondary text-[11px]">
                        {job.error_message || job.reprint_reason || 'Proses pencetakan normal.'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {(job.status === 'FAILED' || job.status === 'UNKNOWN' || job.status === 'COMPLETED') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenReprint(job)}
                            className="gap-1 text-xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reprint
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 4. AUTHORIZED REPRINT REQUEST MODAL */}
        <Modal
          isOpen={isReprintModalOpen}
          onClose={() => setIsReprintModalOpen(false)}
          title="Permintaan Cetak Ulang (Authorized Reprint)"
          description={`Kirim perintah cetak ulang untuk job ${selectedJob?.print_job_number} ke booth.`}
          confirmLabel="Kirim Perintah Cetak Ulang"
          onConfirm={handleConfirmReprint}
        >
          {selectedJob && (
            <div className="space-y-4">
              {selectedJob.status === 'UNKNOWN' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Status job ini sebelumnya <strong>UNKNOWN</strong>. Pastikan Anda atau staff di lokasi telah memeriksa fisik baki printer sebelum mencetak ulang.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Jumlah Lembar / Strip yang Dicetak Ulang
                </label>
                <input
                  type="number"
                  value={reprintQuantity}
                  onChange={(e) => setReprintQuantity(Number(e.target.value))}
                  min={1}
                  max={selectedJob.requested_strips}
                  className="w-full h-9 bg-surface border border-border rounded px-3 text-xs font-mono"
                  required
                />
                <p className="text-[11px] text-content-muted mt-1">
                  Maksimum kuantitas: {selectedJob.requested_strips} strip sesuai paket awal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Alasan Cetak Ulang Wajib
                </label>
                <textarea
                  value={reprintReason}
                  onChange={(e) => setReprintReason(e.target.value)}
                  rows={3}
                  className="w-full bg-surface border border-border rounded p-2 text-xs focus:ring-1 focus:ring-brand"
                  placeholder="Contoh: Kertas macet saat keluar / garis tinta / permintaan pelanggan..."
                  required
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
