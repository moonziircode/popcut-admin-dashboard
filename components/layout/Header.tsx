'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  CheckCircle2,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Settings,
  Shield,
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Header({ title, subtitle, breadcrumbs }: HeaderProps) {
  const router = useRouter();
  const [activeEventName, setActiveEventName] = useState<string>('Popcut Active Event');
  const [onlineRigCount, setOnlineRigCount] = useState<number>(1);

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    full_name: string;
    role: string;
  }>({
    id: 'u-1',
    email: 'aqsa@popcut.id',
    full_name: 'Aqsa Muflihan',
    role: 'owner',
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetch('/api/events?active_only=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.event?.name) {
          setActiveEventName(data.event.name);
        }
      })
      .catch(() => {});

    fetch('/api/booths')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.booths)) {
          const online = data.booths.filter((b: any) => b.status === 'ONLINE').length;
          setOnlineRigCount(online || 1);
        }
      })
      .catch(() => {});

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const roleLabel =
    currentUser.role === 'owner'
      ? 'Owner'
      : currentUser.role === 'admin'
      ? 'Admin'
      : 'Staff Operasional';

  return (
    <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
      {/* 1. Left: Breadcrumbs & Context */}
      <div className="flex flex-col justify-center">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[11px] text-content-secondary">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-content-muted">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-content-primary transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-content-primary font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-sm font-semibold text-content-primary font-headline tracking-tight">
          {title || 'Popcut.id Admin Dashboard'}
        </h1>
      </div>

      {/* 2. Right: Fleet Status Pill, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Dynamic Active Event & Fleet Status Pill */}
        <Link
          href="/events"
          className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-low border border-border hover:border-brand rounded-full text-xs text-content-primary transition-colors group cursor-pointer"
          title="Klik untuk kelola atau ganti Event Aktif"
        >
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span className="font-semibold text-[11px] text-content-primary flex items-center gap-1">
            <span className="text-brand-contrast">🎪</span>
            <span className="truncate max-w-[200px] group-hover:underline">
              {activeEventName}
            </span>
          </span>
          <span className="text-[10px] text-content-muted border-l border-border pl-2">
            {onlineRigCount} Rig Online
          </span>
        </Link>

        {/* Notification Bell */}
        <button
          className="w-8 h-8 rounded border border-border flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-canvas transition-colors relative"
          title="Notifikasi Operasional"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-brand absolute top-1.5 right-1.5" />
        </button>

        {/* User Profile Pill with Logout Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-90 transition-opacity cursor-pointer select-none text-left"
          >
            <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-brand-contrast font-bold text-xs">
              {getInitials(currentUser.full_name)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-content-primary leading-tight flex items-center gap-1">
                {currentUser.full_name}
                <ChevronDown className="w-3 h-3 text-content-muted" />
              </span>
              <div className="flex items-center gap-1 text-[10px] text-content-muted">
                <ShieldCheck className="w-3 h-3 text-status-success" />
                <span>{roleLabel}</span>
              </div>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-11 w-56 bg-surface border border-border rounded-xl shadow-lg p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-1 text-xs">
              <div className="px-3 py-2 border-b border-border">
                <div className="font-bold text-content-primary truncate">{currentUser.full_name}</div>
                <div className="text-[11px] text-content-muted truncate">{currentUser.email}</div>
                <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand/20 text-brand-contrast">
                  ROLE: {currentUser.role.toUpperCase()}
                </div>
              </div>

              <Link
                href="/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-canvas transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan Sistem</span>
              </Link>

              <Link
                href="/users"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-canvas transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Hak Akses Pengguna</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium border-t border-border mt-1 pt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Sign Out)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
