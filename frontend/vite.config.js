import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/aiinterview/',
  server: {
    port: 8054,
    open: true
  }
})
