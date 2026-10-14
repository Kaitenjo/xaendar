import { existsSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { resolvePosixPath } from '../path/path.utils';
import { resolveModulePath, toModulePath } from './module-path.utils';

vi.mock('node:fs', () => ({
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

  it('returns undefined for package (non-relative) import specifiers', () => {
    expect(resolveModulePath('/src', '@scope/pkg')).toBeUndefined();
  });

  it('returns a posix path, matching the owner file keys of the metadata registry', () => {
    vi.mocked(existsSync).mockReturnValue(true);

    expect(resolveModulePath('/src', './button')).not.toContain('\\');
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
