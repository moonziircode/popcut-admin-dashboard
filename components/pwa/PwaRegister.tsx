'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Download, X } from 'lucide-react';

export function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Initial offline state
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // 2. Service Worker registration
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[Popcut PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.error('[Popcut PWA] Service Worker registration failed:', err);
          });
      }

      // 3. BeforeInstallPrompt listener for install banner
      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[Popcut PWA] User accepted installation prompt');
      }
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  return (
    <>
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-medium flex items-center justify-between border-b border-amber-600 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-950 animate-pulse" />
            <span>
              <strong>Mode Offline:</strong> Anda sedang melihat data lokal tercache. Aksi penerbitan konfigurasi dan mutasi finansial ditangguhkan hingga koneksi kembali online.
            </span>
          </div>
          <span className="text-[11px] bg-amber-400/80 px-2 py-0.5 rounded text-amber-950 font-semibold">
            OFFLINE
          </span>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-4 right-4 z-50 bg-surface border border-border shadow-elevation rounded-lg p-3 max-w-sm flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-brand flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-brand-contrast" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-semibold text-content-primary">Install Popcut.id Admin</p>
            <p className="text-content-secondary mt-0.5">Pasang aplikasi di desktop atau tablet untuk akses cepat dan monitoring offline.</p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-brand text-brand-contrast font-semibold px-3 py-1 rounded text-xs hover:bg-brand-hover transition-colors"
              >
                Pasang Sekarang
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-content-secondary hover:text-content-primary px-2 py-1 text-xs"
              >
                Nanti
              </button>
            </div>
          </div>
          <button onClick={() => setShowInstallBanner(false)} className="text-content-muted hover:text-content-primary">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
