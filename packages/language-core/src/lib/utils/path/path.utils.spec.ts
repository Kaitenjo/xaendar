import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeFileName, resolvePosixPath, toPosixPath } from './path.utils';

describe('normalizeFileName', () => {
  it('uses forward slashes and a lowercase drive letter', () => {
    expect(normalizeFileName('C:\\src\\a.ts')).toBe('c:/src/a.ts');
    expect(normalizeFileName('c:/src/A.ts')).toBe('c:/src/A.ts');
    expect(normalizeFileName('/src/a.ts')).toBe('/src/a.ts');
  });
});

describe('toPosixPath', () => {
  it('converts backslashes to forward slashes', () => {
    expect(toPosixPath('C:\\src\\a.ts')).toBe('C:/src/a.ts');
  });
});

describe('resolvePosixPath', () => {
  it('resolves the segments into a posix path', () => {
    expect(resolvePosixPath('/src', './a.ts')).toBe(resolve('/src', './a.ts').replace(/\\/g, '/'));
    expect(resolvePosixPath('/src', './a.ts')).not.toContain('\\');
  });
});
