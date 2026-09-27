import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadCompilerOptions } from './compiler-options.utils';

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

describe('loadCompilerOptions()', () => {
  it('returns an empty object when no tsconfig.json is found', () => {
    const dir = freshDir();

    expect(loadCompilerOptions(dir)).toEqual({});
  });

  it('loads the compilerOptions from the nearest tsconfig.json', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true } }));

    expect(loadCompilerOptions(dir)).toMatchObject({ strict: true });
  });

  it('walks up parent directories to find the tsconfig.json', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true } }));
    const nested = join(dir, 'nested', 'deeper');
    mkdirSync(nested, { recursive: true });

    expect(loadCompilerOptions(nested)).toMatchObject({ strict: true });
  });
});
