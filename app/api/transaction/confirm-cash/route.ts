import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { transaction_id, session_id, operator_id, cash_received } = await req.json();

    if (!transaction_id && !session_id) {
      return NextResponse.json(
        {
          code: 'MISSING_TRANSACTION_OR_SESSION',
          message: 'transaction_id atau session_id wajib disertakan untuk konfirmasi tunai.',
          retryable: false,
          request_id: crypto.randomUUID(),
        },
        { status: 400 }
      );
    }

    // In Supabase production:
    // await supabase.from('transactions').update({
    //   payment_status: 'PAID',
    //   paid_at: new Date().toISOString(),
    //   payment_method: 'CASH',
    //   operator_confirmed_by: operator_id || 'cashier-booth',
    // }).eq('id', transaction_id);

    return NextResponse.json({
      success: true,
      message: 'Pembayaran tunai berhasil dikonfirmasi.',
      transaction_id: transaction_id || `trx-${Date.now()}`,
      session_id: session_id || null,
      payment_status: 'PAID',
      paid_at: new Date().toISOString(),
      cash_received: cash_received || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Gagal mengonfirmasi pembayaran tunai.',
        retryable: true,
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
