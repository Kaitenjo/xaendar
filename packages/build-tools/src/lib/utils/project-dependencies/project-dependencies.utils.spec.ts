import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { CompilerOptions, createProgram, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { toPosixPath } from '../path/path.utils';
import { collectProjectDependencies } from './project-dependencies.utils';

/**
 * Compiler options resolving the fixtures as a bundler does.
 */
const COMPILER_OPTIONS: CompilerOptions = { target: ScriptTarget.ESNext, module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler, noEmit: true };

/**
 * Temporary directory holding the fixture files, created once for the whole suite.
 */
let root: string;

beforeAll(() => {
  root = toPosixPath(mkdtempSync(join(tmpdir(), 'xaendar-dependencies-')));
  const files: Record<string, string> = {
    'main.ts': `/// <reference path="./globals.d.ts" />\nimport { Base } from './base';\nimport type { Value } from './types/value.type';\nexport * from './barrel';\nimport { lib } from 'lib';\nimport { missing } from './missing';\nexport class Main extends Base { value!: Value; }`,
    'base.ts': `import { helper } from './helper';\nexport class Base { help = helper; }`,
    'helper.ts': `import { Base } from './base';\nexport const helper = 1;`,
    'types/value.type.ts': 'export type Value = number;',
    'barrel.ts': `export { helper } from './helper';\nexport const barrel = 1;`,
    'globals.d.ts': 'declare const globalValue: number;',
    'node_modules/lib/package.json': '{ "name": "lib", "types": "index.d.ts" }',
    'node_modules/lib/index.d.ts': 'export declare const lib: number;'
  };

  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
  }
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('collectProjectDependencies', () => {
  it('collects the files imported, exported from and referenced, transitively, leaving out external libraries', () => {
    const main = `${root}/main.ts`;
    const program = createProgram([main], COMPILER_OPTIONS);

    expect(collectProjectDependencies(program, main, COMPILER_OPTIONS).sort()).toEqual([
      `${root}/barrel.ts`,
      `${root}/base.ts`,
      `${root}/globals.d.ts`,
      `${root}/helper.ts`,
      `${root}/types/value.type.ts`
    ]);
  });

  it('reuses the dependencies of the files the program did not change', () => {
    const main = `${root}/main.ts`;
    const program = createProgram([main], COMPILER_OPTIONS);

    const first = collectProjectDependencies(program, main, COMPILER_OPTIONS);

    expect(collectProjectDependencies(program, main, COMPILER_OPTIONS)).toEqual(first);
  });

  it('returns nothing for a file outside the program', () => {
    const program = createProgram([`${root}/helper.ts`], COMPILER_OPTIONS);

    expect(collectProjectDependencies(program, `${root}/unknown.ts`, COMPILER_OPTIONS)).toEqual([]);
  });
});
