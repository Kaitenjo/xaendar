import { describe, expect, it } from 'vitest';
import { assertDeclaredName, isValidIdentifier } from './identifier.utils';

describe('isValidIdentifier', () => {
  it.each(['name', '$el', '_private', 'item2', 'ünïcode'])('accepts the identifier %s', name => {
    expect(isValidIdentifier(name)).toBe(true);
  });

  it.each(['', '2items', 'my-name', 'a b', 'class', 'new', 'this', 'a.b', 'a()'])('rejects %j', name => {
    expect(isValidIdentifier(name)).toBe(false);
  });
});

describe('assertDeclaredName', () => {
  const span = { start: 3, end: 7 };

  it('accepts an identifier the generated code doesn\'t use', () => {
    expect(() => assertDeclaredName('name', span, 'element ref')).not.toThrow();
  });

  it('throws for a name that is not an identifier, pointing to it', () => {
    expect(() => assertDeclaredName('my-name', span, 'element ref')).toThrow('\'my-name\' is not a valid name for an element ref: it must be an identifier.');
    expect(() => assertDeclaredName('class', span, 'element ref')).toThrow(expect.objectContaining({ cause: span }));
  });

  it.each(['root', '$event', '__probe', '$$item'])('throws for the reserved name %s', name => {
    expect(() => assertDeclaredName(name, span, 'element ref')).toThrow(`'${name}' is reserved in templates: give the element ref another name.`);
  });
});
