import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { UserConfig } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCachePlugin, findModulesDir } from './cache-plugin.utils';

/**
 * Temporary directory holding a workspace, with a library of its own package in `libraries/ui`.
 */
let dir: string;

/**
 * The folder of the library of the workspace.
 */
let libraryDir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'xaendar-cache-plugin-'));
  libraryDir = join(dir, 'workspace', 'libraries', 'ui');
  mkdirSync(join(libraryDir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'workspace', 'xaendar.json'), JSON.stringify({ name: 'workspace', libs: { '@acme/ui': { root: 'libraries/ui' } } }));
  writeFileSync(join(libraryDir, 'package.json'), JSON.stringify({ name: '@acme/ui' }));
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true });
});

/**
 * Calls the `config` hook of the plugin created from a directory, as Vite does.
 */
function configOf(fromDir: string | undefined, config: UserConfig): UserConfig | undefined {
  const plugin = createCachePlugin(fromDir);
  return (plugin.config as (config: UserConfig) => UserConfig | undefined)(config);
}

describe('findModulesDir()', () => {
  it('finds the node_modules of the workspace, from the workspace, from a library and from its sources', () => {
    const modulesDir = resolve(dir, 'workspace', 'node_modules');

    expect(findModulesDir(join(dir, 'workspace'))).toBe(modulesDir);
    expect(findModulesDir(libraryDir)).toBe(modulesDir);
    expect(findModulesDir(join(libraryDir, 'src'))).toBe(modulesDir);
  });

  it('falls back to the node_modules of the directory outside of a project', () => {
    expect(findModulesDir(dir)).toBe(resolve(dir, 'node_modules'));
  });
});

describe('createCachePlugin()', () => {
  it('puts the cache of Vite into the node_modules of the workspace, also for the build of a library', () => {
    expect(configOf(libraryDir, { root: libraryDir })).toEqual({ cacheDir: resolve(dir, 'workspace', 'node_modules', '.vite') });
  });

  it('finds the project from the working directory by default', () => {
    vi.spyOn(process, 'cwd').mockReturnValue(libraryDir);

    expect(configOf(undefined, {})).toEqual({ cacheDir: resolve(dir, 'workspace', 'node_modules', '.vite') });
  });

  it('keeps the cache the configuration sets', () => {
    expect(configOf(libraryDir, { cacheDir: '.cache' })).toBeUndefined();
  });
});
