import type { SourceFile } from '../../core/sources/source-files.utils';

/**
 * The snippet `bootstrap.ts`, shown by the page installation.
 */
export const INSTALLATION_BOOTSTRAP: SourceFile = {
  name: 'bootstrap.ts',
  lang: 'ts',
  code: `import { MyAppRootComponent } from './my-app-root/my-app-root.xd.component';

// Importing the class evaluates its @WebComponent decorator, which defines the custom element.
// Logging it keeps the import from being removed as unused.
console.log(MyAppRootComponent);`
};

/**
 * The snippet `main.ts`, shown by the page installation and the API reference of signals.
 */
export const MAIN: SourceFile = {
  name: 'main.ts',
  lang: 'ts',
  code: `import { loadSignals } from '@xaendar/signals';

// Installs the global \`Signal\` (TC39 proposal polyfill) used by @xaendar/core
loadSignals();
// Loaded dynamically: a static import would be evaluated before loadSignals() runs
await import('./bootstrap');`
};

/**
 * The snippet `my-app-root.xd.component.ts`, shown by the page installation.
 */
export const MY_APP_ROOT_XD_COMPONENT: SourceFile = {
  name: 'my-app-root.xd.component.ts',
  lang: 'ts',
  code: `import { CustomElement, WebComponent } from '@xaendar/core';

@WebComponent({
  selector: 'my-app-root',
  styleUrl: './my-app-root.xd.component.css',
  templateUrl: './my-app-root.xd.component.html'
})
export class MyAppRootComponent extends CustomElement {

}`
};

/**
 * The snippet `vite.config.ts`, shown by the page installation and the API reference of build-tools and the page tools/build.
 */
export const INSTALLATION_VITE_CONFIG: SourceFile = {
  name: 'vite.config.ts',
  lang: 'ts',
  code: `import babel from '@rolldown/plugin-babel';
import { xaendarPlugin } from '@xaendar/build-tools';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  plugins: [
    // 1. Transpiles the standard (2023-11) decorators: @WebComponent, @Property, @Event, ...
    babel({
      presets: [{
        preset: () => ({ plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]] }),
        rolldown: { filter: { code: '@' } }
      }]
    }),
    // 2. Compiles the templates and the styles, and type-checks the templates.
    //    It must come after the decorators transform.
    xaendarPlugin()
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});`
};
