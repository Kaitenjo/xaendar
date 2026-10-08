import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../../core/routes/routes';
import { API } from './api.data';

/**
 * The entry points documented by the API reference, relative to the root of the repository.
 */
const ENTRY_POINTS = {
  '@xaendar/core': 'packages/core/src/public-api.ts',
  '@xaendar/core/signals': 'packages/core/src/signals/index.ts',
  '@xaendar/signals': 'packages/signals/src/public-api.ts'
} as const;

/**
 * Finds the root of the repository, walking up from the working directory.
 *
 * @returns The absolute path of the root.
 * @throws When no ancestor contains the packages.
 */
function findRepositoryRoot(): string {
  let directory = ts.sys.getCurrentDirectory();
  while (!ts.sys.fileExists(`${directory}/${ENTRY_POINTS['@xaendar/core']}`)) {
    const parent = ts.sys.resolvePath(`${directory}/..`);
    if (parent === directory) {
      throw new Error('Unable to find the root of the repository');
    }
    directory = parent;
  }
  return directory;
}

/**
 * Lists the names exported by a module, following its re-exports.
 *
 * @param file - The absolute path of the module.
 * @returns The exported names.
 */
function exportsOf(file: string): string[] {
  const program = ts.createProgram([file], { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, noEmit: true });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(file);
  const symbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  return symbol ? checker.getExportsOfModule(symbol).map(exported => exported.getName()) : [];
}

describe('API reference', () => {
  const root = findRepositoryRoot();

  it.each(Object.entries(ENTRY_POINTS))('documents every export of %s', (module, path) => {
    const documented = new Set(API.filter(entry => entry.module === module).flatMap(entry => entry.name.split(', ')));
    const exported = exportsOf(`${root}/${path}`);

    expect(exported.length).toBeGreaterThan(0);
    // The runtime of the compiled templates is documented as a group, starting with the _ prefix
    expect(exported.filter(name => !name.startsWith('_') && !documented.has(name))).toEqual([]);
  });

  it('links every entry to a page and describes it in every language', () => {
    for (const entry of API) {
      expect(PAGES.some(page => page.path === entry.page)).toBe(true);
      expect(entry.description.en.trim()).not.toBe('');
      expect(entry.description.it.trim()).not.toBe('');
    }
  });
});
