import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    host: "0.0.0.0",
    port: "3001",
    proxy: {
      '/api': {
        target: 'https://xkmvwivzjdqv.sealosbja.site',
        changeOrigin: true,
        secure: false
      }
    },
    allowedHosts: [
      'zdvstegdxdfm.sealosbja.site',
      'xkmvwivzjdqv.sealosbja.site',
      'xfpeuhaouomq.sealosbja.site'
    ]
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/variables" as *;`
      }
    }
  }
})
