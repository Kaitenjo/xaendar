import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { CompilerOptions, createSourceFile, forEachChild, isClassDeclaration, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'typescript';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SignalMembers } from '../../types/signal-members/signal-members.type';
import type { ClassDeclarationWithName } from '../../types/typescript-decorator-nodes.type';
import { clearSignalMembersCache, extractSignalMembers } from './extract-signals.utils';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    readFileSync: vi.fn(actual.readFileSync)
  };
});

/**
 * Source of an import declaration binding `signal`/`computed` from the signals module.
 */
const SIGNALS_IMPORT = 'import { signal, computed } from \'@xaendar/core/signals\';\n';

/**
 * Source of a `.d.ts` file declaring a `Base` class with a signal-typed and a plain member.
 */
const BASE_DTS = 'import { Signal } from \'@xaendar/core/signals\';\nexport declare class Base { x: Signal<number>; y: string; }\n';

/**
 * Temporary directory holding the fixture files written by {@link extract}, created once for the whole suite.
 */
let root: string;

/**
 * Incrementing id used to give each {@link extract} call its own fixture sub-directory.
 */
let counter = 0;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'xaendar-signals-'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

beforeEach(() => {
  clearSignalMembersCache();
  vi.mocked(readFileSync).mockClear();
});

/**
 * Writes `content` to `file`, creating its parent directory if missing.
 *
 * @param file - Absolute path of the file to write.
 * @param content - The file content.
 */
const write = (file: string, content: string): void => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

/**
 * Converts a path to posix form, replacing backslashes with slashes.
 *
 * @param path - The path to convert.
 * @returns The path in posix format.
 */
const posix = (path: string): string => path.replace(/\\/g, '/');

/**
 * Runs the extraction over `source` placed in a fresh directory, letting `prepare`
 * add sibling files (base classes, node_modules packages, ...) to that directory.
 *
 * @param source - The TypeScript source declaring a `Cmp` class, extraction is run against it.
 * @param prepare - Callback adding sibling fixture files to the fresh directory.
 * @param compilerOptions - Optional factory of the compiler options to resolve modules with.
 * @returns The extracted signal members and dependencies, plus the fixture directory used.
 */
const extract = (source: string, prepare: (dir: string) => void = () => undefined, compilerOptions?: (dir: string) => CompilerOptions): SignalMembers & { dir: string } => {
  const dir = posix(join(root, `case-${counter++}`));
  mkdirSync(dir, { recursive: true });
  prepare(dir);

  const sourceFile = createSourceFile(`${dir}/main.ts`, source.replaceAll('$DIR', dir), ScriptTarget.Latest, true);
  let klass!: ClassDeclarationWithName;
  forEachChild(sourceFile, node => {
    if (isClassDeclaration(node) && node.name?.text === 'Cmp') {
      klass = node as ClassDeclarationWithName;
    }
  });

  return { ...extractSignalMembers(sourceFile, klass, compilerOptions?.(dir)), dir };
};

/**
 * Shorthand for {@link extract} when only the extracted member names are asserted on.
 *
 * @param source - The TypeScript source declaring a `Cmp` class, extraction is run against it.
 * @param prepare - Callback adding sibling fixture files to the fresh directory.
 * @returns The extracted signal member names.
 */
const setup = (source: string, prepare?: (dir: string) => void): readonly string[] => extract(source, prepare).members;

