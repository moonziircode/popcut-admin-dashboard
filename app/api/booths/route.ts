import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data: booths, error } = await supabase
      .from('booths')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching booths from Supabase:', error);
      return NextResponse.json({ success: false, booths: [] });
    }

    return NextResponse.json({ success: true, booths: booths || [] });
  } catch (error: any) {
    console.error('Unexpected error fetching booths:', error);
    return NextResponse.json({ success: false, booths: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from('booths')
      .insert({
        booth_code: body.booth_code || `BOOTH-${Date.now().toString().slice(-4)}`,
        name: body.name,
        location: body.location || 'Mobile Unit',
        status: body.status || 'OFFLINE',
        camera_status: 'DISCONNECTED',
        printer_status: 'DISCONNECTED',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, booth: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
