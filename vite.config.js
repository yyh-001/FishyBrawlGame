import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [
      vue(),
    ],
    server: {
      host: "0.0.0.0",
      port: "3001",
      proxy: {
        '/api': 'http://localhost:3000',
        '/socket.io': {
          target: 'http://localhost:3000',
          ws: true
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
        '@': path.resolve(__dirname, './src')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/variables" as *;`
        }
      }
    }
  }
})
