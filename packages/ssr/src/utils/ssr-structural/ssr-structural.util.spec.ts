import { describe, expect, it, vi } from 'vitest';
import type { ServerOutput } from '../../types/server-output.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _Context, _defineDirective, _getComponentRuntime, _setExpressionInput, Property, StructuralDirective } = await import('@xaendar/core');
type StructuralDirectiveDescriptor = import('@xaendar/core').RenderElementStructuralDirective;
type StructuralConditionalBinding = import('@xaendar/core').RenderElementStructuralDirectiveConditionalBinding;
const { _ssrStructural } = await import('./ssr-structural.util');
const { _createServerRuntime, _runOnServer } = await import('../server-runtime/server-runtime.util');

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
const guard = (value: boolean | Promise<boolean>) => ({ selector: 'guard', attributes: [{ name: 'allow', value: () => value, setter: _setExpressionInput }] }) as unknown as StructuralDirectiveDescriptor;

/**
 * Writes the element as the generated code does, recording the context it is written in.
 */
const render = vi.fn((out: ServerOutput, _context: InstanceType<typeof _Context>) => {
  out.push('<p></p>');
});

describe('_ssrStructural', () => {
  it('writes the element at once between the markers of a rendered element, in a child of the context, when every structural directive allows it synchronously', () => {
    const out: ServerOutput = [];

    _ssrStructural(out, context, { structuralDirectives: [guard(true), guard(true)], render });

    expect(out).toEqual(['<!--xd-s:1-->', '<p></p>', '<!--/xd-s-->']);
    const elementContext = render.mock.lastCall![1];
    expect(elementContext).not.toBe(context);
    expect(elementContext.get('missing')).toBeUndefined();
  });

  it('writes the markers of an element not rendered for a synchronous false, without leaving the rejection of another one unhandled', async () => {
    const out: ServerOutput = [];
    render.mockClear();

    _ssrStructural(out, context, { structuralDirectives: [guard(Promise.reject(new Error('denied'))), guard(false)], render });
    await Promise.resolve();

    expect(out).toEqual(['<!--xd-s:0-->', '<!--/xd-s-->']);
    expect(render).not.toHaveBeenCalled();
  });

  it('holds the place of the element with the promise of its output when an outcome is asynchronous, rendering it with the runtime of the page', async () => {
    const out: ServerOutput = [];
    const effect = vi.fn();
    let seenRuntime: ReturnType<typeof _getComponentRuntime> | undefined;
    render.mockImplementationOnce((output: ServerOutput) => {
      seenRuntime = _getComponentRuntime();
      seenRuntime.effect(effect);
      output.push('<p>later</p>');
    });
    const runtime = _createServerRuntime({ product: 42 });

    _runOnServer(runtime, () => _ssrStructural(out, context, { structuralDirectives: [guard(true), guard(Promise.resolve(true))], render }));

    expect(out).toHaveLength(2);
    expect(out[1]).toBe('<!--/xd-s-->');
    await expect(out[0]).resolves.toEqual(['<!--xd-s:1-->', '<p>later</p>']);
    expect(seenRuntime).toBe(runtime);
    expect(effect).not.toHaveBeenCalled();
  });

  it('writes the markers of an element not rendered once an asynchronous outcome is false or rejected', async () => {
    const denied: ServerOutput = [];
    const failed: ServerOutput = [];

    _ssrStructural(denied, context, { structuralDirectives: [guard(Promise.resolve(false))], render });
    _ssrStructural(failed, context, { structuralDirectives: [guard(Promise.reject(new Error('failed')))], render });

    await expect(denied[0]).resolves.toEqual(['<!--xd-s:0-->']);
    await expect(failed[0]).resolves.toEqual(['<!--xd-s:0-->']);
    expect(denied[1]).toBe('<!--/xd-s-->');
  });

  it('writes no marker closing the last element of its parent, rendered or not', () => {
    const rendered: ServerOutput = [];
    const hidden: ServerOutput = [];

    _ssrStructural(rendered, context, { structuralDirectives: [guard(true)], render, last: true });
    _ssrStructural(hidden, context, { structuralDirectives: [guard(false)], render, last: true });

    expect(rendered.join('')).toBe('<!--xd-s:1--><p></p>');
    expect(hidden.join('')).toBe('<!--xd-s:0-->');
  });

  it('writes no marker closing the last element of its parent after the promise of its output, when an outcome is asynchronous', async () => {
    const allowed: ServerOutput = [];
    const denied: ServerOutput = [];

    _ssrStructural(allowed, context, { structuralDirectives: [guard(Promise.resolve(true))], render, last: true });
    _ssrStructural(denied, context, { structuralDirectives: [guard(Promise.resolve(false))], render, last: true });

    expect(allowed.slice(1).join('')).toBe('');
    expect(denied.slice(1).join('')).toBe('');
    await expect(allowed[0]).resolves.toEqual(['<!--xd-s:1-->', '<p></p>']);
    await expect(denied[0]).resolves.toEqual(['<!--xd-s:0-->']);
  });

  it('evaluates the structural directives of the branches the conditional bindings select, nested ones included', () => {
    const out: ServerOutput = [];
    const conditionalBindings: StructuralConditionalBinding[] = [
      {
        branches: [
          { condition: () => false, structuralDirectives: [guard(false)] },
          {
            structuralDirectives: [guard(true)],
            conditionalBindings: [{ expression: () => 'b', branches: [{ condition: ['b'], structuralDirectives: [guard(false)] }] }]
          }
        ]
      },
      { branches: [{ condition: () => false, structuralDirectives: [guard(false)] }] }
    ];

    _ssrStructural(out, context, { structuralConditionalBindings: conditionalBindings, render });

    expect(out).toEqual(['<!--xd-s:0-->', '<!--/xd-s-->']);
  });

  it('writes the element with the component of the context as this, a structural directive binding no property applying its defaults', () => {
    const out: ServerOutput = [];
    const component = { name: 'card' };
    const componentContext = new _Context(context, undefined, 0, component);
    let self: unknown;

    _ssrStructural(out, componentContext, {
      structuralDirectives: [{ selector: 'guard' }],
      render(this: unknown, output: ServerOutput) {
        self = this;
        output.push('<p></p>');
      }
    });

    expect(out).toEqual(['<!--xd-s:1-->', '<p></p>', '<!--/xd-s-->']);
    expect(self).toBe(component);
  });

  it('throws when no structural directive is registered for a selector', () => {
    expect(() => _ssrStructural([], context, { structuralDirectives: [{ selector: 'missing', attributes: [] }], render })).toThrow('No directive registered for selector "missing"');
  });
});
