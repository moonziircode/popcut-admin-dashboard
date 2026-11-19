import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('[API Users] Error fetching auth users:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const users = (data.users || []).map((u) => {
      const email = u.email || '';
      let role = u.app_metadata?.role || u.user_metadata?.role;
      if (!role) {
        if (email.includes('owner') || email.includes('aqsa')) role = 'owner';
        else if (email.includes('admin') || email.includes('rian')) role = 'admin';
        else role = 'staff';
      }

      const isConfirmed = Boolean(u.email_confirmed_at || u.user_metadata?.email_verified);
      const isSuspended = Boolean(u.banned_until && new Date(u.banned_until) > new Date());

      return {
        id: u.id,
        full_name: u.user_metadata?.full_name || email.split('@')[0] || 'User',
        email,
        role,
        status: isSuspended ? 'SUSPENDED' : isConfirmed ? 'ACTIVE' : 'INVITED',
        last_login: u.last_sign_in_at || u.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (err: any) {
    console.error('[API Users] Exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, role } = body;

    if (!email || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Nama lengkap dan email wajib diisi.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: role || 'staff',
      },
      app_metadata: {
        role: role || 'staff',
      },
    });

    if (error) {
      console.error('[API Users] Create user error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (data?.user?.id) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name,
          status: 'ACTIVE',
        });
      } catch (profErr) {
        console.warn('[API Users] Profile sync notice:', profErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${full_name} (${email}) berhasil ditambahkan ke Supabase Auth.`,
      user: {
        id: data.user.id,
        full_name,
        email: data.user.email,
        role: role || 'staff',
        status: 'ACTIVE',
        last_login: data.user.created_at,
      },
    });
  } catch (err: any) {
    console.error('[API Users] POST Exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
