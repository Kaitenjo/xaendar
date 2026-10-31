import { SSR_OUTLET } from '../../../../utils/xaendar-config/xaendar-config.utils';

/**
 * Generates the content of the server of the application in production, `server.ts`, run by `npm run serve` once the
 * project is built: it uses `node:http` only, so the project needs no other dependency.
 *
 * It serves the files of the build of the browser as they are, and renders every other page with the entry built for the
 * server, in place of `<!--xd-ssr-->` in `index.html`. A page the server fails to render gets the root component without
 * content, which the browser renders. An entry built without `render` stops the server as it starts: every page would
 * fall back, and the rendering on the server would be off without notice.
 *
 * @param componentName - The root component name derived from the project name (e.g. `my-app-root`).
 * @returns The formatted TypeScript source string.
 */
export function serverTs(componentName: string): string {
  return `import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

/**
 * The folder of the build of the browser, whose files are served as they are.
 */
const CLIENT_DIR = resolve(import.meta.dirname, 'dist/client');

/**
 * The page the browser renders when the server fails to render it.
 */
const FALLBACK = '<${componentName}></${componentName}>';

/**
 * The content type of the files of the build, by extension.
 */
const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

const template = await readFile(join(CLIENT_DIR, 'index.html'), 'utf-8');
const render: ((url: string) => Promise<string>) | undefined = (await import('./dist/server/entry-server.js')).render;
if (!render) {
  throw new Error('dist/server/entry-server.js does not export render(url): export the function rendering a page on the server from src/entry-server.ts');
}

const port = Number(process.env.PORT ?? 3000);

createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const extension = extname(pathname);
  if (extension && extension !== '.html') {
    try {
      const path = normalize(join(CLIENT_DIR, decodeURIComponent(pathname)));
      // Never a file outside of the build
      if (!path.startsWith(CLIENT_DIR)) {
        throw new Error(\`\${pathname} is outside of the build\`);
      }

      const content = await readFile(path);
      response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extension] ?? 'application/octet-stream' });
      response.end(content);
    } catch {
      response.writeHead(404).end();
    }
    return;
  }

  let html: string;
  try {
    html = await render(pathname);
  } catch (error) {
    console.error(error);
    html = FALLBACK;
  }

  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  // A function, because a \`$\` in a replacement string is a pattern: the text of a page would change the page
  response.end(template.replace('${SSR_OUTLET}', () => html));
}).listen(port, () => console.log(\`Listening on http://localhost:\${port}\`));
`;
}
