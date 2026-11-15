import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: batches, error } = await supabase
      .from('prepaid_batches')
      .select(`
        id,
        batch_name,
        package_id,
        total_quantity,
        valid_from,
        valid_until,
        created_at,
        packages (
          id,
          name,
          price
        ),
        prepaid_tickets (
          id,
          ticket_code,
          status,
          claimed_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prepaid batches:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      batches: batches || [],
    });
  } catch (err: any) {
    console.error('Error in tickets GET:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const {
      batch_name,
      package_id,
      total_quantity = 25,
      valid_until,
    } = body;

    if (!batch_name?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Nama batch tiket wajib diisi.' },
        { status: 400 }
      );
    }

    // Default package if none provided
    let targetPackageId = package_id;
    if (!targetPackageId) {
      const { data: defaultPkg } = await supabase
        .from('packages')
        .select('id')
        .eq('is_archived', false)
        .order('price', { ascending: true })
        .limit(1)
        .single();
      targetPackageId = defaultPkg?.id;
    }

    const validFrom = new Date().toISOString();
    const validUntilDate = valid_until
      ? new Date(valid_until).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const qty = Math.min(Math.max(Number(total_quantity) || 1, 1), 500);

    // 1. Create batch
    const { data: batch, error: batchError } = await supabase
      .from('prepaid_batches')
      .insert({
        batch_name: batch_name.trim(),
        package_id: targetPackageId,
        total_quantity: qty,
        valid_from: validFrom,
        valid_until: validUntilDate,
      })
      .select()
      .single();

    if (batchError || !batch) {
      console.error('Error inserting prepaid batch:', batchError);
      return NextResponse.json(
        { success: false, message: batchError?.message || 'Gagal membuat batch tiket.' },
        { status: 500 }
      );
    }

    // 2. Generate unique ticket codes
    const prefix = batch_name.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'POPC';
    const ticketsToInsert = [];
    for (let i = 1; i <= qty; i++) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = `${prefix}-${String(i).padStart(3, '0')}-${randomSuffix}`;
      ticketsToInsert.push({
        batch_id: batch.id,
        ticket_code: ticketCode,
        status: 'AVAILABLE',
      });
    }

    const { data: tickets, error: ticketsError } = await supabase
      .from('prepaid_tickets')
      .insert(ticketsToInsert)
      .select();

    if (ticketsError) {
      console.error('Error inserting tickets:', ticketsError);
      return NextResponse.json(
        { success: false, message: ticketsError.message || 'Gagal menggenerasi tiket prabayar.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Batch "${batch_name}" dengan ${qty} tiket berhasil dibuat.`,
      batch: {
        ...batch,
        prepaid_tickets: tickets,
      },
    });
  } catch (err: any) {
    console.error('Error in tickets POST:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
