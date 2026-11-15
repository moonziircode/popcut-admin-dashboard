import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hxefecxvforrrbggmvmm.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZWZlY3h2Zm9ycnJiZ2dtdm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NzYwNzQsImV4cCI6MjExMDI1MjA3NH0.5VKaslGvgWI00yBCv-K6CxEAa5OcIOu-XjIqrrgdzZQ';

  let response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Check fallback cookie
    const cookieUser = req.cookies.get('popcut_admin_user')?.value;
    if (cookieUser) {
      try {
        const parsed = JSON.parse(cookieUser);
        return NextResponse.json({ authenticated: true, user: parsed });
      } catch (e) {}
    }
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Fetch role & profile
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, status')
    .eq('id', user.id)
    .single();

  const { data: roleRow } = await admin
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || 'Admin Popcut',
      role: roleRow?.role_id || 'staff',
    },
  });
}
