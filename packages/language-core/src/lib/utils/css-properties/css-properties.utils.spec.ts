import { afterEach, describe, expect, it } from 'vitest';
import { _resetCssProperties, getCssProperties } from './css-properties.utils';

describe('getCssProperties', () => {
  afterEach(() => _resetCssProperties());

  it('reads the CSS properties of the DOM TypeScript ships, in kebab-case, once', () => {
    const properties = getCssProperties();
    expect(properties).toContain('font-size');
    expect(properties).toContain('float');
    expect(properties).toContain('-webkit-transform');
    expect(properties).not.toContain('css-text');
    expect(getCssProperties()).toBe(properties);
  });

  it('reads the properties of every declaration of CSSStyleDeclaration and CSSStyleProperties', () => {
    const source = [
      'interface CSSStyleDeclaration {',
      '    cssText: string;',
      '    zIndex: string;',
      '}',
      'interface CSSStyleProperties extends CSSStyleDeclarationBase {',
      '    backgroundColor: string;',
      '    length: number;',
      '}'
    ].join('\n');
    expect(getCssProperties(() => source)).toEqual(['background-color', 'float', 'z-index']);
  });

  it('gives float alone when the file cannot be read', () => {
    expect(getCssProperties(() => undefined)).toEqual(['float']);
  });
});
