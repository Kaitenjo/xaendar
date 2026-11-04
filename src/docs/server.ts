import { toSameOriginPath } from '@xaendar/common';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

/**
 * The folder of the build of the browser, whose files are served as they are.
 */
const CLIENT_DIR = resolve(import.meta.dirname, 'dist/client');

/**
 * The URL of the entry built for the server: imported through a value rather than a path TypeScript resolves, since it
 * exists only once the project is built.
 */
const SERVER_ENTRY = new URL('./dist/server/entry-server.js', import.meta.url).href;

/**
 * The page the browser renders when the server fails to render it.
 */
const FALLBACK = '<docs-app></docs-app>';

/**
 * The content type of the files of the build, by extension.
 */
const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
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
const render: ((url: string) => Promise<string>) | undefined = (await import(SERVER_ENTRY)).render;
if (!render) {
  throw new Error('dist/server/entry-server.js does not export render(url): export the function rendering a page on the server from src/entry-server.ts');
}

const port = Number(process.env.PORT ?? 3000);

createServer(async (request, response) => {
  // The path with its query string, on the origin of any base it is resolved against
  const url = toSameOriginPath(request.url ?? '/');
  const { pathname } = new URL(url, 'http://localhost');
  const extension = extname(pathname);
  // The files of the build are served as they are, the pages of the demos included: only the application is rendered
  if (extension && pathname !== '/index.html') {
    try {
      const path = normalize(join(CLIENT_DIR, decodeURIComponent(pathname)));
      // Never a file outside of the build
      if (!path.startsWith(CLIENT_DIR)) {
        throw new Error(`${pathname} is outside of the build`);
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
    html = await render(url);
  } catch (error) {
    console.error(error);
    html = FALLBACK;
  }

  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  // A function, because a `$` in a replacement string is a pattern: the text of a page would change the page
  response.end(template.replace('<!--xd-ssr-->', () => html));
}).listen(port, () => console.log(`Listening on http://localhost:${port}`));
