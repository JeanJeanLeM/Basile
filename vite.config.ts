import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // COOP avec same-origin-allow-popups permet les popups Firebase
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // COEP require-corp peut causer des problèmes, on le retire
      // 'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
