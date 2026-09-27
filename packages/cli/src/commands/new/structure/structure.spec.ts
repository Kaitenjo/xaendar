import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn()
}));

import { buildStructure } from './structure';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildStructure()', () => {
  it('builds the full project entry tree pinned to the CLI\'s own package.json version', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

    const entries = buildStructure({ name: 'my-app', style: 'scss' });

    expect(entries.map((entry) => entry.name)).toEqual(['package.json', 'xaendar.json', 'vite.config.ts', 'tsconfig.json', 'src']);

    const packageJsonEntry = entries.find((entry) => entry.name === 'package.json');
    expect(packageJsonEntry?.type).toBe('file');
    expect((packageJsonEntry as { content: string }).content).toContain('^1.2.3');

    const xaendarJsonEntry = entries.find((entry) => entry.name === 'xaendar.json');
    expect((xaendarJsonEntry as { content: string }).content).toContain('"style": "scss"');
  });

  it('reads the version from the CLI package\'s own package.json, not a nested one', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

    buildStructure({ name: 'my-app', style: 'css' });

    expect(readFileSync).toHaveBeenCalledWith(resolve(import.meta.dirname, '../../../../package.json'), 'utf8');
  });

  it('derives the root component name by appending "-root" to the project name', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));

    const entries = buildStructure({ name: 'my-app', style: 'css' });
    const srcEntry = entries.find((entry) => entry.name === 'src');
    const children = srcEntry && 'children' in srcEntry ? srcEntry.children : undefined;

    expect(children?.map((entry) => entry.name)).toEqual(['index.html', 'signals.ts', 'main.ts', 'my-app-root', 'styles.css']);

    const componentEntry = children?.find((entry) => entry.name === 'my-app-root');
    expect(componentEntry?.type).toBe('generateComponent');

    const indexHtmlEntry = children?.find((entry) => entry.name === 'index.html');
    expect((indexHtmlEntry as { content: string }).content).toContain('my-app-root');
  });

  it('exits the process when the CLI package.json cannot be read', () => {
    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => buildStructure({ name: 'my-app', style: 'css' })).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading Xaendar CLI version:', expect.any(Error));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits the process when the CLI package.json has no version field', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => buildStructure({ name: 'my-app', style: 'css' })).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading Xaendar CLI version:', 'Unable to determine Xaendar CLI version.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
