import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isStyle, readProjectStyle } from './style';

describe('isStyle()', () => {
  it.each([['css'], ['scss'], ['sass'], ['less']])('accepts %s', style => {
    expect(isStyle(style)).toBe(true);
  });

  it.each([['styl'], ['CSS'], ['']])('rejects "%s"', style => {
    expect(isStyle(style)).toBe(false);
  });
});

describe('readProjectStyle()', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'xaendar-style-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('reads the style from the xaendar.json of the directory', () => {
    writeFileSync(join(root, 'xaendar.json'), JSON.stringify({ generate: { components: { style: 'scss' } } }));

    expect(readProjectStyle(root)).toBe('scss');
  });

  it('reads the style from the nearest xaendar.json found walking up from a nested directory', () => {
    const nested = join(root, 'src', 'components');
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(root, 'xaendar.json'), JSON.stringify({ generate: { components: { style: 'less' } } }));

    expect(readProjectStyle(nested)).toBe('less');
  });

  it('defaults to css when the xaendar.json has no style', () => {
    writeFileSync(join(root, 'xaendar.json'), JSON.stringify({ name: 'my-app' }));

    expect(readProjectStyle(root)).toBe('css');
  });

  it('defaults to css when no xaendar.json is found up to the root of the file system', () => {
    // The temporary directory is outside any project, so no xaendar.json is found walking up from it
    expect(readProjectStyle(root)).toBe('css');
  });

  it('exits with an error when the xaendar.json holds an unsupported style', () => {
    writeFileSync(join(root, 'xaendar.json'), JSON.stringify({ generate: { components: { style: 'styl' } } }));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => readProjectStyle(root)).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith(`✖  Invalid style "styl" in ${join(root, 'xaendar.json')}: use one of css, scss, sass, less.`);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
