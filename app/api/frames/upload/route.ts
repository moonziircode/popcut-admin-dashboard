import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = (formData.get('name') as string)?.trim() || 'Untitled Frame';
    const dimensions = (formData.get('dimensions') as string) || '2x6';
    const categorySlug = (formData.get('category') as string) || 'classic';

    // 1. Validation: File existence
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File PNG frame wajib disertakan.' },
        { status: 400 }
      );
    }

    // 2. Validation: File size (max 25 MB)
    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file melebihi batas maksimum 25 MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Validation: PNG Magic Bytes (89 50 4E 47 0D 0A 1A 0A)
    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    if (!isPng) {
      return NextResponse.json(
        { success: false, error: 'File bukan format PNG valid. Harap unggah file PNG dengan transparansi.' },
        { status: 400 }
      );
    }

    // 4. Extract Width, Height & Alpha Channel from IHDR chunk
    let imgWidth = 1200;
    let imgHeight = 1800;
    let hasAlpha = true;

    if (buffer.length >= 26) {
      try {
        imgWidth = buffer.readUInt32BE(16);
        imgHeight = buffer.readUInt32BE(20);
        const colorType = buffer[25];
        // Color type 4 (Grayscale + Alpha) or 6 (RGBA) contains alpha channel
        hasAlpha = colorType === 4 || colorType === 6;
      } catch (e) {
        console.warn('Could not parse PNG IHDR header:', e);
      }
    }

    // 4b. STRICT 4R STANDARD VALIDATION (2:3 Portrait or 3:2 Landscape)
    const ratio = imgWidth / imgHeight;
    const isPortrait4R = Math.abs(ratio - 2 / 3) <= 0.04; // e.g. 1200x1800 (0.667)
    const isLandscape4R = Math.abs(ratio - 1.5) <= 0.04;  // e.g. 1800x1200 (1.500)

    if (!isPortrait4R && !isLandscape4R) {
      return NextResponse.json(
        {
          success: false,
          error: `File tidak sesuai dengan standar rasio 4R (2:3 Portrait atau 3:2 Landscape). Dimensi file terdeteksi: ${imgWidth} × ${imgHeight} px (rasio ${ratio.toFixed(2)}). Sistem hanya menerima desain berukuran 4R (contoh: 1200 × 1800 px atau 1800 × 1200 px pada 300 DPI).`,
        },
        { status: 400 }
      );
    }

    const frameDimensions = '4x6';
    const aspectRatio = isLandscape4R ? '3:2' : '2:3';

    // 5. Checksum SHA-256
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const supabase = createAdminClient();

    // 6. Get or verify category
    let categoryId: string | null = null;
    const { data: categoryData } = await supabase
      .from('frame_categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();

    if (categoryData?.id) {
      categoryId = categoryData.id;
    } else {
      const { data: firstCat } = await supabase
        .from('frame_categories')
        .select('id')
        .limit(1)
        .maybeSingle();
      categoryId = firstCat?.id || null;
    }

    if (!categoryId) {
      const { data: newCat } = await supabase
        .from('frame_categories')
        .insert({ name: 'Classic Photostrip', slug: 'classic', description: 'Format strip 2x6 klasik' })
        .select('id')
        .single();
      categoryId = newCat?.id || null;
    }

    // 7. Generate IDs and File Path
    const frameId = crypto.randomUUID();
    const versionId = crypto.randomUUID();
    const internalCode = `FRM-${Date.now().toString().slice(-6)}`;
    const storagePath = `${frameId}/v1-${Date.now()}.png`;

    // 8. Upload to Supabase Storage bucket 'frames'
    const { error: storageError } = await supabase.storage
      .from('frames')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (storageError) {
      console.error('Supabase Storage upload error:', storageError);
      return NextResponse.json(
        { success: false, error: `Gagal mengunggah file ke Storage: ${storageError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage.from('frames').getPublicUrl(storagePath);
    const assetUrl = publicUrlData?.publicUrl;

    // 9. Insert Frame into database (Strict 4R standard)
    const { data: frameRecord, error: frameError } = await supabase
      .from('frames')
      .insert({
        id: frameId,
        internal_code: internalCode,
        name,
        category_id: categoryId,
        dimensions: frameDimensions,
        aspect_ratio: aspectRatio,
        current_version_id: versionId,
        is_archived: false,
      })
      .select()
      .single();

    if (frameError) {
      console.error('DB Insert Frame error:', frameError);
      return NextResponse.json(
        { success: false, error: `Gagal menyimpan metadata frame: ${frameError.message}` },
        { status: 500 }
      );
    }

    // 10. Insert Frame Version
    const { data: versionRecord, error: versionError } = await supabase
      .from('frame_versions')
      .insert({
        id: versionId,
        frame_id: frameId,
        version_number: 1,
        asset_path: storagePath,
        thumbnail_path: storagePath,
        checksum_sha256: sha256,
        file_size_bytes: file.size,
        dimensions: {
          width: imgWidth,
          height: imgHeight,
          dpi: 300,
        },
        status: 'DRAFT',
      })
      .select()
      .single();

    if (versionError) {
      console.error('DB Insert Frame Version error:', versionError);
      return NextResponse.json(
        { success: false, error: `Gagal menyimpan versi frame: ${versionError.message}` },
        { status: 500 }
      );
    }

    // 11. Create initial 4R photo slots (2-Slot default with 50:50 divider config)
    const defaultSlots = isLandscape4R
      ? [
          {
            slot_index: 1,
            x_coord: 6,
            y_coord: 8,
            width: 41,
            height: 84,
            crop_config: { divider_ratio: 0.5, layout_type: '2_slot_horizontal' },
          },
          {
            slot_index: 2,
            x_coord: 53,
            y_coord: 8,
            width: 41,
            height: 84,
            crop_config: { divider_ratio: 0.5, layout_type: '2_slot_horizontal' },
          },
        ]
      : [
          {
            slot_index: 1,
            x_coord: 8,
            y_coord: 6,
            width: 84,
            height: 41,
            crop_config: { divider_ratio: 0.5, layout_type: '2_slot_vertical' },
          },
          {
            slot_index: 2,
            x_coord: 8,
            y_coord: 53,
            width: 84,
            height: 41,
            crop_config: { divider_ratio: 0.5, layout_type: '2_slot_vertical' },
          },
        ];

    const slotInserts = defaultSlots.map((s) => ({
      frame_version_id: versionId,
      slot_index: s.slot_index,
      x_coord: s.x_coord,
      y_coord: s.y_coord,
      width: s.width,
      height: s.height,
      rotation: 0,
      fit_mode: 'cover',
      crop_config: s.crop_config,
    }));

    await supabase.from('frame_slots').insert(slotInserts);

    // 12. Audit log
    try {
      await supabase.from('activity_logs').insert({
        action: 'FRAME_CREATE',
        entity_type: 'FRAME',
        entity_id: frameId,
        description: `Frame baru "${name}" berhasil diunggah (${imgWidth}x${imgHeight})`,
      });
    } catch (logErr) {
      console.warn('[Frame Upload] Activity log warning:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Frame PNG berhasil diunggah dan didaftarkan.',
      frame: frameRecord,
      version: versionRecord,
      asset_url: assetUrl,
      dimensions: {
        width: imgWidth,
        height: imgHeight,
        dpi: 300,
        has_alpha: hasAlpha,
      },
    });
  } catch (err: any) {
    console.error('Fatal error during frame upload:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan sistem saat mengunggah frame.' },
      { status: 500 }
    );
  }
}
