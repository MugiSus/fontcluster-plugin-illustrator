import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import solidPlugin from 'vite-plugin-solid';

const CEP_RUNTIME_TARGET = 'es2019';

export default defineConfig({
  base: './',
  plugins: [solidPlugin(), tailwindcss(), viteSingleFile()],
  server: {
    port: 3000,
  },
  build: {
    target: CEP_RUNTIME_TARGET,
    emptyOutDir: false,
  },
});
