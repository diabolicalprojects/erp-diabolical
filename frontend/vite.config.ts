import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        // El bundle era un único chunk de ~947 kB: cualquier cambio en el código
        // de la app invalidaba también React, Recharts y framer-motion en la
        // caché del navegador. Separarlos hace que las dependencias, que casi
        // nunca cambian, se sirvan desde caché entre despliegues.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['framer-motion']
        }
      }
    }
  }
})
