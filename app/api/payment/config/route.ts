import { NextRequest, NextResponse } from 'next/server';
import { getMidtransConfigAsync } from '@/lib/services/midtrans';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const prodConfig = await getMidtransConfigAsync(false);
  const sandConfig = await getMidtransConfigAsync(true);

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '••••••••';
    return `${key.slice(0, 10)}••••••••••••••••${key.slice(-4)}`;
  };

  return NextResponse.json({
    merchantId: prodConfig.merchantName,
    clientKey: prodConfig.clientKey,
    isProduction: prodConfig.isProduction,
    serverKeyMasked: maskKey(prodConfig.serverKey),
    sandboxServerKeyMasked: maskKey(sandConfig.serverKey),
    hasProductionKey: Boolean(prodConfig.serverKey),
    hasSandboxKey: Boolean(sandConfig.serverKey),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'midtrans_config')
      .single();

    const currentVal = existing?.value || {};
    const updatedVal = {
      ...currentVal,
      merchant_name: body.merchantName || currentVal.merchant_name || 'Popcut.id',
      client_key: body.clientKey || currentVal.client_key || 'Mid-client-2aA4MHqiqjjWz7V8',
      production_server_key: body.productionServerKey && !body.productionServerKey.includes('••')
        ? body.productionServerKey
        : currentVal.production_server_key,
      sandbox_server_key: body.sandboxServerKey && !body.sandboxServerKey.includes('••')
        ? body.sandboxServerKey
        : currentVal.sandbox_server_key,
      is_production: body.isProduction !== undefined ? Boolean(body.isProduction) : currentVal.is_production,
      allow_cash_payment: body.allowCashPayment !== undefined ? Boolean(body.allowCashPayment) : currentVal.allow_cash_payment,
    };

    const { error } = await admin.from('app_settings').upsert({
      section: 'payment',
      key: 'midtrans_config',
      value: updatedVal,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Pengaturan pembayaran berhasil diperbarui di database.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message }, { status: 500 });
  }
}
