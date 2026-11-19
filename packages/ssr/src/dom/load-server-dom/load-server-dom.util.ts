import { ServerCustomElementRegistry } from '../server-custom-element-registry/server-custom-element-registry';
import { ServerHTMLElement } from '../server-html-element/server-html-element';

/**
 * Installs the server DOM: the globals `HTMLElement` and `customElements` the modules of the components need when they
 * are evaluated, since a component extends `HTMLElement` and `@WebComponent` defines it in `customElements`. A global
 * already there, such as the one of a browser or of a DOM emulated by the tests, is kept.
 *
 * It must run before the modules of `@xaendar/core` and of the components are evaluated: the entry of the server calls
 * it first, and imports them afterwards, as it does with `loadSignals()`.
 *
 * @example
 * ```ts
 * import { loadSignals } from '@xaendar/signals';
 * import { loadServerDom } from '@xaendar/ssr/dom';
 *
 * loadSignals();
 * loadServerDom();
 *
 * const { renderToString } = await import('@xaendar/ssr');
 * const { AppRootComponent } = await import('./app-root/app-root.xd.component');
 * ```
 */
export function loadServerDom(): void {
  globalThis.customElements ??= new ServerCustomElementRegistry() as unknown as CustomElementRegistry;
  globalThis.HTMLElement ??= ServerHTMLElement as unknown as typeof HTMLElement;
}
