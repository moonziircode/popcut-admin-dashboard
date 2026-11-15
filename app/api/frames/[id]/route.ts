import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // 1. Fetch frame
    const { data: frame, error: frameError } = await supabase
      .from('frames')
      .select(`
        *,
        frame_categories (id, name, slug)
      `)
      .eq('id', id)
      .single();

    if (frameError || !frame) {
      return NextResponse.json(
        { success: false, error: 'Frame tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. Fetch current version or latest version
    const { data: versions, error: versionError } = await supabase
      .from('frame_versions')
      .select('*')
      .eq('frame_id', id)
      .order('version_number', { ascending: false });

    const currentVersion =
      versions?.find((v) => v.id === frame.current_version_id) || versions?.[0];

    let assetUrl: string | null = null;
    if (currentVersion?.asset_path) {
      const { data: publicUrlData } = supabase.storage
        .from('frames')
        .getPublicUrl(currentVersion.asset_path);
      assetUrl = publicUrlData?.publicUrl || null;
    }

    // 3. Fetch slots for this version
    let slots: any[] = [];
    if (currentVersion?.id) {
      const { data: slotData } = await supabase
        .from('frame_slots')
        .select('*')
        .eq('frame_version_id', currentVersion.id)
        .order('slot_index', { ascending: true });
      slots = slotData || [];
    }

    return NextResponse.json({
      success: true,
      frame,
      version: currentVersion,
      asset_url: assetUrl,
      slots,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { slots, status, name } = body;
    const supabase = createAdminClient();

    // Fetch frame to get current version
    const { data: frame } = await supabase
      .from('frames')
      .select('current_version_id, name')
      .eq('id', id)
      .single();

    if (!frame?.current_version_id) {
      return NextResponse.json(
        { success: false, error: 'Versi frame tidak ditemukan.' },
        { status: 404 }
      );
    }

    const versionId = frame.current_version_id;

    // Optional name update
    if (name) {
      await supabase.from('frames').update({ name, updated_at: new Date().toISOString() }).eq('id', id);
    }

    // Update status if requested (e.g. PUBLISHED)
    if (status) {
      await supabase
        .from('frame_versions')
        .update({
          status,
          published_at: status === 'PUBLISHED' ? new Date().toISOString() : null,
        })
        .eq('id', versionId);
    }

    // Update slots if provided
    if (Array.isArray(slots) && slots.length > 0) {
      // Delete existing slots and re-insert
      await supabase.from('frame_slots').delete().eq('frame_version_id', versionId);

      const slotInserts = slots.map((s: any, idx: number) => ({
        frame_version_id: versionId,
        slot_index: s.slot_index || idx + 1,
        x_coord: s.x_coord,
        y_coord: s.y_coord,
        width: s.width,
        height: s.height,
        rotation: s.rotation || 0,
        fit_mode: s.fit_mode || 'cover',
        crop_config: s.crop_config || {},
      }));

      const { error: insertSlotErr } = await supabase.from('frame_slots').insert(slotInserts);
      if (insertSlotErr) {
        throw insertSlotErr;
      }
    }

    // Log activity
    try {
      await supabase.from('activity_logs').insert({
        action: status === 'PUBLISHED' ? 'FRAME_PUBLISH' : 'FRAME_UPDATE',
        entity_type: 'FRAME',
        entity_id: id,
        description: `Frame ${name || id} diperbarui (${slots?.length || 0} slots)`,
      });
    } catch (logErr) {
      console.warn('[Frame Update] Activity log warning:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Perubahan frame berhasil disimpan.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // 1. Fetch frame
    const { data: frame, error: frameError } = await supabase
      .from('frames')
      .select('id, name, current_version_id')
      .eq('id', id)
      .maybeSingle();

    if (frameError || !frame) {
      return NextResponse.json(
        { success: false, error: 'Frame tidak ditemukan atau sudah dihapus.' },
        { status: 404 }
      );
    }

    // 2. Fetch all versions belonging to this frame
    const { data: versions } = await supabase
      .from('frame_versions')
      .select('id, asset_path, thumbnail_path')
      .eq('frame_id', id);

    const versionIds = (versions || []).map((v) => v.id);

    // 3. Delete physical assets from Supabase Storage bucket 'frames'
    const storagePaths: string[] = [];
    (versions || []).forEach((v) => {
      if (v.asset_path) storagePaths.push(v.asset_path);
      if (v.thumbnail_path) storagePaths.push(v.thumbnail_path);
    });

    if (storagePaths.length > 0) {
      try {
        await supabase.storage.from('frames').remove(storagePaths);
      } catch (storageErr) {
        console.warn('[Frame Delete] Storage removal warning:', storageErr);
      }
    }

    // 4. Break circular FK: update frames.current_version_id to null
    await supabase.from('frames').update({ current_version_id: null }).eq('id', id);

    // 5. Delete frame_slots for all versions of this frame
    if (versionIds.length > 0) {
      // If any sessions reference frame_version_id, decouple them safely
      try {
        await supabase
          .from('sessions')
          .update({ frame_version_id: null })
          .in('frame_version_id', versionIds);
      } catch (sErr) {
        console.warn('[Frame Delete] Sessions decouple warning:', sErr);
      }

      const { error: slotErr } = await supabase
        .from('frame_slots')
        .delete()
        .in('frame_version_id', versionIds);

      if (slotErr) {
        console.warn('[Frame Delete] Slot delete warning:', slotErr);
      }

      // 6. Delete frame_versions
      const { error: vErr } = await supabase
        .from('frame_versions')
        .delete()
        .eq('frame_id', id);

      if (vErr) {
        console.warn('[Frame Delete] Version delete warning:', vErr);
      }
    }

    // 7. Delete frame record itself permanently
    const { error: deleteFrameErr } = await supabase
      .from('frames')
      .delete()
      .eq('id', id);

    if (deleteFrameErr) {
      throw deleteFrameErr;
    }

    // 8. Clean up active events allowed_frame_ids array
    try {
      const { data: eventsWithFrame } = await supabase
        .from('events')
        .select('id, allowed_frame_ids');

      if (eventsWithFrame && eventsWithFrame.length > 0) {
        for (const ev of eventsWithFrame) {
          if (Array.isArray(ev.allowed_frame_ids) && ev.allowed_frame_ids.includes(id)) {
            const updatedAllowed = ev.allowed_frame_ids.filter((fid: string) => fid !== id);
            await supabase
              .from('events')
              .update({ allowed_frame_ids: updatedAllowed })
              .eq('id', ev.id);
          }
        }
      }
    } catch (evErr) {
      console.warn('[Frame Delete] Event allowed_frame_ids cleanup warning:', evErr);
    }

    // 9. Log activity
    try {
      await supabase.from('activity_logs').insert({
        action: 'FRAME_DELETE',
        entity_type: 'frames',
        entity_id: id,
        description: `Frame "${frame.name}" berhasil dihapus secara permanen dari database dan storage.`,
        before_state: { frame_name: frame.name, deleted_at: new Date().toISOString() },
      });
    } catch (logErr) {
      console.warn('[Frame Delete] Activity log warning:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: `Frame "${frame.name}" berhasil dihapus secara permanen dari database dan storage.`,
      deleted_id: id,
    });
  } catch (err: any) {
    console.error('Error deleting frame:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus frame dari database.' },
      { status: 500 }
    );
  }
}
