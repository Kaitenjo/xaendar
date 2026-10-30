import { describe, expect, it, vi } from 'vitest';
import type { ServerOutput } from '../../types/server-output/server-output.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _Context, _defineDirective, _getComponentRuntime, _setExpressionProperty, Property, StructuralDirective } = await import('@xaendar/core');
type StructuralDirectiveDescriptor = import('@xaendar/core').RenderElementStructuralDirective;
type StructuralConditionalBinding = import('@xaendar/core').RenderElementStructuralDirectiveConditionalBinding;
const { _ssrStructural } = await import('./ssr-structural.util');

const allow = (Property(true) as unknown as (target: unknown, context: unknown) => { init(this: object): () => boolean | Promise<boolean> })({}, { name: 'allow', metadata: {} });

/**
 * A structural directive allowing the element as its `allow` input tells, synchronously or not.
 */
class GuardDirective extends StructuralDirective {
  public allow = allow.init.call(this);

  public shouldRender(): boolean | Promise<boolean> {
    return this.allow();
  }
}
_defineDirective('guard', GuardDirective);

const context = new _Context({ get: () => undefined } as never);

/**
 * Describes the structural directive `*guard(allow="{…}")`.
 */
const guard = (value: boolean | Promise<boolean>) => ({ selector: 'guard', attributes: [{ name: 'allow', value: () => value, setter: _setExpressionProperty }] }) as unknown as StructuralDirectiveDescriptor;

/**
 * Writes the element as the generated code does, recording the context it is written in.
 */
const render = vi.fn((out: ServerOutput, _context: InstanceType<typeof _Context>) => {
  out.push('<p></p>');
});

describe('_ssrStructural', () => {
  it('writes the element at once, in a child of the context, when every structural directive allows it synchronously', () => {
    const out: ServerOutput = [];

    _ssrStructural(out, context, [guard(true), guard(true)], [], render);

    expect(out).toEqual(['<p></p>']);
    const elementContext = render.mock.lastCall![1];
    expect(elementContext).not.toBe(context);
    expect(elementContext.get('missing')).toBeUndefined();
  });

  it('writes nothing for a synchronous false, without leaving the rejection of another one unhandled', async () => {
    const out: ServerOutput = [];
    render.mockClear();

    _ssrStructural(out, context, [guard(Promise.reject(new Error('denied'))), guard(false)], [], render);
    await Promise.resolve();

    expect(out).toEqual([]);
    expect(render).not.toHaveBeenCalled();
  });

  it('holds the place of the element with the promise of its output when an outcome is asynchronous, rendering on the server', async () => {
    const out: ServerOutput = [];
    const effect = vi.fn();
    render.mockImplementationOnce((output: ServerOutput) => {
      _getComponentRuntime().effect(effect);
      output.push('<p>later</p>');
    });

    _ssrStructural(out, context, [guard(true), guard(Promise.resolve(true))], [], render);

    expect(out).toHaveLength(1);
    await expect(out[0]).resolves.toEqual(['<p>later</p>']);
    expect(effect).not.toHaveBeenCalled();
  });

  it('writes nothing once an asynchronous outcome is false or rejected', async () => {
    const denied: ServerOutput = [];
    const failed: ServerOutput = [];

    _ssrStructural(denied, context, [guard(Promise.resolve(false))], [], render);
    _ssrStructural(failed, context, [guard(Promise.reject(new Error('failed')))], [], render);

    await expect(denied[0]).resolves.toEqual([]);
    await expect(failed[0]).resolves.toEqual([]);
  });

  it('evaluates the structural directives of the branches the conditional bindings select, nested ones included', () => {
    const out: ServerOutput = [];
    const conditionalBindings: StructuralConditionalBinding[] = [
      {
        branches: [
          { condition: () => false, structuralDirectives: [guard(false)], conditionalBindings: [] },
          {
            structuralDirectives: [guard(true)],
            conditionalBindings: [{ expression: () => 'b', branches: [{ condition: ['b'], structuralDirectives: [guard(false)], conditionalBindings: [] }] }]
          }
        ]
      },
      { branches: [{ condition: () => false, structuralDirectives: [guard(false)], conditionalBindings: [] }] }
    ];

    _ssrStructural(out, context, [], conditionalBindings, render);

    expect(out).toEqual([]);
  });

  it('throws when no structural directive is registered for a selector', () => {
    expect(() => _ssrStructural([], context, [{ selector: 'missing', attributes: [] }], [], render)).toThrow('No directive registered for selector "missing"');
  });
});
