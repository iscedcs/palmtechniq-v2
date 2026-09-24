import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  DEFAULT_LOGIN_REDIRECT,
  DEFAULT_LOGIN_REDIRECTS,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  protectedRoutes,
  adminRoutes,
  tutorRoutes,
  mentorRoutes,
  studentRoutes,
  paymentRoutes,
  superiorRoutes,
  documentationRoutes,
} from "@/routes";
import { NextResponse, type NextRequest } from "next/server";

// Initialize authentication with the provided configuration
const { auth } = NextAuth(authConfig);

/**
 * Content Security Policy, per request, with a nonce.
 *
 * The policy used to live in next.config.mjs and allowed `'unsafe-inline'`
 * and `'unsafe-eval'` on scripts, which meant it stopped almost nothing: the
 * whole point of a script CSP is to refuse injected inline script, and
 * `'unsafe-inline'` permits exactly that.
 *
 * Now every request gets a fresh nonce. Next.js reads it from this header
 * during render and stamps it onto the framework bundles, its own inline
 * scripts, and any <Script> given a `nonce` prop. Injected markup has no way
 * to guess it.
 *
 * `'strict-dynamic'` lets a script we trusted by nonce load further scripts
 * (this is how gtag, the Pixel and Mixpanel still work) while ignoring the
 * host allow-list, which is the weaker mechanism it replaces.
 *
 * `'unsafe-eval'` stays in development only: React uses eval there to rebuild
 * server stack traces. Production needs none.
 *
 * `style-src` keeps `'unsafe-inline'` deliberately. framer-motion writes
 * inline style attributes on every animated element, so removing it would
 * break animation across the site, and injected CSS is a far smaller risk
 * than injected script.
 */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https:",
    "media-src 'self' blob: https:",
    "img-src 'self' data: blob: https: http://localhost:*",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss: http://localhost:* https://localhost:*",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://isce-image.fra1.digitaloceanspaces.com https://www.facebook.com https://www.googletagmanager.com",
    "form-action 'self' https://www.facebook.com",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ].join("; ");
}

/**
 * Continue to the app, carrying the nonce.
 *
 * Every "allow" path has to go through here rather than `return;`: the nonce
 * must reach the renderer on the *request* headers, and the policy must reach
 * the browser on the *response* headers. A bare return sends neither, and the
 * page would then load with no CSP at all.
 */
