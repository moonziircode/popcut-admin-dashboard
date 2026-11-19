import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
  merchantName: string;
  snapBaseUrl: string;
  apiBaseUrl: string;
}

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  items?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  customerDetails?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  enabledPayments?: string[];
}

export interface SnapTransactionResult {
  token: string;
  redirect_url: string;
  order_id: string;
}

export async function getMidtransConfigAsync(forceSandbox?: boolean): Promise<MidtransConfig> {
  let isProduction = forceSandbox !== undefined ? !forceSandbox : (process.env.MIDTRANS_IS_PRODUCTION === 'true');
  let serverKey = isProduction
    ? (process.env.MIDTRANS_SERVER_KEY || '')
    : (process.env.MIDTRANS_SANDBOX_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY || '');
  let clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-2aA4MHqiqjjWz7V8';
  let merchantName = process.env.MIDTRANS_MERCHANT_NAME || 'Popcut.id';

  // Read from Supabase app_settings table if env is not configured
  if (!serverKey) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('app_settings')
        .select('value')
        .eq('key', 'midtrans_config')
        .single();

      if (data?.value) {
        if (forceSandbox === undefined && data.value.is_production !== undefined) {
          isProduction = Boolean(data.value.is_production);
        }
        serverKey = isProduction
          ? (data.value.production_server_key || '')
          : (data.value.sandbox_server_key || data.value.production_server_key || '');
        if (data.value.client_key) clientKey = data.value.client_key;
        if (data.value.merchant_name) merchantName = data.value.merchant_name;
      }
    } catch (e) {
      // Ignore database errors and fall back to defaults
    }
  }

  return {
    serverKey,
    clientKey,
    isProduction,
    merchantName,
    snapBaseUrl: isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1',
    apiBaseUrl: isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2',
  };
}

export function getMidtransConfig(forceSandbox?: boolean): MidtransConfig {
  const isEnvProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const isProduction = forceSandbox !== undefined ? !forceSandbox : isEnvProd;

  const serverKey = isProduction
    ? (process.env.MIDTRANS_SERVER_KEY || '')
    : (process.env.MIDTRANS_SANDBOX_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY || '');

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-2aA4MHqiqjjWz7V8';
  const merchantName = process.env.MIDTRANS_MERCHANT_NAME || 'Popcut.id';

  return {
    serverKey,
    clientKey,
    isProduction,
    merchantName,
    snapBaseUrl: isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1',
    apiBaseUrl: isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2',
  };
}

export async function createSnapTransaction(
  params: CreateSnapTransactionParams,
  forceSandbox?: boolean
): Promise<SnapTransactionResult> {
  const config = await getMidtransConfigAsync(forceSandbox);
  const authString = Buffer.from(`${config.serverKey}:`).toString('base64');

  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    item_details: params.items || [
      {
        id: 'pkg-default',
        price: Math.round(params.grossAmount),
        quantity: 1,
        name: 'Popcut Photo Session',
      },
    ],
    customer_details: params.customerDetails || {
      first_name: 'Pengunjung',
      last_name: config.merchantName,
    },
    enabled_payments: params.enabledPayments || ['qris', 'gopay', 'shopeepay'],
  };

  const response = await fetch(`${config.snapBaseUrl}/transactions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Midtrans Snap Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return {
    token: data.token,
    redirect_url: data.redirect_url,
    order_id: params.orderId,
  };
}

export async function verifyMidtransSignatureAsync(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string | number;
  signatureKey: string;
  isProduction?: boolean;
}): Promise<boolean> {
  const config = await getMidtransConfigAsync(params.isProduction === false);
  if (!config.serverKey) {
    console.error('[Midtrans Webhook] Gagal memverifikasi signature: MIDTRANS_SERVER_KEY tidak terkonfigurasi.');
    return false;
  }

  const formattedAmount =
    typeof params.grossAmount === 'number'
      ? params.grossAmount.toFixed(2)
      : params.grossAmount.includes('.')
      ? params.grossAmount
      : `${params.grossAmount}.00`;

  const rawString = `${params.orderId}${params.statusCode}${formattedAmount}${config.serverKey}`;
  const computedHash = crypto.createHash('sha512').update(rawString).digest('hex');

  return computedHash.toLowerCase() === params.signatureKey.toLowerCase();
}

export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string | number;
  signatureKey: string;
  isProduction?: boolean;
}): boolean {
  const config = getMidtransConfig(params.isProduction === false);
  if (!config.serverKey) {
    console.error('[Midtrans Webhook] Gagal memverifikasi signature: MIDTRANS_SERVER_KEY tidak terkonfigurasi.');
    return false;
  }

  const formattedAmount =
    typeof params.grossAmount === 'number'
      ? params.grossAmount.toFixed(2)
      : params.grossAmount.includes('.')
      ? params.grossAmount
      : `${params.grossAmount}.00`;

  const rawString = `${params.orderId}${params.statusCode}${formattedAmount}${config.serverKey}`;
  const computedHash = crypto.createHash('sha512').update(rawString).digest('hex');

  return computedHash.toLowerCase() === params.signatureKey.toLowerCase();
}

export async function checkTransactionStatus(orderId: string, isProduction?: boolean) {
  const config = await getMidtransConfigAsync(isProduction === false);
  const authString = Buffer.from(`${config.serverKey}:`).toString('base64');

  const response = await fetch(`${config.apiBaseUrl}/${orderId}/status`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${authString}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Midtrans Status Error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

export async function testMidtransPing(isProduction?: boolean) {
  const config = await getMidtransConfigAsync(isProduction === false);
  if (!config.serverKey) {
    return {
      success: false,
      environment: config.isProduction ? 'PRODUCTION' : 'SANDBOX',
      message: 'Server Key Midtrans belum dikonfigurasi.',
    };
  }

  const authString = Buffer.from(`${config.serverKey}:`).toString('base64');

  try {
    // Check dummy transaction status to verify authentication
    const response = await fetch(`${config.apiBaseUrl}/popcut-ping-check/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${authString}`,
      },
    });

    if (response.status === 200 || response.status === 404) {
      return {
        success: true,
        environment: config.isProduction ? 'PRODUCTION' : 'SANDBOX',
        serverKeyMasked: `${config.serverKey.slice(0, 10)}...${config.serverKey.slice(-4)}`,
        clientKey: config.clientKey,
        merchantName: config.merchantName,
        message: `Koneksi Midtrans ${config.isProduction ? 'Production' : 'Sandbox'} terhubung dan kredensial valid (HTTP ${response.status}).`,
      };
    }

    if (response.status === 401) {
      return {
        success: false,
        environment: config.isProduction ? 'PRODUCTION' : 'SANDBOX',
        serverKeyMasked: `${config.serverKey.slice(0, 10)}...${config.serverKey.slice(-4)}`,
        message: 'Kredensial Server Key ditolak oleh Midtrans (HTTP 401 Unauthorized). Pastikan status Go Live atau IP Whitelist di Midtrans Dashboard telah aktif.',
      };
    }

    const errorBody = await response.text();
    return {
      success: false,
      environment: config.isProduction ? 'PRODUCTION' : 'SANDBOX',
      message: `Midtrans mengembalikan status ${response.status}: ${errorBody}`,
    };
  } catch (error: any) {
    return {
      success: false,
      environment: config.isProduction ? 'PRODUCTION' : 'SANDBOX',
      message: `Gagal menghubungi server Midtrans: ${error?.message}`,
    };
  }
}
