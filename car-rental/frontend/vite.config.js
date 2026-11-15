import { defineConfig } from 'vite'

const proxy = {
  '/api': {
    target: process.env.CAR_RENTAL_API_URL || 'http://localhost:8080',
    changeOrigin: true,
    configure(proxyServer) {
      proxyServer.on('proxyReq', (outgoing, incoming) => {
        // The browser is calling this Vite server, so only forward genuine cross-origin headers.
        if (incoming.headers.origin === 'http://' + incoming.headers.host) {
          outgoing.removeHeader('origin')
        }
      })
    },
    rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ''),
  },
}

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 3000, proxy },
  preview: { host: '127.0.0.1', port: 3000, proxy },
})
