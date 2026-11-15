import { NextRequest, NextResponse } from 'next/server';
import { BoothAckConfigPayload } from '@/types/shared-contract';

export async function POST(req: NextRequest) {
  try {
    const payload: BoothAckConfigPayload = await req.json();

    if (!payload.booth_id || !payload.config_version_id || !payload.status) {
      return NextResponse.json(
        {
          code: 'INVALID_PAYLOAD',
          message: 'Parameter booth_id, config_version_id, dan status wajib disertakan.',
          retryable: false,
          request_id: crypto.randomUUID(),
        },
        { status: 400 }
      );
    }

    // In production with Supabase:
    // await supabase.from('booth_config_versions').update({ status: payload.status, applied_at: payload.applied_at }).match({ booth_id: payload.booth_id, config_version_id: payload.config_version_id });

    return NextResponse.json({
      success: true,
      acknowledged_at: new Date().toISOString(),
      booth_id: payload.booth_id,
      config_version_id: payload.config_version_id,
      status: payload.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Gagal memproses konfirmasi versi booth.',
        retryable: true,
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
