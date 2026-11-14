'use client';

import React from 'react';
import { Bell, Search, CheckCircle2, User, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function Header({ title, subtitle, breadcrumbs }: HeaderProps) {
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
                  <a href={crumb.href} className="hover:text-content-primary transition-colors">
                    {crumb.label}
                  </a>
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
        {/* Fleet Sync Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-low border border-border rounded-full text-xs text-content-primary">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span className="font-medium text-[11px]">3/3 Booth Online & Sinkron</span>
        </div>

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
