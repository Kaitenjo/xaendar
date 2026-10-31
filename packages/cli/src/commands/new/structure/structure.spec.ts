import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn()
}));

import { CLIENT_RENDERING, SERVER_RENDERING } from '../rendering/rendering';
import { buildStructure } from './structure';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(existsSync).mockImplementation((path) => path === resolve(import.meta.dirname, '../../../../package.json'));
});

describe('buildStructure()', () => {
  it('builds the full project entry tree pinned to the CLI\'s own package.json version', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

    const entries = buildStructure({ name: 'my-app', style: 'scss', rendering: CLIENT_RENDERING });

    expect(entries.map((entry) => entry.name)).toEqual(['package.json', 'xaendar.json', 'vite.config.ts', 'tsconfig.json', 'src']);

    const packageJsonEntry = entries.find((entry) => entry.name === 'package.json');
    expect(packageJsonEntry?.type).toBe('file');
    expect((packageJsonEntry as { content: string }).content).toContain('^1.2.3');

    const xaendarJsonEntry = entries.find((entry) => entry.name === 'xaendar.json');
    expect((xaendarJsonEntry as { content: string }).content).toContain('"style": "scss"');
  });

  it('reads the version from the nearest package.json found walking up from the running module\'s own directory', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

    buildStructure({ name: 'my-app', style: 'css', rendering: CLIENT_RENDERING });

    expect(readFileSync).toHaveBeenCalledWith(resolve(import.meta.dirname, '../../../../package.json'), 'utf8');
  });

  it('derives the root component name by appending "-root" to the project name', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

    const entries = buildStructure({ name: 'my-app', style: 'css', rendering: CLIENT_RENDERING });
    const srcEntry = entries.find((entry) => entry.name === 'src');
    const children = srcEntry && 'children' in srcEntry ? srcEntry.children : undefined;

    expect(children?.map((entry) => entry.name)).toEqual(['index.html', 'main.ts', 'bootstrap.ts', 'my-app-root', 'styles.css']);

    const componentEntry = children?.find((entry) => entry.name === 'my-app-root');
    expect(componentEntry?.type).toBe('generateComponent');

    const indexHtmlEntry = children?.find((entry) => entry.name === 'index.html');
    expect((indexHtmlEntry as { content: string }).content).toContain('my-app-root');
  });

  it('names the global stylesheet, links it and installs its compiler after the style of the project', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

    const entries = buildStructure({ name: 'my-app', style: 'sass', rendering: CLIENT_RENDERING });
    const srcEntry = entries.find((entry) => entry.name === 'src');
    const children = srcEntry && 'children' in srcEntry ? srcEntry.children : undefined;
    const stylesEntry = children?.find((entry) => entry.name === 'styles.sass');
    const indexHtmlEntry = children?.find((entry) => entry.name === 'index.html');
    const packageJsonEntry = entries.find((entry) => entry.name === 'package.json');

    expect((stylesEntry as { content: string }).content).toContain('  box-sizing: border-box\n');
    expect((indexHtmlEntry as { content: string }).content).toContain('href="./styles.sass"');
    expect((packageJsonEntry as { content: string }).content).toContain('"sass": ');
  });

  it('adds the server and the entry rendering a page on the server to a project rendering on the server', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

    const entries = buildStructure({ name: 'my-app', style: 'css', rendering: SERVER_RENDERING });
    const srcEntry = entries.find((entry) => entry.name === 'src');
    const children = srcEntry && 'children' in srcEntry ? srcEntry.children : undefined;
    const content = (name: string, list = entries) => (list.find((entry) => entry.name === name) as { content: string }).content;

    expect(entries.map((entry) => entry.name)).toEqual(['package.json', 'xaendar.json', 'vite.config.ts', 'tsconfig.json', 'server.ts', 'src']);
    expect(children?.map((entry) => entry.name)).toEqual(['index.html', 'main.ts', 'bootstrap.ts', 'my-app-root', 'styles.css', 'entry-server.ts']);
    expect(content('server.ts')).toContain('const FALLBACK = \'<my-app-root></my-app-root>\';');
    expect(content('entry-server.ts', children)).toContain('renderToString(MyAppRootComponent)');
    expect(content('package.json')).toContain('"@xaendar/ssr": "^1.2.3"');
    expect(content('xaendar.json')).toContain('"entry": "src/entry-server",');
    expect(content('vite.config.ts')).toContain('../dist/client');
    expect(content('index.html', children)).toContain('<!--xd-ssr-->');
  });

  it('exits the process when the CLI package.json cannot be read', () => {
    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => buildStructure({ name: 'my-app', style: 'css', rendering: CLIENT_RENDERING })).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading Xaendar CLI version:', expect.any(Error));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits the process when the CLI package.json has no version field', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => buildStructure({ name: 'my-app', style: 'css', rendering: CLIENT_RENDERING })).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading Xaendar CLI version:', 'Unable to determine Xaendar CLI version.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits the process when no package.json is found walking up to the filesystem root', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => buildStructure({ name: 'my-app', style: 'css', rendering: CLIENT_RENDERING })).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading Xaendar CLI version:', new Error('Unable to locate the CLI package.json.'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(readFileSync).not.toHaveBeenCalled();
  });
});
