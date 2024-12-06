import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        admin: 'admin.html',
        oxygen: 'oxygen.html',
        reactor: 'reactor.html',
        secret: 'secret.html',
      }
    },
    outDir: 'build'
  }
})
