import { describe, expect, it, vi } from 'vitest';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { _Context } from '../../types/context.type';
import { AttributeUnbinding } from './attribute-unbinding';

const context = { component: undefined } as unknown as _Context;
const target = { localName: 'div' } as unknown as Element;

describe('AttributeUnbinding', () => {
  it('unbinds, once disposed, each attribute declaring an unbind, in the order they are declared, with the context, the target and the attribute', () => {
    const unbound = new Array<string>();
    const unbind = vi.fn((_context: _Context, _target: unknown, attribute: RenderElementAttribute) => {
      unbound.push(attribute.name);
    });
    const setter = vi.fn();
    const first: RenderElementAttribute = { name: 'first', value: 'a', setter, unbind };
    const second: RenderElementAttribute = { name: 'second', value: 'b', setter, unbind };
    const unbinding = new AttributeUnbinding(context, target, [first, { name: 'static', value: 'c', setter }, second]);
    expect(unbind).not.toHaveBeenCalled();

    unbinding.dispose();

    expect(unbound).toEqual(['first', 'second']);
    expect(unbind.mock.calls).toEqual([[context, target, first], [context, target, second]]);
    expect(setter).not.toHaveBeenCalled();
  });
});
