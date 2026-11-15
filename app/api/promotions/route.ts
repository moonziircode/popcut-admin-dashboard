import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch all promotions with their promotion codes
    const { data: promotions, error: promoError } = await supabase
      .from('promotions')
      .select('*, promotion_codes(*)')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (promoError) {
      console.error('[API Promotions] Fetch error:', promoError);
      return NextResponse.json({ success: false, error: promoError.message }, { status: 500 });
    }

    // Format for frontend
    const mappedPromotions = (promotions || []).map((p) => {
      const codeObj = (p.promotion_codes && p.promotion_codes[0]) || null;
      const code = codeObj?.code || 'N/A';
      const usageCount = codeObj?.usage_count ?? 0;
      const maxUses = codeObj?.max_uses ?? p.total_usage_limit ?? 100;

      const isExpired = p.end_date && new Date(p.end_date) < new Date();
      const isExhausted = usageCount >= maxUses;

      let status = 'APPROVED';
      if (p.is_archived) {
        status = 'ARCHIVED';
      } else if (isExpired) {
        status = 'EXPIRED';
      } else if (isExhausted) {
        status = 'EXHAUSTED';
      } else if (!p.is_active || codeObj?.is_disabled) {
        status = 'PENDING_APPROVAL';
      } else {
        status = 'APPROVED';
      }

      return {
        id: p.id,
        name: p.name,
        code,
        code_id: codeObj?.id,
        promotion_codes: p.promotion_codes || [],
        discount_type: p.discount_type,
        discount_value: Number(p.discount_value),
        usage_count: usageCount,
        max_uses: maxUses,
        valid_from: p.start_date,
        valid_until: p.end_date,
        is_active: p.is_active && !codeObj?.is_disabled && !isExpired && !isExhausted,
        is_archived: p.is_archived,
        status,
        created_at: p.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      promotions: mappedPromotions,
      count: mappedPromotions.length,
    });
  } catch (err: any) {
    console.error('[API Promotions] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memuat promosi' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      code,
      discount_type = 'PERCENTAGE',
      discount_value = 0,
      max_uses = 100,
      valid_until,
      is_active = true,
    } = body;

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama voucher dan kode promo wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const supabase = createAdminClient();

    // Check if code already exists
    const { data: existingCode } = await supabase
      .from('promotion_codes')
      .select('id, code')
      .eq('code', cleanCode)
      .maybeSingle();

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: `Kode voucher "${cleanCode}" sudah digunakan.` },
        { status: 409 }
      );
    }

    const now = new Date();
    const endDate = valid_until
      ? new Date(valid_until).toISOString()
      : new Date(now.getTime() + 365 * 86400000).toISOString(); // 1 year default

    // 1. Insert into promotions
    const { data: newPromo, error: promoError } = await supabase
      .from('promotions')
      .insert({
        name: name.trim(),
        discount_type,
        discount_value: Number(discount_value) || 0,
        start_date: now.toISOString(),
        end_date: endDate,
        total_usage_limit: Number(max_uses) || 100,
        per_customer_limit: 1,
        min_purchase: 0,
        allow_stacking: false,
        is_active: Boolean(is_active),
        is_archived: false,
      })
      .select()
      .single();

    if (promoError || !newPromo) {
      console.error('[API Promotions] Insert promo error:', promoError);
      throw new Error(promoError?.message || 'Gagal membuat record promosi.');
    }

    // 2. Insert into promotion_codes
    const { data: newCode, error: codeError } = await supabase
      .from('promotion_codes')
      .insert({
        promotion_id: newPromo.id,
        code: cleanCode,
        usage_count: 0,
        max_uses: Number(max_uses) || 100,
        expires_at: endDate,
        is_disabled: !is_active,
      })
      .select()
      .single();

    if (codeError || !newCode) {
      console.error('[API Promotions] Insert code error:', codeError);
      await supabase.from('promotions').delete().eq('id', newPromo.id);
      throw new Error(codeError?.message || 'Gagal membuat kode voucher.');
    }

    // 3. Log activity
    try {
      await supabase.from('activity_logs').insert({
        action: 'VOUCHER_CREATE',
        entity_type: 'promotions',
        entity_id: newPromo.id,
        description: `Voucher "${name}" (${cleanCode}) berhasil dibuat dengan status ${is_active ? 'APPROVED' : 'PENDING_APPROVAL'}.`,
        after_state: { promo_id: newPromo.id, code: cleanCode, discount_type, discount_value },
      });
    } catch (logErr) {
      console.warn('[API Promotions] Activity log skipped:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: `Voucher "${cleanCode}" berhasil disimpan ke database.`,
      promotion: {
        id: newPromo.id,
        name: newPromo.name,
        code: cleanCode,
        code_id: newCode.id,
        discount_type: newPromo.discount_type,
        discount_value: Number(newPromo.discount_value),
        usage_count: 0,
        max_uses: Number(max_uses) || 100,
        valid_until: endDate,
        is_active: Boolean(is_active),
        status: is_active ? 'APPROVED' : 'PENDING_APPROVAL',
      },
    });
  } catch (err: any) {
    console.error('[API Promotions] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal membuat voucher' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, is_active, is_archived } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID promosi wajib diisi' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_active === 'boolean') {
      updates.is_active = is_active;
    }
    if (typeof is_archived === 'boolean') {
      updates.is_archived = is_archived;
    }

    const { error: promoErr } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id);

    if (promoErr) {
      throw promoErr;
    }

    if (typeof is_active === 'boolean') {
      await supabase
        .from('promotion_codes')
        .update({ is_disabled: !is_active })
        .eq('promotion_id', id);
    }

    return NextResponse.json({
      success: true,
      message: 'Status promosi berhasil diperbarui.',
    });
  } catch (err: any) {
    console.error('[API Promotions PATCH] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui status promosi' },
      { status: 500 }
    );
  }
}
