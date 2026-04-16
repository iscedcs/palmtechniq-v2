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
      {
        source: "/certificate/:id",
        destination: "/verify-certificate?code=:id",
        permanent: true,
      },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://connect.facebook.net https://isce-image.fra1.digitaloceanspaces.com https://isce-image.fra1.digitaloceanspaces.com https://www.googletagmanager.com https://cdn.mxpnl.com https://www.youtube.com https://localhost:* http://localhost:* ",
      "style-src 'self' 'unsafe-inline' https:",
      "media-src 'self' blob: https:",
      "img-src 'self' data: blob: https://connect.facebook.net https://isce-image.fra1.digitaloceanspaces.com https://www.googletagmanager.com https://www.facebook.com https://cdn.sanity.io https: http://localhost:*",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss: https://www.facebook.com https://connect.facebook.net https://isce-image.fra1.digitaloceanspaces.com  https://www.google-analytics.com https://www.googletagmanager.com   https://api.mixpanel.com https://api-js.mixpanel.com http://localhost:* https://localhost:*",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://isce-image.fra1.digitaloceanspaces.com https://www.facebook.com https://www.googletagmanager.com",
      "form-action 'self' https://www.facebook.com",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
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
    ];
  },
};

export default nextConfig;
