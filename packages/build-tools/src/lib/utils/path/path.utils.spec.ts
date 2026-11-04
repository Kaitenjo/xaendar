import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolvePosixPath, toPosixPath } from './path.utils';

describe('toPosixPath()', () => {
  it('converts every backslash separator to a forward slash, preserving the drive letter', () => {
    expect(toPosixPath('C:\\src\\foo\\foo.xd.component.ts')).toBe('C:/src/foo/foo.xd.component.ts');
  });

  it('leaves a posix path unchanged', () => {
    expect(toPosixPath('C:/src/foo/foo.xd.component.ts')).toBe('C:/src/foo/foo.xd.component.ts');
    expect(toPosixPath('/src/foo/foo.xd.component.ts')).toBe('/src/foo/foo.xd.component.ts');
  });

  it('converts mixed separators', () => {
    expect(toPosixPath('C:/src\\foo/bar\\baz.ts')).toBe('C:/src/foo/bar/baz.ts');
  });
});

describe('resolvePosixPath()', () => {
  it('resolves the segments like node:path resolve, returning a posix path', () => {
    const result = resolvePosixPath('/src/foo', '../bar/./bar.xd.component.html');

    expect(result).toBe(toPosixPath(resolve('/src/foo', '../bar/./bar.xd.component.html')));
    expect(result).not.toContain('\\');
  });

  it('returns a posix path when a segment contains backslash separators', () => {
    expect(resolvePosixPath('/src\\foo', '.\\foo.css')).not.toContain('\\');
  });
});
