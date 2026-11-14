import { NextRequest, NextResponse } from 'next/server';
import { CustomerSessionCreatePayload, CustomerSessionCreateResponse } from '@/types/shared-contract';
import { initialPackages } from '@/lib/data/mock-data';

export async function POST(req: NextRequest) {
  try {
    const payload: CustomerSessionCreatePayload = await req.json();

    if (!payload.idempotency_key || !payload.booth_id || !payload.package_id) {
      return NextResponse.json(
        {
          code: 'INVALID_REQUEST',
          message: 'Parameter pembuatan sesi tidak lengkap.',
          retryable: false,
          request_id: crypto.randomUUID(),
        },
        { status: 400 }
      );
    }

    const selectedPkg = initialPackages.find((p) => p.id === payload.package_id) || initialPackages[0];
    const sessionNum = `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const trxNum = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const response: CustomerSessionCreateResponse = {
      session_id: crypto.randomUUID(),
      session_number: sessionNum,
      transaction_id: crypto.randomUUID(),
      transaction_number: trxNum,
      payable_amount: selectedPkg.price,
      payment_status: payload.payment_method === 'VOUCHER_100' || payload.payment_method === 'PREPAID_TICKET' ? 'PAID' : 'PENDING',
      qris_payload: payload.payment_method === 'QRIS' ? '00020101021226580016ID.CO.SHOPEE.WWW01189360091800000000005204599953033605802ID' : undefined,
      qris_expires_at: new Date(Date.now() + 180 * 1000).toISOString(),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'Gagal membuat sesi baru di booth.',
        retryable: true,
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
