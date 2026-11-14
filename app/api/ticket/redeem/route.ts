import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { ticket_code } = await req.json();

    if (!ticket_code) {
      return NextResponse.json(
        { code: 'MISSING_TICKET', message: 'Kode tiket prabayar wajib diisi.', retryable: false },
        { status: 400 }
      );
    }

    // In production, this invokes the atomic RPC `redeem_ticket_atomic` in Supabase
    return NextResponse.json({
      success: true,
      ticket_code: ticket_code.toUpperCase(),
      package_id: 'pkg-001',
      package_name: 'Regular Duo',
      redeemed_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ code: 'SERVER_ERROR', message: 'Gagal memproses klaim tiket.' }, { status: 500 });
  }
}
