import { compile } from '@xaendar/compiler';
import { compileServer } from '@xaendar/ssr-compiler';
import type { ViteDevServer } from 'vite';
import { generateServerStyleModule, generateServerTemplateModule, generateStyleModule, generateTemplateModule } from '../plugin/plugin-utils/plugin.utils';
import type { XaendarPluginStrategy } from '../types/plugin-strategy.type';

/**
 * The strategy of the browser: templates compiled into DOM operations registered with `_defineRender` of
 * `@xaendar/core`, stylesheets as `CSSStyleSheet`, everything type-checked.
 */
export const CLIENT_STRATEGY: XaendarPluginStrategy = {
  compile,
  generateStyleModule,
  generateTemplateModule,
  registration: {
    define: '_defineRender',
    module: '@xaendar/core',
    styleExport: 'sheet'
  },
  typeCheck: true
};

/**
 * The strategy of the server rendering: templates compiled into functions writing HTML registered with
 * `_defineServerRender` of `@xaendar/ssr`, stylesheets as text, nothing type-checked, and the page reloaded when a
 * module only the server evaluates changes.
 */
export const SERVER_STRATEGY: XaendarPluginStrategy = {
  compile: compileServer,
  generateStyleModule: generateServerStyleModule,
  generateTemplateModule: generateServerTemplateModule,
  registration: {
    define: '_defineServerRender',
    module: '@xaendar/ssr',
    styleExport: 'css'
  },
  typeCheck: false,
  hotUpdate: reloadPageForServerModule
};

/**
 * The `hotUpdate` of the strategy of the server rendering: a module only the server evaluates, such as its entry,
 * changes no module of the browser, so the page is reloaded, to be rendered again.
 *
 * @param file - The changed file, evaluated by the server.
 * @param server - The dev server.
 */
function reloadPageForServerModule(file: string, server: ViteDevServer): void {
  const client = server.environments.client;
  if (!client.moduleGraph.getModulesByFile(file)?.size) {
    client.hot.send({ type: 'full-reload' });
  }
}