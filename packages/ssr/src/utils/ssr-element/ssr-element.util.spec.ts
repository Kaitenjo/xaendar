import { describe, expect, it, vi } from 'vitest';
import type { ServerBindings } from '../../types/server-bindings.type';
import type { ServerAttribute } from '../../types/server-attribute.type';
import type { ServerOutput } from '../../types/server-output.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _Context, _setExpressionClass, _setExpressionInput, _setExpressionProperty, _setInput, _setProperty, CustomElement, HostProperty, Property } = await import('@xaendar/core');
type RenderConditionalBinding = import('@xaendar/core').RenderConditionalBinding<ServerBindings>;
const { _defineServerRender } = await import('../server-render-registry/server-render-registry.util');
const { _ssrClientComponent, _ssrComponent, _ssrStartTag } = await import('./ssr-element.util');

const context = new _Context({ get: () => undefined } as never);

/**
 * Describes an attribute written with a value known when the template is compiled.
 */
const literal = (name: string, value: string) => ({ name, value, setter: _setProperty }) as unknown as ServerAttribute;

/**
 * Describes an attribute written with the value of an expression.
 */
const expression = (name: string, value: unknown) => ({ name, value: () => value, setter: _setExpressionProperty }) as unknown as ServerAttribute;

/**
 * Describes an input set to a value known when the template is compiled, by the name of its property.
 */
const literalInput = (name: string, value: string) => ({ name, value, setter: _setInput }) as unknown as ServerAttribute;

/**
 * Describes an input set to the value of an expression, by the name of its property.
 */
const expressionInput = (name: string, value: unknown) => ({ name, value: () => value, setter: _setExpressionInput }) as unknown as ServerAttribute;

/**
 * Describes a class toggled by the value of an expression.
 */
const classBinding = (name: string, value: unknown) => ({ name, value: () => value, setter: _setExpressionClass }) as unknown as ServerAttribute;

describe('_ssrStartTag', () => {
  it('writes the start tag with the attributes and the classes applied in order through the setters of the client', () => {
    const out: ServerOutput = [];

    _ssrStartTag(out, context, 'div', [literal('class', 'a'), expression('title', '"x" & <y>'), classBinding('on', 1)], []);

    expect(out).toEqual(['<div class="a on" title="&quot;x&quot; &amp; &lt;y&gt;">']);
  });

  it('applies the bindings of the branch each conditional binding selects, nested ones included', () => {
    const out: ServerOutput = [];
    const conditionalBindings: RenderConditionalBinding[] = [
      {
        branches: [
          { condition: () => false, attributes: [literal('title', 'no')], conditionalBindings: [] },
          {
            attributes: [literal('title', 'else')],
            conditionalBindings: [{
              expression: () => 2,
              branches: [
                { condition: [1], attributes: [literal('lang', 'one')], conditionalBindings: [] },
                { condition: null, attributes: [literal('lang', 'other')], conditionalBindings: [] }
              ]
            }]
          }
        ]
      },
      { branches: [{ condition: () => false, attributes: [literal('id', 'never')], conditionalBindings: [] }] }
    ];

    _ssrStartTag(out, context, 'p', [], conditionalBindings);

    expect(out).toEqual(['<p title="else" lang="other">']);
  });
});

describe('_ssrClientComponent', () => {
  const options = { island: false };

  it('writes the attributes and the classes, not the inputs, without reading their expressions', () => {
    const out: ServerOutput = [];
    const read = vi.fn();
    const input = { name: 'centre', value: read, setter: _setExpressionInput } as unknown as ServerAttribute;

    _ssrClientComponent(out, context, 'x-map', [literal('title', 'Map'), input, classBinding('zoom', 1)], [], options);

    expect(out).toEqual(['<x-map title="Map" class="zoom" data-xd-client="">']);
    expect(read).not.toHaveBeenCalled();
  });

  it('writes the inputs of an island into data-xd-inputs by the name of their property, the ones of the branch selected included', () => {
    const out: ServerOutput = [];
    const conditionalBindings: RenderConditionalBinding[] = [
      {
        branches: [
          { condition: () => false, attributes: [literalInput('zoom', 'no')], conditionalBindings: [] },
          { condition: () => true, attributes: [literal('title', 'Map')], conditionalBindings: [{ branches: [{ attributes: [expressionInput('zoom', 3)], conditionalBindings: [] }] }] }
        ]
      },
      { branches: [{ condition: () => false, attributes: [], conditionalBindings: [] }] }
    ];

    _ssrClientComponent(out, context, 'x-map', [literalInput('centre', 'Rome')], conditionalBindings, { ...options, island: true, hydrate: 'visible' });

    expect(out).toHaveLength(1);
    expect(out[0]).toContain('<x-map title="Map" data-xd-client="" data-xd-hydrate="visible" data-xd-inputs="');
    expect(out[0]).toContain('centre');
    expect(out[0]).toContain('Rome');
    expect(out[0]).not.toContain('center');
  });

  it('writes no trigger for load, which is the default', () => {
    const out: ServerOutput = [];

    _ssrClientComponent(out, context, 'x-map', [], [], { ...options, hydrate: 'load' });

    expect(out).toEqual(['<x-map data-xd-client="">']);
  });
});

