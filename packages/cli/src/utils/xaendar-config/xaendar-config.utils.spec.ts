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
    writeFileSync(join(projectDir, 'xaendar.json'), JSON.stringify({ customElements: ['sl-*'], ssr: { entry: 'src/entry-server.ts' } }));

    expect(readXaendarConfig()).toEqual({ customElements: ['sl-*'], ssr: { entry: 'src/entry-server.ts' } });
  });

  it('reads nothing without a xaendar.json', () => {
    expect(readXaendarConfig()).toBeUndefined();
  });
});

describe('resolveSsrPaths()', () => {
  it('resolves the entry, the folder of the build of the server, dist/server by default, and the entry built there', () => {
    expect(resolveSsrPaths({ entry: 'src/entry-server.ts' })).toEqual({
      entry: resolve(projectDir, 'src/entry-server.ts'),
      outDir: resolve(projectDir, 'dist/server'),
      builtEntry: resolve(projectDir, 'dist/server/entry-server.js')
    });
  });

  it('resolves the folder of the build the configuration gives', () => {
    expect(resolveSsrPaths({ entry: 'src\\server\\render.mts', outDir: 'build/ssr' })).toEqual({
      entry: resolve(projectDir, 'src\\server\\render.mts'),
      outDir: resolve(projectDir, 'build/ssr'),
      builtEntry: resolve(projectDir, 'build/ssr/render.js')
    });
  });
});
