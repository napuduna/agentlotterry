import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-icons')) return 'icons';
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('axios')) return 'http';
          return 'vendor';
        }
      }
    }
  }
});
