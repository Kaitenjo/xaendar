import { describe, expect, it } from 'vitest';
import { toStyleString } from './element-styles.utils';

describe('toStyleString', () => {
  it('writes a declaration per property, in kebab-case', () => {
    expect(toStyleString({ color: 'red', backgroundColor: '#fff', 'font-size': '12px', WebkitLineClamp: 2, '-webkit-box-orient': 'vertical' }))
      .toBe('color: red; background-color: #fff; font-size: 12px; -webkit-line-clamp: 2; -webkit-box-orient: vertical');
  });

  it('follows a value with the unit of its key', () => {
    expect(toStyleString({ 'width.px': 120, 'height.%': 50, 'gap.rem': '1.5' })).toBe('width: 120px; height: 50%; gap: 1.5rem');
  });

  it('writes a custom property as it is, without unit', () => {
    expect(toStyleString({ '--accent': 'tomato', '--Size': 3 })).toBe('--accent: tomato; --Size: 3');
  });

  it('keeps !important, parentheses and quotes', () => {
    expect(toStyleString({ color: 'red !important', backgroundImage: 'url("a;b.png")', content: '"a;b"' }))
      .toBe('color: red !important; background-image: url("a;b.png"); content: "a;b"');
  });

  it('sets nothing for null, undefined and an empty string', () => {
    expect(toStyleString({ color: null, width: undefined, height: '', top: 0 })).toBe('top: 0');
    expect(toStyleString(null)).toBeUndefined();
    expect(toStyleString(undefined)).toBeUndefined();
  });

  it('leaves out a property whose name or value would end the declaration and write other properties', () => {
    expect(toStyleString({ color: 'red; background: blue', margin: 'red;', padding: '  ', '--a;color': 'blue', '--b: 1; color': 'blue', top: 0 }))
      .toBe('top: 0');
  });

  it('throws for a key that is not a style property, or a unit that CSS does not have', () => {
    expect(() => toStyleString({ 'font size': '1px' })).toThrow('"font size" names no style property');
    expect(() => toStyleString({ 'width.pixels': 1 })).toThrow('sets width in "pixels", which is not a unit of CSS');
  });
});
