import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: 'terser',
  target: 'node22',
  format: ['esm'],
});
