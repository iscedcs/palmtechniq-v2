/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
};

export default nextConfig;
