import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vite', () => ({
  build: vi.fn()
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn()
}));

vi.mock('node:fs/promises', () => ({
  copyFile: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn()
}));

vi.mock('@xaendar/language-core', () => ({
  disposeLanguageService: vi.fn()
}));

vi.mock('../../registry/metadata-registry/metadata-registry', () => ({
  clearMetadataRegistry: vi.fn()
}));

vi.mock('../library-analysis/library-analysis.utils', () => ({
  analyzeLibrary: vi.fn(),
  createLibraryProgram: vi.fn()
}));

vi.mock('../library-build-config/library-build-config.utils', () => ({
  createExternalMatcher: vi.fn(),
  createLibraryBuildConfig: vi.fn((_library, _plugins, _analysis, _outDir, _external, server: boolean) => ({ server }))
}));

vi.mock('../library-declarations/library-declarations.utils', () => ({
  emitLibraryDeclarations: vi.fn()
}));

vi.mock('../library-package/library-package.utils', () => ({
  createLibraryManifest: vi.fn(() => ({ schemaVersion: 1 })),
  createLibraryPackageJson: vi.fn(() => ({ name: '@acme/ui' }))
}));

import { disposeLanguageService } from '@xaendar/language-core';
import { existsSync } from 'node:fs';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { build } from 'vite';
import { clearMetadataRegistry } from '../../registry/metadata-registry/metadata-registry';
import { resolvePosixPath } from '../../utils/path/path.utils';
import { analyzeLibrary, createLibraryProgram } from '../library-analysis/library-analysis.utils';
import { createExternalMatcher, createLibraryBuildConfig } from '../library-build-config/library-build-config.utils';
import { emitLibraryDeclarations } from '../library-declarations/library-declarations.utils';
import { createLibraryManifest, createLibraryPackageJson } from '../library-package/library-package.utils';
import { buildLibrary } from './build-library';

/**
 * The folder of the library, resolved.
 */
const ROOT = resolvePosixPath('/ws/libraries/ui');

/**
 * The folder of its build, resolved.
 */
const OUT_DIR = resolvePosixPath('/ws/dist/ui');

/**
 * What the build reads of its sources.
 */
const ANALYSIS = { base: `${ROOT}/src` };

/**
 * The program of the library.
 */
const PROGRAM = { program: true };

/**
 * The matcher of the imports left to the application.
 */
const EXTERNAL = () => false;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readFile).mockResolvedValue('{ "name": "@acme/ui", "version": "1.4.0" }');
  vi.mocked(createLibraryProgram).mockReturnValue(PROGRAM as never);
  vi.mocked(analyzeLibrary).mockResolvedValue(ANALYSIS as never);
  vi.mocked(createExternalMatcher).mockReturnValue(EXTERNAL);
  vi.mocked(existsSync).mockImplementation(path => path === `${ROOT}/README.md`);
});

describe('buildLibrary()', () => {
  it('builds the library for the browser, emits its declarations, then writes its manifest, its package.json and its README', async () => {
    const plugins = [{ name: 'babel' }];

    await buildLibrary({ name: '@acme/ui', root: '/ws/libraries/ui', outDir: '/ws/dist/ui', plugins, xaendarVersion: '1.2.0' });

    const library = { name: '@acme/ui', root: ROOT, entry: `${ROOT}/src/public-api.ts`, ssr: false, customElements: [] };
    expect(readFile).toHaveBeenCalledWith(`${ROOT}/package.json`, 'utf-8');
    expect(createLibraryProgram).toHaveBeenCalledWith(library, OUT_DIR);
    expect(analyzeLibrary).toHaveBeenCalledWith(library, PROGRAM);
    expect(createLibraryManifest).toHaveBeenCalledWith({ name: '@acme/ui', version: '1.4.0' }, ANALYSIS, PROGRAM, library, '1.2.0');
    expect(createLibraryBuildConfig).toHaveBeenCalledExactlyOnceWith(library, plugins, ANALYSIS, OUT_DIR, EXTERNAL, false);
    expect(build).toHaveBeenCalledExactlyOnceWith({ server: false });
    expect(emitLibraryDeclarations).toHaveBeenCalledWith(PROGRAM, `${ROOT}/src`);
    expect(createLibraryPackageJson).toHaveBeenCalledWith({ name: '@acme/ui', version: '1.4.0' }, ANALYSIS, false, '1.2.0');
    expect(writeFile).toHaveBeenCalledWith(`${OUT_DIR}/xaendar-manifest.json`, '{\n  "schemaVersion": 1\n}\n', 'utf-8');
    expect(writeFile).toHaveBeenCalledWith(`${OUT_DIR}/package.json`, '{\n  "name": "@acme/ui"\n}\n', 'utf-8');
    expect(copyFile).toHaveBeenCalledExactlyOnceWith(`${ROOT}/README.md`, `${OUT_DIR}/README.md`);
  });

  it('builds the library for the server too when it renders there', async () => {
    await buildLibrary({ name: '@acme/ui', root: '/ws/libraries/ui', outDir: '/ws/dist/ui', ssr: true, xaendarVersion: '1.2.0' });

    expect(build).toHaveBeenNthCalledWith(1, { server: false });
    expect(build).toHaveBeenNthCalledWith(2, { server: true });
    expect(createLibraryPackageJson).toHaveBeenCalledWith(expect.anything(), ANALYSIS, true, '1.2.0');
  });

  it('forgets what an earlier build registered, and reads the libraries of the workspace it depends on from their builds', async () => {
    await buildLibrary({ name: 'charts', root: '/ws/libraries/charts', outDir: '/ws/dist/charts', dependencies: { '@acme/ui': '/ws/dist/ui' }, xaendarVersion: '1.2.0' });

    expect(clearMetadataRegistry).toHaveBeenCalledOnce();
    expect(disposeLanguageService).toHaveBeenCalledOnce();
    expect(createLibraryProgram).toHaveBeenCalledWith(expect.objectContaining({ name: 'charts', dependencies: { '@acme/ui': '/ws/dist/ui' } }), resolvePosixPath('/ws/dist/charts'));
    expect(createLibraryBuildConfig).toHaveBeenCalledWith(expect.objectContaining({ dependencies: { '@acme/ui': '/ws/dist/ui' } }), undefined, ANALYSIS, resolvePosixPath('/ws/dist/charts'), EXTERNAL, false);
  });
});
