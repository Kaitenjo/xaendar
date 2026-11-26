import { defineConfig } from 'vite';

/*
  The Lit page of the framework comparison. The build goes into the public folder of the documentation site, which
  shows it in an iframe.
*/
export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: '../../public/comparison/lit'
  }
});
