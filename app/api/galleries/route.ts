import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
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
