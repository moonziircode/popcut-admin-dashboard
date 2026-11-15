import { NextRequest, NextResponse } from 'next/server';
import { getMidtransConfig } from '@/lib/services/midtrans';

export async function GET() {
  const prodConfig = getMidtransConfig(false);
  const sandConfig = getMidtransConfig(true);

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '••••••••';
    return `${key.slice(0, 10)}••••••••••••••••${key.slice(-4)}`;
  };

  return NextResponse.json({
    merchantId: prodConfig.merchantName,
    clientKey: prodConfig.clientKey,
    isProduction: prodConfig.isProduction,
    serverKeyMasked: maskKey(process.env.MIDTRANS_SERVER_KEY || ''),
    sandboxServerKeyMasked: maskKey(process.env.MIDTRANS_SANDBOX_SERVER_KEY || ''),
    hasProductionKey: Boolean(process.env.MIDTRANS_SERVER_KEY),
    hasSandboxKey: Boolean(process.env.MIDTRANS_SANDBOX_SERVER_KEY),
  });
}
