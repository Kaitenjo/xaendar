import { qwikVite } from '@builder.io/qwik/optimizer';
import { defineConfig } from 'vite';

/*
  A client-only Qwik application, not a Qwik City site: `csr: true` drops the server entry and the service
  worker, and `src/main.tsx` renders the tree itself. It needs no Xaendar plugin either, since the component
  arrives already built, as one ES module, in the @xaendar-demo/qty-picker package. The build goes straight
  into the public folder of the documentation site, which embeds it in an iframe, so every url it emits stays
  relative to the page.
*/
export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: '../../public/demos/qwik'
  },
  plugins: [
    qwikVite({ csr: true })
  ]
});
