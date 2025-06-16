// vite.config.js - Fixed with API proxy to Express server
import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          svarog: ['svarog-ui-core'],
          storyblok: ['storyblok-js-client'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    // PROXY API CALLS TO EXPRESS SERVER
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Express server on port 3001
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🔥 Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 Proxying API request:', req.method, req.url);
          });
        },
      },
      '/health': {
        target: 'http://localhost:3001', // Health endpoint too
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
