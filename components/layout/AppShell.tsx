'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PwaRegister } from '../pwa/PwaRegister';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AppShell({ children, title, subtitle, breadcrumbs }: AppShellProps) {
  return (
    <div className="min-h-screen flex bg-canvas text-content-primary">
      {/* 1. Left Fixed / Collapsible Sidebar */}
      <Sidebar />

      {/* 2. Main Work Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <PwaRegister />
        <Header title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
