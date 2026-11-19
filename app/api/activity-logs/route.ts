import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[API ActivityLogs] Database query error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (err: any) {
    console.error('[API ActivityLogs] Exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
