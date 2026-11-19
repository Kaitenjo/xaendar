import { describe, expect, it } from 'vitest';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { validateExpression } from '../../../parser/utils/expression-validator/expression-validator';
import type { LineMapping } from '../../../type-checker/types/line-mapping.type';
import { GeneratorContext } from '../../context/context';
import { getBlockIdentifier, getElementIdentifier, getSignalCallee, getTextIdentifier, GLOBAL_IDENTIFIERS, isBrowserOnlyGlobal, resolveExpression, ROOT_NODE, toStringLiteral } from './generator.utils';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const resolve = (source: string, context = new GeneratorContext(cache), options?: Parameters<typeof resolveExpression>[2]) => resolveExpression(validateExpression(source).node, context, options);

describe('resolveExpression', () => {
  describe('segments', () => {
    const collect = (source: string, offset: number, context = new GeneratorContext(cache)) => {
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
      const context = new GeneratorContext(cache);
      context.addIdentifier('item', 'signal');

      const { expression, segments } = collect('{ item }', 0, context);

      expect(expression).toBe('({ item: _read(context, 0, 5) })');
      expect(columns(expression, segments)).toContainEqual(['item: _read(context, 0, 5)', 2, 6]);
    });

    it('maps the read of a narrowed signal onto the call, keeping the mappings of the call', () => {
      const context = new GeneratorContext(cache);
      context.addSignalClassField('user');
      const segments = new Array<LineMapping>();

      const { expression } = resolveExpression(validateExpression('user().name', 4).node, context, { resolver: 'root', narrowedSignal: () => '__if0_user' }, segments);

      expect(expression).toBe('(root.user(), __if0_user).name');
      expect(columns(expression, segments)).toEqual([
        ['user', 4, 8],
        ['()', 8, 10],
        ['(root.user(), __if0_user)', 4, 10],
        ['.', 10, 11],
        ['name', 11, 15]
      ]);
    });

    it('collects no segment for an expression validated without offset', () => {
      const segments = new Array<LineMapping>();
      resolveExpression(validateExpression('a + b').node, new GeneratorContext(cache), {}, segments);

      expect(segments).toEqual([]);
    });
  });

  it('prefixes unknown identifiers with the default resolver', () => {
    expect(resolve('items')).toEqual({ expression: 'this.items' });
  });

  it('uses a custom resolver', () => {
    expect(resolve('items', new GeneratorContext(cache), { resolver: 'ctx' })).toEqual({ expression: 'ctx.items' });
  });

  it('emits the bare identifier when the resolver is empty', () => {
    expect(resolve('items', new GeneratorContext(cache), { resolver: '' })).toEqual({ expression: 'items' });
  });

  it('resolves a local identifier named like a global to the local value, keeping window and globalThis for the global', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('Math');
    expect(resolve('Math', context)).toEqual({ expression: 'this.Math', reactive: true });
    expect(resolve('window.Math.PI + globalThis.Math.E', context)).toEqual({ expression: 'window.Math.PI + globalThis.Math.E' });
  });

  it('resolves a non-signal class member named like a global through the resolver', () => {
    const context = new GeneratorContext(cache);
    context.addShadowingMember('name');
    expect(resolve('name', context)).toEqual({ expression: 'this.name' });
    expect(resolve('name', context, { resolver: 'root' })).toEqual({ expression: 'root.name' });
    expect(resolve('window.name', context)).toEqual({ expression: 'window.name' });
    expect(resolve('name', new GeneratorContext(new GeneratorContext(cache)))).toEqual({ expression: 'name' });
  });

  it('drops the non-null assertion, resolving the value it applies to', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('user');
    expect(resolve('user()!.name', context)).toEqual({ expression: 'this.user().name', reactive: true });
    expect(resolve('items!', new GeneratorContext(cache))).toEqual({ expression: 'this.items' });
    expect(resolve('(a! + b!)!')).toEqual({ expression: '(this.a + this.b)' });
  });

  it('drops the non-null assertion from a subtree without identifiers to resolve', () => {
    expect(resolve('window.name!.length')).toEqual({ expression: 'window.name.length' });
  });

  it('keeps the non-null assertion when asked to', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('user');
    expect(resolve('user()!.name', context, { preserveTypeScript: true })).toEqual({ expression: 'this.user()!.name', reactive: true });
    expect(resolve('window.name!.length', undefined, { preserveTypeScript: true })).toEqual({ expression: 'window.name!.length' });
  });

  it('drops the casts of the arguments of a call, resolving the values they apply to', () => {
    expect(resolve('format(value as Date)')).toEqual({ expression: 'this.format(this.value)' });
    expect(resolve('format(value as unknown as Row, 1)')).toEqual({ expression: 'this.format(this.value, 1)' });
    expect(resolve('Math.max(1 as number)')).toEqual({ expression: 'Math.max(1)' });
  });

  it('keeps the casts when asked to, writing their types as written and mapped onto the template', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('Row');
    const segments = new Array<LineMapping>();
    // `{ format(value as Row) }`: the expression starts at offset 2
    const { expression } = resolveExpression(validateExpression('format(value as Row)', 2).node, context, { resolver: 'root', preserveTypeScript: true }, segments);

    expect(expression).toBe('root.format(root.value as Row)');
    expect(segments).toContainEqual({ columnStart: 26, columnEnd: 29, original: { start: 18, end: 21 } });
    expect(resolve('Math.max(1 as number)', undefined, { preserveTypeScript: true })).toEqual({ expression: 'Math.max(1 as number)' });
  });

  it('resolves signal class fields as reactive this-members', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('count');
    expect(resolve('count', context)).toEqual({ expression: 'this.count', reactive: true });
  });

  it.each([
    ['signal', true],
    ['value', false]
  ] as const)('leaves unresolvable %s identifiers untouched', (kind, reactive) => {
    const context = new GeneratorContext(cache);
    context.addUnresolvableIdentifier('$event', kind);
    expect(resolve('$event', context)).toEqual({ expression: '$event', reactive });
  });

  it.each([
    ['signal', true],
    ['value', false]
  ] as const)('resolves declared %s identifiers through the slot of the scope declaring them', (kind, reactive) => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('item', kind);
    expect(resolve('item', context)).toEqual({ expression: '_read(context, 0, 5)', reactive });
  });

  it('resolves a template through the constant describing it, which reads no variable', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable', 'template_row_0$template');
    expect(resolve('row', new GeneratorContext(context))).toEqual({ expression: 'template_row_0$template', reactive: false });
  });

  it('resolves a variable of the template named like a signal member to the variable, which shadows the member', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('count');
    const forContext = new GeneratorContext(context);
    forContext.addIdentifier('count', 'signal');
    const eventContext = new GeneratorContext(context);
    eventContext.addUnresolvableIdentifier('count');

    expect(resolve('count()', forContext)).toEqual({ expression: '_read(context, 0, 5)()', reactive: true });
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
    const context = new GeneratorContext(cache);
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

  it('reads the variables of the template as values, listing each one once, and calls one holding a function as written', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable');
    context.addIdentifier('handler', 'variable');
    context.addIdentifier('field', 'value');

    const resolved = resolve('handler(row) + row.id + field.value', context);

    expect(resolved.expression).toBe('_read(context, 0, 6)(_read(context, 0, 5)) + _read(context, 0, 5).id + _read(context, 0, 7).value');
    expect(resolved.variables).toEqual([1, 0]);
    expect(resolved.reactive).toBeFalsy();
  });

  it('propagates reactivity from any part of the expression', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('a');
    expect(resolve('a + b', context).reactive).toBe(true);
    expect(resolve('b + c', context).reactive).toBeUndefined();
  });

  it('ignores identifiers with an empty name produced by error recovery', () => {
    expect(resolve('a.').expression).toBe('this.a.');
  });

  it('reads a narrowed signal called without arguments through its constant, after the call, leaving its other reads untouched', () => {
    const context = new GeneratorContext(cache);
    context.addSignalClassField('user');
    context.addSignalClassField('count');
    const narrowedSignal = (name: string) => name === 'user' ? '__if0_user' : undefined;

    expect(resolve('user()?.name + take(user) + user(1) + user?.() + count()', context, { resolver: 'root', narrowedSignal })).toEqual({
      expression: '(root.user(), __if0_user)?.name + root.take(root.user) + root.user(1) + root.user?.() + root.count()',
      reactive: true
    });
  });

  it('calls a global named like a narrowed signal', () => {
    expect(resolve('Date()', new GeneratorContext(cache), { narrowedSignal: () => '__if0_Date' })).toEqual({ expression: 'Date()' });
  });

  describe('browserGlobals', () => {
    it('reads the globals of the browser through the given object, leaving the ones of ECMAScript as written', () => {
      expect(resolve('document.title + Math.max(innerWidth, 1) + JSON.stringify(undefined)', new GeneratorContext(cache), { browserGlobals: 'globalThis' }).expression)
        .toBe('globalThis.document.title + Math.max(globalThis.innerWidth, 1) + JSON.stringify(undefined)');
    });

    it('keeps the name of a shorthand property, giving it the global', () => {
      expect(resolve('{ window }', new GeneratorContext(cache), { browserGlobals: 'globalThis' }).expression).toBe('({ window: globalThis.window })');
    });

    it('resolves a member or a variable of the template named like a global of the browser as without the option', () => {
      const context = new GeneratorContext(cache);
      context.addShadowingMember('name');
      context.addSignalClassField('status');
      const blockContext = new GeneratorContext(context);
      blockContext.addIdentifier('location');

      expect(resolve('name + status() + location', blockContext, { browserGlobals: 'globalThis' })).toEqual({
        expression: 'this.name + this.status() + _read(context, 0, 5)',
        reactive: true
      });
    });

    it('leaves the globals of the browser as written without the option', () => {
      expect(resolve('document.title').expression).toBe('document.title');
    });
  });
});

describe('isBrowserOnlyGlobal', () => {
  it.each(['window', 'document', 'location', 'Notification', 'localStorage', 'sessionStorage', 'navigator'])('is true for %s', name => {
    expect(isBrowserOnlyGlobal(name)).toBe(true);
  });

  it.each(['console', 'fetch', 'URL', 'setTimeout', 'Math', 'JSON', 'item'])('is false for %s', name => {
    expect(isBrowserOnlyGlobal(name)).toBe(false);
  });
});

describe('getSignalCallee', () => {
  it('returns the identifier a call without arguments calls, nothing for any other node', () => {
    const callee = (source: string) => getSignalCallee(validateExpression(source).node)?.text;

    expect(callee('user()')).toBe('user');
    expect(callee('user')).toBeUndefined();
    expect(callee('user(1)')).toBeUndefined();
    expect(callee('user?.()')).toBeUndefined();
    expect(callee('store.user()')).toBeUndefined();
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
