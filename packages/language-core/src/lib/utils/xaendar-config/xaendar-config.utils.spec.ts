import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readCustomElements } from './xaendar-config.utils';

let root: string;
let counter = 0;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'xaendar-config-'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

const freshDir = (): string => {
  const dir = join(root, `case-${counter++}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};

describe('readCustomElements()', () => {
  it('returns undefined when no xaendar.json is found', () => {
    expect(readCustomElements(freshDir())).toBeUndefined();
  });

  it('reads the patterns from the nearest xaendar.json, walking up parent directories', () => {
    const dir = freshDir();
    writeFileSync(join(dir, 'xaendar.json'), JSON.stringify({ customElements: ['sl-*', 'md-button'] }));
    const nested = join(dir, 'src', 'app');
    mkdirSync(nested, { recursive: true });

    expect(readCustomElements(nested)).toEqual(['sl-*', 'md-button']);
  });

  it('returns undefined when the xaendar.json has no customElements field or cannot be parsed', () => {
    const withoutField = freshDir();
    writeFileSync(join(withoutField, 'xaendar.json'), JSON.stringify({ generate: {} }));
    const malformed = freshDir();
    writeFileSync(join(malformed, 'xaendar.json'), '{');

    expect(readCustomElements(withoutField)).toBeUndefined();
    expect(readCustomElements(malformed)).toBeUndefined();
  });
});
