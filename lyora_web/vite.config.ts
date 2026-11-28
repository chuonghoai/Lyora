import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@core': path.resolve(import.meta.dirname, './src/core'),
      '@features': path.resolve(import.meta.dirname, './src/features'),
      '@ui': path.resolve(import.meta.dirname, './src/ui'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/posts': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/friends': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // `/friends` cũng là route của SPA. Khi người dùng F5/navigate trực tiếp,
        // để Vite trả index.html thay vì proxy document request sang Nest API.
        bypass: (request) =>
          request.headers.accept?.includes('text/html') ? '/friends' : undefined,
      },
      '/notifications': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/conversations': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
