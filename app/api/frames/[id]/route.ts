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
    await supabase.from('activity_logs').insert({
      action_type: status === 'PUBLISHED' ? 'FRAME_PUBLISH' : 'FRAME_UPDATE',
      entity_name: 'frames',
      entity_id: id,
      details: { slots_count: slots?.length, status },
    });

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
