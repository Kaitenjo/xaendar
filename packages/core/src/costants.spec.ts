import { describe, expect, it } from 'vitest';
import { DIRECTIVE_CONNECT, INTERNAL_ALIAS_TO_ATTRIBUTE, MATHML_NS, SVG_NS } from './costants';

describe('costants', () => {
  it('exposes the alias-to-attribute metadata key', () => {
    expect(INTERNAL_ALIAS_TO_ATTRIBUTE).toBe('aliasToAttribute');
  });

  it('exposes the SVG namespace', () => {
    expect(SVG_NS).toBe('http://www.w3.org/2000/svg');
  });

  it('exposes the MathML namespace', () => {
    expect(MATHML_NS).toBe('http://www.w3.org/1998/Math/MathML');
  });

  it('exposes the directive connect key as a unique symbol', () => {
    expect(typeof DIRECTIVE_CONNECT).toBe('symbol');
    expect(DIRECTIVE_CONNECT.description).toBe('DirectiveConnect');
  });
});
