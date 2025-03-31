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
    // base: process.env.VITE_BASE_PATH || '/Trendify' // Ensures fallback
  }
})
