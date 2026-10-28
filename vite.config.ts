import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages 的项目站点运行在 https://<user>.github.io/<repo>/ 子路径下，
  // 构建时统一用相对路径，仓库改名或换自定义域名都不用改配置
  base: command === 'build' ? './' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入 SCSS 变量，组件内可直接使用，无需重复 @use
        additionalData: '@use "@/styles/variables.scss" as *;\n',
      },
    },
  },
  build: {
    // 单页应用只有一份入口，卡面图片与字体都由 Vite 处理成独立资源
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
}))
