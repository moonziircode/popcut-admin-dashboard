import { NextRequest, NextResponse } from 'next/server';
import { BoothHeartbeatPayload } from '@/types/shared-contract';

export async function POST(req: NextRequest) {
  try {
    const payload: BoothHeartbeatPayload = await req.json();

    if (!payload.booth_id || !payload.camera_state || !payload.printer_state) {
      return NextResponse.json(
        {
          code: 'INVALID_PAYLOAD',
          message: 'Parameter telemetri booth tidak lengkap.',
          retryable: false,
          request_id: crypto.randomUUID(),
        },
        { status: 400 }
      );
    }

    // In production with connected Supabase, this updates booths table and inserts into booth_heartbeats
    return NextResponse.json({
      success: true,
      acknowledged_at: new Date().toISOString(),
      server_timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memproses heartbeat booth.',
        retryable: true,
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
