/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: process.env.SKIP_LINT === "true",
  },
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === "true",
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://connect.facebook.net https://www.googletagmanager.com https://cdn.mxpnl.com https://localhost:* http://localhost:* ",
      "style-src 'self' 'unsafe-inline' https:",
      "media-src 'self' blob: https:",
      "img-src 'self' data: blob: https://connect.facebook.net https://www.googletagmanager.com https://www.facebook.com https: http://localhost:*",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss: https://www.facebook.com https://connect.facebook.net https://www.google-analytics.com https://www.googletagmanager.com   https://api.mixpanel.com https://api-js.mixpanel.com http://localhost:* https://localhost:*",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.facebook.com https://www.googletagmanager.com",
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

  webpack: (config, { isServer, nextRuntime }) => {
    const isEdge = nextRuntime === "edge";
    if (!isServer || isEdge) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),

        // Your server-only files
        "@/lib/db": false,
        "@/lib/mail": false,
        "@/lib/password": false,

        // Node-only deps that often get pulled in transitively
        resend: false,
        "@react-email/render": false,
        "@react-email/components": false,
        "react-email": false,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  api: {
    bodyParser: {
      sizeLimit: "500mb", // Allow up to 500MB for API request bodies (e.g., video uploads)
    },
  },
};

export default nextConfig;
