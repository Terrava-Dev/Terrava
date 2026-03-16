import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // ← exposes to your local network (iPhone access)
    port: 5173,
  },
})