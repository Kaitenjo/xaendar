import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { loadTsConfig } from '../compiler-options/compiler-options.utils';
import { resolvePosixPath } from '../path/path.utils';
import { resolveModule, resolveModulePath, toModulePath } from './module-path.utils';

vi.mock('node:fs', async importOriginal => ({
  ...await importOriginal<typeof import('node:fs')>(),
  existsSync: vi.fn()
}));

describe('resolveModulePath()', () => {
  const resolvedPath = resolvePosixPath('/src', './button');

  it('returns the resolved path unchanged when it already exists as-is', () => {
    vi.mocked(existsSync).mockImplementation((p) => p === resolvedPath);

    expect(resolveModulePath('/src', './button')).toBe(resolvedPath);
  });

  it('appends a .ts extension when the bare path does not exist but the .ts file does', () => {
    vi.mocked(existsSync).mockImplementation((p) => p === `${resolvedPath}.ts`);

    expect(resolveModulePath('/src', './button')).toBe(`${resolvedPath}.ts`);
  });

  it('appends /index.ts when the path is a directory containing an index file', () => {
    vi.mocked(existsSync).mockImplementation((p) => p === `${resolvedPath}/index.ts`);

    expect(resolveModulePath('/src', './button')).toBe(`${resolvedPath}/index.ts`);
  });

  it('returns undefined when no candidate path exists', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(resolveModulePath('/src', './button')).toBeUndefined();
  });

  it('returns a posix path, matching the owner file keys of the metadata registry', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    expect(resolveModulePath('/src', './button')).not.toContain('\\');
  });
});

describe('resolveModule()', () => {
  let root: string;

  /**
   * Writes a file of the project, creating its directories.
   */
  const write = (path: string, content: string) => {
    const fileName = join(root, path);
    mkdirSync(dirname(fileName), { recursive: true });
    writeFileSync(fileName, content);
  };

  beforeAll(() => {
    // The real path, which TypeScript resolves the files of the packages to: the temporary directory can be reached through a short name or a symlink
    root = realpathSync.native(mkdtempSync(join(tmpdir(), 'xd-module-path-')));
    write('tsconfig.json', JSON.stringify({
      compilerOptions: { module: 'ESNext', moduleResolution: 'bundler', paths: { '@lib/*': ['./src/lib/*'] } },
      include: ['src/**/*.ts']
    }));
    write('src/lib/format.ts', 'export const format = (value: number) => `${value}`;');
    write('node_modules/@scope/pkg/package.json', JSON.stringify({
      name: '@scope/pkg',
      exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } }
    }));
    write('node_modules/@scope/pkg/dist/index.d.ts', 'export declare const LIMIT: number;');
    write('node_modules/@scope/pkg/dist/index.js', 'export const LIMIT = 5;');
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('resolves a relative path to a file of the project', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    expect(resolveModule('/src', './button')).toEqual({ fileName: resolvePosixPath('/src', './button'), external: false });
  });

  it('returns undefined for a relative path leading to no file', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(resolveModule('/src', './button')).toBeUndefined();
  });

  it('resolves the name of a package to its declarations, through the exports of its package.json', () => {
    expect(resolveModule(join(root, 'src/pages'), '@scope/pkg')).toEqual({
      fileName: resolvePosixPath(root, 'node_modules/@scope/pkg/dist/index.d.ts'),
      external: true
    });
  });

  it('resolves an alias of the project to its source file, with the options of the project', () => {
    const { options } = loadTsConfig(root);

    expect(resolveModule(join(root, 'src/pages'), '@lib/format', options)).toEqual({
      fileName: resolvePosixPath(root, 'src/lib/format.ts'),
      external: false
    });
  });

  it('returns undefined for a package that is not installed, and for an alias the options do not declare', () => {
    expect(resolveModule(join(root, 'src/pages'), '@scope/missing')).toBeUndefined();
    expect(resolveModule(join(root, 'src/pages'), '@lib/format')).toBeUndefined();
  });
});

describe('toModulePath()', () => {
  it.each([
    ['a file of the same directory', '/src', '/src/button.ts', './button'],
    ['a file of a subdirectory', '/src', '/src/ui/button.ts', './ui/button'],
    ['a file of a parent directory', '/src/pages', '/src/ui/button.ts', '../ui/button'],
    ['paths written with backslashes and another drive case', 'C:\\src\\pages', 'c:/src/ui/button.ts', '../ui/button'],
    ['an index', '/src', '/src/ui/index.ts', './ui/index']
  ])('writes the path of %s', (_name, baseDir, fileName, expected) => {
    expect(toModulePath(baseDir, fileName)).toBe(expected);
  });
});
