import type { NextConfig } from "next";

// better-sqlite3 是 native 模块, 必须在 server 端外部依赖
// 中, 否则 Webpack/Turbopack 会把它打包导致 .node 二进制找不到.
//
// allowedDevOrigins 放行 e2b sandbox 反代域名 (*.e2b.app / *.e2b.dev).
// Next 15.2.2+ 在 dev 模式对 _next/* 端点 (含 webpack-hmr WebSocket) 启用 cross-origin
// 校验, 默认仅允许 localhost; e2b sandbox 通过子域名反代 3000 端口, origin 非 localhost
// 会被拒, 表现为浏览器控制台不断刷 wss 连接失败. 详见 vercel/next.js#77253.
const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
};

export default nextConfig;
