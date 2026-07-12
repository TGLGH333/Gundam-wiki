import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev", "*.trae.cn", "*.agent-sandbox-bj-d2-gw.trae.cn", "127.0.0.1"],
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vjpgugicrwwydvkifiam.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_Lwgm4DrMboFdAkLxd-vuNA_pIwmhLYA",
    NEXT_PUBLIC_LOGIN_URL:
      process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login",
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
