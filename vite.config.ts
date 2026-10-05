import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// PhotoMax Vite configuration with strict security headers.
//
// Base path strategy:
//   - Dev server  (`vite`)             → `/`           — works at http://localhost:5173/
//   - Production  (`vite build`)      → `/Photo-Max/` — matches GitHub Pages project URL
//                                         (https://guidevin.github.io/Photo-Max/)
//   - Other hosts (Vercel, Netlify…)  → override with VITE_BASE=/ npm run build
const REPO_NAME = 'Photo-Max';
const base =
  process.env.VITE_BASE ||
  (process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/');

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
    strictPort: false,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
});