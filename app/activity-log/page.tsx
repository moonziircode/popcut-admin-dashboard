'use client';

import React, { useState } from 'react';
import {
  History,
  Shield,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  Eye,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateId } from '@/lib/utils';
import { ActivityLog } from '@/types/database.types';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: 'log-001',
      actor_id: 'u-1',
      actor_email: 'aqsa@popcut.id',
      action: 'SYSTEM_DATABASE_RESET',
      entity_type: 'system',
      entity_id: 'sys-clean-slate',
      description: 'Pembersihan database operasional berhasil dijalankan. Konfigurasi payment gateway Midtrans dipertahankan 100%.',
      before_state: { status: 'PREVIOUS_MIGRATION' },
      after_state: { status: 'CLEAN_SLATE_EMPTY', frames: 0, packages: 0, events: 0, payment_gateway: 'MIDTRANS_INTACT' },
      created_at: new Date().toISOString(),
    },
  ]);

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  return (
    <AppShell
      title="Catatan Aktivitas Sistem & Audit Trail"
      breadcrumbs={[{ label: 'Sistem' }, { label: 'Log Aktivitas' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Catatan Audit Trail & Aktivitas Sistem
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Riwayat perubahan konfigurasi, otorisasi cetak ulang, verifikasi transaksi kasir, dan penerbitan rilis.
            </p>
          </div>
        </div>

        {/* 2. Audit Trail Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                  <th className="py-3 px-4">Waktu Kejadian</th>
                  <th className="py-3 px-4">Pelaku (Actor)</th>
                  <th className="py-3 px-4">Jenis Aksi</th>
                  <th className="py-3 px-4">Entitas / Modul</th>
                  <th className="py-3 px-4">Keterangan Aktivitas</th>
                  <th className="py-3 px-4 text-right">Detail Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-canvas/30 transition-colors">
                    <td className="py-3.5 px-4 text-content-secondary text-[11px]">
                      {formatDateId(log.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-content-primary">
                      {log.actor_email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] bg-canvas border border-border px-2 py-0.5 rounded font-semibold text-content-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-content-secondary font-medium">
                      {log.entity_type}
                    </td>
                    <td className="py-3.5 px-4 text-content-primary max-w-sm truncate">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="gap-1 text-xs"
                      >
                        <Eye className="w-3 h-3" />
                        Diff
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 3. DIFF INSPECTOR MODAL */}
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Detail Perubahan: ${selectedLog?.action}`}
          description={`Dilakukan oleh ${selectedLog?.actor_email} pada ${formatDateId(selectedLog?.created_at)}`}
        >
          {selectedLog && (
            <div className="space-y-4">
              <p className="text-xs text-content-primary font-medium">
                {selectedLog.description}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Before State */}
                <div className="p-3 rounded bg-rose-50/70 border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1">
                    Kondisi Sebelum (Before):
                  </span>
                  <pre className="font-mono text-[11px] text-rose-950 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.before_state, null, 2)}
                  </pre>
                </div>

                {/* After State */}
                <div className="p-3 rounded bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    Kondisi Sesudah (After):
                  </span>
                  <pre className="font-mono text-[11px] text-emerald-950 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.after_state, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
