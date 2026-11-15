import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ success: true, transactions: [] });
    }

    return NextResponse.json({
      success: true,
      transactions: data || [],
    });
  } catch (err: any) {
    console.error('Error in transactions route:', err);
    return NextResponse.json({ success: true, transactions: [] });
  }
}
