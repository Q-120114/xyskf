import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true, // 端口被占时直接报错，避免起多个实例造成混淆
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/vue/') || id.includes('vue-router') || id.includes('pinia')) return 'vue'
          if (id.includes('element-plus')) return 'element'
          if (id.includes('echarts')) return 'echarts'
          return 'vendor'
        }
      }
    }
  }
})