describe('_ssrComponent', () => {
  it('renders outside of a page, where no event contract collects the events', () => {
    class Outside extends CustomElement { }
    customElements.define('x-outside', Outside);
    const render = Object.assign(() => undefined, { events: ['click'] });
    _defineServerRender(Outside, render);
    const out: ServerOutput = [];

    expect(() => _ssrComponent(out, context, 'x-outside', [], [])).not.toThrow();
  });

  it('writes a custom element whose class is not defined as an element without shadow root', () => {
    const out: ServerOutput = [];

    _ssrComponent(out, context, 'not-defined', [literal('title', 'x')], []);

    expect(out).toEqual(['<not-defined title="x">']);
  });

  it('writes a component without a template compiled for the server as an element without shadow root, without constructing it', () => {
    const constructed = vi.fn();
    class ClientOnlyElement extends CustomElement {
      constructor() {
        super();
        constructed();
      }
    }
    customElements.define('client-only', ClientOnlyElement);
    const out: ServerOutput = [];

    _ssrComponent(out, context, 'client-only', [literal('title', 'x')], []);

    expect(out).toEqual(['<client-only title="x">']);
    expect(constructed).not.toHaveBeenCalled();
  });

  it('renders a component: its inputs set, onInit run before the template, its stylesheet first, and its host attributes written on the start tag', () => {
    const metadata: DecoratorMetadataObject = {};
    const label = (Property('default', { alias: 'card-label' }) as unknown as (target: unknown, context: unknown) => { init(this: object): () => string })({}, { name: 'label', metadata });
    (HostProperty('role') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'role', static: false, metadata, access: { get: (owner: { role: string }) => owner.role } });

    class CardElement extends CustomElement {
      public label = label.init.call(this);
      public role = 'note';
      public calls = new Array<string>();

      public onInit(): void {
        this.calls.push(`onInit ${this.label()}`);
      }
    }
    Object.defineProperty(CardElement, Symbol.for('Symbol.metadata'), { value: metadata });
    customElements.define('ssr-card', CardElement);
    let rendered: CardElement | undefined;
    _defineServerRender(CardElement, function (this: InstanceType<typeof CustomElement>, out: ServerOutput) {
      rendered = this as CardElement;
      rendered.calls.push('render');
      out.push(`<span>${rendered.label()}</span>`);
    }, ':host { color: red } </style>');
    const out: ServerOutput = [];

    _ssrComponent(out, context, 'ssr-card', [expressionInput('label', 'Ada'), literal('title', 'x')], []);

    expect(out).toEqual([
      '<ssr-card title="x" role="note">',
      '<template shadowrootmode="open">',
      '<style>:host { color: red } <\\/style></style>',
      '<span>Ada</span>',
      '</template>'
    ]);
    expect(rendered!.calls).toEqual(['onInit Ada', 'render']);
  });

  it('renders a component without stylesheet', () => {
    class PlainElement extends CustomElement { }
    customElements.define('ssr-plain', PlainElement);
    _defineServerRender(PlainElement, (out: ServerOutput) => {
      out.push('x');
    });
    const out: ServerOutput = [];

    _ssrComponent(out, context, 'ssr-plain', [], []);

    expect(out).toEqual(['<ssr-plain>', '<template shadowrootmode="open">', 'x', '</template>']);
  });

  it('writes the trigger hydrating a component its @WebComponent declares, the default load excepted', () => {
    const define = (tagName: string, hydrate: string) => {
      class TriggeredElement extends CustomElement { }
      Object.defineProperty(TriggeredElement, Symbol.for('Symbol.metadata'), { value: { hydrate } });
      customElements.define(tagName, TriggeredElement);
      _defineServerRender(TriggeredElement, () => undefined);
    };
    define('ssr-visible', 'visible');
    define('ssr-load', 'load');
    const out: ServerOutput = [];

    _ssrComponent(out, context, 'ssr-visible', [], []);
    _ssrComponent(out, context, 'ssr-load', [], []);

    expect(out.filter(html => typeof html === 'string' && !html.startsWith('<template') && html !== '</template>')).toEqual(['<ssr-visible data-xd-hydrate="visible">', '<ssr-load>']);
  });
});
