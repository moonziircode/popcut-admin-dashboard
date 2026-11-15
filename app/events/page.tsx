'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Plus,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Tag,
  Layers,
  MonitorDot,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  PartyPopper,
  Filter,
  StopCircle,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { initialPackages, initialFrames, initialBooths } from '@/lib/data/mock-data';
import { PhotoboothEvent } from '@/types/database.types';

export default function EventsPage() {
  const [events, setEvents] = useState<PhotoboothEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetEventToActivate, setTargetEventToActivate] = useState<PhotoboothEvent | null>(null);
  const [targetEventToDeactivate, setTargetEventToDeactivate] = useState<PhotoboothEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<PhotoboothEvent | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Event Form State
  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventType, setEventType] = useState<'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'GRADUATION' | 'COMMUNITY' | 'POPUP'>('WEDDING');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [welcomeGreeting, setWelcomeGreeting] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedFrames, setSelectedFrames] = useState<string[]>([]);

  // Fetch events from backend API on mount
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Active event
  const activeEvent = events.find((e) => e.is_active) || null;

  // Handle Switch Active Event
  const handleConfirmSwitchEvent = async () => {
    if (!targetEventToActivate) return;

    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: targetEventToActivate.id, action: 'ACTIVATE' }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) => ({
            ...e,
            is_active: e.id === targetEventToActivate.id,
            status: e.id === targetEventToActivate.id ? 'ACTIVE' : e.status === 'ACTIVE' ? 'COMPLETED' : e.status,
          }))
        );
        setNotification(`Event "${targetEventToActivate.name}" kini AKTIF untuk Customer Application booth.`);
      }
    } catch (err) {
      console.error('Failed to switch event:', err);
    }

    setIsSwitchModalOpen(false);
    setTargetEventToActivate(null);
  };

  // Handle Deactivate Active Event (Put booth to standby)
  const handleConfirmDeactivateEvent = async () => {
    if (!targetEventToDeactivate) return;

    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: targetEventToDeactivate.id, action: 'DEACTIVATE' }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) => {
            if (e.id === targetEventToDeactivate.id) {
              return {
                ...e,
                is_active: false,
                status: 'COMPLETED',
                updated_at: new Date().toISOString(),
              };
            }
            return e;
          })
        );
        setNotification(`Event "${targetEventToDeactivate.name}" telah dinonaktifkan. Armada kini dalam status Standby.`);
      }
    } catch (err) {
      console.error('Failed to deactivate event:', err);
    }

    setIsDeactivateModalOpen(false);
    setTargetEventToDeactivate(null);
  };

  // Handle Delete Event
  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      const res = await fetch(`/api/events?id=${eventToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
        setNotification(`Event "${eventToDelete.name}" berhasil dihapus.`);
      } else {
        alert(data.message || 'Gagal menghapus event.');
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
    }

    setIsDeleteModalOpen(false);
    setEventToDelete(null);
  };

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !clientName.trim()) return;

    try {
      const payload = {
        name: eventName.trim(),
        client_name: clientName.trim(),
        event_type: eventType,
        venue: venue.trim() || 'Lokasi Klien',
        start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        is_active: false,
        welcome_greeting: welcomeGreeting.trim() || `Selamat Datang di ${eventName}! Sentuh Layar untuk Mulai Foto`,
        allowed_package_ids: selectedPackages,
        allowed_frame_ids: selectedFrames,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success && result.event) {
        setEvents((prev) => [result.event, ...prev]);
        setNotification(`Event "${result.event.name}" berhasil dibuat dan tersimpan.`);
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    }

    setIsCreateModalOpen(false);

    // Reset Form
    setEventName('');
    setClientName('');
    setVenue('');
    setStartDate('');
    setEndDate('');
    setWelcomeGreeting('');
  };

  const filteredEvents = filterStatus === 'all'
    ? events
    : events.filter((e) => e.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <AppShell
      title="Manajemen Event & Konfigurasi Kiosk"
      breadcrumbs={[{ label: 'Bisnis' }, { label: 'Event & Konfigurasi' }]}
    >
      <div className="space-y-6">
        {/* 1. Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-headline text-content-primary tracking-tight">
              Manajemen Event Dinamis
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Atur identitas event, branding visual, paket khusus, dan frame yang aktif berjalan di armada photobooth tanpa ubah kode aplikasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsPublishModalOpen(true)}>
              <Send className="w-3.5 h-3.5" />
              Terbitkan Rilis Konfig
            </Button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              Buat Event Baru
            </Button>
          </div>
        </div>

        {/* Notification Alert if any */}
        {notification && (
          <div className="p-3 bg-brand/20 border border-brand/50 rounded-lg text-xs font-medium text-brand-contrast flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 2. Primary Hero Card: Currently Active Event Running on Rig OR Standby Mode */}
        {activeEvent ? (
          <div className="bg-surface border-2 border-brand/50 rounded-xl p-5 shadow-elevation relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand text-brand-contrast px-4 py-1 rounded-bl-lg font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
              SEDANG AKTIF DI BOOTH
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="brand">{activeEvent.event_type}</Badge>
                  <span className="text-[11px] font-mono text-content-muted">{activeEvent.internal_code}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold font-headline text-content-primary">
                    {activeEvent.name}
                  </h3>
                  <p className="text-xs text-content-secondary mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-content-muted" />
                    Klien: <strong className="text-content-primary">{activeEvent.client_name}</strong>
                    <span className="text-content-muted">•</span>
                    <MapPin className="w-3.5 h-3.5 text-content-muted" />
                    {activeEvent.venue}
                  </p>
                </div>

                {/* Subtitle Display */}
                <div className="bg-canvas p-3 rounded-lg border border-border text-xs">
                  <span className="text-[10px] text-content-muted uppercase tracking-wider block font-semibold mb-0.5">
                    Teks Salam di Layar Kiosk Customer:
                  </span>
                  <p className="text-content-primary italic">
                    &quot;{activeEvent.welcome_greeting}&quot;
                  </p>
                </div>

                {/* Hardware & Package details */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-content-secondary">
                    <MonitorDot className="w-4 h-4 text-emerald-600" />
                    <span>Rig Operasional: <strong>Mobile Rig #1 (MacBook Pro M1 Pro)</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-content-secondary">
                    <Tag className="w-4 h-4 text-brand-dark" />
                    <span>{activeEvent.allowed_package_ids.length} Paket Aktif</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-content-secondary">
                    <Layers className="w-4 h-4 text-cyan-600" />
                    <span>{activeEvent.allowed_frame_ids.length} Frame Khusus</span>
                  </div>
                </div>
              </div>

              {/* Quick Status Box */}
              <div className="lg:col-span-4 bg-canvas/70 p-4 rounded-lg border border-border flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-content-primary block">
                    Status Sinkronisasi Customer App
                  </span>
                  <span className="text-[10px] text-content-secondary block mt-0.5">
                    Versi rilis aktif: <strong className="font-mono text-content-primary">v2.4.1 (APPLIED)</strong>
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-content-secondary">DSLR Camera:</span>
                    <span className="font-semibold text-emerald-700">Canon EOS 60D</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">Printer Fisik:</span>
                    <span className="font-semibold text-emerald-700">Epson L3250</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-secondary">Mode Layar:</span>
                    <span className="font-semibold text-content-primary">Customer Fullscreen Touch</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full text-xs"
                    onClick={() => {
                      const nextEvt = events.find((e) => !e.is_active && e.id !== activeEvent.id);
                      if (nextEvt) {
                        setTargetEventToActivate(nextEvt);
                        setIsSwitchModalOpen(true);
                      }
                    }}
                  >
                    <CalendarDays className="w-3.5 h-3.5 mr-1" />
                    Ganti Event untuk Booth Ini
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    onClick={() => {
                      setTargetEventToDeactivate(activeEvent);
                      setIsDeactivateModalOpen(true);
                    }}
                  >
                    <StopCircle className="w-3.5 h-3.5 mr-1 text-red-500" />
                    Akhiri Event (Nonaktifkan)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standby Mode Hero Banner when no event is running */
          <div className="bg-surface border-2 border-dashed border-border-strong rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-content-muted text-white px-4 py-1 rounded-bl-lg font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              STATUS BOOTH: STANDBY (SIAGA)
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Tidak Ada Event yang Berjalan
                </div>
                <h3 className="text-lg font-bold font-headline text-content-primary">
                  Armada Photobooth Sedang Berada Dalam Mode Siaga (Standby)
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Layar Customer Application pada <strong>Mobile Rig #1 (MacBook Pro M1 Pro)</strong> saat ini menampilkan standby screen Popcut.id default. Pilih event mendatang dari katalog di bawah atau buat event baru untuk mengaktifkan sesi operasional booth.
                </p>
                <div className="flex items-center gap-4 text-xs text-content-muted pt-1">
                  <span>Hardware Status: <strong className="text-emerald-600 font-medium">Ready (Online)</strong></span>
                  <span>•</span>
                  <span>Printer & DSLR: <strong className="text-emerald-600 font-medium">Connected</strong></span>
                  <span>•</span>
                  <span>Data Finansial: <strong className="text-content-primary font-medium">Tersimpan Aman</strong></span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-brand text-brand-contrast hover:bg-brand-hover text-xs"
                  onClick={() => {
                    const upcomingEvt = events.find((e) => !e.is_active);
                    if (upcomingEvt) {
                      setTargetEventToActivate(upcomingEvt);
                      setIsSwitchModalOpen(true);
                    } else {
                      setIsCreateModalOpen(true);
                    }
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-dark" />
                  Pilih & Aktifkan Event
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Buat Event Baru
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Filter Pills */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
          <span className="text-content-muted font-medium pr-1 text-[11px] uppercase tracking-wider">Status:</span>
          {[
            { id: 'all', label: 'Semua Event' },
            { id: 'active', label: 'Aktif' },
            { id: 'upcoming', label: 'Mendatang' },
            { id: 'completed', label: 'Selesai' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterStatus(cat.id)}
              className={`px-3 py-1 rounded-full border transition-all text-xs font-medium ${
                filterStatus === cat.id
                  ? 'bg-content-primary text-white border-content-primary shadow-sm'
                  : 'bg-surface text-content-secondary border-border hover:border-border-strong hover:text-content-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 4. Events Catalog Grid & Empty State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-brand animate-spin mb-3" />
            <p className="text-xs text-content-secondary">Memuat data event dari database...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 px-4 bg-surface border-2 border-dashed border-border rounded-xl text-center max-w-lg mx-auto flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-canvas border border-border flex items-center justify-center mb-4 text-content-muted">
              <CalendarDays className="w-7 h-7 text-content-muted" />
            </div>
            <h3 className="text-sm font-bold text-content-primary font-headline">
              Belum Ada Event Terdaftar
            </h3>
            <p className="text-xs text-content-secondary mt-1 leading-relaxed max-w-md">
              Seluruh database operasional telah di-reset. Buat event pertama Anda untuk mengatur nama acara, klien, custom welcome greeting, paket, dan frame yang akan aktif di armada photobooth.
            </p>
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 bg-brand text-brand-contrast hover:bg-brand-hover text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Buat Event Pertama Sekarang
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((evt) => {
              const isCurActive = evt.is_active;
              return (
                <Card
                  key={evt.id}
                  className={`p-5 flex flex-col justify-between transition-all ${
                    isCurActive ? 'border-2 border-brand bg-surface' : 'hover:border-border-strong'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={isCurActive ? 'brand' : evt.status === 'UPCOMING' ? 'info' : 'neutral'}>
                        {evt.status}
                      </Badge>
                      <span className="text-[10px] font-mono text-content-muted">{evt.event_type}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold font-headline text-content-primary line-clamp-1">
                        {evt.name}
                      </h4>
                      <p className="text-xs text-content-secondary mt-0.5 line-clamp-1">
                        {evt.client_name} • {evt.venue}
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-canvas border border-border text-[11px] space-y-1">
                      <div className="flex justify-between text-content-secondary">
                        <span>Paket Tersedia:</span>
                        <strong className="text-content-primary">{evt.allowed_package_ids.length} Paket</strong>
                      </div>
                      <div className="flex justify-between text-content-secondary">
                        <span>Frame Khusus:</span>
                        <strong className="text-content-primary">{evt.allowed_frame_ids.length} Frame</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border mt-4 flex items-center justify-between gap-2">
                    {isCurActive ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sedang Aktif di Kiosk
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 py-1 px-2.5 h-7"
                          onClick={() => {
                            setTargetEventToDeactivate(evt);
                            setIsDeactivateModalOpen(true);
                          }}
                        >
                          <StopCircle className="w-3 h-3 mr-1 text-red-500" />
                          Akhiri Event
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs flex-1"
                          onClick={() => {
                            setTargetEventToActivate(evt);
                            setIsSwitchModalOpen(true);
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-dark" />
                          Aktifkan di Booth
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          onClick={() => {
                            setEventToDelete(evt);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Hapus Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 5. MODAL: Buat Event Baru */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Buat Event Photobooth Baru"
          description="Konfigurasikan identitas event, lokasi, custom greeting, dan paket foto yang akan ditampilkan pada layar Customer Application."
          maxWidth="2xl"
          cancelLabel="Batal"
          confirmLabel="Simpan Event"
          onConfirm={() => {
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            handleCreateEvent(fakeEvent);
          }}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Nama Event <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Popcut Wedding — The Ritz-Carlton"
                  className="w-full h-9 bg-surface border border-border rounded px-3 text-xs focus:outline-none focus:border-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Nama Klien / Penyelenggara <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Bima & Sarah Wedding"
                  className="w-full h-9 bg-surface border border-border rounded px-3 text-xs focus:outline-none focus:border-brand"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Tipe Event
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full h-9 bg-surface border border-border rounded px-3 text-xs focus:outline-none focus:border-brand"
                >
                  <option value="WEDDING">Wedding & Engagement</option>
                  <option value="CORPORATE">Corporate & Conference</option>
                  <option value="BIRTHDAY">Birthday & Sweet 17</option>
                  <option value="GRADUATION">Graduation & Wisuda</option>
                  <option value="COMMUNITY">Community & Gathering</option>
                  <option value="POPUP">Public Pop-Up Booth</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Lokasi / Venue Acara
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Grand Ballroom The Ritz-Carlton"
                  className="w-full h-9 bg-surface border border-border rounded px-3 text-xs focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Custom Welcome Greeting */}
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Teks Sambutan Layar Kiosk (Welcome Greeting)
              </label>
              <input
                type="text"
                value={welcomeGreeting}
                onChange={(e) => setWelcomeGreeting(e.target.value)}
                placeholder="e.g. Selamat Datang di Pernikahan Bima & Sarah! Sentuh Layar untuk Mulai Foto"
                className="w-full h-9 bg-surface border border-border rounded px-3 text-xs focus:outline-none focus:border-brand"
              />
              <span className="text-[10px] text-content-muted mt-1 block">
                Teks ini akan langsung muncul di Layar Awal (Welcome Screen) Customer Application.
              </span>
            </div>

            {/* Package selector */}
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1.5">
                Paket Foto yang Diberlakukan untuk Event Ini:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {initialPackages.map((pkg) => {
                  const isChecked = selectedPackages.includes(pkg.id);
                  return (
                    <label
                      key={pkg.id}
                      className={`p-2.5 rounded border flex items-center gap-2 cursor-pointer transition-colors ${
                        isChecked ? 'border-brand bg-brand-light/20' : 'border-border bg-surface'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPackages([...selectedPackages, pkg.id]);
                          } else {
                            setSelectedPackages(selectedPackages.filter((id) => id !== pkg.id));
                          }
                        }}
                        className="rounded border-border text-brand focus:ring-brand"
                      />
                      <div>
                        <span className="font-semibold block text-content-primary">{pkg.name}</span>
                        <span className="text-[10px] text-content-muted">Rp {pkg.price.toLocaleString('id-ID')}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>

        {/* 6. MODAL: Konfirmasi Switch Active Event (Safe Switching Mechanism) */}
        <Modal
          isOpen={isSwitchModalOpen}
          onClose={() => setIsSwitchModalOpen(false)}
          title="Konfirmasi Pergantian Event Aktif di Booth"
          description="Pastikan tidak ada sesi foto yang sedang berjalan di booth sebelum mengalihkan identitas event."
          cancelLabel="Batal"
          confirmLabel="Ya, Alihkan Booth ke Event Ini"
          onConfirm={handleConfirmSwitchEvent}
        >
          {targetEventToActivate && (
            <div className="space-y-4 text-xs text-content-secondary">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Mekanisme Pergantian Aman (Safe Switch Protocol)
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                  <li>Layar Customer Application pada MacBook akan otomatis berganti ke identitas: <strong>{targetEventToActivate.name}</strong>.</li>
                  <li>Paket dan frame yang ditargetkan akan langsung disinkronkan ke cache lokal booth.</li>
                  <li>Riwayat transaksi event sebelumnya tetap tersimpan aman dan tidak akan terhapus.</li>
                </ul>
              </div>

              <div className="p-3 bg-surface border border-border rounded-lg space-y-1 text-content-primary">
                <div className="text-[11px] text-content-muted">Target Event Baru:</div>
                <div className="font-bold text-sm font-headline">{targetEventToActivate.name}</div>
                <div className="text-[11px] text-content-secondary">{targetEventToActivate.client_name} • {targetEventToActivate.venue}</div>
              </div>
            </div>
          )}
        </Modal>

        {/* 6B. MODAL: Konfirmasi Pengakhiran / Deaktivasi Event */}
        <Modal
          isOpen={isDeactivateModalOpen}
          onClose={() => setIsDeactivateModalOpen(false)}
          title="Akhiri & Nonaktifkan Event Berjalan"
          description="Konfirmasikan pengakhiran event operasional untuk mengembalikan armada booth ke mode Siaga (Standby)."
          cancelLabel="Batal"
          confirmLabel="Ya, Akhiri Event Sekarang"
          onConfirm={handleConfirmDeactivateEvent}
        >
          {targetEventToDeactivate && (
            <div className="space-y-4 text-xs text-content-secondary">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-950 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  Protokol Pengakhiran Event Dinamis
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-red-800">
                  <li>Layar Customer Application pada MacBook akan otomatis kembali ke <strong>Standby Screen (Mode Siaga)</strong> default Popcut.id.</li>
                  <li>Status event ini diubah menjadi <strong className="font-semibold text-red-950">COMPLETED (Selesai)</strong>.</li>
                  <li><strong>Data Finansial Aman:</strong> Seluruh riwayat transaksi (Midtrans/QRIS/Tunai), pendapatan, foto sesi, dan print job tetap 100% tersimpan aman di database dan laporan analitik.</li>
                  <li>Anda dapat mengaktifkan kembali event lain kapan saja tanpa perlu me-restart perangkat hardware booth.</li>
                </ul>
              </div>

              <div className="p-3 bg-surface border border-border rounded-lg space-y-1 text-content-primary">
                <div className="text-[11px] text-content-muted">Event yang akan diakhiri:</div>
                <div className="font-bold text-sm font-headline text-red-700">{targetEventToDeactivate.name}</div>
                <div className="text-[11px] text-content-secondary">
                  Klien: {targetEventToDeactivate.client_name} • Venue: {targetEventToDeactivate.venue}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* 7. MODAL: Terbitkan Konfigurasi */}
        <Modal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          title="Terbitkan Rilis Konfigurasi ke Kiosk"
          description="Konfigurasi event aktif, paket, dan frame akan dipaketkan ke dalam manifest rilis immutable baru."
          confirmLabel="Terbitkan Rilis Sekarang"
          cancelLabel="Batal"
          onConfirm={() => setIsPublishModalOpen(false)}
        >
          <div className="space-y-3 text-xs text-content-secondary">
            <p>
              Rilis baru <strong>v2.4.2</strong> akan didistribusikan ke <strong>Mobile Rig #1</strong>. Aplikasi booth akan memverifikasi checksum SHA-256 dan menerapkan konfigurasi secara atomik.
            </p>
            <div className="p-3 bg-canvas border border-border rounded-lg text-[11px] space-y-1">
              <div>Event Target: <strong>{activeEvent?.name}</strong></div>
              <div>Jumlah Paket: <strong>{activeEvent?.allowed_package_ids.length}</strong></div>
              <div>Jumlah Frame: <strong>{activeEvent?.allowed_frame_ids.length}</strong></div>
            </div>
          </div>
        </Modal>

        {/* 8. MODAL: Konfirmasi Hapus Event */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Konfirmasi Hapus Event"
          description="Tindakan ini akan menghapus data event dari sistem secara permanen."
          cancelLabel="Batal"
          confirmLabel="Ya, Hapus Event"
          onConfirm={handleConfirmDeleteEvent}
        >
          {eventToDelete && (
            <div className="space-y-4 text-xs text-content-secondary">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-950 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  Peringatan Penghapusan Event
                </div>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  Apakah Anda yakin ingin menghapus event <strong className="font-semibold text-red-950">{eventToDelete.name}</strong>? Data event ini akan dihapus dari Supabase.
                </p>
              </div>

              <div className="p-3 bg-surface border border-border rounded-lg space-y-1 text-content-primary">
                <div className="text-[11px] text-content-muted">Event yang akan dihapus:</div>
                <div className="font-bold text-sm font-headline text-red-700">{eventToDelete.name}</div>
                <div className="text-[11px] text-content-secondary">
                  Klien: {eventToDelete.client_name} • Venue: {eventToDelete.venue}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
