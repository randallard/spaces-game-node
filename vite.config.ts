import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Use base path for GitHub Pages, but not for Vercel
  base: process.env.VERCEL ? '/' : (mode === 'production' ? '/spaces-game-node/' : '/'),
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'validation': ['zod'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}))
