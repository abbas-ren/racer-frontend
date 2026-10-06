import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import compression from 'vite-plugin-compression';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  server: {
    port: 5006,
  },
  plugins: [
    react(),
    svgr(),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  resolve: {
    alias: {
      services: resolve(__dirname, 'src/services'),
      components: resolve(__dirname, 'src/components'),
      hooks: resolve(__dirname, 'src/hooks'),
      assets: resolve(__dirname, 'src/assets'),
      pages: resolve(__dirname, 'src/pages'),
      store: resolve(__dirname, 'src/store'),
      styles: resolve(__dirname, 'src/styles'),
      routes: resolve(__dirname, 'src/routes'),
      utils: resolve(__dirname, 'src/utils'),
      types: resolve(__dirname, 'src/types'),
      typesCustom: resolve(__dirname, 'src/types'),
      constants: resolve(__dirname, 'src/constants'),
      context: resolve(__dirname, 'src/context'),
      test: resolve(__dirname, 'src/test'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'mui-core': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          'react-vendors': ['react', 'react-dom', 'react-router'],
          redux: ['@reduxjs/toolkit', 'redux', 'redux-persist', 'redux-saga'],
          helpers: ['axios', 'clsx'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
