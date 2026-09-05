import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.lhr.life'],
    proxy: {
      '/api': 'http://localhost:5001',
      '/auth': 'http://localhost:5001',
      '/uploads': 'http://localhost:5001',
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
      },
    },
  },
})