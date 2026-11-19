import { loadSignals } from '@xaendar/signals';
import { loadServerDom } from '@xaendar/ssr/dom';

loadSignals();
loadServerDom();
await import('./core/i18n/i18n').then(m => m.startI18n());

const { renderToString } = await import('@xaendar/ssr');
const { DocsAppComponent } = await import('./shell/docs-app/docs-app.xd.component');
// The server runs no effect, so the outlet renders only a page loaded before it
await import('./core/pages/pages').then(pages => pages.loadInitialPage());

/**
 * Renders the page of a URL on the server: the HTML replacing `<!--xd-ssr-->` in `index.html`.
 *
 * @param _url - The path of the page, with its query string (`/products/42?ref=mail`), to render the one of a route.
 * @returns The HTML of the root component.
 */
export function render(_url: string): Promise<string> {
  return renderToString(DocsAppComponent);
}
