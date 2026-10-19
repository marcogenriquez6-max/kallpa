import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El panel interno se sirve bajo /sistema/ desde nginx (carpeta ../landing).
// En desarrollo, /api se redirige al backend NestJS en el puerto 3000.
export default defineConfig({
  base: '/sistema/',
  plugins: [react()],
  build: {
    outDir: '../landing/sistema',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
