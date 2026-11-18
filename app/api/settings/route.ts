import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: rows, error } = await supabase.from('app_settings').select('*');

    if (error) {
      console.error('[Settings GET Error]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Consolidate settings with defaults
    const settingsMap: Record<string, any> = {
      business_name: 'Popcut.id Photobooth Studio',
      brand_color: '#D9E83F',
      contact_email: 'ops@popcut.id',
      contact_phone: '+6281234567890',
      operating_city: 'Jakarta',
      default_currency: 'IDR',
      countdown_timer_seconds: 5,
      idle_timeout_seconds: 60,
      payment_timeout_seconds: 180,
      session_duration_minutes: 10,
      allow_retakes: true,
      max_retakes_per_pose: 2,
      enable_live_photo: true,
      paper_warning_threshold: 20,
      retention_days: 14,
      max_upload_mb: 25,
      watermark_enabled: true,
    };

    (rows || []).forEach((row) => {
      if (row.value && typeof row.value === 'object') {
        Object.assign(settingsMap, row.value);
      }
    });

    return NextResponse.json({
      success: true,
      settings: settingsMap,
      raw: rows,
    });
  } catch (error: any) {
    console.error('[Settings GET Exception]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const businessValues = {
      business_name: body.business_name || 'Popcut.id Photobooth Studio',
      brand_color: body.brand_color || '#D9E83F',
      contact_email: body.contact_email || 'ops@popcut.id',
      contact_phone: body.contact_phone || '+6281234567890',
      operating_city: body.operating_city || 'Jakarta',
      default_currency: body.default_currency || 'IDR',
    };

    const kioskValues = {
      countdown_timer_seconds: Number(body.countdown_timer_seconds ?? 5),
      idle_timeout_seconds: Number(body.idle_timeout_seconds ?? 60),
      payment_timeout_seconds: Number(body.payment_timeout_seconds ?? 180),
      session_duration_minutes: Number(body.session_duration_minutes ?? 10),
      allow_retakes: Boolean(body.allow_retakes ?? true),
      max_retakes_per_pose: Number(body.max_retakes_per_pose ?? 2),
      enable_live_photo: Boolean(body.enable_live_photo ?? true),
      paper_warning_threshold: Number(body.paper_warning_threshold ?? 20),
      welcome_title: body.business_name || 'Popcut.id Photobooth',
    };

    const storageValues = {
      retention_days: Number(body.retention_days ?? 14),
      max_upload_mb: Number(body.max_upload_mb ?? 25),
      watermark_enabled: Boolean(body.watermark_enabled ?? true),
    };

    // Upsert business settings
    const { error: bErr } = await supabase.from('app_settings').upsert(
      {
        section: 'business',
        key: 'general_profile',
        value: businessValues,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
    if (bErr) throw bErr;

    // Upsert kiosk defaults
    const { error: kErr } = await supabase.from('app_settings').upsert(
      {
        section: 'customer_app',
        key: 'kiosk_defaults',
        value: kioskValues,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
    if (kErr) throw kErr;

    // Upsert storage retention
    const { error: sErr } = await supabase.from('app_settings').upsert(
      {
        section: 'storage',
        key: 'retention_policy',
        value: storageValues,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
    if (sErr) throw sErr;

    // Record in activity_logs
    try {
      await supabase.from('activity_logs').insert({
        action: 'SETTINGS_UPDATE',
        entity_type: 'app_settings',
        description: `Pengaturan sistem diperbarui (Countdown: ${kioskValues.countdown_timer_seconds}s, Retensi: ${storageValues.retention_days} hari)`,
        after_state: { businessValues, kioskValues, storageValues },
      });
    } catch (logErr) {
      console.warn('[Settings Update] Activity log error:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan sistem berhasil disimpan secara permanen.',
      settings: {
        ...businessValues,
        ...kioskValues,
        ...storageValues,
      },
    });
  } catch (error: any) {
    console.error('[Settings POST Error]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal menyimpan pengaturan.' },
      { status: 500 }
    );
  }
}

export const PUT = POST;
