'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  Ticket,
  Receipt,
  Camera,
  Printer,
  Image as ImageIcon,
  MonitorDot,
  BarChart3,
  Settings,
  Users,
  History,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Ringkasan', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'BISNIS',
    items: [
      { name: 'Event & Konfigurasi', href: '/events', icon: CalendarDays },
      { name: 'Paket & Harga', href: '/packages', icon: Package },
      { name: 'Bingkai & Slot', href: '/frames', icon: Layers },
      { name: 'Promo & Voucher', href: '/promotions', icon: Tag },
      { name: 'Tiket Prabayar', href: '/tickets', icon: Ticket },
    ],
  },
  {
    title: 'OPERASIONAL',
    items: [
      { name: 'Transaksi', href: '/transactions', icon: Receipt },
      { name: 'Sesi Foto', href: '/sessions', icon: Camera },
      { name: 'Antrean Cetak', href: '/print-jobs', icon: Printer },
      { name: 'Galeri Digital', href: '/galleries', icon: ImageIcon },
      { name: 'Armada Booth', href: '/booths', icon: MonitorDot },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      { name: 'Laporan Bisnis', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'SISTEM',
    items: [
      { name: 'Pengaturan', href: '/settings', icon: Settings },
      { name: 'Pengguna & Akses', href: '/users', icon: Users },
      { name: 'Log Aktivitas', href: '/activity-log', icon: History },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-surface border-r border-border flex flex-col justify-between transition-all duration-300 z-30 select-none',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* 1. Brand Logo Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-border">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded bg-brand flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 text-brand-contrast" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-headline font-bold text-base text-content-primary tracking-tight leading-tight">
                  Popcut<span className="text-content-secondary">.id</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-content-muted uppercase">
                  Admin Console
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-content-muted hover:text-content-primary p-1 rounded-md hover:bg-canvas transition-colors hidden md:block"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. Navigation Sections */}
        <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <p className="px-2 text-[10px] font-bold text-content-muted tracking-wider uppercase">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-2.5 py-2 rounded text-xs font-medium transition-all group relative',
                        isActive
                          ? 'bg-canvas-alt text-content-primary font-semibold border-l-2 border-brand'
                          : 'text-content-secondary hover:text-content-primary hover:bg-canvas'
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-brand-contrast' : 'text-content-muted group-hover:text-content-primary'
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                      {!isCollapsed && item.badge && (
                        <span className="ml-auto bg-canvas text-content-secondary text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* 3. Bottom Footer / Booth Quick Indicator */}
      <div className="p-3 border-t border-border bg-canvas/40">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-[11px] text-content-secondary">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-status-success inline-block animate-pulse shrink-0" />
              <span className="truncate font-medium">Booth Sync: Aktif</span>
            </div>
            <span className="font-mono text-[10px] text-content-muted">v2.0</span>
          </div>
        ) : (
          <div className="flex justify-center" title="Booth Sync: Aktif">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
