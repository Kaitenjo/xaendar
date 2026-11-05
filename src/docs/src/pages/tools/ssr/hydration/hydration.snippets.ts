import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet giving the event contract the nonce of the response, shown by the page tools/ssr/hydration and the API
 * reference of ssr.
 */
export const CSP_NONCE: SourceFile = {
  name: 'entry-server.ts',
  lang: 'ts',
  code: `// In the server: a new nonce for each response, the same one in the header and in the page
const nonce = randomBytes(16).toString('base64');
response.setHeader('Content-Security-Policy', \`script-src 'self' 'nonce-\${nonce}'\`);
const html = await render(pathname, nonce);

// In the entry
export function render(url: string, nonce?: string): Promise<string> {
  return renderToString(AppRootComponent, undefined, { nonce });
}`
};

/**
 * The snippet of a component reading the clock of the user after the hydration, shown by the page tools/ssr/hydration.
 */
export const GREETING: SourceFile = {
  name: 'greeting.xd.component.ts',
  lang: 'ts',
  code: `import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Greets the user by the hour of their clock, with a branch of the template for the morning and one for the evening.
 */
@WebComponent({
  selector: 'app-greeting',
  templateUrl: './greeting.xd.component.html'
})
export class GreetingComponent extends CustomElement {
  /**
   * Whether it is morning: false on the server, which renders the same page for everyone. Read in onInit or in a
   * computed, the clock of the server could pick another branch than the browser, which would render it again.
   */
  public readonly morning = signal(false);

  constructor() {
    super();
    // An effect runs in the browser only, once the nodes of the server are adopted: the @if then changes as usual
    this.effect(() => this.morning.set(new Date().getHours() < 12));
  }
}`
};
