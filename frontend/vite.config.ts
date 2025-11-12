import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/amico-app/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://amico-management-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Optimizaciones de build
    target: 'es2015',
    minify: 'esbuild', // Usar esbuild (más rápido y no requiere terser)
    // Para producción final, instalar terser: npm install -D terser
    // Configurar chunks para separar dependencias grandes
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React y React DOM (vendor principal)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Separar XLSX (librería pesada) - solo se carga al exportar
          'xlsx': ['xlsx'],

          // Separar librería de gráficos si existe
          'charts': ['recharts'],

          // Separar iconos
          'icons': ['lucide-react'],

          // Separar React Query
          'react-query': ['@tanstack/react-query'],

          // Separar Socket.io
          'socket': ['socket.io-client'],
        },
      },
    },
    // Configurar límites de chunks
    chunkSizeWarningLimit: 1000, // 1MB
    // Optimizar assets
    assetsInlineLimit: 4096, // 4KB - inlinear assets pequeños
  },
  // Optimizaciones de desarrollo
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
    ],
    exclude: ['xlsx'], // Excluir XLSX del pre-bundling
  },
})
