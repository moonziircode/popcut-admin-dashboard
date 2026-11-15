import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*, booths(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching print_jobs:', error);
      return NextResponse.json({ success: true, print_jobs: [] });
    }

    const print_jobs = (data || []).map((row: any) => ({
      ...row,
      booth: row.booths || { name: 'Mobile Rig #1' },
      submitted_at: row.submitted_at || row.created_at,
    }));

    return NextResponse.json({
      success: true,
      print_jobs,
    });
  } catch (err: any) {
    console.error('Error in print_jobs route:', err);
    return NextResponse.json({ success: true, print_jobs: [] });
  }
}
