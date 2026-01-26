import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
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
