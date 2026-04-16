import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // 👈 rende il dev server raggiungibile da tutta la rete
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000", // 👈 qui può restare localhost, è dal punto di vista del Mac
        changeOrigin: true,
      },
    },
  },
});
