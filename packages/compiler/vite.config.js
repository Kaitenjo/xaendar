import path from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    target: 'esnext',
    lib: {
      entry: path.resolve(__dirname, 'src/public-api.ts'),
      name: 'XendarCompiler',
      fileName: format => `xendar-compiler.${format}.js`
    },
    outDir: path.resolve(__dirname, '../../dist'),
    rollupOptions: {
      output: {
        dir: path.resolve(__dirname, '../../dist')
      },
      external: [
        '@xendar/compiler'
      ]
    }
  },
  esbuild: {
    target: 'es2024'
  },
  plugins: [
    tsconfigPaths()
  ]
});
