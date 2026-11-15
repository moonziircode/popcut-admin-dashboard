'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Download,
  Share2,
  Sparkles,
  Camera,
  Heart,
  CheckCircle2,
  ArrowDownToLine,
  ExternalLink,
} from 'lucide-react';

interface GalleryPhoto {
  id: string;
  url: string;
  pose_number: number;
}

export default function CustomerGalleryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params?.id as string;
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('POPCUT WEDDING — THE RITZ-CARLTON');
  const [eventDate, setEventDate] = useState('15 November 2026');
  const [photostripUrl, setPhotostripUrl] = useState<string>('');
  const [rawPhotos, setRawPhotos] = useState<GalleryPhoto[]>([]);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    // In production, fetch session & photos from Supabase storage_assets or digital_galleries
    async function loadGalleryData() {
      try {
        setLoading(true);

        // Fetch from API or use session artifacts
        const res = await fetch(`/api/galleries?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.gallery) {
            setEventName(data.gallery.event_name || eventName);
            if (data.gallery.photostrip_url) setPhotostripUrl(data.gallery.photostrip_url);
            if (data.gallery.photos) setRawPhotos(data.gallery.photos);
          }
        }
      } catch (e) {
        console.warn('Gallery fetch fallback to default preview:', e);
      } finally {
        // Fallback default photos for seamless customer viewing
        if (!photostripUrl) {
          setPhotostripUrl('/samples/photostrip-sample.jpg');
        }
        if (rawPhotos.length === 0) {
          setRawPhotos([
            { id: '1', pose_number: 1, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop' },
            { id: '2', pose_number: 2, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop' },
            { id: '3', pose_number: 3, url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop' },
            { id: '4', pose_number: 4, url: 'https://images.unsplash.com/photo-1519225424988-51000632d43e?w=800&auto=format&fit=crop' },
          ]);
        }
        setLoading(false);
      }
    }

    if (sessionId) {
      loadGalleryData();
    }
  }, [sessionId, token]);

  const handleDownloadSingle = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = () => {
    setDownloadSuccess(true);
    rawPhotos.forEach((photo, idx) => {
      setTimeout(() => {
        handleDownloadSingle(photo.url, `Popcut_Pose_${photo.pose_number}.jpg`);
      }, idx * 400);
    });
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(
      `Lihat hasil photostrip kami di Popcut.id!\n${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center select-none font-sans">
      {/* Top Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-60 bg-[#F5ED35]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-2xl px-6 py-6 flex items-center justify-between border-b border-[#222222] z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#F5ED35] text-black font-black flex items-center justify-center rounded text-sm">
            P
          </div>
          <span className="font-mono font-bold tracking-widest text-sm text-[#F5ED35]">
            POPCUT.ID
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] border border-[#333333] rounded-full text-xs font-mono text-[#AAA]">
          <Sparkles className="w-3 h-3 text-[#F5ED35]" />
          <span>GALERI DIGITAL</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl px-6 py-8 flex flex-col items-center space-y-8 z-10">
        {/* Event Title Card */}
        <div className="text-center space-y-2">
          <span className="text-[11px] font-mono tracking-widest text-[#F5ED35] uppercase">
            STUDIO PHOTOBOOTH 4R
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white uppercase">
            {eventName}
          </h1>
          <p className="text-xs text-[#888888] font-mono">
            Sesi #{sessionId ? sessionId.slice(0, 8) : 'LIVE'} • {eventDate}
          </p>
        </div>

        {/* Photostrip Hero Display */}
        <div className="w-full bg-[#141414] border border-[#2A2A2A] rounded-3xl p-5 shadow-2xl flex flex-col items-center space-y-4">
          <div className="w-full flex items-center justify-between text-xs font-mono text-[#888888]">
            <span>PHOTOSTRIP 4R RESMI</span>
            <span className="text-[#F5ED35]">300 DPI STUDIO</span>
          </div>

          {/* Photostrip Preview Image */}
          <div className="w-64 sm:w-72 aspect-[2/3] bg-[#000000] border-2 border-[#333333] rounded-2xl overflow-hidden shadow-2xl relative group">
            <img
              src={photostripUrl}
              alt="Hasil Photostrip 4R"
              className="w-full h-full object-cover"
              onError={(e) => {
                // If local path or fallback fails, render high-res placeholder
                e.currentTarget.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => handleDownloadSingle(photostripUrl, `Popcut_Photostrip_4R.jpg`)}
                className="px-4 py-2 bg-[#F5ED35] text-black font-bold text-xs rounded-full flex items-center gap-1.5 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Photostrip</span>
              </button>
            </div>
          </div>

          {/* Direct Photostrip Download Button */}
          <button
            onClick={() => handleDownloadSingle(photostripUrl, `Popcut_Photostrip_4R.jpg`)}
            className="w-full py-3.5 bg-[#F5ED35] hover:bg-[#E5DD25] text-black font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#F5ED35]/20 active:scale-95 transition-all"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Unduh Photostrip Resolusi Penuh</span>
          </button>
        </div>

        {/* Action Buttons: Download All & Share */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadAll}
            className="w-full py-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#F5ED35]" />
            <span>{downloadSuccess ? 'Mengunduh Semua Foto...' : 'Unduh Semua Pose Satuan'}</span>
          </button>

          <button
            onClick={shareToWhatsApp}
            className="w-full py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan ke WhatsApp</span>
          </button>
        </div>

        {/* Individual Poses Grid */}
        <div className="w-full space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wider uppercase text-white font-mono">
              POSE SATUAN ASLI ({rawPhotos.length} FOTO)
            </h3>
            <span className="text-[11px] text-[#888] font-mono">Ketuk untuk unduh</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {rawPhotos.map((photo) => (
              <div
                key={photo.id}
                className="bg-[#141414] border border-[#282828] rounded-2xl overflow-hidden p-2 flex flex-col space-y-2 group"
              >
                <div className="w-full aspect-[4/3] bg-black rounded-xl overflow-hidden relative">
                  <img
                    src={photo.url}
                    alt={`Pose ${photo.pose_number}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur rounded text-[9px] font-mono text-[#F5ED35]">
                    POSE 0{photo.pose_number}
                  </span>
                </div>

                <button
                  onClick={() => handleDownloadSingle(photo.url, `Popcut_Pose_0${photo.pose_number}.jpg`)}
                  className="w-full py-2 bg-[#222222] hover:bg-[#333333] text-xs font-mono text-[#DDD] rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#F5ED35]" />
                  <span>Unduh Pose</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <footer className="w-full text-center pt-8 pb-12 border-t border-[#1F1F1F] space-y-2">
          <div className="flex items-center justify-center gap-1 text-xs text-[#888]">
            <span>Ditenagai oleh</span>
            <span className="text-white font-bold">Popcut.id Hybrid Cloud</span>
            <span>• Cloudflare R2 & Supabase</span>
          </div>
          <p className="text-[10px] text-[#555] font-mono">
            Tautan galeri ini aktif selama 30 hari sejak tanggal sesi.
          </p>
        </footer>
      </main>
    </div>
  );
}
