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
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
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
