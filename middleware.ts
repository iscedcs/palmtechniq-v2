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
  studentRoutes,
  paymentRoutes,
} from "@/routes";

// Initialize authentication with the provided configuration
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
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
  const isStudentRoute = matchesRoute(nextUrl.pathname, studentRoutes);
  const isPaymentRoute = matchesRoute(nextUrl.pathname, paymentRoutes);

  // Allow API authentication routes to proceed
  if (isApiAuthRoute) {
    return;
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
    return; // Allow access to auth routes for non-logged-in users
  }

  // Handle public routes
  if (isPublicRoute) {
    return; // Allow access to public routes
  }

  // Handle protected routes
  if (isProtectedRoute || isPaymentRoute) {
    if (!isLoggedIn) {
      // Redirect to login with callback URL
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return Response.redirect(
        new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
      );
    }

    // Role-based access control for protected routes
    if (isAdminRoute && userRole !== "ADMIN") {
      return Response.redirect(new URL("/courses", nextUrl));
    }

    if (
      isTutorRoute &&
      userRole !== "TUTOR" &&
      userRole !== "MENTOR" &&
      userRole !== "ADMIN"
    ) {
      return Response.redirect(new URL("/courses", nextUrl));
    }

    if (isStudentRoute && userRole !== "STUDENT" && userRole !== "ADMIN") {
      return Response.redirect(new URL("/courses", nextUrl));
    }

    return;
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
  return;
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
    "/admin/:path*",
    "/courses/:path*/learn",
    "/settings/:path*",
    "/auth/:path*",
  ],
};
