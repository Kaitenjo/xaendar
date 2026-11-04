import { describe, expect, it } from 'vitest';
import { getTemplateSpan, validateExpression } from './expression-validator';
import type { BinaryExpression } from 'typescript';

const capture = (fn: () => void): Error => {
  try {
    fn();
  } catch (err) {
    return err as Error;
  }

  throw new Error('Expected the expression to be rejected');
};

describe('validateExpression', () => {
  describe('permitted constructs', () => {
    it.each([
      // Literals
      ['string literal', '\'hello\''],
      ['numeric literal', '42'],
      ['bigint literal', '10n'],
      ['true keyword', 'true'],
      ['false keyword', 'false'],
      ['null keyword', 'null'],
      ['undefined', 'undefined'],
      // Identifiers and member access
      ['identifier', 'user'],
      ['property access', 'user.name'],
      ['element access', 'items[0]'],
      ['optional chaining', 'user?.name'],
      // Calls
      ['call expression', 'user.hasRole(\'admin\')'],
      ['call with spread argument', 'fn(...args)'],
      // Comparison
      ['loose equality', 'a == b'],
      ['strict equality', 'a === b'],
      ['loose inequality', 'a != b'],
      ['strict inequality', 'a !== b'],
      ['less than', 'a < b'],
      ['less than or equal', 'a <= b'],
      ['greater than', 'a > b'],
      ['greater than or equal', 'a >= b'],
      // Arithmetic
      ['addition', 'a + b'],
      ['subtraction', 'a - b'],
      ['multiplication', 'a * b'],
      ['division', 'a / b'],
      ['modulo', 'a % b'],
      ['exponentiation', 'a ** b'],
      // Logical
      ['logical and', 'a && b'],
      ['logical or', 'a || b'],
      ['nullish coalescing', 'a ?? b'],
      // Bitwise
      ['bitwise and', 'a & b'],
      ['bitwise or', 'a | b'],
      ['bitwise xor', 'a ^ b'],
      ['left shift', 'a << b'],
      ['right shift', 'a >> b'],
      ['unsigned right shift', 'a >>> b'],
      // instanceof / in
      ['instanceof', 'a instanceof B'],
      ['in operator', '\'k\' in obj'],
      // Unary
      ['logical not', '!a'],
      ['negation', '-a'],
      ['unary plus', '+a'],
      ['bitwise not', '~a'],
      ['postfix increment', 'a++'],
      ['typeof', 'typeof a'],
      ['void', 'void 0'],
      // Conditional and grouping
      ['ternary', 'a ? b : c'],
      ['parenthesised expression', '(a + b)'],
      // Template literals
      ['template with substitution', '`Hello ${name}!`'],
      ['template without substitution', '`Hello`'],
      ['template with multiple substitutions', '`${a} and ${b}`'],
      ['tagged template', 'tag`hello`'],
      // Collections
      ['array literal', '[1, 2, 3]'],
      ['array with spread', '[...items]'],
      ['object literal', '{ a: 1, b, ...rest }']
    ])('accepts %s', (_name, source) => {
      const { node } = validateExpression(source);
      expect(node).toBeDefined();
      expect(node.getText()).toBe(source);
    });
  });

  describe('prohibited constructs', () => {
    it('rejects await', () => {
      expect(() => validateExpression('await user.load()')).toThrow();
    });

    it('rejects yield', () => {
      expect(() => validateExpression('yield value')).toThrow();
    });

    it('rejects new', () => {
      expect(() => validateExpression('new Foo()')).toThrow();
    });

    it('rejects arrow functions', () => {
      expect(() => validateExpression('() => 1')).toThrow();
    });

    it('rejects function expressions', () => {
      expect(() => validateExpression('function () { return 1; }')).toThrow();
    });

    it('rejects simple assignments', () => {
      expect(() => validateExpression('a = b')).toThrow();
    });

    it('rejects compound assignments', () => {
      expect(() => validateExpression('a += b')).toThrow();
    });

    it('rejects a disallowed node nested inside an allowed one', () => {
      expect(() => validateExpression('items.map(() => 1)')).toThrow();
    });
  });

  describe('single expression', () => {
    it.each(['a() + b()', 'a ? b : c', ' a ','a // comment', 'a /* comment */'])('accepts "%s"', source => {
      expect(() => validateExpression(source)).not.toThrow();
    });

    it.each([
      ['a b', 'b'],
      ['a; b', '; b'],
      ['a;', ';'],
      ['a, b', ', b'],
      ['a)', ')']
    ])('rejects "%s", having "%s" after the first expression', (source, rest) => {
      expect(() => validateExpression(source)).toThrow(`'${source}' must be a single expression, got '${rest}' after 'a'.`);
    });

    it('accepts an incomplete expression recovered by the parser', () => {
      expect(validateExpression('a.').node.getText()).toBe('a.');
    });
  });

  describe('template positions', () => {
    it('locates any node of an expression validated with its offset', () => {
      const { node } = validateExpression('user.name + 1', 10);

      expect(getTemplateSpan(node)).toEqual({ start: 10, end: 23 });
      expect(getTemplateSpan((node as BinaryExpression).left)).toEqual({ start: 10, end: 19 });
    });

    it('does not locate an expression validated without offset', () => {
      expect(getTemplateSpan(validateExpression('user').node)).toBeUndefined();
    });

    it('carries the span of the disallowed node as the cause of the error', () => {
      const error = capture(() => validateExpression('a = 1', 4));

      expect(error.cause).toEqual({ start: 6, end: 7 });
    });

    it('carries the span of what follows the expression as the cause of the error', () => {
      const error = capture(() => validateExpression('a b ', 4));

      expect(error.message).toBe('\'a b\' must be a single expression, got \'b\' after \'a\'.');
      expect(error.cause).toEqual({ start: 6, end: 7 });
    });

    it('carries no span when the offset is not known', () => {
      expect(capture(() => validateExpression('a = 1')).cause).toBeUndefined();
    });
  });
});
