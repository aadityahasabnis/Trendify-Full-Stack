import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
  // const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    // base: process.env.VITE_BASE_PATH || '/Trendify', // Ensures fallback
    build: {
      rollupOptions: {
        external: ['react-icons/fa'],
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Adjust the limit as needed
    }
  }
})
