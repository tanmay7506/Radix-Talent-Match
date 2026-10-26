import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.BACKEND_URL || 'http://localhost:8001'

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
      port: 5173,
      proxy: {
        '/profile': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/talent-check': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/jd': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
