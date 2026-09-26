import { describe, expect, it } from 'vitest';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { validateExpression } from '../../../parser/utils/expression-validator/expression-validator';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { getBlockIdentifier, getElementIdentifier, getTextIdentifier, GLOBAL_IDENTIFIERS, resolveExpression, ROOT_NODE } from './generator.utils';

const resolve = (source: string, context = new CompilerContext(), options?: Parameters<typeof resolveExpression>[2]) => resolveExpression(validateExpression(source).node, context, options);

describe('resolveExpression', () => {
  it('prefixes unknown identifiers with the default resolver', () => {
    expect(resolve('items')).toEqual({ expression: 'this.items' });
  });

  it('uses a custom resolver', () => {
    expect(resolve('items', new CompilerContext(), { resolver: 'ctx' })).toEqual({ expression: 'ctx.items' });
  });

  it('emits the bare identifier when the resolver is empty', () => {
    expect(resolve('items', new CompilerContext(), { resolver: '' })).toEqual({ expression: 'items' });
  });

  it('emits the bare identifier when resolution is skipped', () => {
    expect(resolve('items', new CompilerContext(), { skipResolution: true })).toEqual({ expression: 'items' });
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

  it('resolves declared value identifiers through the context', () => {
    expect(resolve('item', new CompilerContext(undefined, ['item']))).toEqual({ expression: 'context.get(\'item\')', reactive: false });
  });

  it('resolves declared signal identifiers and unwraps them', () => {
    expect(resolve('item', new CompilerContext(undefined, [['item', 'signal']]))).toEqual({ expression: 'context.get(\'item\')()', reactive: true });
  });

  it('does not resolve globals or member names', () => {
    expect(resolve('Math.max(1, 2)')).toEqual({ expression: 'Math.max(1, 2)' });
    expect(resolve('user.name')).toEqual({ expression: 'this.user.name', reactive: undefined });
  });

  it('does not resolve object literal keys', () => {
    expect(resolve('{ a: b }').expression).toBe('{ a: this.b }');
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
