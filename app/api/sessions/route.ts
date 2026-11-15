import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ success: true, sessions: [] });
    }

    return NextResponse.json({
      success: true,
      sessions: data || [],
    });
  } catch (err: any) {
    console.error('Error in sessions route:', err);
    return NextResponse.json({ success: true, sessions: [] });
  }
}
