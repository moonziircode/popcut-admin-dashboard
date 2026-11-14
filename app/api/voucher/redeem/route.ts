import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json(
        { code: 'MISSING_CODE', message: 'Kode voucher wajib diisi.', retryable: false },
        { status: 400 }
      );
    }

    // In production, this invokes the atomic RPC `redeem_voucher_atomic` in Supabase
    if (code.toUpperCase() === 'VOUCH-FREE100-VAL') {
      return NextResponse.json({
        success: true,
        discount_amount: subtotal || 35000,
        discount_type: 'FREE_100',
        code: 'VOUCH-FREE100-VAL',
      });
    }

    if (code.toUpperCase() === 'POPCUT-SENOPATI10K') {
      return NextResponse.json({
        success: true,
        discount_amount: 10000,
        discount_type: 'FIXED_AMOUNT',
        code: 'POPCUT-SENOPATI10K',
      });
    }

    return NextResponse.json(
      { code: 'CODE_NOT_FOUND', message: 'Kode voucher tidak valid atau telah habis.', retryable: false },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json({ code: 'SERVER_ERROR', message: 'Gagal memproses voucher.' }, { status: 500 });
  }
}
