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
  async rewrites() {
    return [
      // 代理 /login 到 Vue 登录页（Vite 服务），同源访问，localStorage 共享
      { source: "/login", destination: "http://localhost:5173/login/" },
      { source: "/login/:path*", destination: "http://localhost:5173/login/:path*" },
    ];
  },
};

export default nextConfig;
