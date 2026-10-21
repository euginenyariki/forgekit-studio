import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Placeholders are quoted so the rendered configuration stays valid TypeScript.
const devPort = Number('{{port}}');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: devPort,
    strictPort: true,
  },
  preview: {
    port: devPort + 1,
    strictPort: false,
  },
  build: {
    sourcemap: true,
  },
});
