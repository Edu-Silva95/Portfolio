import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 100
    },
    fs: {
      allow: [
        // allow your project root on Windows (mounted in WSL)
        __dirname,
        path.resolve(__dirname, 'public'),
        path.resolve(__dirname, 'js-dos'),
        path.resolve(__dirname, 'dos')
      ]
    }
  }
})
