import { NextRequest, NextResponse } from 'next/server';
import { initialPackages, initialFrames, initialEvents } from '@/lib/data/mock-data';
import { BoothConfigDeliveryResponse } from '@/types/shared-contract';

export async function GET(req: NextRequest) {
  const boothId = req.nextUrl.searchParams.get('booth_id');

  if (!boothId) {
    return NextResponse.json(
      {
        code: 'MISSING_BOOTH_ID',
        message: 'Parameter booth_id wajib disertakan.',
        retryable: false,
        request_id: crypto.randomUUID(),
      },
      { status: 400 }
    );
  }

  // Retrieve active event
  const activeEvent = initialEvents.find((e) => e.is_active) || initialEvents[0];

  // Filter packages and frames for active event
  const eventPackages = initialPackages.filter(
    (p) => p.is_active && !p.is_archived && (!activeEvent.allowed_package_ids.length || activeEvent.allowed_package_ids.includes(p.id))
  );

  const eventFrames = initialFrames.filter(
    (f) => !f.is_archived && (!activeEvent.allowed_frame_ids.length || activeEvent.allowed_frame_ids.includes(f.id))
  );

  const response: BoothConfigDeliveryResponse = {
    schema_version: 1,
    config_version_id: 'cfg-v2.4.1',
    version_number: 'v2.4.1',
    booth_id: boothId,
    published_at: new Date().toISOString(),
    event_info: {
      event_id: activeEvent.id,
      event_name: activeEvent.name,
      client_name: activeEvent.client_name,
      venue: activeEvent.venue,
      theme_color: activeEvent.custom_theme_color,
      welcome_greeting: activeEvent.welcome_greeting,
    },
    packages: eventPackages.length > 0 ? eventPackages : initialPackages.filter((p) => p.is_active),
    additional_print_pricing: {
      price_per_unit: 15000,
      min_quantity: 1,
      quantity_increment: 1,
      max_quantity: 6,
    },
    frames: (eventFrames.length > 0 ? eventFrames : initialFrames).map((f) => ({
      ...f,
      slots: [
        {
          id: `slot-1-${f.id}`,
          frame_version_id: f.current_version_id || 'fv-001',
          slot_index: 1,
          x_coord: 10,
          y_coord: 8,
          width: 80,
          height: 24,
          rotation: 0,
          fit_mode: 'cover',
          created_at: new Date().toISOString(),
        },
      ],
      asset_entry: {
        asset_type: 'FRAME_MASTER',
        asset_id: f.id,
        version_number: 1,
        download_url: `https://storage.popcut.id/frame-assets/${f.id}/v1/frame.png`,
        file_size_bytes: 4821000,
        checksum_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        target_relative_path: `frames/${f.id}.png`,
      },
    })),
    promotions: [],
    kiosk_settings: {
      welcome_title: activeEvent.name,
      idle_timeout_seconds: 60,
      payment_timeout_seconds: 180,
      session_duration_minutes: 10,
      allow_retakes: true,
      max_retakes_per_pose: 2,
      enable_live_photo: true,
      event_name: activeEvent.name,
      event_venue: activeEvent.venue,
    },
    assets_manifest: (eventFrames.length > 0 ? eventFrames : initialFrames).map((f) => ({
      asset_type: 'FRAME_MASTER',
      asset_id: f.id,
      version_number: 1,
      download_url: `https://storage.popcut.id/frame-assets/${f.id}/v1/frame.png`,
      file_size_bytes: 4821000,
      checksum_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      target_relative_path: `frames/${f.id}.png`,
    })),
  };

  return NextResponse.json(response);
}
