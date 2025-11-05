import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(), // Add React plugin
    crx({ manifest })
  ],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB to suppress warning
    rollupOptions: {
      output: {
        // Simplified chunking for React
        manualChunks: (id) => {
          // Keep React ecosystem together
          if (id.includes('react')) {
            return 'react-vendor';
          }
          // Keep jQuery separate  
          if (id.includes('jquery')) {
            return 'jquery';
          }
          return undefined;
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})