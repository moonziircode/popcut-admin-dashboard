import { NextRequest, NextResponse } from 'next/server';
import { DigitalGalleryRegisterPayload, DigitalGalleryRegisterResponse } from '@/types/shared-contract';

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
    const qrViewUrl = `https://gallery.popcut.id/view/${payload.session_id}?token=${token}`;

    const response: DigitalGalleryRegisterResponse = {
      gallery_id: galleryId,
      qr_view_url: qrViewUrl,
      upload_target_urls: [
        {
          asset_type: 'RENDERED_STRIP',
          signed_upload_url: `https://storage.popcut.id/upload/galleries/${payload.session_id}/rendered_strip.jpg`,
          object_path: `galleries/${payload.session_id}/rendered_strip.jpg`,
        },
        {
          asset_type: 'ORIGINAL',
          signed_upload_url: `https://storage.popcut.id/upload/galleries/${payload.session_id}/raw_photos.zip`,
          object_path: `galleries/${payload.session_id}/raw_photos.zip`,
        },
        {
          asset_type: 'LIVE_PHOTO_VIDEO',
          signed_upload_url: `https://storage.popcut.id/upload/galleries/${payload.session_id}/live_clip.mp4`,
          object_path: `galleries/${payload.session_id}/live_clip.mp4`,
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
