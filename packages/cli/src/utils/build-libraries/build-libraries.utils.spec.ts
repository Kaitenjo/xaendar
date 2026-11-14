import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@xaendar/build-tools', () => ({
  buildLibrary: vi.fn()
}));

vi.mock('../plugins', () => ({
  createBabelPlugin: vi.fn(() => ({ name: 'babel' }))
}));

vi.mock('../../commands/new/structure/structure', () => ({
  readCliVersion: vi.fn(() => '1.2.0')
}));

import { buildLibrary } from '@xaendar/build-tools';
import type { XaendarLibraryConfig } from '../../types/xaendar-library-config.type';
import type { XaendarProject } from '../../types/xaendar-project.type';
import { buildLibraries } from './build-libraries.utils';

/**
 * Temporary directory holding the workspace.
 */
let dir: string;

beforeEach(() => {
  vi.clearAllMocks();
  dir = mkdtempSync(join(tmpdir(), 'xaendar-build-libraries-'));
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true });
});

/**
 * Writes a workspace with the given libraries, each one with its `package.json`.
 *
 * @param libraries - The entry of each library in `libs` and its `package.json`, by the name of its package.
 * @returns The workspace.
 */
function writeWorkspace(libraries: Record<string, [XaendarLibraryConfig, object]>): XaendarProject {
  const libs: Record<string, XaendarLibraryConfig> = {};
  for (const [name, [config, packageJson]] of Object.entries(libraries)) {
    libs[name] = config;
    mkdirSync(join(dir, config.root), { recursive: true });
    writeFileSync(join(dir, config.root, 'package.json'), JSON.stringify(Object.assign({ name }, packageJson)));
  }

  return { dir, configPath: join(dir, 'xaendar.json'), config: { libs } };
}

describe('buildLibraries()', () => {
  it('builds every library in the order of libs, into dist/<folder> unless it sets its outDir', async () => {
    const project = writeWorkspace({
      '@acme/ui': [{ root: 'libraries/ui', ssr: true, customElements: ['sl-*'] }, { dependencies: { lit: '^3.0.0' } }],
      charts: [{ root: 'libraries/charts', entry: 'lib/index.ts', outDir: 'out/charts' }, {}]
    });

    await buildLibraries(project);

    expect(vi.mocked(buildLibrary).mock.calls).toEqual([
      [{ name: '@acme/ui', root: resolve(dir, 'libraries/ui'), entry: undefined, outDir: resolve(dir, 'dist/ui'), ssr: true, customElements: ['sl-*'], plugins: [{ name: 'babel' }], xaendarVersion: '1.2.0' }],
      [{ name: 'charts', root: resolve(dir, 'libraries/charts'), entry: 'lib/index.ts', outDir: resolve(dir, 'out/charts'), ssr: false, customElements: undefined, plugins: [{ name: 'babel' }], xaendarVersion: '1.2.0' }]
    ]);
    expect(console.log).toHaveBeenCalledWith(`✔  @acme/ui → ${resolve(dir, 'dist/ui')}`);
    expect(console.log).toHaveBeenCalledWith(`✔  charts → ${resolve(dir, 'out/charts')}`);
  });

  it('builds a library with its strictEvents, the one of the workspace when it declares none', async () => {
    const project = writeWorkspace({
      '@acme/ui': [{ root: 'libraries/ui' }, {}],
      charts: [{ root: 'libraries/charts', strictEvents: true }, {}]
    });

    await buildLibraries({ ...project, config: { ...project.config, strictEvents: false } });

    expect(vi.mocked(buildLibrary).mock.calls.map(([options]) => options.strictEvents)).toEqual([false, true]);
  });

  it('builds only the library named, by the name of its folder', async () => {
    const project = writeWorkspace({
      '@acme/ui': [{ root: 'libraries/ui' }, {}],
      charts: [{ root: 'libraries/charts' }, { dependencies: { '@acme/ui': '^1.0.0' } }]
    });

    await buildLibraries(project, 'ui');

    expect(buildLibrary).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: '@acme/ui', outDir: resolve(dir, 'dist/ui') }));
  });

  it('builds a library after the libraries of the workspace it depends on, which it reads from their builds', async () => {
    const project = writeWorkspace({
      dashboard: [{ root: 'libraries/dashboard' }, { dependencies: { charts: '^1.0.0', '@acme/ui': '^1.0.0' } }],
      charts: [{ root: 'libraries/charts', outDir: 'out/charts' }, { peerDependencies: { '@acme/ui': '^1.0.0' } }],
      '@acme/ui': [{ root: 'libraries/ui' }, {}],
      tools: [{ root: 'libraries/tools' }, {}]
    });

    await buildLibraries(project);

    expect(vi.mocked(buildLibrary).mock.calls.map(([options]) => [options.name, options.dependencies])).toEqual([
      ['@acme/ui', undefined],
      ['charts', { '@acme/ui': resolve(dir, 'dist/ui') }],
      ['dashboard', { '@acme/ui': resolve(dir, 'dist/ui'), charts: resolve(dir, 'out/charts') }],
      ['tools', undefined]
    ]);
  });

  it('builds the libraries of the workspace the library named depends on first', async () => {
    const project = writeWorkspace({
      '@acme/ui': [{ root: 'libraries/ui' }, {}],
      charts: [{ root: 'libraries/charts' }, { peerDependencies: { '@acme/ui': '^1.0.0' } }],
      tools: [{ root: 'libraries/tools' }, {}]
    });

    await buildLibraries(project, 'charts');

    expect(vi.mocked(buildLibrary).mock.calls.map(([options]) => options.name)).toEqual(['@acme/ui', 'charts']);
  });

  it('exits before building when a library depends on itself through the libraries it depends on', async () => {
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const project = writeWorkspace({
      '@acme/ui': [{ root: 'libraries/ui' }, { dependencies: { charts: '^1.0.0' } }],
      charts: [{ root: 'libraries/charts' }, { peerDependencies: { '@acme/ui': '^1.0.0' } }]
    });

    await expect(buildLibraries(project)).rejects.toThrow('process.exit');
    expect(error).toHaveBeenCalledWith('✖  @acme/ui depends on itself, through the libraries of the workspace it depends on: a library is built after the ones it depends on.');
    expect(buildLibrary).not.toHaveBeenCalled();
  });
});
