import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      session_id = null,
      transaction_id = null,
      booth_id = null,
      validate_only = false,
    } = body;
    const effectiveSubtotal = Number(body.subtotal || body.cart_total || body.order_amount) || 35000;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { code: 'MISSING_CODE', message: 'Kode voucher wajib diisi.', retryable: false },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const supabase = createAdminClient();

    const isValidUuid = (val: any) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    // 1. If validate_only mode (check validity without incrementing usage)
    if (validate_only) {
      const { data: codeData, error: codeErr } = await supabase
        .from('promotion_codes')
        .select('*, promotions(*)')
        .eq('code', cleanCode)
        .maybeSingle();

      if (codeErr || !codeData || !codeData.promotions) {
        return NextResponse.json(
          { code: 'CODE_NOT_FOUND', message: 'Kode voucher tidak ditemukan.', retryable: false },
          { status: 404 }
        );
      }

      const promo = codeData.promotions;
      const now = new Date();

      if (codeData.is_disabled || !promo.is_active || promo.is_archived) {
        return NextResponse.json(
          { code: 'CODE_DISABLED', message: 'Voucher sedang tidak aktif atau belum disetujui.', retryable: false },
          { status: 400 }
        );
      }

      if (codeData.expires_at && new Date(codeData.expires_at) < now) {
        return NextResponse.json(
          { code: 'CODE_EXPIRED', message: 'Voucher telah kedaluwarsa.', retryable: false },
          { status: 400 }
        );
      }

      if (promo.end_date && new Date(promo.end_date) < now) {
        return NextResponse.json(
          { code: 'PROMO_PERIOD_INVALID', message: 'Periode promosi telah berakhir.', retryable: false },
          { status: 400 }
        );
      }

      if (codeData.usage_count >= codeData.max_uses) {
        return NextResponse.json(
          { code: 'USAGE_LIMIT_EXCEEDED', message: 'Kuota pemakaian voucher telah habis.', retryable: false },
          { status: 400 }
        );
      }

      let discountAmount = 0;
      const pSubtotal = effectiveSubtotal;
      if (promo.discount_type === 'FREE_100') {
        discountAmount = pSubtotal;
      } else if (promo.discount_type === 'PERCENTAGE') {
        discountAmount = Math.min(pSubtotal, Math.round((pSubtotal * Number(promo.discount_value)) / 100));
      } else {
        discountAmount = Math.min(pSubtotal, Number(promo.discount_value) || 0);
      }

      return NextResponse.json({
        success: true,
        valid: true,
        code: cleanCode,
        discount_amount: discountAmount,
        discount_type: promo.discount_type,
        message: promo.discount_type === 'FREE_100'
          ? 'Voucher 100% Gratis berhasil diterapkan!'
          : `Diskon Rp ${discountAmount.toLocaleString('id-ID')} berhasil diterapkan!`,
      });
    }

    // 2. Atomic Redemption via Supabase RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('redeem_voucher_atomic', {
      p_code: cleanCode,
      p_session_id: isValidUuid(session_id) ? session_id : null,
      p_transaction_id: isValidUuid(transaction_id) ? transaction_id : null,
      p_booth_id: isValidUuid(booth_id) ? booth_id : null,
      p_subtotal: effectiveSubtotal,
    });

    if (rpcError) {
      console.error('[API Voucher Redeem] RPC error:', rpcError);
      return NextResponse.json(
        { code: 'RPC_ERROR', message: rpcError.message || 'Gagal memproses voucher di database.' },
        { status: 500 }
      );
    }

    if (!rpcResult || !rpcResult.success) {
      return NextResponse.json(
        {
          code: rpcResult?.error_code || 'INVALID_CODE',
          message: rpcResult?.message || 'Kode voucher tidak valid atau telah habis.',
          retryable: false,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      discount_amount: rpcResult.discount_amount,
      discount_type: rpcResult.discount_type,
      code: rpcResult.code,
      redemption_id: rpcResult.redemption_id,
      message: `Voucher "${cleanCode}" berhasil digunakan.`,
    });
  } catch (error: any) {
    console.error('[API Voucher Redeem] Exception:', error);
    return NextResponse.json(
      { code: 'SERVER_ERROR', message: error.message || 'Gagal memproses voucher.' },
      { status: 500 }
    );
  }
}
