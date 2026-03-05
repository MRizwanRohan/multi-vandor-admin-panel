import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    // HMR settings to prevent empty page issues
    hmr: {
      overlay: true,
      timeout: 5000,
    },
    // Watch settings for better file change detection
    watch: {
      usePolling: false,
      interval: 100,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://localhost:8001',  // PHP server handles symlinks correctly
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['@headlessui/vue'],
          'vendor-charts': ['chart.js', 'vue-chartjs'],
          'vendor-utils': ['axios', 'dayjs', 'zod'],
          'vendor-forms': ['vee-validate', '@vee-validate/zod'],
          'vendor-i18n': ['vue-i18n'],
          'vendor-editor': ['@tiptap/vue-3', '@tiptap/starter-kit', '@tiptap/pm'],
        },
      },
    },
  },
})
