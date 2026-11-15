import { NextRequest, NextResponse } from 'next/server';
import { r2Storage, CloudflareR2StorageAdapter } from '@/lib/storage/r2-storage-adapter';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sessionId = (formData.get('session_id') as string) || 'SESS-GEN';
    const eventId = (formData.get('event_id') as string) || 'EVT-GEN';
    const boothId = (formData.get('booth_id') as string) || 'BOOTH-01';
    const fileType = (formData.get('file_type') as string) || 'FINAL_PHOTO';
    const customKey = formData.get('object_key') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File binary wajib disertakan dalam request.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';

    // Standardized Object Key Hierarchy:
    // events/EVT-.../booths/BOOTH-.../sessions/SESS-.../final/photo-final.jpg
    let objectKey = customKey;
    if (!objectKey) {
      const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      if (fileType === 'FINAL_PHOTO') {
        objectKey = `events/${eventId}/booths/${boothId}/sessions/${sessionId}/final/photo-final.${ext}`;
      } else if (fileType === 'THUMBNAIL') {
        objectKey = `events/${eventId}/booths/${boothId}/sessions/${sessionId}/thumbnails/preview.webp`;
      } else {
        const pose = formData.get('pose_index') || '1';
        objectKey = `events/${eventId}/booths/${boothId}/sessions/${sessionId}/originals/pose-${pose}.${ext}`;
      }
    }

    // Upload to R2 / Storage
    const result = await r2Storage.uploadObject(
      CloudflareR2StorageAdapter.BUCKET_MEDIA,
      objectKey,
      buffer,
      mimeType
    );

    // Update digital_galleries record in Supabase
    const supabase = createAdminClient();
    try {
      await supabase
        .from('digital_galleries')
        .update({
          upload_status: 'AVAILABLE',
          available_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
    } catch (gErr) {
      console.warn('[Storage Upload API] Gallery status update warning:', gErr);
    }

    return NextResponse.json({
      success: true,
      message: 'File berhasil diunggah ke storage.',
      storage: {
        provider: result.provider,
        bucket: result.bucket,
        object_key: result.objectKey,
        file_size_bytes: result.fileSizeBytes,
        mime_type: result.mimeType,
        checksum_sha256: result.checksumSha256,
        url: result.url,
      },
    });
  } catch (err: any) {
    console.error('[Storage Upload API] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengunggah file ke storage' },
      { status: 500 }
    );
  }
}
