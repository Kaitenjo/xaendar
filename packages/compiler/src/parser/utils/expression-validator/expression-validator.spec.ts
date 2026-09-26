import { describe, expect, it } from 'vitest';
import { validateExpression } from './expression-validator';

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
});
