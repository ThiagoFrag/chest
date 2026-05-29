import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  ssr: {
    external: ['bun:sqlite', '@node-rs/argon2', 'dockerode']
  },
  optimizeDeps: {
    exclude: ['bun:sqlite']
  }
});
