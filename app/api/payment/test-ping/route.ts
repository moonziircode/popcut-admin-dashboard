import { NextRequest, NextResponse } from 'next/server';
import { testMidtransPing } from '@/lib/services/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const isProduction = body.isProduction !== undefined ? Boolean(body.isProduction) : false;

    const result = await testMidtransPing(isProduction);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Gagal menguji koneksi Midtrans.',
      },
      { status: 500 }
    );
  }
}
