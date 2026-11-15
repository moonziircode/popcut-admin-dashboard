'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Search, CheckCircle2, User, ShieldCheck } from 'lucide-react';
import { initialEvents, initialBooths } from '@/lib/data/mock-data';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Header({ title, subtitle, breadcrumbs }: HeaderProps) {
  const activeEvent = initialEvents.find((e) => e.is_active) || initialEvents[0];
  const primaryRig = initialBooths[0];

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
              {activeEvent?.name || 'Popcut Wedding — The Ritz-Carlton'}
            </span>
          </span>
          <span className="text-[10px] text-content-muted border-l border-border pl-2">
            Rig #1 Online
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

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-canvas-alt border border-border flex items-center justify-center text-content-primary font-bold text-xs">
            OP
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-content-primary leading-tight">
              Owner Popcut
            </span>
            <div className="flex items-center gap-1 text-[10px] text-content-muted">
              <ShieldCheck className="w-3 h-3 text-status-success" />
              <span>Full Access</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
