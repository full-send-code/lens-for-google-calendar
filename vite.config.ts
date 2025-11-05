import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    crx({ manifest })
  ],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB to suppress warning
    rollupOptions: {
      output: {
        // Ensure Vue and Vuetify are in the same chunk to prevent initialization issues
        manualChunks: (id) => {
          // Put Vue ecosystem in one chunk to prevent multiple instances
          if (id.includes('vue') || id.includes('vuetify')) {
            return 'vue-ecosystem';
          }
          // Keep jQuery separate
          if (id.includes('jquery')) {
            return 'jquery';
          }
          // Keep everything else in default chunks
          return undefined;
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})