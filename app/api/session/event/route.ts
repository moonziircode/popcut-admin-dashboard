import { NextRequest, NextResponse } from 'next/server';
import { SessionTimelineUpdatePayload } from '@/types/shared-contract';

export async function POST(req: NextRequest) {
  try {
    const payload: SessionTimelineUpdatePayload = await req.json();

    if (!payload.session_id || !payload.event_type) {
      return NextResponse.json(
        {
          code: 'INVALID_PAYLOAD',
          message: 'session_id dan event_type wajib disertakan.',
          retryable: false,
          request_id: crypto.randomUUID(),
        },
        { status: 400 }
      );
    }

    // In Supabase production:
    // await supabase.from('session_events').insert({
    //   session_id: payload.session_id,
    //   event_type: payload.event_type,
    //   payload: payload.payload || {},
    //   occurred_at: payload.occurred_at || new Date().toISOString(),
    // });

    return NextResponse.json({
      success: true,
      session_id: payload.session_id,
      event_type: payload.event_type,
      received_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Gagal merekam session timeline event.',
        retryable: true,
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
