import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const sessionId = req.nextUrl.searchParams.get('sessionId') || req.nextUrl.searchParams.get('id');

    // 1. Single Gallery Query for public customer view
    if (sessionId) {
      // Robust query: avoid invalid nested join sessions.events
      const { data: galleryRow } = await supabase
        .from('digital_galleries')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      // Retrieve session details
      const { data: sessionRow } = await supabase
        .from('sessions')
        .select('id, session_number, event_id')
        .eq('id', sessionId)
        .maybeSingle();

      // Retrieve event details if event_id is present
      let eventName = 'Popcut Photobooth Studio';
      let eventDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      if (sessionRow?.event_id) {
        const { data: eventRow } = await supabase
          .from('events')
          .select('name, start_date')
          .eq('id', sessionRow.event_id)
          .maybeSingle();

        if (eventRow) {
          eventName = eventRow.name;
          eventDate = eventRow.start_date
            ? new Date(eventRow.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : eventDate;
        }
      }

      // Retrieve gallery assets
      let assets: any[] = [];
      if (galleryRow?.id) {
        const { data: dbAssets } = await supabase
          .from('gallery_assets')
          .select('*')
          .eq('gallery_id', galleryRow.id)
          .order('pose_number', { ascending: true });
        assets = dbAssets || [];
      }

      // Also check photos table if gallery_assets is empty
      if (assets.length === 0) {
        const { data: dbPhotos } = await supabase
          .from('photos')
          .select('*')
          .eq('session_id', sessionId)
          .order('pose_number', { ascending: true });

        if (dbPhotos && dbPhotos.length > 0) {
          assets = dbPhotos.map((p) => ({
            id: p.id,
            pose_number: p.pose_number,
            asset_type: 'ORIGINAL_PHOTO',
            asset_url: p.watermarked_photo_url || p.raw_photo_url || '',
          }));
        }
      }

      const stripAsset = assets.find((a) => a.asset_type === 'PHOTOSTRIP');
      const photoItems = assets
        .filter((a) => a.asset_type !== 'PHOTOSTRIP')
        .map((a, idx) => ({
          id: a.id || String(idx + 1),
          pose_number: a.pose_number || idx + 1,
          url: a.asset_url || a.url || '',
        }));

      return NextResponse.json({
        success: true,
        gallery: {
          id: galleryRow?.id || `gal-${sessionId.slice(0, 8)}`,
          session_id: sessionId,
          session_number: sessionRow?.session_number || sessionId.slice(0, 8),
          event_name: eventName,
          event_date: eventDate,
          photostrip_url: stripAsset?.asset_url || `/samples/photostrip-sample.jpg`,
          photos: photoItems,
          qr_route: galleryRow?.qr_route || `https://popcut.id/gallery/${sessionId}`,
          upload_status: galleryRow?.upload_status || 'AVAILABLE',
          expires_at: galleryRow?.expires_at || new Date(Date.now() + 14 * 86400000).toISOString(),
        },
      });
    }

    // 2. Admin table list
    const { data, error } = await supabase
      .from('digital_galleries')
      .select('*, sessions(session_number), booths(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching digital_galleries:', error);
      return NextResponse.json({ success: true, galleries: [] });
    }

    const galleries = (data || []).map((row: any) => ({
      id: row.id,
      session_number: row.sessions?.session_number || row.session_id?.slice(0, 8) || 'SES-001',
      booth_name: row.booths?.name || 'Mobile Rig #1',
      qr_token: row.access_token_hash || 'token-default',
      file_count: row.file_count || 4,
      upload_status: row.upload_status || 'AVAILABLE',
      download_count: row.download_count || 0,
      available_at: row.created_at,
      expires_at: row.expires_at || new Date(Date.now() + 14 * 86400000).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      galleries,
    });
  } catch (err: any) {
    console.error('Error in galleries route:', err);
    return NextResponse.json({ success: false, error: err?.message, galleries: [] }, { status: 500 });
  }
}
