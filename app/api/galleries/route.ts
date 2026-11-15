import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const sessionId = req.nextUrl.searchParams.get('sessionId') || req.nextUrl.searchParams.get('id');

    // 1. Single Gallery Query for public customer view
    if (sessionId) {
      const { data: galleryRow } = await supabase
        .from('digital_galleries')
        .select('*, sessions(session_number, events(name, event_date))')
        .eq('session_id', sessionId)
        .maybeSingle();

      const eventName = galleryRow?.sessions?.events?.name || 'Popcut Wedding — The Ritz-Carlton';
      const eventDate = galleryRow?.sessions?.events?.event_date || '15 November 2026';

      return NextResponse.json({
        success: true,
        gallery: {
          id: galleryRow?.id || `gal-${sessionId.slice(0, 8)}`,
          session_id: sessionId,
          event_name: eventName,
          event_date: eventDate,
          photostrip_url: `/samples/photostrip-sample.jpg`,
          photos: [
            { id: '1', pose_number: 1, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop' },
            { id: '2', pose_number: 2, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop' },
            { id: '3', pose_number: 3, url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop' },
            { id: '4', pose_number: 4, url: 'https://images.unsplash.com/photo-1519225424988-51000632d43e?w=800&auto=format&fit=crop' },
          ],
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
    return NextResponse.json({ success: true, galleries: [] });
  }
}
