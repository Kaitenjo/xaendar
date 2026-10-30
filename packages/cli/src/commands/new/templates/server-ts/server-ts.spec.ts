import { describe, expect, it } from 'vitest';
import { serverTs } from './server-ts';

describe('serverTs()', () => {
  it('renders the pages with the entry built for the server, in place of the outlet of the index.html of the build', () => {
    const content = serverTs('my-app-root');

    expect(content).toContain('const template = await readFile(join(CLIENT_DIR, \'index.html\'), \'utf-8\');');
    expect(content).toContain('await import(\'./dist/server/entry-server.js\')');
    expect(content).toContain('response.end(template.replace(\'<!--xd-ssr-->\', () => html));');
  });

  it('inserts the page through a function, so that the sequences with a dollar of its text stay as they are', () => {
    const replacement = /template\.replace\('<!--xd-ssr-->', (.+)\)\);/.exec(serverTs('my-app-root'))![1];
    const insertPage = new Function('html', `return ${replacement};`) as (html: string) => () => string;
    const page = '<p>$& $\' $` $$</p>';

    expect('<body><!--xd-ssr--><footer></footer></body>'.replace('<!--xd-ssr-->', insertPage(page))).toBe(`<body>${page}<footer></footer></body>`);
  });

  it('falls back to the root component without content, which the browser renders', () => {
    expect(serverTs('my-app-root')).toContain('const FALLBACK = \'<my-app-root></my-app-root>\';');
  });

  it('serves the files of the build, never one outside of it', () => {
    const content = serverTs('my-app-root');

    expect(content).toContain('if (!path.startsWith(CLIENT_DIR)) {');
    expect(content).toContain('throw new Error(`${pathname} is outside of the build`);');
    expect(content).toContain('}).listen(port, () => console.log(`Listening on http://localhost:${port}`));');
  });
});
