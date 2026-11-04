import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `css-minify.ts`, shown by the API reference of build-tools and the page tools/build.
 */
export const CSS_MINIFY: SourceFile = {
  name: 'css-minify.ts',
  lang: 'ts',
  code: `// vite.config.ts — styles are minified with Lightning CSS in builds, unless CSS minification is off
export default defineConfig({
  build: {
    cssMinify: false
  }
});`
};

/**
 * The snippet `injected-code.ts`, shown by the page tools/build.
 */
export const INJECTED_CODE: SourceFile = {
  name: 'injected-code.ts',
  lang: 'ts',
  code: `// What the plugin adds to user-card.xd.component.ts, after Babel has compiled the decorators (simplified)
import { _defineRender } from '@xaendar/core';
import { render as __UserCardComponent_render } from 'virtual:xaendar-template:/src/user-card/user-card.xd.component.html?signals=name&lang.js';
import { sheet as __UserCardComponent_sheet } from 'virtual:xaendar-style?path=%2Fsrc%2Fuser-card%2Fuser-card.xd.component.css&lang.js';

/**
 * The component, as written by you.
 */
class UserCardComponent extends CustomElement {
  static {
    // Runs before the decorators: @WebComponent finds the render function and the stylesheet ready
    _defineRender(this, __UserCardComponent_render, __UserCardComponent_sheet);
  }
}`
};
