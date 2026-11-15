import { NextRequest, NextResponse } from 'next/server';
import { PrintJobStatusUpdatePayload } from '@/types/shared-contract';

export async function POST(req: NextRequest) {
  try {
    const payload: PrintJobStatusUpdatePayload = await req.json();

    if (!payload.print_job_id || !payload.status) {
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

    // In Supabase production:
    // await supabase.from('print_jobs').update({
    //   status: payload.status,
    //   error_code: payload.error_code || null,
    //   error_message: payload.error_message || null,
    //   completed_at: payload.status === 'COMPLETED' ? (payload.completed_at || new Date().toISOString()) : null,
    //   updated_at: new Date().toISOString(),
    // }).eq('id', payload.print_job_id);

    return NextResponse.json({
      success: true,
      print_job_id: payload.print_job_id,
      status: payload.status,
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
