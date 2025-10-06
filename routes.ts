/**
 * These routes don't require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/courses",
  "/courses/[slug]", // Individual course pages are public for viewing
  "/mentorship", // External mentorship page is public
  "/apply", // Application page is public
  "/terms",
  "/privacy",
  "/api/chat",
  "/blog",
  "/docs",
  "/faq",
  "/podcast",
  "/awareness-program",
];

/**
 * These are array of routes that require authentication
 * These routes will redirect logged in users to their dashboard
 * @type {string[]}
 */
export const authRoutes = [
  "/login",
  "/signup",
  "/error",
  "/verify",
  "/forgot-password",
  "/new-password",
];

/**
 * Protected routes that require authentication
 * @type {string[]}
 */
export const protectedRoutes = [
  "/student",
  "/student/courses",
  "/student/mentorship",
  "/student/assignments",
  "/student/profile",
  "/student/progress",
  "/tutor",
  "/tutor/courses",
  "/tutor/courses/create",
  "/tutor/courses/[courseId]/edit",
  "/tutor/mentorship",
  "/tutor/projects",
  "/tutor/profile",
  "/tutor/wallet",
  "/tutor/reviews",
  "/admin",
  "/settings",
];

/**
 * Admin-only routes
 * @type {string[]}
 */
export const adminRoutes = ["/admin"];

/**
 * Tutor-only routes
 * @type {string[]}
 */
export const tutorRoutes = [
  "/tutor",
  "/tutor/courses",
  "/tutor/courses/create",
  "/tutor/courses/[courseId]/edit",
  "/tutor/mentorship",
  "/tutor/projects",
  "/tutor/profile",
  "/tutor/wallet",
  "/tutor/reviews",
];

/**
 * Student-only routes
 * @type {string[]}
 */
export const studentRoutes = [
  "/student",
  "/student/courses",
  "/student/mentorship",
  "/student/assignments",
  "/student/profile",
  "/student/progress",
];

/**
 * Routes that require payment/enrollment
 * @type {string[]}
 */
export const paymentRoutes = [
  "/courses/[slug]/learn", // Learning interface requires enrollment
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in based on user role
 * @type {Record<string, string>}
 */
export type UserRole = "STUDENT" | "TUTOR" | "ADMIN" | "USER";
export const DEFAULT_LOGIN_REDIRECTS: Record<UserRole, string> & {
  USER: string;
} = {
  STUDENT: "/student",
  TUTOR: "/tutor",
  ADMIN: "/admin",
  USER: "/courses",
};

/**
 * The default redirect path for general login
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/courses";
