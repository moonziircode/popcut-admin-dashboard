import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface border border-border rounded-lg shadow-subtle p-8 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
          <WifiOff className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className="text-base font-bold text-content-primary font-headline">
          Koneksi Internet Terputus
        </h1>
        <p className="text-xs text-content-secondary mt-2 leading-relaxed">
          Admin Dashboard sedang beroperasi dalam mode offline. Data yang Anda lihat saat ini bersumber dari penyimpanan cache lokal perangkat Anda.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 w-full justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand text-brand-contrast text-xs font-semibold rounded hover:bg-brand-hover transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Muat Ulang
          </Link>
        </div>
      </div>
    </div>
  );
}
