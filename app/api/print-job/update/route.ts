import { NextRequest, NextResponse } from 'next/server';
import { PrintJobStatusUpdatePayload } from '@/types/shared-contract';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const printJobId = body.print_job_id || body.id;
    const status = body.status;

    if (!printJobId || !status) {
      return NextResponse.json(
        {
          code: 'INVALID_PAYLOAD',
          message: 'print_job_id dan status wajib disertakan.',
          retryable: false,
          request_id: crypto.randomUUID(),
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    try {
      await supabase.from('print_jobs').update({
        status,
        completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', printJobId);
    } catch (dbErr) {
      console.warn('[Print Job Update] Database update notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      print_job_id: printJobId,
      status,
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Gagal memperbarui status antrean cetak.',
        retryable: true,
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
