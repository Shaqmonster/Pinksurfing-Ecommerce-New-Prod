import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Browser → Anvil JSON-RPC (anvil_setBalance) without CORS; no Django needed
      '/anvil-rpc': {
        target: 'http://127.0.0.1:8545',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anvil-rpc/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
