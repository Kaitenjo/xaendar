import { describe, expect, it } from 'vitest';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { validateExpression } from '../../../parser/utils/expression-validator/expression-validator';
import type { LineMapping } from '../../../type-checker/types/generated-line.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { getBlockIdentifier, getElementFactory, getElementIdentifier, getTextIdentifier, GLOBAL_IDENTIFIERS, resolveExpression, ROOT_NODE, toStringLiteral } from './generator.utils';

const resolve = (source: string, context = new CompilerContext(), options?: Parameters<typeof resolveExpression>[2]) => resolveExpression(validateExpression(source).node, context, options);

describe('resolveExpression', () => {
  describe('segments', () => {
    const collect = (source: string, offset: number, context = new CompilerContext()) => {
      const segments = new Array<LineMapping>();
      const { expression } = resolveExpression(validateExpression(source, offset).node, context, { resolver: 'root' }, segments);
      return { expression, segments };
    };
    const columns = (expression: string, segments: LineMapping[]) => segments.map(({ columnStart, columnEnd, original }) => [expression.slice(columnStart, columnEnd), original.start, original.end]);

    it('maps every resolved identifier and every piece copied verbatim, without changing the expression', () => {
      const { expression, segments } = collect('a.b + c', 10);

      expect(expression).toBe('root.a.b + root.c');
      expect(columns(expression, segments)).toEqual([
        ['a', 10, 11],
        ['.', 11, 12],
        ['b', 12, 13],
        [' ', 13, 14],
        ['+', 14, 15],
        [' ', 15, 16],
        ['c', 16, 17]
      ]);
    });

    it('maps a subtree without resolvable identifiers as a whole', () => {
      const { expression, segments } = collect('\'x\' + 1', 3);

      expect(columns(expression, segments)).toEqual([['\'x\' + 1', 3, 10]]);
    });

    it('moves the segments of an object literal wrapped in parentheses', () => {
      const { expression, segments } = collect('{ a: b }', 0);

      expect(expression).toBe('({ a: root.b })');
      expect(columns(expression, segments)).toContainEqual(['b', 5, 6]);
    });

    it('maps the whole access of an identifier read through the context, and the name of a shorthand property', () => {
      const context = new CompilerContext();
      context.addIdentifier('item', 'signal');

      const { expression, segments } = collect('{ item }', 0, context);

      expect(expression).toBe('({ item: context.get(\'item\') })');
      expect(columns(expression, segments)).toContainEqual(['item: context.get(\'item\')', 2, 6]);
    });

    it('collects no segment for an expression validated without offset', () => {
      const segments = new Array<LineMapping>();
      resolveExpression(validateExpression('a + b').node, new CompilerContext(), {}, segments);

      expect(segments).toEqual([]);
    });
  });

  it('prefixes unknown identifiers with the default resolver', () => {
    expect(resolve('items')).toEqual({ expression: 'this.items' });
  });

  it('uses a custom resolver', () => {
    expect(resolve('items', new CompilerContext(), { resolver: 'ctx' })).toEqual({ expression: 'ctx.items' });
  });

  it('emits the bare identifier when the resolver is empty', () => {
    expect(resolve('items', new CompilerContext(), { resolver: '' })).toEqual({ expression: 'items' });
  });

  it('resolves a local identifier named like a global to the local value, keeping window and globalThis for the global', () => {
    const context = new CompilerContext();
    context.addSignalClassField('Math');
    expect(resolve('Math', context)).toEqual({ expression: 'this.Math', reactive: true });
    expect(resolve('window.Math.PI + globalThis.Math.E', context)).toEqual({ expression: 'window.Math.PI + globalThis.Math.E' });
  });

  it('resolves a non-signal class member named like a global through the resolver', () => {
    const context = new CompilerContext();
    context.addShadowingMember('name');
    expect(resolve('name', context)).toEqual({ expression: 'this.name' });
    expect(resolve('name', context, { resolver: 'root' })).toEqual({ expression: 'root.name' });
    expect(resolve('window.name', context)).toEqual({ expression: 'window.name' });
    expect(resolve('name', new CompilerContext(new CompilerContext()))).toEqual({ expression: 'name' });
  });

  it('resolves signal class fields as reactive this-members', () => {
    const context = new CompilerContext();
    context.addSignalClassField('count');
    expect(resolve('count', context)).toEqual({ expression: 'this.count', reactive: true });
  });

  it.each([
    ['signal', true],
    ['value', false]
  ] as const)('leaves unresolvable %s identifiers untouched', (kind, reactive) => {
    const context = new CompilerContext();
    context.addUnresolvableIdentifier('$event', kind);
    expect(resolve('$event', context)).toEqual({ expression: '$event', reactive });
  });

  it.each([
    ['signal', true],
    ['value', false]
  ] as const)('resolves declared %s identifiers through the context', (kind, reactive) => {
    const context = new CompilerContext();
    context.addIdentifier('item', kind);
    expect(resolve('item', context)).toEqual({ expression: 'context.get(\'item\')', reactive });
  });

  it('resolves a variable of the template named like a signal member to the variable, which shadows the member', () => {
    const context = new CompilerContext();
    context.addSignalClassField('count');
    const forContext = new CompilerContext(context);
    forContext.addIdentifier('count', 'signal');
    const eventContext = new CompilerContext(context);
    eventContext.addUnresolvableIdentifier('count');

    expect(resolve('count()', forContext)).toEqual({ expression: 'context.get(\'count\')()', reactive: true });
    expect(resolve('count', eventContext)).toEqual({ expression: 'count', reactive: false });
    expect(resolve('count()', context)).toEqual({ expression: 'this.count()', reactive: true });
  });

  it('does not resolve globals or member names', () => {
    expect(resolve('Math.max(1, 2)')).toEqual({ expression: 'Math.max(1, 2)' });
    expect(resolve('user.name')).toEqual({ expression: 'this.user.name', reactive: undefined });
  });

  it('does not resolve object literal keys', () => {
    expect(resolve('[{ a: b }]').expression).toBe('[{ a: this.b }]');
  });

  it('keeps the name of a shorthand property, giving it the resolved value', () => {
    const context = new CompilerContext();
    context.addSignalClassField('count');
    context.addUnresolvableIdentifier('$event');
    expect(resolve('[{ b, count, $event, Math }]', context)).toEqual({ expression: '[{ b: this.b, count: this.count, $event, Math }]', reactive: true });
  });

  it.each([
    ['an object literal', '{ a: b }', '({ a: this.b })'],
    ['a shorthand object literal', '{b}', '({b: this.b})'],
    ['an expression starting with an object literal', '{ b }.b', '({ b: this.b }.b)'],
    ['an object literal without identifiers to resolve', '{ a: 1 }', '({ a: 1 })']
  ])('wraps %s starting the expression in parentheses', (_name, source, expression) => {
    expect(resolve(source).expression).toBe(expression);
  });

  it('preserves the original formatting of complex expressions', () => {
    expect(resolve('typeof id !== \'boolean\' || pippo instanceof HTMLElement').expression)
      .toBe('typeof this.id !== \'boolean\' || this.pippo instanceof HTMLElement');
  });

  it('propagates reactivity from any part of the expression', () => {
    const context = new CompilerContext();
    context.addSignalClassField('a');
    expect(resolve('a + b', context).reactive).toBe(true);
    expect(resolve('b + c', context).reactive).toBeUndefined();
  });

  it('ignores identifiers with an empty name produced by error recovery', () => {
    expect(resolve('a.').expression).toBe('this.a.');
  });
});

