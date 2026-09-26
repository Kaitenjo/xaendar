import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createSourceFile, forEachChild, isClassDeclaration, ScriptTarget } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ClassDeclarationWithName } from '../../types/typescript-decorator-nodes.type';
import { extractSignalMembers } from './extract-signals.utils';

const SIGNALS_IMPORT = 'import { signal, computed } from \'@xaendar/core/signals\';\n';
const BASE_DTS = 'import { Signal } from \'@xaendar/core/signals\';\nexport declare class Base { x: Signal<number>; y: string; }\n';

let root: string;
let counter = 0;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'xaendar-signals-'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

const write = (file: string, content: string): void => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

const posix = (path: string): string => path.replace(/\\/g, '/');

/**
 * Runs the extraction over `source` placed in a fresh directory, returning the directory
 * so tests can add sibling files (base classes, node_modules packages, ...).
 */
const setup = (source: string, prepare: (dir: string) => void = () => undefined): string[] => {
  const dir = join(root, `case-${counter++}`);
  mkdirSync(dir, { recursive: true });
  prepare(dir);

  const sourceFile = createSourceFile(join(dir, 'main.ts'), source.replaceAll('$DIR', posix(dir)), ScriptTarget.Latest, true);
  let klass!: ClassDeclarationWithName;
  forEachChild(sourceFile, node => {
    if (isClassDeclaration(node) && node.name?.text === 'Cmp') {
      klass = node as ClassDeclarationWithName;
    }
  });

  return extractSignalMembers(sourceFile, klass);
};

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

  describe('inheritance', () => {
    it('returns nothing inherited for classes without heritage, with implements only or with a non-identifier base', () => {
      expect(setup(`${SIGNALS_IMPORT} class Cmp { a = signal(1); }`)).toEqual(['a']);
      expect(setup('class Cmp implements Foo {}')).toEqual([]);
      expect(setup('class Cmp extends mixin(Foo) {}')).toEqual([]);
    });

    it('ignores base classes that are not imported', () => {
      expect(setup('class Base {}\nclass Cmp extends Base {}')).toEqual([]);
    });

    it('ignores a base class whose import specifier is not a string literal', () => {
      expect(setup('import { Base } from foo;\nclass Cmp extends Base {}')).toEqual([]);
    });

    it('resolves named, default, namespace and unrelated imports when looking for the base class', () => {
      const prepare = (dir: string) => write(join(dir, 'base.d.ts'), BASE_DTS);

      expect(setup('import { Other, Base } from \'./base\';\nclass Cmp extends Base {}', prepare)).toEqual(['x']);
      expect(setup('import Base from \'./base\';\nclass Cmp extends Base {}', prepare)).toEqual(['x']);
      expect(setup('import * as ns from \'./base\';\nimport { Other } from \'./base\';\nclass Cmp extends Base {}', prepare)).toEqual([]);
      expect(setup('import \'./base\';\nclass Cmp extends Base {}', prepare)).toEqual([]);
    });

    it('resolves relative and absolute specifiers, including directory index files', () => {
      expect(setup('import { Base } from \'./lib\';\nclass Cmp extends Base {}', dir => write(join(dir, 'lib', 'index.d.ts'), BASE_DTS))).toEqual(['x']);
      expect(setup('import { Base } from \'$DIR/base\';\nclass Cmp extends Base {}', dir => write(join(dir, 'base.d.ts'), BASE_DTS))).toEqual(['x']);
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
    });
  });

  describe('package resolution', () => {
    const pkg = (name: string, packageJson: unknown, files: Record<string, string> = { 'index.d.ts': BASE_DTS }) => (dir: string) => {
      const packageDir = join(dir, 'node_modules', name);
      write(join(packageDir, 'package.json'), typeof packageJson === 'string' ? packageJson : JSON.stringify(packageJson));
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
      expect(extend('pkg-d', pkg('pkg-d', { exports: [{ default: './lib/main.js' }, { types: './lib/types.d.ts' }] }, file))).toEqual(['x']);
    });

    it('falls back to index.d.ts when no types can be found through "exports"', () => {
      expect(extend('pkg-e', pkg('pkg-e', { exports: './lib/main.js' }))).toEqual(['x']);
      expect(extend('pkg-f', pkg('pkg-f', { exports: null }))).toEqual(['x']);
      expect(extend('pkg-g', pkg('pkg-g', { exports: {} }))).toEqual(['x']);
      expect(extend('pkg-h', pkg('pkg-h', { exports: [{ default: './lib/main.js' }] }))).toEqual(['x']);
      expect(extend('pkg-i', pkg('pkg-i', { exports: { '.': { default: null } } }))).toEqual(['x']);
      expect(extend('pkg-j', pkg('pkg-j', { types: 'missing.d.ts', exports: { types: './missing.d.ts' } }))).toEqual(['x']);
    });

    it('resolves nothing when the package, its manifest or its types are unavailable', () => {
      expect(extend('pkg-not-installed', () => undefined)).toEqual([]);
      expect(extend('pkg-broken', pkg('pkg-broken', '{ not json'))).toEqual([]);
      expect(extend('pkg-empty', pkg('pkg-empty', {}, {}))).toEqual([]);
    });
  });
});
