import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/*
  The React page of the framework comparison. The build goes into the public folder of the documentation site,
  which shows it in an iframe.
*/
export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: '../../public/comparison/react'
  },
  plugins: [react()]
});
