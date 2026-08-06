/**
 * Next.js edge middleware — route protection.
 *
 * It adapts the incoming request into the framework-neutral `RouteRequest` and
 * applies the pure guard from `@platform/auth`. It reads only the PRESENCE of
 * the httpOnly session cookie (a reference); it never inspects a token value.
 * The backend remains the authoritative authorization boundary.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, evaluateRouteAccess, type RouteRequest } from '@platform/auth';
import { authRoutes } from './lib/auth-routes';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const routeRequest: RouteRequest = {
    path: pathname,
    hasSession: request.cookies.has(SESSION_COOKIE),
  };

  const decision = evaluateRouteAccess(authRoutes, routeRequest);

  switch (decision.kind) {
    case 'REDIRECT_TO_HOME': {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
    case 'REDIRECT_TO_LOGIN':
    case 'FORBIDDEN':
    case 'REQUIRE_WORKFLOW': {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    default:
      return NextResponse.next();
  }
}

export const config = {
  // Skip Next internals and static assets; guard everything else.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
