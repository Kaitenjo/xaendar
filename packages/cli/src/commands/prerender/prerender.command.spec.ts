import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveConfig } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vite', () => ({
  resolveConfig: vi.fn()
}));

vi.mock('../build/build.command', () => ({
  buildProject: vi.fn()
}));

import { buildProject } from '../build/build.command';
import { prerenderCommand } from './prerender.command';

/**
 * Temporary project directory: its build of the browser holds `index.html`, the one of the server the entry.
 */
let projectDir: string;

beforeEach(() => {
  vi.clearAllMocks();
  projectDir = mkdtempSync(join(tmpdir(), 'xaendar-prerender-'));
  vi.spyOn(process, 'cwd').mockReturnValue(projectDir);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.mocked(resolveConfig).mockResolvedValue({ root: join(projectDir, 'src'), build: { outDir: '../dist/client' } } as Awaited<ReturnType<typeof resolveConfig>>);
  mkdirSync(join(projectDir, 'dist', 'client'), { recursive: true });
  mkdirSync(join(projectDir, 'dist', 'server'), { recursive: true });
  writeFileSync(join(projectDir, 'dist', 'client', 'index.html'), '<body><!--xd-ssr--></body>');
  writeFileSync(join(projectDir, 'dist', 'server', 'entry-server.js'), 'export function render(url) { return `<app-root>${url}</app-root>`; }');
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(projectDir, { recursive: true, force: true });
});

describe('prerenderCommand()', () => {
  it('registers the "prerender" command with its "p" alias', () => {
    const command = prerenderCommand();

    expect(command.name()).toBe('prerender');
    expect(command.aliases()).toContain('p');
  });

  it('builds the project and renders each route into the index.html of its folder in the build of the browser', async () => {
    writeFileSync(join(projectDir, 'xaendar.json'), JSON.stringify({ ssr: { entry: 'src/entry-server.ts', prerender: ['/', '/team/'] } }));

    await prerenderCommand().parseAsync([], { from: 'user' });

    expect(buildProject).toHaveBeenCalledTimes(1);
    expect(resolveConfig).toHaveBeenCalledWith({}, 'build');
    expect(readFileSync(join(projectDir, 'dist', 'client', 'index.html'), 'utf-8')).toBe('<body><app-root>/</app-root></body>');
    expect(readFileSync(join(projectDir, 'dist', 'client', 'team', 'index.html'), 'utf-8')).toBe('<body><app-root>/team/</app-root></body>');
  });

  it('renders the root route by default', async () => {
    writeFileSync(join(projectDir, 'xaendar.json'), JSON.stringify({ ssr: { entry: 'src/entry-server.ts' } }));

    await prerenderCommand().parseAsync([], { from: 'user' });

    expect(readFileSync(join(projectDir, 'dist', 'client', 'index.html'), 'utf-8')).toBe('<body><app-root>/</app-root></body>');
  });

  it('keeps as they are the sequences with a dollar in the text of a page', async () => {
    const page = '<p>$& $\' $` $$</p>';
    writeFileSync(join(projectDir, 'xaendar.json'), JSON.stringify({ ssr: { entry: 'src/entry-server.ts' } }));
    writeFileSync(join(projectDir, 'dist', 'client', 'index.html'), '<body><!--xd-ssr--><footer></footer></body>');
    writeFileSync(join(projectDir, 'dist', 'server', 'entry-server.js'), `export function render() { return ${JSON.stringify(page)}; }`);

    await prerenderCommand().parseAsync([], { from: 'user' });

    expect(readFileSync(join(projectDir, 'dist', 'client', 'index.html'), 'utf-8')).toBe(`<body>${page}<footer></footer></body>`);
  });

  it('exits when the project does not render on the server, building nothing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(prerenderCommand().parseAsync([], { from: 'user' })).rejects.toThrow('process.exit called');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('The project does not render on the server'));
    expect(buildProject).not.toHaveBeenCalled();
  });
});
