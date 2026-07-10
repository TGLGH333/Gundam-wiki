import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