describe('identifier helpers', () => {
  it('exposes the global identifiers and the root node name', () => {
    expect(GLOBAL_IDENTIFIERS.has('Math')).toBe(true);
    expect(ROOT_NODE).toBe('root');
  });

  it('builds element identifiers', () => {
    const node = { tagName: 'my-element' } as ElementNode;
    expect(getElementIdentifier(node, ROOT_NODE, '0')).toBe('my_element0');
    expect(getElementIdentifier(node, 'div0', '1')).toBe('div0__my_element1');
  });

  it('builds text identifiers with a default prefix', () => {
    expect(getTextIdentifier(undefined, ROOT_NODE, '2')).toBe('text2');
    expect(getTextIdentifier('items', 'div0', '2')).toBe('div0__items2');
  });

  it('builds block identifiers', () => {
    expect(getBlockIdentifier('if', ROOT_NODE, '0')).toBe('if0');
    expect(getBlockIdentifier('elseIf', 'div0', '0_1')).toBe('div0__elseIf0_1');
  });
});

describe('getElementFactory', () => {
  it.each([
    ['html', '_createElement'],
    ['svg', '_createSVGElement'],
    ['mathml', '_createMATHMLElement']
  ] as const)('returns the runtime factory of the %s namespace', (namespace, factory) => {
    expect(getElementFactory(namespace)).toBe(factory);
  });
});

describe('toStringLiteral', () => {
  const LINE_SEPARATOR = String.fromCharCode(0x2028);
  const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

  it('wraps a plain text in single quotes', () => {
    expect(toStringLiteral('hello')).toBe(`'hello'`);
  });

  it.each([
    ['a single quote', `it's`, `'it\\'s'`],
    ['a backslash', 'a\\b', `'a\\\\b'`],
    ['line feeds and carriage returns', 'a\r\nb', `'a\\r\\nb'`],
    ['line and paragraph separators', `a${LINE_SEPARATOR}b${PARAGRAPH_SEPARATOR}c`, `'a\\u2028b\\u2029c'`]
  ])('escapes %s', (_description, value, literal) => {
    expect(toStringLiteral(value)).toBe(literal);
  });

  it('produces a literal evaluating back to the text', () => {
    const value = `it's a \\ "quoted"\r\n${LINE_SEPARATOR}text`;
    expect(new Function(`return ${toStringLiteral(value)};`)()).toBe(value);
  });
});
