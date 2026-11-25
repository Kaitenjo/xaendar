import { isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { serverTs } from './server-ts';

describe('serverTs()', () => {
  it('renders the pages with the entry built for the server, in place of the outlet of the index.html of the build', () => {
    const content = serverTs('my-app-root');

    expect(content).toContain('const template = await readFile(join(CLIENT_DIR, \'index.html\'), \'utf-8\');');
    expect(content).toContain('(await import(SERVER_ENTRY)).render;');
    expect(content).toContain('response.end(template.replace(\'<!--xd-ssr-->\', () => html));');
  });

  it('imports the entry built for the server by its URL next to the server, which TypeScript does not resolve before the build', () => {
    const content = serverTs('my-app-root');

    expect(content).toContain('const SERVER_ENTRY = new URL(\'./dist/server/entry-server.js\', import.meta.url).href;');
    expect(content).not.toContain('import(\'./dist/server/entry-server.js\')');
  });

  it('inserts the page through a function, so that the sequences with a dollar of its text stay as they are', () => {
    const replacement = /template\.replace\('<!--xd-ssr-->', (.+)\)\);/.exec(serverTs('my-app-root'))![1];
    const insertPage = new Function('html', `return ${replacement};`) as (html: string) => () => string;
    const page = '<p>$& $\' $` $$</p>';

    expect('<body><!--xd-ssr--><footer></footer></body>'.replace('<!--xd-ssr-->', insertPage(page))).toBe(`<body>${page}<footer></footer></body>`);
  });

  it('does not start when the entry built for the server does not export render, naming the file to fix', () => {
    expect(serverTs('my-app-root')).toContain([
      'if (!render) {',
      '  throw new Error(\'dist/server/entry-server.js does not export render(url): export the function rendering a page on the server from src/entry-server.ts\');',
      '}',
      '',
      'const port = Number(process.env.PORT ?? 3000);'
    ].join('\n'));
  });

  it('renders the path of the request with its query string, on the origin of any base it is resolved against', () => {
    const content = serverTs('my-app-root');

    expect(content).toContain('import { toSameOriginPath } from \'@xaendar/common\';');
    expect(content).toContain([
      '  const url = toSameOriginPath(request.url ?? \'/\');',
      '  const { pathname } = new URL(url, \'http://localhost\');'
    ].join('\n'));
    expect(content).toContain('html = await render(url);');
  });

  it('falls back to the root component without content, which the browser renders', () => {
    expect(serverTs('my-app-root')).toContain('const FALLBACK = \'<my-app-root></my-app-root>\';');
  });

  it('serves the files of the build, never one outside of it', () => {
    const content = serverTs('my-app-root');

    expect(content).toContain('throw new Error(`${pathname} is outside of the build`);');
    expect(content).toContain('}).listen(port, () => console.log(`Listening on http://localhost:${port}`));');
  });

  it('refuses a path going up out of the build, also encoded so that the URL keeps it, and serves the others', () => {
    // The code reading the path of a file and refusing it outside of the build, run as the server runs it
    const check = /(const path = [^\n]+\n[\s\S]+?\n\s+if \(([^\n]+)\) \{)/.exec(serverTs('my-app-root'))!;
    const readPath = new Function('CLIENT_DIR', 'pathname', 'join', 'normalize', 'relative', 'isAbsolute', 'sep', `${check[1]} return null; } return path;`) as (...args: unknown[]) => string | null;
    const clientDir = resolve('/app/dist/client');
    const serve = (url: string): string | null => readPath(clientDir, new URL(url, 'http://localhost').pathname, join, normalize, relative, isAbsolute, sep);

    expect(serve('/assets/index.js')).toBe(join(clientDir, 'assets', 'index.js'));
    expect(serve('/%2e%2e/client-old/secret.js')).toBe(join(clientDir, 'client-old', 'secret.js'));
    expect(serve('/..%2Fclient-old%2Fsecret.js')).toBeNull();
    expect(serve('/..%2F..%2Fetc%2Fpasswd.txt')).toBeNull();
    expect(serve('/..%2Fclient.js')).toBeNull();
  });
});
