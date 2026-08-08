import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8002";
const isMobileBuild = process.env.NEXT_EXPORT === "true";

const nextConfig: NextConfig = {
  // Static export for Capacitor (mobile) builds
  ...(isMobileBuild && {
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },
  }),

  // Rewrites only apply in web server mode (not static export)
  ...(!isMobileBuild && {
    async rewrites() {
      return [
        { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
        { source: "/static/:path*", destination: `${BACKEND_URL}/static/:path*` },
      ];
    },
  }),
};

export default nextConfig;
