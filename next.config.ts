import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route handlers read the catalog, pools and schedules from disk at runtime.
  outputFileTracingIncludes: {
    "/api/**": ["./data/catalog.json", "./data/generated/**/*.json"],
  },
};

export default nextConfig;
