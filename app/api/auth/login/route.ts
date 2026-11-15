import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Prepare response to handle cookies
    let response = NextResponse.json({ success: true });

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hxefecxvforrrbggmvmm.supabase.co';
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZWZlY3h2Zm9ycnJiZ2dtdm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NzYwNzQsImV4cCI6MjExMDI1MjA3NH0.5VKaslGvgWI00yBCv-K6CxEAa5OcIOu-XjIqrrgdzZQ';

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
          });
        },
      },
    });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kombinasi email atau kata sandi tidak valid. Silakan periksa kembali.',
        },
        { status: 401 }
      );
    }

    // Fetch user profile and role from database
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, status')
      .eq('id', authData.user.id)
      .single();

    if (profile?.status === 'SUSPENDED') {
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, message: 'Akun Anda dinonaktifkan oleh Administrator.' },
        { status: 403 }
      );
    }

    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role_id')
      .eq('user_id', authData.user.id)
      .single();

    const role = roleRow?.role_id || 'staff';
    const fullName = profile?.full_name || authData.user.user_metadata?.full_name || 'Admin Popcut';

    // Store custom session info in secure cookie for fast client reading
    response.cookies.set(
      'popcut_admin_user',
      JSON.stringify({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        role,
      }),
      {
        path: '/',
        httpOnly: false, // Accessible to AppShell for immediate header rendering
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600, // 7 days
      }
    );

    // Return user info in body
    const body = {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        role,
      },
    };

    return new NextResponse(JSON.stringify(body), {
      status: 200,
      headers: response.headers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Terjadi kesalahan sistem saat login.' },
      { status: 500 }
    );
  }
}
