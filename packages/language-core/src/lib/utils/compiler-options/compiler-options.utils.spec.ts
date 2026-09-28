import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadTsConfig } from './compiler-options.utils';

let root: string;
let counter = 0;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'xaendar-compiler-options-'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

const freshDir = (): string => {
  const dir = join(root, `case-${counter++}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};

describe('loadTsConfig()', () => {
  it('returns empty options and no files when no tsconfig.json is found', () => {
    const dir = freshDir();

    expect(loadTsConfig(dir)).toEqual({ options: {}, fileNames: [] });
  });

  it('loads the compilerOptions from the nearest tsconfig.json', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true } }));

    expect(loadTsConfig(dir).options).toMatchObject({ strict: true });
  });

  it('walks up parent directories to find the tsconfig.json', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true } }));
    const nested = join(dir, 'nested', 'deeper');
    mkdirSync(nested, { recursive: true });

    expect(loadTsConfig(nested).options).toMatchObject({ strict: true });
  });

  it('returns the project files matched by the tsconfig.json include', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ include: ['src/**/*.ts', 'globals.d.ts'] }));
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src', 'component.ts'), 'export {};');
    writeFileSync(join(dir, 'globals.d.ts'), 'declare global {}');
    writeFileSync(join(dir, 'excluded.ts'), 'export {};');

    const fileNames = loadTsConfig(dir).fileNames.map(fileName => basename(fileName));

    expect(fileNames.sort()).toEqual(['component.ts', 'globals.d.ts']);
  });
});
