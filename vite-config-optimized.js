// Configuração adicional para Vite (se aplicável)
// Adicione estas configurações ao seu vite.config.js ou vite.config.ts

export default {
  build: {
    // Gerar nomes de arquivo únicos para evitar cache
    rollupOptions: {
      output: {
        // Adicionar timestamp aos chunks para evitar cache
        chunkFileNames: 'static/js/[name].[hash].js',
        entryFileNames: 'static/js/[name].[hash].js',
        assetFileNames: 'static/[ext]/[name].[hash].[ext]'
      }
    },
    // Configurações de cache
    cache: false,
    // Otimizações para produção
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Configurações do servidor de desenvolvimento
  server: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  }
}
