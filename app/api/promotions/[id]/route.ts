import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { is_active, is_archived, name, max_uses, valid_until } = body;

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
    if (name) updates.name = name.trim();
    if (valid_until) updates.end_date = new Date(valid_until).toISOString();

    const { data: updatedPromo, error: promoErr } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (promoErr || !updatedPromo) {
      throw new Error(promoErr?.message || 'Gagal memperbarui status promosi.');
    }

    // Synchronize promotion_codes is_disabled state
    if (typeof is_active === 'boolean') {
      await supabase
        .from('promotion_codes')
        .update({ is_disabled: !is_active })
        .eq('promotion_id', id);
    }

    if (max_uses) {
      await supabase
        .from('promotion_codes')
        .update({ max_uses: Number(max_uses) })
        .eq('promotion_id', id);
    }

    // Log activity
    try {
      await supabase.from('activity_logs').insert({
        action: 'VOUCHER_UPDATE',
        entity_type: 'promotions',
        entity_id: id,
        description: `Status voucher ID ${id} diubah: ${JSON.stringify(updates)}`,
        after_state: updates,
      });
    } catch (logErr) {
      console.warn('[API Promotions ID] Log skipped:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Status promosi berhasil diperbarui.',
      promotion: updatedPromo,
    });
  } catch (err: any) {
    console.error('[API Promotions ID] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui promosi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // 1. Soft archive promotion
    const { error: archiveErr } = await supabase
      .from('promotions')
      .update({ is_archived: true, is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (archiveErr) {
      throw archiveErr;
    }

    // 2. Disable associated codes
    await supabase
      .from('promotion_codes')
      .update({ is_disabled: true })
      .eq('promotion_id', id);

    // Log activity
    try {
      await supabase.from('activity_logs').insert({
        action: 'VOUCHER_ARCHIVE',
        entity_type: 'promotions',
        entity_id: id,
        description: `Voucher ID ${id} diarsipkan.`,
      });
    } catch (logErr) {
      console.warn('[API Promotions ID] Log skipped:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Voucher berhasil diarsipkan dari sistem.',
      deleted_id: id,
    });
  } catch (err: any) {
    console.error('[API Promotions ID] Delete error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengarsipkan voucher' },
      { status: 500 }
    );
  }
}
