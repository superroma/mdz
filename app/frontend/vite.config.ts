import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwind()],
  envDir: '../..',
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || '3001'}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
