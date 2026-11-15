import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  let response = NextResponse.json({ success: true, message: 'Berhasil keluar.' });

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
            maxAge: 0, // Invalidate
          });
        });
      },
    },
  });

  await supabase.auth.signOut();

  // Clear Popcut user cookie
  response.cookies.set('popcut_admin_user', '', { path: '/', maxAge: 0 });

  return response;
}
