import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BoothConfigDeliveryResponse } from '@/types/shared-contract';

export async function GET(req: NextRequest) {
  const boothId = req.nextUrl.searchParams.get('booth_id') || 'RIG-M1-01';

  try {
    const supabase = createAdminClient();

    // 1. Retrieve active event from Supabase
    const { data: activeEvent } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Retrieve packages from Supabase
    const { data: dbPackages } = await supabase
      .from('packages')
      .select('*')
      .eq('is_archived', false)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // 3. Retrieve frames, categories, versions, and slots from Supabase
    const { data: dbCategories } = await supabase
      .from('frame_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const { data: dbFrames } = await supabase
      .from('frames')
      .select('*')
      .eq('is_archived', false);

    const { data: dbVersions } = await supabase
      .from('frame_versions')
      .select('*');

    const { data: dbSlots } = await supabase
      .from('frame_slots')
      .select('*');

    // 4. Retrieve active promotions and codes from Supabase
    const { data: dbPromos } = await supabase
      .from('promotions')
      .select('*, promotion_codes(*)')
      .eq('is_active', true)
      .eq('is_archived', false);

    const mappedPromotions = (dbPromos || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      discount_type: p.discount_type,
      discount_value: Number(p.discount_value),
      start_date: p.start_date,
      end_date: p.end_date,
      total_usage_limit: p.total_usage_limit,
      per_customer_limit: p.per_customer_limit || 1,
      min_purchase: Number(p.min_purchase || 0),
      allow_stacking: Boolean(p.allow_stacking),
      is_active: Boolean(p.is_active),
      is_archived: Boolean(p.is_archived),
      created_at: p.created_at,
      updated_at: p.updated_at,
      promotion_codes: p.promotion_codes || [],
    }));

    // INT-003: Smart fallback for package filtering
    let eventPackages = dbPackages || [];
    if (activeEvent && Array.isArray(activeEvent.allowed_package_ids) && activeEvent.allowed_package_ids.length > 0) {
      const filtered = eventPackages.filter((p) => activeEvent.allowed_package_ids.includes(p.id));
      if (filtered.length > 0) {
        eventPackages = filtered;
      }
    }

    // Smart fallback for frame filtering
    let eventFrames = dbFrames || [];
    if (activeEvent && Array.isArray(activeEvent.allowed_frame_ids) && activeEvent.allowed_frame_ids.length > 0) {
      const filtered = eventFrames.filter((f) => activeEvent.allowed_frame_ids.includes(f.id));
      if (filtered.length > 0) {
        eventFrames = filtered;
      }
    }

    // Build frame objects with slots and asset metadata
    const mappedFrames = eventFrames.map((f) => {
      const version = (dbVersions || []).find((v) => v.id === f.current_version_id) || (dbVersions || []).find((v) => v.frame_id === f.id);
      
      const isLandscape = f.aspect_ratio === '3:2' || f.dimensions === '1800x1200';
      const canvasW = isLandscape ? 1800 : 1200;
      const targetCanvasH = isLandscape ? 1200 : 1800;

      // Check raw slot coordinates to determine original pixel canvas space
      const rawFrameSlots = (dbSlots || []).filter((s) => version && s.frame_version_id === version.id);
      const maxRawY = Math.max(...rawFrameSlots.map((s) => Number(s.y_coord || 0) + Number(s.height || 0)), 0);
      const sourcePixelH = isLandscape ? 1200 : (maxRawY > 1800 ? 3600 : 1800);

      // INT-006: Normalize slot coordinates to percentage if in absolute pixels
      const slots = rawFrameSlots
        .sort((a, b) => a.slot_index - b.slot_index)
        .map((s) => {
          let x = Number(s.x_coord || 0);
          let y = Number(s.y_coord || 0);
          let w = Number(s.width || 0);
          let h = Number(s.height || 0);

          if (w > 100 || h > 100) {
            x = Math.round(((x / canvasW) * 100) * 100) / 100;
            y = Math.round(((y / sourcePixelH) * 100) * 100) / 100;
            w = Math.round(((w / canvasW) * 100) * 100) / 100;
            h = Math.round(((h / sourcePixelH) * 100) * 100) / 100;
          }

          // Enforce 0-100% boundary clamping
          x = Math.min(100, Math.max(0, x));
          y = Math.min(100, Math.max(0, y));
          w = Math.min(100, Math.max(1, w));
          h = Math.min(100, Math.max(1, h));

          return {
            id: s.id,
            frame_version_id: s.frame_version_id,
            slot_index: s.slot_index,
            x_coord: x,
            y_coord: y,
            width: w,
            height: h,
            rotation: Number(s.rotation || 0),
            fit_mode: s.fit_mode || 'cover',
            created_at: s.created_at,
          };
        });

      const downloadUrl = version?.asset_path
        ? (version.asset_path.startsWith('http') ? version.asset_path : `https://hxefecxvforrrbggmvmm.supabase.co/storage/v1/object/public/frames/${version.asset_path}`)
        : '';

      const cat = (dbCategories || []).find((c) => c.id === f.category_id);

      // INT-005: Ensure consistent lowercase path for frame asset syncing
      const normalizedRelativePath = `frames/${f.id}.png`;

      return {
        id: f.id,
        internal_code: f.internal_code || `FRM-${f.id.slice(0, 6)}`,
        name: f.name,
        category_id: f.category_id,
        category_slug: cat?.slug || 'classic',
        category_name: cat?.name || 'Classic',
        dimensions: '4R',
        aspect_ratio: f.aspect_ratio || (isLandscape ? '3:2' : '2:3'),
        canvas_width: canvasW,
        canvas_height: targetCanvasH,
        current_version_id: version?.id || 'v1',
        preview_url: downloadUrl,
        asset_path: normalizedRelativePath,
        overlay_url: normalizedRelativePath,
        checksum_sha256: version?.checksum_sha256 || '',
        is_archived: false,
        created_at: f.created_at || new Date().toISOString(),
        updated_at: f.updated_at || new Date().toISOString(),
        slots,
        asset_entry: {
          asset_type: 'FRAME_MASTER' as const,
          asset_id: f.id,
          version_number: version?.version_number || 1,
          download_url: downloadUrl,
          file_size_bytes: version?.file_size_bytes || 0,
          checksum_sha256: version?.checksum_sha256 || '',
          target_relative_path: normalizedRelativePath,
        },
      };
    });

    const assetsManifest = mappedFrames
      .filter((f) => Boolean(f.asset_entry?.download_url))
      .map((f) => f.asset_entry);

    const eventInfo = activeEvent
      ? {
          event_id: activeEvent.id,
          event_name: activeEvent.name,
          client_name: activeEvent.client_name,
          venue: activeEvent.venue,
          theme_color: activeEvent.custom_theme_color || '#D9E83F',
          welcome_greeting: activeEvent.welcome_greeting || `Selamat Datang di ${activeEvent.name}!`,
        }
      : {
          event_id: 'evt-standby',
          event_name: 'Popcut Photobooth (Standby)',
          client_name: 'Popcut Studio',
          venue: 'Standby / Booth Siaga',
          theme_color: '#D9E83F',
          welcome_greeting: 'Selamat Datang di Popcut Photobooth! Kiosk sedang dalam mode siaga.',
        };

    const response: BoothConfigDeliveryResponse & Record<string, any> = {
      success: true,
      schema_version: 1,
      config_version_id: activeEvent ? `cfg-${activeEvent.id.slice(0, 8)}` : 'cfg-standby',
      version_number: 'v2.4.2',
      booth_id: boothId,
      booth: {
        id: boothId,
        code: boothId,
      },
      published_at: new Date().toISOString(),
      event_id: eventInfo.event_id,
      event_name: eventInfo.event_name,
      location_label: eventInfo.venue,
      branding: {
        theme_primary_color: eventInfo.theme_color,
        theme_secondary_color: '#202020',
        welcome_headline: eventInfo.welcome_greeting,
        welcome_subheadline: 'Sentuh Layar untuk Memulai',
      },
      event_info: eventInfo,
      packages: eventPackages,
      additional_print_pricing: {
        price_per_unit: 15000,
        min_quantity: 1,
        quantity_increment: 1,
        max_quantity: 6,
      },
      frame_categories: dbCategories || [],
      frames: mappedFrames,
      promotions: mappedPromotions,
      kiosk_settings: {
        welcome_title: eventInfo.event_name,
        idle_timeout_seconds: 60,
        payment_timeout_seconds: 180,
        session_duration_minutes: 10,
        allow_retakes: true,
        max_retakes_per_pose: 2,
        enable_live_photo: true,
        event_name: eventInfo.event_name,
        event_venue: eventInfo.venue,
      },
      assets_manifest: assetsManifest,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error serving booth config:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Gagal memuat konfigurasi booth.',
        retryable: true,
      },
      { status: 500 }
    );
  }
}
