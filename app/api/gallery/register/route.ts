import { NextRequest, NextResponse } from 'next/server';
import { DigitalGalleryRegisterPayload, DigitalGalleryRegisterResponse } from '@/types/shared-contract';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const payload: DigitalGalleryRegisterPayload = await req.json();

    if (!payload.session_id || !payload.booth_id) {
      return NextResponse.json(
        {
          code: 'INVALID_PAYLOAD',
          message: 'session_id dan booth_id wajib disertakan.',
          retryable: false,
          request_id: crypto.randomUUID(),
        },
        { status: 400 }
      );
    }

    const galleryId = `gal-${Date.now()}`;
    const token = payload.access_token || crypto.randomUUID().slice(0, 8);
    
    // Live Vercel Production Public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://popcut-admin-dashboard.vercel.app';
    const qrViewUrl = `${baseUrl}/gallery/${payload.session_id}?token=${token}`;

    const supabase = createAdminClient();

    // 1. Get real booth ID if UUID, or default first booth
    let dbBoothId = payload.booth_id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbBoothId)) {
      const { data: firstBooth } = await supabase.from('booths').select('id').limit(1).maybeSingle();
      if (firstBooth) dbBoothId = firstBooth.id;
    }

    // 2. Persist in digital_galleries table
    try {
      await supabase.from('digital_galleries').upsert(
        {
          session_id: payload.session_id,
          booth_id: dbBoothId,
          access_token_hash: token,
          qr_route: qrViewUrl,
          upload_status: 'AVAILABLE',
          file_count: 4,
          expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      );
    } catch (dbErr) {
      console.warn('[Gallery Register] Database record warning:', dbErr);
    }

    const response: DigitalGalleryRegisterResponse = {
      gallery_id: galleryId,
      qr_view_url: qrViewUrl,
      upload_target_urls: [
        {
          asset_type: 'RENDERED_STRIP',
          signed_upload_url: `${baseUrl}/api/storage/upload`,
          object_path: `events/current/booths/${payload.booth_id}/sessions/${payload.session_id}/final/photo-final.jpg`,
        },
        {
          asset_type: 'ORIGINAL',
          signed_upload_url: `${baseUrl}/api/storage/upload`,
          object_path: `events/current/booths/${payload.booth_id}/sessions/${payload.session_id}/originals/raw_photos.zip`,
        },
        {
          asset_type: 'LIVE_PHOTO_VIDEO',
          signed_upload_url: `${baseUrl}/api/storage/upload`,
          object_path: `events/current/booths/${payload.booth_id}/sessions/${payload.session_id}/thumbnails/preview.webp`,
        },
      ],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Gagal mendaftarkan galeri digital.',
        retryable: true,
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
