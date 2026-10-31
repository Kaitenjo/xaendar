import { toComponentClassName } from '../../../../utils/component-class-name/component-class-name.utils';

/**
 * Generates the content of the module rendering a page on the server, `src/entry-server.ts`, whose path the
 * `xaendar.json` of the project declares.
 *
 * It installs the Signal polyfill and the server DOM, then loads `@xaendar/ssr` and the root component on demand: the
 * modules of `@xaendar/core` need both as soon as they are evaluated, so they must not be imported statically.
 *
 * @param componentName - The root component name derived from the project name (e.g. `my-app-root`).
 * @returns The formatted TypeScript source string.
 */
export function entryServerTs(componentName: string): string {
  const componentClassName = toComponentClassName(componentName);
  return `import { loadSignals } from '@xaendar/signals';
import { loadServerDom } from '@xaendar/ssr/dom';

loadSignals();
loadServerDom();

const { renderToString } = await import('@xaendar/ssr');
const { ${componentClassName} } = await import('./${componentName}/${componentName}.xd.component');

/**
 * Renders the page of a URL on the server: the HTML replacing \`<!--xd-ssr-->\` in \`index.html\`.
 *
 * @param _url - The URL of the page, to render the one of a route.
 * @returns The HTML of the root component.
 */
export function render(_url: string): Promise<string> {
  return renderToString(${componentClassName});
}
`;
}