function allow(req: NextRequest, nonce: string): NextResponse {
  const requestHeaders = new Headers(req.headers);
  const csp = buildCsp(nonce);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export default auth((req) => {
  const { nextUrl } = req;
  const hostname = req.headers.get("host") || "";
  // Fresh per request. Predictable nonces are no better than 'unsafe-inline'.
  const nonce = crypto.randomUUID().replace(/-/g, "");

  // If accessing via bootcamp subdomain (e.g. bootcamp.palmtechniq.com or bootcamp.localhost), rewrite to /bootcamp path
  if (
    hostname.startsWith("bootcamp.") &&
    !nextUrl.pathname.startsWith("/bootcamp") &&
    !nextUrl.pathname.startsWith("/api") &&
    !nextUrl.pathname.startsWith("/_next")
  ) {
    const rewritten = NextResponse.rewrite(
      new URL(
        `/bootcamp${nextUrl.pathname === "/" ? "" : nextUrl.pathname}`,
        req.url,
      ),
    );
    rewritten.headers.set("Content-Security-Policy", buildCsp(nonce));
    return rewritten;
  }

  const authObj = req.auth;
  const isLoggedIn = !!req.auth;

  const userRole = authObj?.role;

  // Helper function to check if a route matches patterns with dynamic segments
  const matchesRoute = (pathname: string, routes: string[]): boolean => {
    return routes.some((route) => {
      // Convert route pattern to regex (e.g., "/courses/[slug]" -> "/courses/[^/]+")
      const pattern = route.replace(/\[[\w]+\]/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname) || pathname === route;
    });
  };

  // Check route types
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = matchesRoute(nextUrl.pathname, publicRoutes);
  const isAuthRoute = matchesRoute(nextUrl.pathname, authRoutes);
  const isProtectedRoute = matchesRoute(nextUrl.pathname, protectedRoutes);
  const isAdminRoute = matchesRoute(nextUrl.pathname, adminRoutes);
  const isTutorRoute = matchesRoute(nextUrl.pathname, tutorRoutes);
  const isMentorRoute = matchesRoute(nextUrl.pathname, mentorRoutes);
  const isStudentRoute = matchesRoute(nextUrl.pathname, studentRoutes);
  const isPaymentRoute = matchesRoute(nextUrl.pathname, paymentRoutes);
  const isSuperiorRoute =
    matchesRoute(nextUrl.pathname, superiorRoutes) ||
    nextUrl.pathname.startsWith("/superior");
  const isDocumentationRoute =
    matchesRoute(nextUrl.pathname, documentationRoutes) ||
    nextUrl.pathname.startsWith("/documentation");
  const isChangePasswordRoute = nextUrl.pathname === "/change-password";

  // Allow API authentication routes to proceed
  if (isApiAuthRoute) {
    return allow(req, nonce);
  }

  // Handle authentication routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      // Redirect logged-in users away from auth pages to their dashboard
      const redirectPath = userRole
        ? DEFAULT_LOGIN_REDIRECTS[
            userRole as keyof typeof DEFAULT_LOGIN_REDIRECTS
          ]
        : DEFAULT_LOGIN_REDIRECT;

      return Response.redirect(new URL(redirectPath, nextUrl));
    }
    return allow(req, nonce); // signed-out users may see auth pages
  }

  // Handle public routes
  if (isPublicRoute) {
    return allow(req, nonce); // public routes
  }

  // Handle change-password route
  if (isChangePasswordRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/login", nextUrl));
    }
    // Allow access - the page itself checks mustChangePassword
    return allow(req, nonce);
  }

  // Handle protected routes
  if (
    isProtectedRoute ||
    isPaymentRoute ||
    isDocumentationRoute ||
    isSuperiorRoute
  ) {
    if (!isLoggedIn) {
      // Redirect to login with callback URL
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return Response.redirect(
        new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl),
      );
    }

    // Forced password change: redirect to /change-password if mustChangePassword is true
    const mustChangePassword = (authObj as any)?.mustChangePassword;
    if (mustChangePassword && !isChangePasswordRoute) {
      return Response.redirect(new URL("/change-password", nextUrl));
    }

    // Role-based access control for protected routes
    if (isAdminRoute && userRole !== "ADMIN" && userRole !== "SUPERIOR") {
      return Response.redirect(new URL("/courses", nextUrl));
    }

    // Superior routes: only SUPERIOR can access
    if (isSuperiorRoute && userRole !== "SUPERIOR") {
      const redirectPath = userRole
        ? DEFAULT_LOGIN_REDIRECTS[
            userRole as keyof typeof DEFAULT_LOGIN_REDIRECTS
          ]
        : DEFAULT_LOGIN_REDIRECT;
      return Response.redirect(new URL(redirectPath, nextUrl));
    }

    // Documentation routes: only TESTER and SUPERIOR can access
    if (
      isDocumentationRoute &&
      userRole !== "TESTER" &&
      userRole !== "SUPERIOR"
    ) {
      const redirectPath = userRole
        ? DEFAULT_LOGIN_REDIRECTS[
            userRole as keyof typeof DEFAULT_LOGIN_REDIRECTS
          ]
        : DEFAULT_LOGIN_REDIRECT;
      return Response.redirect(new URL(redirectPath, nextUrl));
    }

    if (
      isTutorRoute &&
      userRole !== "TUTOR" &&
      userRole !== "MENTOR" &&
      userRole !== "ADMIN"
    ) {
      return Response.redirect(new URL("/courses", nextUrl));
    }

    if (
      isMentorRoute &&
      userRole !== "MENTOR" &&
      userRole !== "TUTOR" &&
      userRole !== "ADMIN"
    ) {
      return Response.redirect(new URL("/courses", nextUrl));
    }

    if (isStudentRoute && userRole !== "STUDENT") {
      const redirectPath = userRole
        ? DEFAULT_LOGIN_REDIRECTS[
            userRole as keyof typeof DEFAULT_LOGIN_REDIRECTS
          ]
        : DEFAULT_LOGIN_REDIRECT;
      return Response.redirect(new URL(redirectPath, nextUrl));
    }

    return allow(req, nonce);
  }

  // Handle role-based redirects for dashboard routes
  if (nextUrl.pathname === "/dashboard") {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/login", nextUrl));
    }

    // Redirect to role-specific dashboard
    const redirectPath = userRole
      ? DEFAULT_LOGIN_REDIRECTS[
          userRole as keyof typeof DEFAULT_LOGIN_REDIRECTS
        ]
      : DEFAULT_LOGIN_REDIRECT;
    return Response.redirect(new URL(redirectPath, nextUrl));
  }

  // Default: allow the request to proceed
  return allow(req, nonce);
});

// Configuration for the middleware to match specific routes
export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    // Specifically match protected route patterns
    "/student/:path*",
    "/tutor/:path*",
    "/mentor/:path*",
    "/admin/:path*",
    "/superior/:path*",
    "/documentation/:path*",
    "/courses/:path*/learn",
    "/settings/:path*",
    "/auth/:path*",
    "/change-password",
  ],
};
