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
