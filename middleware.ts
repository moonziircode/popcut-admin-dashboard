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

  // Define public web pages and public APIs that bypass auth check
  const isAuthPage = pathname === '/login';
  const isOfflinePage = pathname === '/offline';
  const isPublicWebPage = isAuthPage || isOfflinePage || pathname.startsWith('/gallery/');

  // Category A: Public Absolute APIs
  const PUBLIC_API_ROUTES = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/payment/verify',
    '/api/webhooks/payment',
    '/api/galleries',
  ];
  const isPublicApi = PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));

  // Category B: Kiosk M2M Hardware (Booth Service APIs)
  const KIOSK_API_ROUTES = [
    '/api/booth',
    '/api/session',
    '/api/voucher/redeem',
    '/api/ticket/redeem',
    '/api/gallery/register',
    '/api/storage/upload',
  ];
  const isKioskApi = KIOSK_API_ROUTES.some((route) => pathname.startsWith(route));

  // If Kiosk M2M route:
  if (isKioskApi) {
    const boothSecret = process.env.BOOTH_API_SECRET;
    if (process.env.NODE_ENV === 'production' && boothSecret) {
      const boothToken =
        request.headers.get('x-booth-token') ||
        request.headers.get('authorization')?.replace('Bearer ', '');
      if (!boothToken || boothToken !== boothSecret) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Token kiosk x-booth-token tidak valid.' },
          { status: 401 }
        );
      }
    }
    return response;
  }

  // Category C: Admin Internal (Strict Session / Token Auth)
  // If user is not authenticated:
  if (!isAuthenticated && !isPublicWebPage && !isPublicApi) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Autentikasi sesi atau token API diperlukan.' },
        { status: 401 }
      );
    }
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
