import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/*
  A plain React application. It needs no Xaendar plugin: the component arrives already built, as one ES module,
  in the @xaendar-demo/qty-picker package. The build goes straight into the public folder of the documentation
  site, which embeds it in an iframe.
*/
export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: '../../public/demos/react'
  },
  plugins: [react()]
});
