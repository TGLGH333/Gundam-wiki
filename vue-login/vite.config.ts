import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 移除 Vite 自动注入的 @vite/client 脚本，避免通过 Next.js rewrites 代理时
// WebSocket 连接失败的报错（HMR 在 sandbox 代理环境下不可用）
function stripViteClient() {
  return {
    name: 'strip-vite-client',
    transformIndexHtml(html: string) {
      return html.replace(
        /<script type="module" src="[^"]*\/@vite\/client[^"]*"[^>]*><\/script>\s*/g,
        '',
      )
    },
  }
}

export default defineConfig({
  plugins: [vue(), stripViteClient()],
  // 通过 Next.js rewrites 代理 /login 路径到本服务，需设置 base 让资源路径一致
  base: '/login/',
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
})
