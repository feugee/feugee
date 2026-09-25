import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

import { securityHeaders } from "./src/securityHeaders";

const nextConfig: NextConfig = {
  // The production image serves `.next/standalone/server.js` (see Dockerfile)
  // — a minimal traced server without a full node_modules install.
  output: "standalone",
  // Two root layouts (public site and CMS Dashboard) leave no single layout
  // to compose unmatched-URL 404s from — global-not-found.tsx serves those.
  experimental: {
    globalNotFound: true,
  },
  images: {
    // localhost resolves to a loopback IP, which the optimizer blocks as an
    // SSRF guard by default — safe here since remotePatterns below already
    // restricts it to this app's own asset route, and prod never hits this.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      // Local dev serves assets from the app itself over a non-default port —
      // remotePatterns matches port '' (the default) unless one is given, so
      // omitting it here would 400 every http://localhost:3000/... asset URL.
      { protocol: "http", hostname: "localhost", port: "3000" },
      { protocol: "https", hostname: "feugee.com" },
      ...(process.env.R2_PUBLIC_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.R2_PUBLIC_URL).hostname,
            },
          ]
        : []),
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withPayload(nextConfig);
