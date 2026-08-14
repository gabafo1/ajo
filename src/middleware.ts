import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing(.*)',
  '/contact(.*)',
  '/onboarding(.*)',
  '/api/auth/refresh(.*)',
  '/api/webhooks(.*)',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/dashboard/admin(.*)',
]);

const isMemberRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/notifications(.*)',
  '/reports(.*)',
  '/schedule(.*)',
  '/setting(.*)',
  '/transactions(.*)',
  '/ajo(.*)',
  '/groups(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, getToken } = await auth();
  const pathname = req.nextUrl.pathname;

  // 1. Allow public routes immediately
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 2. Not signed in → redirect to sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 3. Decode the raw JWT to get the freshest possible metadata.
  //    sessionClaims can be stale (cached); getToken() fetches a new
  //    token if the current one is close to expiry.
  let onboardingComplete = false;
  let role: string | undefined;

  try {
    const token = await getToken();
    if (token) {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString()
      );
      onboardingComplete = payload?.metadata?.onboardingComplete === true;
      role = payload?.metadata?.role as string | undefined;
    } else {
      // Fallback to sessionClaims
      onboardingComplete = sessionClaims?.metadata?.onboardingComplete === true;
      role = sessionClaims?.metadata?.role as string | undefined;
    }
  } catch {
    // Fallback to sessionClaims if decode fails
    onboardingComplete = sessionClaims?.metadata?.onboardingComplete === true;
    role = sessionClaims?.metadata?.role as string | undefined;
  }

  // 4. Onboarding not complete → force onboarding
  if (!onboardingComplete && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // 5. Onboarding complete but on onboarding page → send to dashboard
  if (onboardingComplete && pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 6. Admin-only routes
  if (isAdminRoute(req) && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 7. Role check for protected routes
  if (isMemberRoute(req) && !['admin', 'member'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};