import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for cross-origin handling
  experimental: {
    // Allow Server Actions from different origins (for LTI iframe)
    serverActions: {
      allowedOrigins: [
        "localhost:3000", // Canvas
        "localhost:3001", // Our app
        "127.0.0.1:3000",
        "127.0.0.1:3001",
      ],
    },
  },
  
  // Headers configuration for iframe embedding
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL", // Allow iframe embedding
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' localhost:3000 127.0.0.1:3000", // Allow Canvas to embed us
          },
        ],
      },
    ];
  },
};

export default nextConfig;
