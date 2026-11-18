import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get('transaction_id') || req.nextUrl.searchParams.get('id');

  if (!transactionId || transactionId.trim() === '') {
    return NextResponse.json(
      {
        success: false,
        code: 'BAD_REQUEST',
        message: 'Parameter transaction_id wajib disertakan.',
      },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Support both UUID and transaction_number string (e.g., TRX-20261118-1234)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId.trim());
    
    let query = supabase.from('transactions').select('*');
    if (isUuid) {
      query = query.eq('id', transactionId.trim());
    } else {
      query = query.eq('transaction_number', transactionId.trim());
    }

    const { data: trx, error } = await query.maybeSingle();

    if (error) {
      console.error('[PaymentVerify Query Error]', error);
      return NextResponse.json({
        success: true,
        payment_status: 'PENDING',
        message: 'Sedang memeriksa status transaksi.',
      });
    }

    if (!trx) {
      return NextResponse.json({
        success: true,
        payment_status: 'PENDING',
        message: 'Transaksi belum tercatat di database atau sedang dalam proses antrean.',
      });
    }

    return NextResponse.json({
      success: true,
      payment_status: trx.payment_status || 'PENDING',
      transaction_id: trx.id,
      transaction_number: trx.transaction_number,
      payable_amount: Number(trx.payable_amount || 0),
      paid_at: trx.paid_at || null,
      payment_method: trx.payment_method,
    });
  } catch (error: any) {
    console.error('[PaymentVerify Exception]', error);
    return NextResponse.json(
      {
        success: false,
        payment_status: 'PENDING',
        error: error?.message || 'Terjadi kesalahan internal saat memeriksa status pembayaran.',
      },
      { status: 500 }
    );
  }
}
