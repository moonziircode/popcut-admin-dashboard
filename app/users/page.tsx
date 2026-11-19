'use client';

import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  ShieldCheck,
  Check,
  X,
  Lock,
  Mail,
  Shield,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatDateId } from '@/lib/utils';
import { UserRoleType } from '@/types/database.types';

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  role: UserRoleType;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  last_login: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRoleType>('staff');

  const handleInviteUser = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: inviteName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers();
        setIsInviteModalOpen(false);
        setInviteName('');
        setInviteEmail('');
      } else {
        alert(data.error || 'Gagal menambahkan user');
      }
    } catch (e: any) {
      alert(e.message || 'Gagal menambahkan user');
    }
  };

  const permissionMatrix = [
    { module: 'Overview Dashboard', owner: true, admin: true, staff: true },
    { module: 'Katalog Paket & Harga', owner: true, admin: true, staff: false },
    { module: 'Bingkai & Frame Editor', owner: true, admin: true, staff: false },
    { module: 'Penerbitan Konfigurasi', owner: true, admin: true, staff: false },
    { module: 'Manajemen Armada Booth', owner: true, admin: true, staff: false },
    { module: 'Promosi & Voucher', owner: true, admin: true, staff: false },
    { module: 'Tiket Prabayar', owner: true, admin: true, staff: false },
    { module: 'Lihat Transaksi', owner: true, admin: true, staff: true },
    { module: 'Konfirmasi Kasir Tunai', owner: true, admin: true, staff: true },
    { module: 'Koreksi Transaksi', owner: true, admin: true, staff: false },
    { module: 'Monitoring Sesi & Timeline', owner: true, admin: true, staff: true },
    { module: 'Akses Foto Privat Pelanggan', owner: true, admin: true, staff: false },
    { module: 'Antrean Cetak & Reprint', owner: true, admin: true, staff: true },
    { module: 'Laporan Finansial & CSV', owner: true, admin: true, staff: false },
    { module: 'Pengaturan Gateway & Bisnis', owner: true, admin: false, staff: false },
    { module: 'Manajemen Pengguna & Role', owner: true, admin: false, staff: false },
  ];

  return (
    <AppShell
      title="Pengguna & Matriks Hak Akses"
      breadcrumbs={[{ label: 'Sistem' }, { label: 'Pengguna & Akses' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Manajemen Pengguna & Akses
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Kelola akun staf internal, pembagian peran operasional, dan penegakan izin Row Level Security (RLS).
            </p>
          </div>

          <Button size="sm" onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="w-3.5 h-3.5" />
            Undang Anggota Tim
          </Button>
        </div>

        {/* 2. User Accounts Table */}
        <Card className="p-0 overflow-hidden">
          <CardHeader className="p-4 border-b border-border m-0">
            <CardTitle>Daftar Pengguna Aktif</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Peran (Role)</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4 text-right">Login Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-canvas/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-content-primary font-headline">
                      {u.full_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-content-secondary">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold capitalize text-content-primary bg-canvas px-2 py-0.5 rounded border border-border">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right text-content-secondary text-[11px]">
                      {formatDateId(u.last_login)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 3. Role Permission Matrix Card */}
        <Card className="p-0 overflow-hidden">
          <CardHeader className="p-4 border-b border-border m-0">
            <div>
              <CardTitle>Matriks Hak Akses Peran (Permission Matrix)</CardTitle>
              <p className="text-xs text-content-secondary mt-0.5">
                Hak akses diverifikasi secara ketat di backend melalui PostgreSQL Row Level Security (RLS) dan RPC functions.
              </p>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider bg-canvas/40">
                  <th className="py-3 px-4">Modul / Fitur</th>
                  <th className="py-3 px-4 text-center">Owner (Pemilik)</th>
                  <th className="py-3 px-4 text-center">Admin (Manajer)</th>
                  <th className="py-3 px-4 text-center">Staff (Operasional Booth)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {permissionMatrix.map((item) => (
                  <tr key={item.module} className="hover:bg-canvas/30 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-content-primary">{item.module}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {item.admin ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-rose-500">
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {item.staff ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 text-stone-400">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 4. INVITE USER MODAL */}
        <Modal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          title="Undang Pengguna Baru"
          description="Kirimkan undangan ke email staf untuk mengakses Popcut.id Admin Dashboard."
          confirmLabel="Kirim Undangan"
          onConfirm={handleInviteUser}
        >
          <div className="space-y-4">
            <Input
              label="Nama Lengkap"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Budi Santoso"
              required
            />
            <Input
              label="Alamat Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="staf@popcut.id"
              required
            />
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Tugaskan Peran (Role)
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full h-9 bg-surface border border-border rounded px-3 text-xs"
              >
                <option value="staff">Staff (Operasional Booth & Kasir)</option>
                <option value="admin">Admin (Pengelola Bisnis & Monitoring)</option>
                <option value="owner">Owner (Akses Penuh Seluruh Sistem)</option>
              </select>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
