import { NextRequest, NextResponse } from 'next/server';
import { initialEvents } from '@/lib/data/mock-data';
import { PhotoboothEvent } from '@/types/database.types';

// In-memory state for API handlers
let eventsStore: PhotoboothEvent[] = [...initialEvents];

export async function GET(req: NextRequest) {
  const activeOnly = req.nextUrl.searchParams.get('active_only') === 'true';

  if (activeOnly) {
    const active = eventsStore.find((e) => e.is_active) || null;
    return NextResponse.json({ event: active, is_standby: !active });
  }

  return NextResponse.json({ events: eventsStore });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.client_name) {
      return NextResponse.json(
        {
          code: 'INVALID_PAYLOAD',
          message: 'name dan client_name wajib disertakan.',
          retryable: false,
          request_id: crypto.randomUUID(),
        },
        { status: 400 }
      );
    }

    const newEvent: PhotoboothEvent = {
      id: `evt-${Date.now()}`,
      internal_code: `EVT-${Date.now().toString().slice(-6)}`,
      name: body.name,
      client_name: body.client_name,
      event_type: body.event_type || 'WEDDING',
      venue: body.venue || 'Lokasi Klien',
      start_date: body.start_date || new Date().toISOString(),
      end_date: body.end_date || new Date(Date.now() + 86400000).toISOString(),
      is_active: Boolean(body.is_active),
      status: body.is_active ? 'ACTIVE' : 'UPCOMING',
      logo_url: body.logo_url || null,
      welcome_greeting: body.welcome_greeting || `Selamat Datang di ${body.name}!`,
      custom_theme_color: body.custom_theme_color || '#D9E83F',
      allowed_package_ids: body.allowed_package_ids || [],
      allowed_frame_ids: body.allowed_frame_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (newEvent.is_active) {
      eventsStore = eventsStore.map((e) => ({
        ...e,
        is_active: false,
        status: e.status === 'ACTIVE' ? 'COMPLETED' : e.status,
      }));
    }

    eventsStore.unshift(newEvent);

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Gagal membuat event.',
        retryable: true,
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { event_id, action } = await req.json();

    if (!event_id) {
      return NextResponse.json(
        { code: 'MISSING_EVENT_ID', message: 'event_id wajib disertakan.' },
        { status: 400 }
      );
    }

    if (action === 'ACTIVATE') {
      eventsStore = eventsStore.map((e) => {
        if (e.id === event_id) {
          return { ...e, is_active: true, status: 'ACTIVE', updated_at: new Date().toISOString() };
        }
        return {
          ...e,
          is_active: false,
          status: e.status === 'ACTIVE' ? 'COMPLETED' : e.status,
          updated_at: new Date().toISOString(),
        };
      });

      const updated = eventsStore.find((e) => e.id === event_id);
      return NextResponse.json({
        success: true,
        message: `Event "${updated?.name}" kini aktif untuk armada booth.`,
        event: updated,
      });
    }

    if (action === 'DEACTIVATE' || action === 'COMPLETE') {
      eventsStore = eventsStore.map((e) => {
        if (e.id === event_id) {
          return {
            ...e,
            is_active: false,
            status: 'COMPLETED',
            updated_at: new Date().toISOString(),
          };
        }
        return e;
      });

      const updated = eventsStore.find((e) => e.id === event_id);
      return NextResponse.json({
        success: true,
        message: `Event "${updated?.name}" telah dinonaktifkan. Armada booth kini dalam mode Standby.`,
        event: updated,
      });
    }

    return NextResponse.json(
      { code: 'UNKNOWN_ACTION', message: `Action "${action}" tidak dikenali.` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: error?.message || 'Gagal memperbarui event.' },
      { status: 500 }
    );
  }
}
