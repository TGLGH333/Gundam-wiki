import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 通过 Next.js rewrites 代理 /login 路径到本服务，需设置 base 让资源路径一致
  base: '/login/',
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
})
