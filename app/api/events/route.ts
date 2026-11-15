import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PhotoboothEvent } from '@/types/database.types';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const activeOnly = req.nextUrl.searchParams.get('active_only') === 'true';

    if (activeOnly) {
      const { data: active, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching active event from Supabase:', error);
      }

      return NextResponse.json({
        event: active || null,
        is_standby: !active,
      });
    }

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events from Supabase:', error);
      return NextResponse.json({ events: [] });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    return NextResponse.json({ events: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
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

    const isActive = Boolean(body.is_active);

    // If activating new event, deactivate all currently active events
    if (isActive) {
      await supabase
        .from('events')
        .update({ is_active: false, status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('is_active', true);
    }

    const internalCode = body.internal_code || `EVT-${Date.now().toString().slice(-6)}`;
    const newEvent = {
      internal_code: internalCode,
      name: body.name.trim(),
      client_name: body.client_name.trim(),
      event_type: body.event_type || 'WEDDING',
      venue: body.venue?.trim() || 'Lokasi Klien',
      start_date: body.start_date || new Date().toISOString(),
      end_date: body.end_date || new Date(Date.now() + 86400000).toISOString(),
      is_active: isActive,
      status: isActive ? 'ACTIVE' : 'UPCOMING',
      logo_url: body.logo_url || null,
      welcome_greeting: body.welcome_greeting?.trim() || `Selamat Datang di ${body.name}! Sentuh Layar untuk Mulai Foto`,
      custom_theme_color: body.custom_theme_color || '#D9E83F',
      allowed_package_ids: body.allowed_package_ids || [],
      allowed_frame_ids: body.allowed_frame_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdEvent, error } = await supabase
      .from('events')
      .insert(newEvent)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to insert event to Supabase:', error);
      return NextResponse.json(
        { code: 'DB_ERROR', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, event: createdEvent }, { status: 201 });
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
    const supabase = createAdminClient();
    const { event_id, action } = await req.json();

    if (!event_id) {
      return NextResponse.json(
        { code: 'MISSING_EVENT_ID', message: 'event_id wajib disertakan.' },
        { status: 400 }
      );
    }

    if (action === 'ACTIVATE') {
      // 1. Deactivate all other events
      await supabase
        .from('events')
        .update({ is_active: false, status: 'COMPLETED', updated_at: new Date().toISOString() })
        .neq('id', event_id);

      // 2. Activate target event
      const { data: updated, error } = await supabase
        .from('events')
        .update({ is_active: true, status: 'ACTIVE', updated_at: new Date().toISOString() })
        .eq('id', event_id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ code: 'DB_ERROR', message: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Event "${updated?.name}" kini aktif untuk armada booth.`,
        event: updated,
      });
    }

    if (action === 'DEACTIVATE' || action === 'COMPLETE') {
      const { data: updated, error } = await supabase
        .from('events')
        .update({ is_active: false, status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('id', event_id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ code: 'DB_ERROR', message: error.message }, { status: 500 });
      }

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

export const PATCH = PUT;

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const eventId = req.nextUrl.searchParams.get('id');

    if (!eventId) {
      return NextResponse.json(
        { code: 'MISSING_ID', message: 'Parameter id event wajib disertakan.' },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: existing } = await supabase
      .from('events')
      .select('id, name, is_active')
      .eq('id', eventId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: 'Event tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      return NextResponse.json(
        { code: 'DB_ERROR', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Event "${existing.name}" berhasil dihapus dari sistem.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: error?.message || 'Gagal menghapus event.' },
      { status: 500 }
    );
  }
}
