import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { ticket_code, session_id, preview_only = false } = await req.json();

    if (!ticket_code || typeof ticket_code !== 'string') {
      return NextResponse.json(
        { code: 'MISSING_TICKET', message: 'Kode tiket prabayar wajib diisi.', retryable: false },
        { status: 400 }
      );
    }

    const cleanTicket = ticket_code.trim().toUpperCase();
    const supabase = createAdminClient();

    // 1. Query ticket with batch and package details
    const { data: ticket, error: ticketErr } = await supabase
      .from('prepaid_tickets')
      .select(`
        id,
        ticket_code,
        status,
        claimed_at,
        claimed_session_id,
        batch:prepaid_batches (
          id,
          batch_name,
          valid_from,
          valid_until,
          packages (
            id,
            name,
            price,
            photo_count,
            included_strips
          )
        )
      `)
      .ilike('ticket_code', cleanTicket)
      .maybeSingle();

    if (ticketErr || !ticket) {
      return NextResponse.json(
        { code: 'TICKET_NOT_FOUND', message: `Tiket "${cleanTicket}" tidak ditemukan.`, retryable: false },
        { status: 404 }
      );
    }

    if (ticket.status === 'USED' || ticket.status === 'CLAIMED') {
      return NextResponse.json(
        { code: 'TICKET_ALREADY_USED', message: `Tiket "${cleanTicket}" sudah pernah digunakan pada ${ticket.claimed_at || 'sesi sebelumnya'}.`, retryable: false },
        { status: 400 }
      );
    }

    if (ticket.status !== 'AVAILABLE' && ticket.status !== 'ACTIVE') {
      return NextResponse.json(
        { code: 'TICKET_INVALID_STATUS', message: `Status tiket "${cleanTicket}" tidak aktif (${ticket.status}).`, retryable: false },
        { status: 400 }
      );
    }

    const batch: any = Array.isArray(ticket.batch) ? ticket.batch[0] : ticket.batch;
    const pkg: any = batch?.packages ? (Array.isArray(batch.packages) ? batch.packages[0] : batch.packages) : null;

    if (preview_only) {
      return NextResponse.json({
        success: true,
        ticket_code: cleanTicket,
        package_id: pkg?.id || null,
        package_name: pkg?.name || 'Paket Prabayar',
        batch_name: batch?.batch_name || '',
      });
    }

    // 2. Mark as USED
    const isValidUuid = (val: any) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const dbSessionId = isValidUuid(session_id) ? session_id : null;

    const { error: claimErr } = await supabase
      .from('prepaid_tickets')
      .update({
        status: 'USED',
        claimed_at: new Date().toISOString(),
        claimed_session_id: dbSessionId,
      })
      .eq('id', ticket.id);

    if (claimErr) {
      console.error('Error claiming ticket:', claimErr);
      return NextResponse.json(
        { code: 'DB_ERROR', message: `Gagal memperbarui status tiket: ${claimErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket_code: cleanTicket,
      package_id: pkg?.id || null,
      package_name: pkg?.name || 'Paket Prabayar',
      batch_name: batch?.batch_name || '',
      redeemed_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in ticket redeem:', error);
    return NextResponse.json(
      { code: 'SERVER_ERROR', message: 'Gagal memproses klaim tiket.' },
      { status: 500 }
    );
  }
}
