import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description:
    "The page you're looking for doesn't exist or has been moved. Browse our courses, mentorship programs, and more.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-[80vh] pt-32 pb-8 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 text-8xl font-bold text-emerald-500/20">404</div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mb-8 max-w-md text-foreground">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or no longer exists.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
            Go Home
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
