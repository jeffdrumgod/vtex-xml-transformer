import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true, // Habilita sourcemap para debug
  clean: true,
  format: ['cjs'],
  dts: false,
  outDir: 'build',
  minify: false,
  target: 'esnext',
  onSuccess: 'node build/index.js', // Executa o servidor após compilação
  outExtension() {
    return {
      js: '.js',
    };
  },
});
