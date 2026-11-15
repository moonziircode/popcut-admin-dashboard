import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hxefecxvforrrbggmvmm.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZWZlY3h2Zm9ycnJiZ2dtdm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NzYwNzQsImV4cCI6MjExMDI1MjA3NH0.5VKaslGvgWI00yBCv-K6CxEAa5OcIOu-XjIqrrgdzZQ';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const pathname = request.nextUrl.pathname;

  // Check auth user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Also check session cookie fallback
  const hasCustomSession = Boolean(request.cookies.get('popcut_admin_user')?.value);
  const isAuthenticated = Boolean(user) || hasCustomSession;

  // Define public paths that bypass auth check
  const isAuthPage = pathname === '/login';
  const isOfflinePage = pathname === '/offline';
  const isPublicApi =
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/booth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/frames') ||
    pathname.startsWith('/api/session') ||
    pathname.startsWith('/api/transaction') ||
    pathname.startsWith('/api/print-job') ||
    pathname.startsWith('/api/gallery') ||
    pathname.startsWith('/api/voucher') ||
    pathname.startsWith('/api/ticket') ||
    pathname.startsWith('/api/events') ||
    pathname.startsWith('/api/payment');

  // If user is not authenticated and trying to access protected dashboard route:
  if (!isAuthenticated && !isAuthPage && !isOfflinePage && !isPublicApi) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirectedFrom', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If user is already authenticated and visits /login:
  if (isAuthenticated && isAuthPage) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/';
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons (PWA icons)
     * - manifest.webmanifest
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest).*)',
  ],
};