describe('extractSignalMembers', () => {
  describe('own members', () => {
    it('detects members initialised through signal functions and typed as signals', () => {
      const members = setup(`
        ${SIGNALS_IMPORT}
        import * as s from '@xaendar/core/signals';
        import { InputSignal } from '@xaendar/core/signals';
        class Cmp {
          a = signal(0);
          b = computed(() => 1);
          c = s.signal(1);
          d = other();
          e = a.b.c();
          f = 5;
          g!: InputSignal<boolean>;
          h!: s.InputSignal<number>;
          i!: Other<string>;
          j!: a.b.C;
          k!: string;
          l;
          ['m'] = signal(1);
          method() {}
        }
      `);

      expect(members).toEqual(['a', 'b', 'c', 'g', 'h']);
    });

    it('ignores side-effect and default imports of the signals module', () => {
      const members = setup(`
        import '@xaendar/core/signals';
        import defaultImport from '@xaendar/core/signals';
        import { other } from 'somewhere-else';
        class Cmp { a = other(); }
      `);

      expect(members).toEqual([]);
    });
  });

  describe('members initialised with module-level signals', () => {
    const STORE = `${SIGNALS_IMPORT}import { Signal } from '@xaendar/core/signals';
      export const count = signal(0);
      export const double = computed(() => count() * 2);
      export const typed: Signal<number> = make();
      export const untyped = 5;
      export const declared: number;
      export let uninitialised;
      export const aliased = count;
      const hidden = signal(0);
      export { hidden as renamed };
      export let a = b, b = a;
    `;
    const withStore = (source: string, files: Record<string, string> = {}) => setup(source, dir => {
      write(join(dir, 'store.ts'), STORE);
      Object.entries(files).forEach(([file, content]) => write(join(dir, file), content));
    });

    it('detects members initialised with an imported signal, without annotation', () => {
      expect(withStore(`
        import { count, double, typed, untyped, declared, uninitialised, aliased, renamed, missing, a } from './store';
        import { count as other } from './store';
        class Cmp {
          count = count;
          double = double;
          typed = typed;
          untyped = untyped;
          declared = declared;
          uninitialised = uninitialised;
          aliased = aliased;
          renamed = renamed;
          missing = missing;
          a = a;
          other = other;
          literal = 'x';
        }
      `)).toEqual(['count', 'double', 'typed', 'aliased', 'renamed', 'other']);
    });

    it('detects members initialised with a signal of a namespace import, or of a re-exporting barrel', () => {
      expect(withStore(`
        import * as store from './store';
        import { count } from './barrel';
        class Cmp {
          a = store.count;
          b = store.untyped;
          c = unknown.count;
          d = count;
        }
      `, { 'barrel.ts': 'export * from \'./store\';' })).toEqual(['a', 'd']);
    });

    it('detects members initialised with a signal declared in the same file', () => {
      expect(setup(`
        ${SIGNALS_IMPORT}
        import * as s from '@xaendar/core/signals';
        const local = signal(0);
        const viaNamespace = s.signal(0);
        const plain = other();
        const typed: s.Signal<number> = make();
        const notSignalType: Other = make();
        const notReference: Array<number> = [];
        class Cmp {
          local = local;
          viaNamespace = viaNamespace;
          plain = plain;
          typed = typed;
          notSignalType = notSignalType;
          notReference = notReference;
        }
      `)).toEqual(['local', 'viaNamespace', 'typed']);
    });

    it('reports the files read to resolve the signals', () => {
      const { members, dependencies, dir } = extract('import { count } from \'./store\';\nclass Cmp { count = count; }', dir => write(join(dir, 'store.ts'), STORE));

      expect(members).toEqual(['count']);
      expect(dependencies).toEqual([`${dir}/store.ts`]);
    });
  });

  describe('inheritance', () => {
    it('returns nothing inherited for classes without heritage, with implements only or with an unsupported base expression', () => {
      expect(setup(`${SIGNALS_IMPORT} class Cmp { a = signal(1); }`)).toEqual(['a']);
      expect(setup('class Cmp implements Foo {}')).toEqual([]);
      expect(setup('class Cmp extends mixin(Foo) {}')).toEqual([]);
      expect(setup('class Cmp extends a.b.Base {}')).toEqual([]);
    });

    it('resolves base classes declared in the same file', () => {
      expect(setup(`${SIGNALS_IMPORT}class Base { b = signal(1); }\nclass Cmp extends Base { own = signal(1); }`)).toEqual(['b', 'own']);
      expect(setup(`${SIGNALS_IMPORT}import { Base } from './base';\nclass Middle extends Base { m = signal(1); }\nclass Cmp extends Middle {}`, dir => write(join(dir, 'base.d.ts'), BASE_DTS))).toEqual(['x', 'm']);
    });

    it('ignores base classes that are neither declared nor imported', () => {
      expect(setup('class Cmp extends Base {}')).toEqual([]);
    });

    it('ignores a base class whose import specifier is not a string literal', () => {
      expect(setup('import { Base } from foo;\nclass Cmp extends Base {}')).toEqual([]);
    });

    it('resolves named, renamed, default and namespace imports when looking for the base class', () => {
      const prepare = (dir: string) => {
        write(join(dir, 'base.d.ts'), BASE_DTS);
        write(join(dir, 'default-base.d.ts'), 'import { Signal } from \'@xaendar/core/signals\';\nexport default class Base { d: Signal<number>; }\n');
      };

      expect(setup('import { Other, Base } from \'./base\';\nclass Cmp extends Base {}', prepare)).toEqual(['x']);
      expect(setup('import { Base as Renamed } from \'./base\';\nclass Cmp extends Renamed {}', prepare)).toEqual(['x']);
      expect(setup('import Base from \'./default-base\';\nclass Cmp extends Base {}', prepare)).toEqual(['d']);
      expect(setup('import Base from \'./base\';\nclass Cmp extends Base {}', prepare)).toEqual([]);
      expect(setup('import * as ns from \'./base\';\nclass Cmp extends ns.Base {}', prepare)).toEqual(['x']);
      expect(setup('import * as ns from \'./base\';\nclass Cmp extends other.Base {}', prepare)).toEqual([]);
      expect(setup('import * as ns from \'./base\';\nimport { Other } from \'./base\';\nclass Cmp extends Base {}', prepare)).toEqual([]);
      expect(setup('import \'./base\';\nclass Cmp extends Base {}', prepare)).toEqual([]);
    });

    it('resolves relative and absolute specifiers, including directory index files', () => {
      expect(setup('import { Base } from \'./lib\';\nclass Cmp extends Base {}', dir => write(join(dir, 'lib', 'index.d.ts'), BASE_DTS))).toEqual(['x']);
      expect(setup('import { Base } from \'$DIR/base\';\nclass Cmp extends Base {}', dir => write(join(dir, 'base.d.ts'), BASE_DTS))).toEqual(['x']);
    });

    it('resolves base classes declared in project source files', () => {
      const members = setup('import { Base } from \'./base\';\nclass Cmp extends Base {}', dir => {
        write(join(dir, 'base.ts'), `${SIGNALS_IMPORT}export class Base { s = signal(1); c = computed(() => 1); plain = 1; }`);
      });

      expect(members).toEqual(['s', 'c']);
    });

    it('resolves base classes imported through a TypeScript path alias', () => {
      const members = extract('import { Base } from \'@lib/base\';\nclass Cmp extends Base {}', dir => write(join(dir, 'lib', 'base.d.ts'), BASE_DTS), dir => ({
        module: ModuleKind.ESNext,
        moduleResolution: ModuleResolutionKind.Bundler,
        paths: { '@lib/*': [`${dir}/lib/*`] }
      })).members;

      expect(members).toEqual(['x']);
    });

    it('collects members along the whole inheritance chain, own members last', () => {
      const members = setup(`${SIGNALS_IMPORT}import { A } from './a';\nclass Cmp extends A { own = signal(1); }`, dir => {
        write(join(dir, 'a.d.ts'), 'import { Signal } from \'@xaendar/core/signals\';\nimport { B } from \'./b\';\nexport declare class A extends B { a: Signal<number>; }');
        write(join(dir, 'b.d.ts'), 'import { Signal } from \'@xaendar/core/signals\';\nexport declare class B { b: Signal<number>; }');
      });

      expect(members).toEqual(['b', 'a', 'own']);
    });

    it('stops on circular inheritance', () => {
      const members = setup('import { A } from \'./a\';\nclass Cmp extends A {}', dir => {
        write(join(dir, 'a.d.ts'), 'import { Signal } from \'@xaendar/core/signals\';\nimport { B } from \'./b\';\nexport declare class A extends B { a: Signal<number>; }');
        write(join(dir, 'b.d.ts'), 'import { Signal } from \'@xaendar/core/signals\';\nimport { A } from \'./a\';\nexport declare class B extends A { b: Signal<number>; }');
      });

      expect(members).toEqual(['b', 'a']);
    });

    it('skips base classes that cannot be resolved, read or found', () => {
      expect(setup('import { Base } from \'./missing\';\nclass Cmp extends Base {}')).toEqual([]);
      expect(setup('import { Base } from \'./base\';\nclass Cmp extends Base {}', dir => mkdirSync(join(dir, 'base.d.ts')))).toEqual([]);
      expect(setup('import { Base } from \'./base\';\nclass Cmp extends Base {}', dir => write(join(dir, 'base.d.ts'), 'export declare class Other {}'))).toEqual([]);

      vi.mocked(readFileSync).mockImplementationOnce(() => {
        throw new Error('EACCES');
      });
      expect(setup('import { Base } from \'./base\';\nclass Cmp extends Base {}', dir => write(join(dir, 'base.d.ts'), BASE_DTS))).toEqual([]);
    });
  });

  describe('re-exports', () => {
    const extendsBaseFrom = (specifier: string, files: Record<string, string>) => setup(`import { Base } from '${specifier}';\nclass Cmp extends Base {}`, dir => {
      Object.entries(files).forEach(([file, content]) => write(join(dir, file), content));
    });

    it('follows named re-exports, renamed or not', () => {
      expect(extendsBaseFrom('./barrel', { 'barrel.d.ts': 'export { Base } from \'./base\';', 'base.d.ts': BASE_DTS })).toEqual(['x']);
      expect(extendsBaseFrom('./barrel', { 'barrel.d.ts': 'export { Inner as Base } from \'./inner\';', 'inner.d.ts': BASE_DTS.replace('class Base', 'class Inner') })).toEqual(['x']);
      expect(extendsBaseFrom('./barrel', { 'barrel.d.ts': 'export { Other } from \'./base\';', 'base.d.ts': BASE_DTS })).toEqual([]);
    });

    it('follows local exports of declared or imported classes', () => {
      expect(extendsBaseFrom('./barrel', { 'barrel.d.ts': 'import { Inner } from \'./inner\';\nexport { Inner as Base };', 'inner.d.ts': BASE_DTS.replace('class Base', 'class Inner') })).toEqual(['x']);
      expect(extendsBaseFrom('./barrel', { 'barrel.d.ts': 'import { Signal } from \'@xaendar/core/signals\';\ndeclare class Inner { i: Signal<number>; }\nexport { Inner as Base };' })).toEqual(['i']);
    });

    it('follows wildcard re-exports until the class is found', () => {
      expect(extendsBaseFrom('./barrel', {
        'barrel.d.ts': 'export * from \'./unrelated\';\nexport * as ns from \'./base\';\nexport * from \'./nested\';',
        'unrelated.d.ts': 'export declare class Unrelated {}',
        'nested.d.ts': 'export * from \'./base\';',
        'base.d.ts': BASE_DTS
      })).toEqual(['x']);
      expect(extendsBaseFrom('./barrel', { 'barrel.d.ts': 'export * from \'./unrelated\';', 'unrelated.d.ts': 'export declare class Unrelated {}' })).toEqual([]);
    });

    it('stops on circular re-exports', () => {
      expect(extendsBaseFrom('./a', { 'a.d.ts': 'export * from \'./b\';', 'b.d.ts': 'export * from \'./a\';' })).toEqual([]);
    });

    it('resolves default exports, which wildcard re-exports never forward', () => {
      const extendsDefault = (files: Record<string, string>) => setup('import Base from \'./barrel\';\nclass Cmp extends Base {}', dir => {
        Object.entries(files).forEach(([file, content]) => write(join(dir, file), content));
      });
      const inner = 'import { Signal } from \'@xaendar/core/signals\';\nexport declare class Inner { i: Signal<number>; }\nexport default Inner;';

      expect(extendsDefault({ 'barrel.d.ts': 'export { default } from \'./inner\';', 'inner.d.ts': inner })).toEqual(['i']);
      expect(extendsDefault({ 'barrel.d.ts': 'export * from \'./inner\';', 'inner.d.ts': inner })).toEqual([]);
      expect(extendsDefault({ 'barrel.d.ts': 'declare const value: unknown;\nexport default value.x;' })).toEqual([]);
      expect(extendsDefault({ 'barrel.d.ts': 'declare class Inner {}\nexport = Inner;' })).toEqual([]);
    });
  });

  describe('dependencies and cache', () => {
    it('reports every file read to resolve the inheritance chain, except the component file', () => {
      const { members, dependencies, dir } = extract(`${SIGNALS_IMPORT}import { Base } from './barrel';\nclass Cmp extends Base {}`, dir => {
        write(join(dir, 'barrel.d.ts'), 'export * from \'./base\';');
        write(join(dir, 'base.d.ts'), BASE_DTS);
      });

      expect(members).toEqual(['x']);
      expect(dependencies).toEqual([`${dir}/barrel.d.ts`, `${dir}/base.d.ts`]);
      expect(extract('class Cmp {}').dependencies).toEqual([]);
    });

    it('parses an unchanged file only once, reparsing it when it changes or the cache is cleared', () => {
      const dir = posix(join(root, `case-${counter++}`));
      const basePath = `${dir}/base.d.ts`;
      write(basePath, BASE_DTS);
      const sourceFile = createSourceFile(`${dir}/main.ts`, 'import { Base } from \'./base\';\nclass Cmp extends Base {}', ScriptTarget.Latest, true);
      const klass = sourceFile.statements[1] as unknown as ClassDeclarationWithName;
      const baseReads = () => vi.mocked(readFileSync).mock.calls.filter(([path]) => path === basePath).length;

      expect(extractSignalMembers(sourceFile, klass).members).toEqual(['x']);
      expect(extractSignalMembers(sourceFile, klass).members).toEqual(['x']);
      expect(baseReads()).toBe(1);

      write(basePath, BASE_DTS.replace('y: string', 'y: Signal<string>'));
      utimesSync(basePath, new Date(), new Date(Date.now() + 10_000));
      expect(extractSignalMembers(sourceFile, klass).members).toEqual(['x', 'y']);
      expect(baseReads()).toBe(2);

      clearSignalMembersCache();
      expect(extractSignalMembers(sourceFile, klass).members).toEqual(['x', 'y']);
      expect(baseReads()).toBe(3);
    });
  });

  describe('package resolution', () => {
    const pkg = (name: string, packageJson: unknown, files: Record<string, string> = { 'index.d.ts': BASE_DTS }) => (dir: string) => {
      const packageDir = join(dir, 'node_modules', name);
      write(join(packageDir, 'package.json'), JSON.stringify(packageJson));
      Object.entries(files).forEach(([file, content]) => write(join(packageDir, file), content));
    };
    const extend = (name: string, prepare: (dir: string) => void) => setup(`import { Base } from '${name}';\nclass Cmp extends Base {}`, prepare);

    it('uses the "types" and "typings" fields', () => {
      expect(extend('pkg-types', pkg('pkg-types', { types: 'lib/types.d.ts' }, { 'lib/types.d.ts': BASE_DTS }))).toEqual(['x']);
      expect(extend('pkg-typings', pkg('pkg-typings', { typings: 'lib/types.d.ts' }, { 'lib/types.d.ts': BASE_DTS }))).toEqual(['x']);
    });

    it('uses the "exports" field in its different shapes', () => {
      const file = { 'lib/types.d.ts': BASE_DTS };

      expect(extend('pkg-a', pkg('pkg-a', { exports: { types: './lib/types.d.ts' } }, file))).toEqual(['x']);
      expect(extend('pkg-b', pkg('pkg-b', { exports: { '.': { types: './lib/types.d.ts' } } }, file))).toEqual(['x']);
      expect(extend('pkg-c', pkg('pkg-c', { exports: { '.': { import: { types: './lib/types.d.ts' } } } }, file))).toEqual(['x']);
    });

    it('falls back to index.d.ts when the manifest declares neither types nor exports', () => {
      expect(extend('pkg-e', pkg('pkg-e', {}))).toEqual(['x']);
    });

    it('resolves nothing when the package or its types are unavailable', () => {
      expect(extend('pkg-not-installed', () => undefined)).toEqual([]);
      expect(extend('pkg-empty', pkg('pkg-empty', {}, {}))).toEqual([]);
    });

    it('resolves base classes re-exported through a package barrel, as `@xaendar/core` does', () => {
      const members = extend('pkg-barrel', pkg('pkg-barrel', { types: 'public-api.d.ts' }, {
        'public-api.d.ts': 'export * from \'./directives\';',
        'directives/index.d.ts': 'export * from \'./base\';',
        'directives/base.d.ts': BASE_DTS
      }));

      expect(members).toEqual(['x']);
    });
  });
});
