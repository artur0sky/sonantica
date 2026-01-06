import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disabled due to tsconfig issues, use tsc for types
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'zustand'],
});
