import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

/*
  A plain Vue application. It needs no Xaendar plugin: the component arrives already built, as one ES module,
  in the @xaendar-demo/qty-picker package. The template compiler is told that <ex-qty-picker> is a custom
  element, otherwise Vue looks for a Vue component of that name and warns that it cannot resolve it. The build
  goes straight into the public folder of the documentation site, which embeds it in an iframe.
*/
export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: '../../public/demos/vue'
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag === 'ex-qty-picker'
        }
      }
    })
  ]
});
