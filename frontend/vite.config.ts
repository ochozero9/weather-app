import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use relative paths for Tauri, /weather-app/ for GitHub Pages
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined

// https://vite.dev/config/
export default defineConfig({
  base: isTauri ? './' : '/weather-app/',
  plugins: [react()],
  server: {
    host: true, // Listen on all network interfaces
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React into its own chunk for better caching
          'vendor-react': ['react', 'react-dom'],
          // Separate icons library
          'vendor-icons': ['react-icons'],
        },
      },
    },
  },
})
