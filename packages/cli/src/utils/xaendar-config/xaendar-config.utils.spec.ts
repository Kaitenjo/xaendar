import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readXaendarConfig, resolveSsrPaths } from './xaendar-config.utils';

/**
 * Temporary project directory the configuration is read from.
 */
let projectDir: string;

beforeEach(() => {
  projectDir = mkdtempSync(join(tmpdir(), 'xaendar-config-'));
  vi.spyOn(process, 'cwd').mockReturnValue(projectDir);
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(projectDir, { recursive: true, force: true });
});

describe('readXaendarConfig()', () => {
  it('reads the xaendar.json of the project in the working directory', () => {
    writeFileSync(join(projectDir, 'xaendar.json'), JSON.stringify({ customElements: ['sl-*'], ssr: { entry: 'src/entry-server' } }));

    expect(readXaendarConfig()).toEqual({ customElements: ['sl-*'], ssr: { entry: 'src/entry-server' } });
  });

  it('reads nothing without a xaendar.json', () => {
    expect(readXaendarConfig()).toBeUndefined();
  });
});

describe('resolveSsrPaths()', () => {
  it('resolves the entry, the folder of the build of the server, dist/server by default, and the entry built there', () => {
    expect(resolveSsrPaths({ entry: 'src/entry-server' })).toEqual({
      entry: resolve(projectDir, 'src/entry-server'),
      outDir: resolve(projectDir, 'dist/server'),
      builtEntry: resolve(projectDir, 'dist/server/entry-server.js')
    });
  });

  it('resolves the folder of the build the configuration gives', () => {
    expect(resolveSsrPaths({ entry: 'src\\server\\render', outDir: 'build/ssr' })).toEqual({
      entry: resolve(projectDir, 'src\\server\\render'),
      outDir: resolve(projectDir, 'build/ssr'),
      builtEntry: resolve(projectDir, 'build/ssr/render.js')
    });
  });

  it.each(['src/entry-server.ts', 'src/entry-server.mts', 'src/entry-server.js'])('exits when the entry %s is written with its extension', (entry) => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => resolveSsrPaths({ entry })).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith(`✖  Invalid ssr entry "${entry}" in xaendar.json: write it without extension.`);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
