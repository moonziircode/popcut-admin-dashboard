import { NextRequest, NextResponse } from 'next/server';
import { verifyMidtransSignatureAsync } from '@/lib/services/midtrans';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_time,
      transaction_id,
    } = notification;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { code: 'INVALID_WEBHOOK_PAYLOAD', message: 'Parameter notifikasi Midtrans tidak lengkap.' },
        { status: 400 }
      );
    }

    // Determine if sandbox or production based on signature verification
    const isSandboxKey = signature_key && (await verifyMidtransSignatureAsync({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
      isProduction: false,
    }));

    const isProdKey = !isSandboxKey && (await verifyMidtransSignatureAsync({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
      isProduction: true,
    }));

    const isSignatureValid = isSandboxKey || isProdKey;

    if (!isSignatureValid) {
      console.warn(`[Midtrans Webhook] Invalid signature key for order ${order_id}`);
      return NextResponse.json(
        { code: 'INVALID_SIGNATURE', message: 'Signature hash SHA-512 tidak valid.' },
        { status: 403 }
      );
    }

    // Determine target payment status
    let mappedStatus: 'PAID' | 'PENDING' | 'FAILED' | 'EXPIRED' = 'PENDING';

    if (transaction_status === 'settlement') {
      mappedStatus = 'PAID';
    } else if (transaction_status === 'capture') {
      mappedStatus = fraud_status === 'accept' ? 'PAID' : 'PENDING';
    } else if (transaction_status === 'pending') {
      mappedStatus = 'PENDING';
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      mappedStatus = transaction_status === 'expire' ? 'EXPIRED' : 'FAILED';
    }

    // Log the successful webhook processing
    console.log(
      `[Midtrans Webhook Verified] Order: ${order_id}, Status: ${transaction_status} -> ${mappedStatus}, Type: ${payment_type}`
    );

    // Persist to Supabase Database
    const supabase = createAdminClient();

    // 1. Find existing transaction
    const { data: trx } = await supabase
      .from('transactions')
      .select('id, transaction_number')
      .eq('transaction_number', order_id)
      .maybeSingle();

    // 2. Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        payment_status: mappedStatus,
        paid_at: mappedStatus === 'PAID' ? (transaction_time || new Date().toISOString()) : null,
        provider_ref: transaction_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_number', order_id);

    if (updateError) {
      console.error('[Midtrans Webhook DB Update Error]', updateError);
    }

    // 3. Record audit event in payment_events if transaction exists
    if (trx?.id) {
      try {
        await supabase.from('payment_events').insert({
          transaction_id: trx.id,
          event_type: `MIDTRANS_${(transaction_status || 'NOTIFICATION').toUpperCase()}`,
          payload: notification,
          received_at: new Date().toISOString(),
        });
      } catch (peErr) {
        console.warn('[Midtrans Webhook] Failed to insert payment_events:', peErr);
      }

      // 4. Update linked session if payment settled
      if (mappedStatus === 'PAID') {
        try {
          await supabase
            .from('sessions')
            .update({
              payment_status: 'PAID',
              session_status: 'READY',
              updated_at: new Date().toISOString(),
            })
            .eq('transaction_id', trx.id);
        } catch (sessErr) {
          console.warn('[Midtrans Webhook] Failed to update linked session:', sessErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: 'OK',
      order_id,
      payment_status: mappedStatus,
      processed_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Midtrans Webhook Error]:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: error?.message || 'Gagal memproses webhook Midtrans.' },
      { status: 500 }
    );
  }
}
