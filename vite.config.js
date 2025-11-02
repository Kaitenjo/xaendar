import { defineConfig } from 'vite';
import tsconfigPaths from "vite-tsconfig-paths";

const external = [
  '@xendar/common',
  '@xendar/core',
  '@xendar/components'
]

export default defineConfig({
  root: './src',
  esbuild: {
    target: 'es2022',
  },
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: './src/index.html'
    },
    external
  },
  server: {
    open: true
  },
  plugins: [
    tsconfigPaths()
  ]
});