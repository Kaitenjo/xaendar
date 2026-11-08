import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readCustomElements, readSsr } from './xaendar-config.utils';

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

describe('readSsr()', () => {
  it('returns undefined when no xaendar.json is found, or it cannot be parsed', () => {
    const malformed = freshDir();
    writeFileSync(join(malformed, 'xaendar.json'), '{');

    expect(readSsr(freshDir())).toBeUndefined();
    expect(readSsr(malformed)).toBeUndefined();
  });

  it('tells whether the nearest xaendar.json declares the rendering on the server', () => {
    const server = freshDir();
    writeFileSync(join(server, 'xaendar.json'), JSON.stringify({ ssr: { entry: 'src/entry-server' } }));
    const browser = freshDir();
    writeFileSync(join(browser, 'xaendar.json'), JSON.stringify({ customElements: [] }));

    expect(readSsr(server)).toBe(true);
    expect(readSsr(browser)).toBe(false);
  });
});

describe('the libraries of a workspace', () => {
  /**
   * Creates a workspace rendering on the server with patterns of its own, and two libraries: `ui`, rendering only in the
   * browser, and `charts`, rendering on the server, with patterns of its own.
   */
  const workspace = (): string => {
    const dir = freshDir();
    writeFileSync(join(dir, 'xaendar.json'), JSON.stringify({
      customElements: ['app-*'],
      ssr: { entry: 'src/entry-server' },
      libs: { '@acme/ui': { root: 'libraries/ui' }, charts: { root: 'libraries/charts', ssr: true, customElements: ['sl-*'] } }
    }));
    mkdirSync(join(dir, 'libraries', 'ui', 'src', 'card'), { recursive: true });
    mkdirSync(join(dir, 'libraries', 'charts', 'src'), { recursive: true });
    mkdirSync(join(dir, 'libraries', 'ui-kit'), { recursive: true });
    mkdirSync(join(dir, 'src'), { recursive: true });
    return dir;
  };

  it('reads the options of the library holding a directory, the ones of the project anywhere else', () => {
    const dir = workspace();

    expect(readSsr(join(dir, 'libraries', 'ui', 'src', 'card'))).toBe(false);
    expect(readCustomElements(join(dir, 'libraries', 'ui', 'src', 'card'))).toBeUndefined();
    expect(readSsr(join(dir, 'libraries', 'charts', 'src'))).toBe(true);
    expect(readCustomElements(join(dir, 'libraries', 'charts'))).toEqual(['sl-*']);
    expect(readSsr(join(dir, 'src'))).toBe(true);
    expect(readCustomElements(join(dir, 'libraries', 'ui-kit'))).toEqual(['app-*']);
  });
});

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
