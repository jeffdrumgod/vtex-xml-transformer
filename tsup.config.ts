import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: false,
  clean: true,
  format: ['cjs'],
  dts: false,
  outDir: 'build',
  minify: false,
  target: 'esnext',
  outExtension() {
    return {
      js: `.js`,
    };
  },
});
