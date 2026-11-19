import { NextRequest, NextResponse } from 'next/server';
import { r2Storage, CloudflareR2StorageAdapter } from '@/lib/storage/r2-storage-adapter';
import { createAdminClient } from '@/lib/supabase/admin';

// Maximum allowed payload size: 15MB
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Magic byte validator
function isValidImage(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return true;

  // PNG: 89 50 4E 47 (0x89 'PNG')
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  if (isPng) return true;

  // WebP: RIFF ... WEBP
  const isWebp =
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 && // 'RIFF'
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50; // 'WEBP'
  if (isWebp) return true;

  // SVG text checks
  if (mimeType.includes('svg')) {
    const textSample = buffer.slice(0, 100).toString('utf8');
    if (textSample.includes('<svg') || textSample.includes('<?xml')) {
      return true;
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type harus berupa multipart/form-data.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sessionId = (formData.get('session_id') as string) || 'SESS-GEN';
    const eventId = (formData.get('event_id') as string) || 'EVT-GEN';
    const boothId = formData.get('booth_id') as string | null;
    const fileType = (formData.get('file_type') as string) || 'FINAL_PHOTO';
    const customKey = formData.get('object_key') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File binary wajib disertakan dalam request.' },
        { status: 400 }
      );
    }

    // 1. File Size Validation (Limit to 15MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Ukuran file melampaui batas maksimal (15MB). Terdeteksi: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';

    // 2. Binary Magic Bytes Validation
    if (!isValidImage(buffer, mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format file tidak valid. Hanya file gambar (JPEG, PNG, WebP, SVG) yang diperbolehkan.',
        },
        { status: 400 }
      );
    }

    // 3. Path Traversal & Object Key Sanitization
    if (customKey) {
      if (
        customKey.includes('..') ||
        customKey.startsWith('/') ||
        customKey.startsWith('\\') ||
        !/^[a-zA-Z0-9_\-\./]+$/.test(customKey)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Path traversal terdeteksi pada object_key. Pengunggahan ditolak.',
          },
          { status: 400 }
        );
      }
    }

    // 4. Booth ID Validation against Database
    const supabase = createAdminClient();
    if (boothId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boothId);
      const query = supabase.from('booths').select('id, booth_code, status').eq('is_active', true);
      const { data: boothData } = isUuid
        ? await query.eq('id', boothId).maybeSingle()
        : await query.eq('booth_code', boothId).maybeSingle();

      if (!boothData) {
        return NextResponse.json(
          {
            success: false,
            error: `Booth ID '${boothId}' tidak terdaftar atau tidak aktif di sistem.`,
          },
          { status: 403 }
        );
      }
    }

    // Standardized Object Key Hierarchy:
    // events/EVT-.../booths/BOOTH-.../sessions/SESS-.../final/photo-final.jpg
    let objectKey = customKey;
    if (!objectKey) {
      const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const safeBoothId = boothId || 'BOOTH-DEFAULT';
      if (fileType === 'FINAL_PHOTO') {
        objectKey = `events/${eventId}/booths/${safeBoothId}/sessions/${sessionId}/final/photo-final.${ext}`;
      } else if (fileType === 'THUMBNAIL') {
        objectKey = `events/${eventId}/booths/${safeBoothId}/sessions/${sessionId}/thumbnails/preview.webp`;
      } else {
        const pose = formData.get('pose_index') || '1';
        objectKey = `events/${eventId}/booths/${safeBoothId}/sessions/${sessionId}/originals/pose-${pose}.${ext}`;
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
      public_url: result.url,
      object_key: result.objectKey,
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
