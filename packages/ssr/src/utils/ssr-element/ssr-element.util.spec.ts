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

const { _Context, _setExpressionClass, _setExpressionProperty, _setProperty, CustomElement, HostProperty, Property } = await import('@xaendar/core');
type RenderConditionalBinding = import('@xaendar/core').RenderConditionalBinding<ServerBindings>;
const { _defineServerRender } = await import('../server-render-registry/server-render-registry.util');
const { _ssrComponent, _ssrStartTag } = await import('./ssr-element.util');

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

describe('_ssrComponent', () => {
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

    _ssrComponent(out, context, 'ssr-card', [expression('card-label', 'Ada'), literal('title', 'x')], []);

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
});
