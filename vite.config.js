import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { bambuVitePlugin } from './bambuBridge.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), bambuVitePlugin()],
  server: {
    watch: {
      ignored: [
        /(?:public[\\/](?:wallpapers|snapshots)|[\\/]data[\\/])/,
      ],
    },
  },
})
