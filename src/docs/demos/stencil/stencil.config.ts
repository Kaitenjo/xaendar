import type { Config } from '@stencil/core';

/*
  A plain Stencil application. It needs no Xaendar plugin: the component arrives already built, as one ES
  module, in the @xaendar-demo/qty-picker package. The build goes straight into the public folder of the
  documentation site, which embeds it in an iframe, so `baseUrl` keeps every url of the generated index.html
  relative to the page.
*/
export const config: Config = {
  namespace: 'demo',
  globalScript: 'src/global/app.ts',
  sourceMap: false,
  outputTargets: [
    {
      type: 'www',
      dir: '../../public/demos/stencil',
      baseUrl: './',
      copy: [
        { src: 'demo.css' }
      ],
      serviceWorker: null
    }
  ]
};
