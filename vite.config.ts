import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    crx({ manifest })
  ],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000 // Increase limit to 1MB to suppress warning
  },
  define: {
    global: 'globalThis',
  }
})