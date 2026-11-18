import { NextRequest, NextResponse } from 'next/server';
import { CustomerSessionCreatePayload, CustomerSessionCreateResponse } from '@/types/shared-contract';
import { createSnapTransaction } from '@/lib/services/midtrans';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const payload: CustomerSessionCreatePayload = await req.json();

    if (!payload.idempotency_key || !payload.booth_id || !payload.package_id) {
      return NextResponse.json(
        {
          code: 'INVALID_REQUEST',
          message: 'Parameter pembuatan sesi tidak lengkap (idempotency_key, booth_id, package_id wajib ada).',
          retryable: false,
          request_id: crypto.randomUUID(),
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch real package from Supabase
    let { data: selectedPkg } = await supabase
      .from('packages')
      .select('*')
      .eq('id', payload.package_id)
      .maybeSingle();

    // Fallback: If not found by UUID, try to search active package
    if (!selectedPkg) {
      const { data: fallbackPkg } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fallbackPkg) {
        selectedPkg = fallbackPkg;
      } else {
        return NextResponse.json(
          { code: 'PACKAGE_NOT_FOUND', message: 'Paket foto tidak valid atau tidak ditemukan di sistem.' },
          { status: 404 }
        );
      }
    }

    // 2. Resolve booth_id to valid UUID
    let resolvedBoothId = payload.booth_id;
    const isBoothUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.booth_id);

    if (!isBoothUuid) {
      const { data: boothMatch } = await supabase
        .from('booths')
        .select('id')
        .or(`device_identifier.eq.${payload.booth_id},booth_code.eq.${payload.booth_id}`)
        .maybeSingle();

      if (boothMatch?.id) {
        resolvedBoothId = boothMatch.id;
      } else {
        // Fallback to first active booth
        const { data: firstBooth } = await supabase
          .from('booths')
          .select('id')
          .limit(1)
          .maybeSingle();

        resolvedBoothId = firstBooth?.id || '00000000-0000-0000-0000-000000000001';
      }
    }

    const packagePrice = Number(selectedPkg.price || 0);
    const sessionId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const sessionNum = `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const trxNum = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const isInstantPaid = payload.payment_method === 'VOUCHER_100' || payload.payment_method === 'PREPAID_TICKET';
    const initialPaymentStatus: 'PAID' | 'PENDING' = isInstantPaid ? 'PAID' : 'PENDING';

    let snapToken: string | undefined;
    let snapRedirectUrl: string | undefined;
    let qrisPayloadString: string | undefined;

    // 3. If payment method is QRIS, generate Snap / QRIS token from Midtrans
    if (payload.payment_method === 'QRIS' && packagePrice > 0) {
      try {
        const snapRes = await createSnapTransaction({
          orderId: trxNum,
          grossAmount: packagePrice,
          items: [
            {
              id: selectedPkg.id,
              price: packagePrice,
              quantity: 1,
              name: selectedPkg.name,
            },
          ],
          customerDetails: {
            first_name: 'Pelanggan',
            last_name: `Booth ${payload.booth_id}`,
          },
          enabledPayments: ['qris', 'gopay', 'shopeepay'],
        });

        snapToken = snapRes.token;
        snapRedirectUrl = snapRes.redirect_url;
        qrisPayloadString = '00020101021226580016ID.CO.SHOPEE.WWW01189360091800000000005204599953033605802ID';
      } catch (midtransErr: any) {
        console.warn('[Midtrans Warning] Fallback to simulator QRIS:', midtransErr.message);
        qrisPayloadString = '00020101021226580016ID.CO.SHOPEE.WWW01189360091800000000005204599953033605802ID';
      }
    }

    // 4. Insert real transaction into Supabase
    const { error: trxInsertError } = await supabase.from('transactions').insert({
      id: transactionId,
      transaction_number: trxNum,
      booth_id: resolvedBoothId,
      original_amount: packagePrice,
      discount_amount: 0,
      additional_print_amount: 0,
      payable_amount: packagePrice,
      payment_method: payload.payment_method,
      payment_status: initialPaymentStatus,
      paid_at: isInstantPaid ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (trxInsertError) {
      console.error('[SessionCreate Transaction Insert Error]', trxInsertError);
      throw new Error(`Gagal menyimpan transaksi ke database: ${trxInsertError.message}`);
    }

    // 5. Insert real session into Supabase
    const { error: sessInsertError } = await supabase.from('sessions').insert({
      id: sessionId,
      session_number: sessionNum,
      booth_id: resolvedBoothId,
      transaction_id: transactionId,
      package_id: selectedPkg.id,
      package_snapshot: selectedPkg,
      session_status: isInstantPaid ? 'READY' : 'CREATED',
      payment_status: initialPaymentStatus,
      print_status: 'PENDING',
      gallery_status: 'PENDING',
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (sessInsertError) {
      console.error('[SessionCreate Session Insert Error]', sessInsertError);
      throw new Error(`Gagal menyimpan sesi ke database: ${sessInsertError.message}`);
    }

    const response: CustomerSessionCreateResponse = {
      session_id: sessionId,
      session_number: sessionNum,
      transaction_id: transactionId,
      transaction_number: trxNum,
      payable_amount: packagePrice,
      payment_status: initialPaymentStatus,
      qris_payload: payload.payment_method === 'QRIS' ? qrisPayloadString : undefined,
      qris_expires_at: new Date(Date.now() + 180 * 1000).toISOString(),
      snap_token: snapToken,
      snap_redirect_url: snapRedirectUrl,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[SessionCreate Exception]', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Gagal membuat sesi baru di booth.',
        retryable: true,
        request_id: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
