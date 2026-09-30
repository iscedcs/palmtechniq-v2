/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === "true",
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Canonical host: www.
      //
      // Both spellings previously resolved, which split ranking signals and let
      // the sitemap be served on www while listing non-www URLs inside it —
      // Google discovered 11 of 75 URLs and stopped re-reading the file. A 301
      // means there is exactly one spelling of every page.
      {
        source: "/:path*",
        has: [{ type: "host", value: "palmtechniq.com" }],
        destination: "https://www.palmtechniq.com/:path*",
        permanent: true,
      },
      {
        source: "/certificate/:id",
        destination: "/verify-certificate?code=:id",
        permanent: true,
      },
    ];
  },
  async headers() {
    // The Content-Security-Policy is NOT set here. It is built per request in
    // proxy.ts, because a nonce has to be generated per request and a static
    // header cannot carry one. Two CSP headers would both be enforced — the
    // browser takes the intersection — so the policy lives in exactly one
    // place. The headers below are static and safe to set here.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(true)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // The service worker must never be cached by the browser or a CDN: the
      // browser re-checks it on each visit, and a stale copy would keep serving
      // an old offline page. The CSP is the one Next's PWA guide recommends for
      // the worker script itself.
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
