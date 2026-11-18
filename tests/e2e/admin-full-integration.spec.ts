import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hxefecxvforrrbggmvmm.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZWZlY3h2Zm9ycnJiZ2dtdm1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDY3NjA3NCwiZXhwIjoyMTEwMjUyMDc0fQ.H8a2gkukjzzc_jA04aWIFFsfYf2p9MUuNx_0V5pmtE4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

test.describe('Popcut.id Full-Stack Integration & Spec Verification Suite', () => {
  let adminCookie = '';

  test.beforeAll(async ({ request }) => {
    // Authenticate as Admin to get session cookie
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: 'admin@popcut.id',
        password: 'Password123!',
      },
    });
    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.success).toBe(true);
    expect(loginData.user.email).toBe('admin@popcut.id');

    // Extract cookie from response
    const headers = loginRes.headers();
    const setCookie = headers['set-cookie'];
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }
  });

  // --------------------------------------------------------------------------
  // FLOW 1: AUTH GUARD ENFORCEMENT (INT-014)
  // --------------------------------------------------------------------------
  test('Flow 1: Middleware Auth Guard protects admin routes and permits public/kiosk endpoints', async ({
    page,
    request,
  }) => {
    // 1. Unauthenticated page visit redirects to /login
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);

    // 2. Unauthenticated API request to internal route receives HTTP 401
    const unauthSettingsRes = await request.get('/api/settings');
    expect(unauthSettingsRes.status()).toBe(401);
    const unauthData = await unauthSettingsRes.json();
    expect(unauthData.success).toBe(false);
    expect(unauthData.error).toContain('Unauthorized');

    const unauthPackagesRes = await request.get('/api/packages');
    expect(unauthPackagesRes.status()).toBe(401);

    // 3. Public API routes bypass auth check
    const verifyRes = await request.get('/api/payment/verify?transaction_id=non-existent-probe');
    expect(verifyRes.status()).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.success).toBe(true);
    expect(verifyData.payment_status).toBe('PENDING');

    // 4. Kiosk route bypasses auth check in dev/test
    const kioskRes = await request.get('/api/booth/config?booth_id=RIG-M1-01');
    expect(kioskRes.status()).toBe(200);
  });

  // --------------------------------------------------------------------------
  // FLOW 2: SETTINGS PERSISTENCE & POSTGRESQL MUTATION (INT-012)
  // --------------------------------------------------------------------------
  test('Flow 2: Settings form mutates database and persists across reloads', async ({
    request,
    page,
  }) => {
    // 1. Mutate settings via authenticated API
    const targetTimer = 8;
    const saveRes = await request.post('/api/settings', {
      headers: {
        Cookie: adminCookie,
      },
      data: {
        business: {
          companyName: 'Popcut Studio Official',
          supportEmail: 'support@popcut.id',
        },
        kiosk: {
          countdownTimer: targetTimer,
          enableSoundEffects: true,
          liveViewFps: 30,
        },
      },
    });
    expect(saveRes.status()).toBe(200);
    const saveData = await saveRes.json();
    expect(saveData.success).toBe(true);

    // 2. Direct PostgreSQL assertion on Supabase app_settings table
    const { data: dbSetting, error: dbErr } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'kiosk_countdown_timer')
      .single();

    expect(dbErr).toBeNull();
    expect(dbSetting).not.toBeNull();
    expect(Number(dbSetting.value)).toBe(targetTimer);

    // 3. Verify GET /api/settings returns mutated countdownTimer
    const getRes = await request.get('/api/settings', {
      headers: { Cookie: adminCookie },
    });
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();
    expect(getData.settings.kiosk.countdownTimer).toBe(targetTimer);

    // 4. Verify in UI with authenticated session
    await page.context().addCookies([
      {
        name: 'popcut_admin_user',
        value: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@popcut.id',
          full_name: 'Admin Popcut',
          role: 'admin',
        }),
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);

    // Switch to kiosk tab to inspect countdownTimer
    const kioskTabBtn = page.getByRole('button', { name: /Aplikasi Booth \/ Kiosk/i });
    await kioskTabBtn.click();

    const timerInput = page.locator('input[type="number"]').first();
    await expect(timerInput).toBeVisible();
    await expect(timerInput).toHaveValue(String(targetTimer));
  });

  // --------------------------------------------------------------------------
  // FLOW 3: BOOTH CONFIG DELIVERY & 4R FRAME GEOMETRY (INT-003, INT-005, INT-006)
  // --------------------------------------------------------------------------
  test('Flow 3: Booth config delivers active catalog, lowercase paths, and normalized 4R slots', async ({
    request,
  }) => {
    const res = await request.get('/api/booth/config?booth_id=RIG-M1-01');
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data.booth).toBeDefined();
    expect(data.booth.code).toBe('RIG-M1-01');

    // Packages validation
    expect(Array.isArray(data.packages)).toBe(true);
    expect(data.packages.length).toBeGreaterThan(0);
    for (const pkg of data.packages) {
      expect(pkg.id).toBeDefined();
      expect(pkg.name).toBeDefined();
      expect(typeof pkg.price).toBe('number');
      expect(pkg.price).toBeGreaterThanOrEqual(0);
    }

    // Frames validation (4R only, lowercase paths, normalized coordinates)
    expect(Array.isArray(data.frames)).toBe(true);
    expect(data.frames.length).toBeGreaterThan(0);
    for (const frame of data.frames) {
      // 4R aspect ratio check (1200x1800 portrait or 1800x1200 landscape)
      const is4R =
        (frame.canvas_width === 1200 && frame.canvas_height === 1800) ||
        (frame.canvas_width === 1800 && frame.canvas_height === 1200);
      expect(is4R).toBe(true);

      // Overlay URL casing check (INT-005: must start with lowercase frames/)
      expect(frame.overlay_url.startsWith('frames/')).toBe(true);

      // Slot coordinate normalization check (INT-006: 0-100% percentage space)
      expect(Array.isArray(frame.slots)).toBe(true);
      for (const slot of frame.slots) {
        expect(slot.x_coord).toBeGreaterThanOrEqual(0);
        expect(slot.x_coord).toBeLessThanOrEqual(100);
        expect(slot.y_coord).toBeGreaterThanOrEqual(0);
        expect(slot.y_coord).toBeLessThanOrEqual(100);
        expect(slot.width).toBeGreaterThan(0);
        expect(slot.width).toBeLessThanOrEqual(100);
        expect(slot.height).toBeGreaterThan(0);
        expect(slot.height).toBeLessThanOrEqual(100);
      }
    }
  });

  // --------------------------------------------------------------------------
  // FLOW 4: PAYMENT VERIFICATION & MIDTRANS WEBHOOK SETTLEMENT (INT-007, INT-008)
  // --------------------------------------------------------------------------
  test('Flow 4: Payment verification handles probe gracefully, and webhook mutates DB transaction', async ({
    request,
  }) => {
    // 1. Verify endpoint does not crash on non-existent query
    const verifyRes = await request.get('/api/payment/verify?transaction_id=non-existent-trx-probe');
    expect(verifyRes.status()).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.success).toBe(true);
    expect(verifyData.payment_status).toBe('PENDING');

    // 2. Insert test transaction row in Supabase
    const testTrxNumber = `TRX-TEST-${Date.now()}`;
    const { data: testBooth } = await supabase.from('booths').select('id').limit(1).single();
    expect(testBooth).not.toBeNull();

    const { data: insertedTrx, error: insertErr } = await supabase
      .from('transactions')
      .insert({
        transaction_number: testTrxNumber,
        booth_id: testBooth!.id,
        customer_ref: 'E2E Testing Customer',
        original_amount: 50000,
        payable_amount: 50000,
        payment_method: 'QRIS',
        payment_status: 'PENDING',
      })
      .select()
      .single();

    expect(insertErr).toBeNull();
    expect(insertedTrx).toBeDefined();
    expect(insertedTrx.payment_status).toBe('PENDING');

    // 3. Compute authentic Midtrans SHA-512 signature hash
    const statusCode = '200';
    const grossAmount = '50000.00';
    const serverKey =
      process.env.MIDTRANS_SANDBOX_SERVER_KEY ||
      process.env.MIDTRANS_SERVER_KEY ||
      'SB-Mid-server-U9sBTAc_JXUN9sYMkbzY-gNG';

    const rawString = `${testTrxNumber}${statusCode}${grossAmount}${serverKey}`;
    const signatureKey = crypto.createHash('sha512').update(rawString).digest('hex');

    // Send Midtrans settlement webhook notification
    const webhookRes = await request.post('/api/webhooks/payment', {
      data: {
        order_id: testTrxNumber,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signatureKey,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'qris',
        transaction_time: new Date().toISOString(),
      },
    });

    expect(webhookRes.status()).toBe(200);
    const webhookData = await webhookRes.json();
    expect(webhookData.success).toBe(true);

    // 4. Assert PostgreSQL transaction record was mutated to PAID with paid_at timestamp
    const { data: updatedTrx, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', insertedTrx.id)
      .single();

    expect(fetchErr).toBeNull();
    expect(updatedTrx.payment_status).toBe('PAID');
    expect(updatedTrx.paid_at).not.toBeNull();

    // 5. Clean up test transaction
    await supabase.from('transactions').delete().eq('id', insertedTrx.id);
  });

  // --------------------------------------------------------------------------
  // FLOW 5: DIGITAL GALLERY RETRIEVAL WITHOUT POSTGREST RELATION ERRORS (INT-010, INT-011)
  // --------------------------------------------------------------------------
  test('Flow 5: Digital gallery endpoint resolves without PostgREST relation joins error', async ({
    request,
  }) => {
    // 1. Get an existing session or digital gallery from Supabase
    const { data: existingGallery } = await supabase
      .from('digital_galleries')
      .select('session_id')
      .limit(1)
      .maybeSingle();

    const testSessionId = existingGallery?.session_id || 'b0000000-0000-4000-8000-000000000001';

    // 2. Call GET /api/galleries with sessionId
    const res = await request.get(`/api/galleries?sessionId=${testSessionId}`);
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    // Ensure no PostgREST relation error
    expect(JSON.stringify(data)).not.toContain("Could not find a relationship between 'sessions' and 'events'");

    // 3. Verify compatibility view `public.galleries` works directly in Supabase
    const { data: viewGalleries, error: viewErr } = await supabase
      .from('galleries')
      .select('*')
      .limit(5);

    expect(viewErr).toBeNull();
    expect(Array.isArray(viewGalleries)).toBe(true);
  });
});
