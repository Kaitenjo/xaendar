// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { MATHML_NS, SVG_NS } = await import('../../costants');
const { input } = await import('../../signals/input/input');
const { _Context } = await import('../context/context.util');
const {
  _createElement,
  _createMATHMLElement,
  _createSVGElement,
  _removeAttribute,
  _renderElement,
  _setExpressionProperty,
  _setProperty,
  _setReactiveProperty
} = await import('./render-element.util');
const { signal } = await import('../../signals');
const { effect } = await import('../../signals/effect/effect');
const { CustomDirective } = await import('../../models/custom-directive/custom-directive');
const { _defineDirective } = await import('../directive-registry/directive-registry.util');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot(root: Record<string, unknown> = {}) {
  return new _Context(root as never, { createElement: _createElement } as never);
}

const render = (
  parent: Element,
  context: InstanceType<typeof _Context>,
  { attributes = [], events = [], conditionalBindings = [], directives = [], anchor = null }: { attributes?: unknown[], events?: unknown[], conditionalBindings?: unknown[], directives?: unknown[], anchor?: Comment | null } = {}
) => _renderElement(parent, context, anchor, 'div', attributes as never, events as never, conditionalBindings as never, directives as never);

/**
 * Directive recording the values of its `label` input seen by the effects started in `reactToChanges`.
 */
class LabelDirective extends CustomDirective {
  public static readonly instances = new Array<LabelDirective>();

  public readonly label = input<string>('initial');
  public readonly seen = new Array<string>();
  public readonly unlisten = vi.fn();

  public reactToChanges(): Array<() => void> {
    return [effect(() => { this.seen.push(this.label()); }), this.unlisten];
  }

  constructor(element: HTMLElement) {
    super(element);
    LabelDirective.instances.push(this);
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}

Object.defineProperty(LabelDirective, Symbol.for('Symbol.metadata'), { value: { aliasToAttribute: { 'my-label': 'label' } } });
_defineDirective('label', LabelDirective);

/**
 * Directive reading a signal while it is started, outside of any effect of its own.
 */
class TrackingDirective extends CustomDirective {
  public static readonly instances = new Array<TrackingDirective>();
  public static readonly source = signal(0);

  public reactToChanges(): undefined {
    TrackingDirective.source();
    TrackingDirective.instances.push(this);
  }
}

_defineDirective('tracking', TrackingDirective);

describe('element factories', () => {
  it('creates an HTML element', () => {
    expect(_createElement('section').tagName).toBe('SECTION');
  });

  it('creates an SVG element in the SVG namespace', () => {
    expect(_createSVGElement('circle').namespaceURI).toBe(SVG_NS);
  });

  it('creates a MathML element in the MathML namespace', () => {
    expect(_createMATHMLElement('mi').namespaceURI).toBe(MATHML_NS);
  });
});

describe('property setters', () => {
  it('_setProperty sets a literal attribute', () => {
    const element = document.createElement('div');
    _setProperty(createRoot(), element, 'title', 'hello');
    expect(element.getAttribute('title')).toBe('hello');
  });

  it('_setExpressionProperty evaluates the expression once', () => {
    const element = document.createElement('div');
    _setExpressionProperty(createRoot(), element, 'title', () => 5);
    expect(element.getAttribute('title')).toBe('5');
  });

  it('_setReactiveProperty follows the signals it reads', async () => {
    const element = document.createElement('div');
    const title = signal('a');
    _setReactiveProperty(createRoot(), element, 'title', () => title());
    expect(element.getAttribute('title')).toBe('a');

    title.set('b');
    await flush();

    expect(element.getAttribute('title')).toBe('b');
  });

  it('_setReactiveProperty stops following once the context is destroyed', async () => {
    const element = document.createElement('div');
    const context = createRoot();
    const title = signal('a');
    _setReactiveProperty(context, element, 'title', () => title());

    context.unlisten();
    title.set('b');
    await flush();

    expect(element.getAttribute('title')).toBe('a');
  });

  it('_removeAttribute removes the attribute', () => {
    const element = document.createElement('div');
    element.setAttribute('title', 'x');
    _removeAttribute(createRoot(), element, 'title');
    expect(element.hasAttribute('title')).toBe(false);
  });

  describe('input signal properties', () => {
    it('sets the value of an input signal instead of the attribute', () => {
      const element = document.createElement('div') as unknown as HTMLElement & { label: ReturnType<typeof input<string>> };
      element.label = input<string>('initial');

      _setProperty(createRoot(), element, 'label', 'updated');

      expect(element.label()).toBe('updated');
      expect(element.hasAttribute('label')).toBe(false);
    });

    it('resolves the attribute alias through the class metadata', () => {
      class Aliased extends HTMLElement {
        label = input<string>('initial');
      }
      Object.defineProperty(Aliased, Symbol.for('Symbol.metadata'), { value: { aliasToAttribute: { 'my-label': 'label' } } });
      customElements.define('x-aliased', Aliased);
      const element = document.createElement('x-aliased') as Aliased;

      _setProperty(createRoot(), element, 'my-label', 'aliased');

      expect(element.label()).toBe('aliased');
    });

    it('sets the value of an input signal of a directive', () => {
      const directive = new LabelDirective(document.createElement('div'));

      _setProperty(createRoot(), directive, 'label', 'updated');

      expect(directive.label()).toBe('updated');
    });

    it('resolves the alias of a directive property through the class metadata', () => {
      const directive = new LabelDirective(document.createElement('div'));

      _setProperty(createRoot(), directive, 'my-label', 'aliased');

      expect(directive.label()).toBe('aliased');
    });

    it('throws when a directive does not declare the property', () => {
      const directive = new LabelDirective(document.createElement('div'));

      expect(() => _setProperty(createRoot(), directive, 'missing', 'value')).toThrow('LabelDirective does not declare a property named "missing"');
    });

    it('falls back to the attribute for properties that are not input signals', () => {
      const element = document.createElement('div') as unknown as HTMLElement & { custom: string };
      element.custom = 'not-a-signal';

      _setProperty(createRoot(), element, 'custom', 'value');

      expect(element.getAttribute('custom')).toBe('value');
    });
  });
});

describe('_renderElement', () => {
  it('creates and mounts the element', () => {
    const parent = document.createElement('div');
    const element = render(parent, createRoot());

    expect(element.tagName).toBe('DIV');
    expect(element.parentNode).toBe(parent);
  });

  it('inserts the element before the anchor', () => {
    const parent = document.createElement('div');
    const anchor = document.createComment('anchor');
    parent.appendChild(anchor);

    const element = render(parent, createRoot(), { anchor });

    expect(element.nextSibling).toBe(anchor);
  });

  it('removes the element when the context is destroyed', () => {
    const parent = document.createElement('div');
    const context = createRoot();
    render(parent, context);

    context.unlisten();

    expect(parent.childNodes.length).toBe(0);
  });

  describe('attributes', () => {
    it('applies attributes through their setter', () => {
      const setter = vi.fn(_setProperty);
      const element = render(document.createElement('div'), createRoot(), {
        attributes: [{ name: 'title', value: 'hi', setter }]
      });

      expect(setter).toHaveBeenCalledOnce();
      expect(element.getAttribute('title')).toBe('hi');
    });

    it('removes the attribute on destroy when unbind is _removeAttribute', () => {
      const context = createRoot();
      const element = render(document.createElement('div'), context, {
        attributes: [{ name: 'title', value: 'hi', setter: _setProperty, unbind: _removeAttribute }]
      });

      context.unlisten();

      expect(element.hasAttribute('title')).toBe(false);
    });

    it('restores the default value on destroy when unbind is _setExpressionProperty', () => {
      const context = createRoot();
      const element = render(document.createElement('div'), context, {
        attributes: [{ name: 'title', value: () => 'hi', setter: _setExpressionProperty, unbind: _setExpressionProperty, defaultValue: 'default' }]
      });
      expect(element.getAttribute('title')).toBe('hi');

      context.unlisten();

      expect(element.getAttribute('title')).toBe('default');
    });
  });

  describe('events', () => {
    it('calls the root handler with the evaluated parameters', () => {
      const onClick = vi.fn();
      const element = render(document.createElement('div'), createRoot({ onClick }), {
        events: [{ name: 'click', handler: 'onClick', parameters: [(event: Event) => event.type, () => 'extra'] }]
      });

      element.dispatchEvent(new Event('click'));

      expect(onClick).toHaveBeenCalledWith('click', 'extra');
    });

    it('detaches the listener when the context is destroyed', () => {
      const onClick = vi.fn();
      const context = createRoot({ onClick });
      const element = render(document.createElement('div'), context, {
        events: [{ name: 'click', handler: 'onClick', parameters: [] }]
      });

      context.unlisten();
      element.dispatchEvent(new Event('click'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('conditional bindings', () => {
    const attribute = (name: string, value = 'on') => ({ name, value, setter: _setProperty, unbind: _removeAttribute });
    const branch = (overrides: Record<string, unknown> = {}) => ({ attributes: [], events: [], conditionalBindings: [], directives: [], ...overrides });
    const ifBinding = (...branches: unknown[]) => ({ branches });
    const switchBinding = (expression: () => unknown, ...branches: unknown[]) => ({ expression, branches });

    it('applies attributes only while the condition is true', async () => {
      const enabled = signal(false);
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(branch({ condition: () => enabled(), attributes: [attribute('data-on')] }))]
      });
      expect(element.hasAttribute('data-on')).toBe(false);

      enabled.set(true);
      await flush();
      expect(element.getAttribute('data-on')).toBe('on');

      enabled.set(false);
      await flush();
      expect(element.hasAttribute('data-on')).toBe(false);
    });

    it('attaches events only while the condition is true', async () => {
      const onClick = vi.fn();
      const enabled = signal(true);
      const element = render(document.createElement('div'), createRoot({ onClick }), {
        conditionalBindings: [ifBinding(branch({ condition: () => enabled(), events: [{ name: 'click', handler: 'onClick', parameters: [] }] }))]
      });

      element.dispatchEvent(new Event('click'));
      expect(onClick).toHaveBeenCalledTimes(1);

      enabled.set(false);
      await flush();
      element.dispatchEvent(new Event('click'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('binds several conditional bindings independently', async () => {
      const first = signal(true);
      const second = signal(false);
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [
          ifBinding(branch({ condition: () => first(), attributes: [attribute('data-first')] })),
          ifBinding(branch({ condition: () => second(), attributes: [attribute('data-second')] }))
        ]
      });
      expect(element.hasAttribute('data-first')).toBe(true);
      expect(element.hasAttribute('data-second')).toBe(false);

      second.set(true);
      await flush();

      expect(element.hasAttribute('data-first')).toBe(true);
      expect(element.hasAttribute('data-second')).toBe(true);
    });

    describe('@if chains', () => {
      it('applies the @else branch while the condition is false, swapping the branches reactively', async () => {
        const enabled = signal(false);
        const element = render(document.createElement('div'), createRoot(), {
          conditionalBindings: [ifBinding(
            branch({ condition: () => enabled(), attributes: [attribute('data-on')] }),
            branch({ attributes: [attribute('data-off')] })
          )]
        });
        expect(element.hasAttribute('data-on')).toBe(false);
        expect(element.hasAttribute('data-off')).toBe(true);

        enabled.set(true);
        await flush();
        expect(element.hasAttribute('data-on')).toBe(true);
        expect(element.hasAttribute('data-off')).toBe(false);

        enabled.set(false);
        await flush();
        expect(element.hasAttribute('data-on')).toBe(false);
        expect(element.hasAttribute('data-off')).toBe(true);
      });

      it('unbinds the previous branch before binding the selected one, so that they can bind the same attribute', async () => {
        const enabled = signal(true);
        const element = render(document.createElement('div'), createRoot(), {
          conditionalBindings: [ifBinding(
            branch({ condition: () => enabled(), attributes: [attribute('title', 'first')] }),
            branch({ attributes: [attribute('title', 'second')] })
          )]
        });
        expect(element.getAttribute('title')).toBe('first');

        enabled.set(false);
        await flush();
        expect(element.getAttribute('title')).toBe('second');

        enabled.set(true);
        await flush();
        expect(element.getAttribute('title')).toBe('first');
      });

      it('applies the first branch whose condition holds, even when the following ones hold too', async () => {
        const value = signal(1);
        const element = render(document.createElement('div'), createRoot(), {
          conditionalBindings: [ifBinding(
            branch({ condition: () => value() === 1, attributes: [attribute('data-one')] }),
            branch({ condition: () => value() > 0, attributes: [attribute('data-positive')] }),
            branch({ attributes: [attribute('data-other')] })
          )]
        });
        const bound = () => element.getAttributeNames();
        expect(bound()).toEqual(['data-one']);

        value.set(2);
        await flush();
        expect(bound()).toEqual(['data-positive']);

        value.set(0);
        await flush();
        expect(bound()).toEqual(['data-other']);
      });

      it('applies no branch when no condition holds and there is no @else branch', async () => {
        const value = signal(0);
        const element = render(document.createElement('div'), createRoot(), {
          conditionalBindings: [ifBinding(
            branch({ condition: () => value() === 1, attributes: [attribute('data-one')] }),
            branch({ condition: () => value() === 2, attributes: [attribute('data-two')] })
          )]
        });
        expect(element.getAttributeNames()).toEqual([]);

        value.set(2);
        await flush();
        expect(element.getAttributeNames()).toEqual(['data-two']);

        value.set(3);
        await flush();
        expect(element.getAttributeNames()).toEqual([]);
      });

      it('neither evaluates nor tracks the conditions following the one of the selected branch', async () => {
        const other = signal(0);
        const first = vi.fn(() => true);
        const second = vi.fn(() => other() > 0);
        render(document.createElement('div'), createRoot(), {
          conditionalBindings: [ifBinding(
            branch({ condition: first, attributes: [attribute('data-first')] }),
            branch({ condition: second, attributes: [attribute('data-second')] })
          )]
        });

        other.set(1);
        await flush();

        expect(first).toHaveBeenCalledOnce();
        expect(second).not.toHaveBeenCalled();
      });
    });

    describe('@switch', () => {
      const branches = () => [
        branch({ condition: ['a', 'b'], attributes: [attribute('data-letter')] }),
        branch({ condition: [1], attributes: [attribute('data-number')] }),
        branch({ condition: null, attributes: [attribute('data-default')] })
      ];

      it('applies the branch listing the value of the expression, switching branch reactively', async () => {
        const mode = signal<unknown>('b');
        const element = render(document.createElement('div'), createRoot(), {
          conditionalBindings: [switchBinding(() => mode(), ...branches())]
        });
        expect(element.getAttributeNames()).toEqual(['data-letter']);

        mode.set(1);
        await flush();
        expect(element.getAttributeNames()).toEqual(['data-number']);
      });

      it('applies the @default branch when no value matches, using strict equality', async () => {
        const mode = signal<unknown>('1');
        const element = render(document.createElement('div'), createRoot(), {
          conditionalBindings: [switchBinding(() => mode(), ...branches())]
        });
        expect(element.getAttributeNames()).toEqual(['data-default']);

        mode.set('a');
        await flush();
        expect(element.getAttributeNames()).toEqual(['data-letter']);
      });

      it('applies no branch when no value matches and there is no @default branch', async () => {
        const mode = signal<unknown>('a');
        const element = render(document.createElement('div'), createRoot(), {
          conditionalBindings: [switchBinding(() => mode(), ...branches().slice(0, 2))]
        });

        mode.set('z');
        await flush();

        expect(element.getAttributeNames()).toEqual([]);
      });

      it('neither unbinds nor binds again when the expression changes to another value of the selected branch', async () => {
        const setter = vi.fn(_setProperty);
        const unbind = vi.fn(_removeAttribute);
        const mode = signal('a');
        const element = render(document.createElement('div'), createRoot(), {
          conditionalBindings: [switchBinding(() => mode(), branch({ condition: ['a', 'b'], attributes: [{ name: 'data-letter', value: 'on', setter, unbind }] }))]
        });

        mode.set('b');
        await flush();

        expect(element.getAttributeNames()).toEqual(['data-letter']);
        expect(setter).toHaveBeenCalledOnce();
        expect(unbind).not.toHaveBeenCalled();
      });

      it('evaluates the expression once per selection, whatever the number of branches', () => {
        const expression = vi.fn(() => 'z');
        render(document.createElement('div'), createRoot(), {
          conditionalBindings: [switchBinding(expression, ...branches())]
        });

        expect(expression).toHaveBeenCalledOnce();
      });
    });

    it('supports nested conditional bindings', async () => {
      const inner = signal(false);
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(branch({
          condition: () => true,
          conditionalBindings: [ifBinding(branch({ condition: () => inner(), attributes: [attribute('data-inner')] }))]
        }))]
      });
      expect(element.hasAttribute('data-inner')).toBe(false);

      inner.set(true);
      await flush();

      expect(element.getAttribute('data-inner')).toBe('on');
    });

    it('unbinds the nested conditional bindings together with the enclosing branch', async () => {
      const outer = signal(true);
      const inner = signal(true);
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(branch({
          condition: () => outer(),
          conditionalBindings: [ifBinding(branch({ condition: () => inner(), attributes: [attribute('data-inner')] }))]
        }))]
      });
      expect(element.getAttribute('data-inner')).toBe('on');

      outer.set(false);
      await flush();
      expect(element.hasAttribute('data-inner')).toBe(false);

      outer.set(true);
      await flush();
      expect(element.getAttribute('data-inner')).toBe('on');
    });

    it('binds only the conditional bindings nested in the selected branch', async () => {
      const outer = signal(true);
      const inner = signal(true);
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(
          branch({ condition: () => outer(), conditionalBindings: [ifBinding(branch({ condition: () => inner(), attributes: [attribute('data-if')] }))] }),
          branch({ conditionalBindings: [switchBinding(() => inner(), branch({ condition: [true], attributes: [attribute('data-else')] }))] })
        )]
      });
      expect(element.getAttributeNames()).toEqual(['data-if']);

      outer.set(false);
      await flush();
      expect(element.getAttributeNames()).toEqual(['data-else']);

      inner.set(false);
      await flush();
      expect(element.getAttributeNames()).toEqual([]);
    });

    it('neither unbinds nor binds again when the condition is evaluated again without changing its outcome', async () => {
      const onClick = vi.fn();
      const setter = vi.fn(_setProperty);
      const unbind = vi.fn(_removeAttribute);
      const count = signal(1);
      const element = render(document.createElement('div'), createRoot({ onClick }), {
        conditionalBindings: [ifBinding(branch({
          condition: () => count() > 0,
          attributes: [{ name: 'data-positive', value: 'on', setter, unbind }],
          events: [{ name: 'click', handler: 'onClick', parameters: [] }]
        }))]
      });

      count.set(2);
      await flush();
      element.dispatchEvent(new Event('click'));

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(setter).toHaveBeenCalledOnce();
      expect(unbind).not.toHaveBeenCalled();
    });

    it('does not apply a directive again when the condition is evaluated again without changing its outcome', async () => {
      const count = signal(1);
      render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(branch({ condition: () => count() > 0, directives: [{ selector: 'label', attributes: [], events: [], conditionalBindings: [] }] }))]
      });
      const instance = LabelDirective.instances.at(-1)!;

      count.set(2);
      await flush();

      expect(LabelDirective.instances.at(-1)).toBe(instance);
      expect(instance.unlisten).not.toHaveBeenCalled();
    });

    it('applies a directive only while the condition is true', async () => {
      const enabled = signal(false);
      const instances = LabelDirective.instances.length;
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(branch({
          condition: () => enabled(),
          directives: [{ selector: 'label', attributes: [{ name: 'label', value: 'bound', setter: _setProperty }], events: [], conditionalBindings: [] }]
        }))]
      });
      expect(LabelDirective.instances).toHaveLength(instances);

      enabled.set(true);
      await flush();
      const instance = LabelDirective.instances.at(-1)!;
      expect(LabelDirective.instances).toHaveLength(instances + 1);
      expect(instance.getElement()).toBe(element);
      expect(instance.seen).toEqual(['bound']);
      expect(instance.unlisten).not.toHaveBeenCalled();

      enabled.set(false);
      await flush();
      expect(instance.unlisten).toHaveBeenCalledOnce();

      enabled.set(true);
      await flush();
      expect(LabelDirective.instances).toHaveLength(instances + 2);
    });

    it('disposes the directive of the previous branch before applying the one of the selected branch', async () => {
      const enabled = signal(true);
      const labelDirective = (label: string) => ({ selector: 'label', attributes: [{ name: 'label', value: label, setter: _setProperty }], events: [], conditionalBindings: [] });
      render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(
          branch({ condition: () => enabled(), directives: [labelDirective('first')] }),
          branch({ directives: [labelDirective('second')] })
        )]
      });
      const first = LabelDirective.instances.at(-1)!;
      expect(first.seen).toEqual(['first']);

      enabled.set(false);
      await flush();
      const second = LabelDirective.instances.at(-1)!;

      expect(second).not.toBe(first);
      expect(second.seen).toEqual(['second']);
      expect(first.unlisten).toHaveBeenCalledOnce();
      expect(second.unlisten).not.toHaveBeenCalled();
    });

    it('does not apply a directive again when a signal read while starting it changes', async () => {
      const instances = TrackingDirective.instances;
      const before = instances.length;
      render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(branch({ condition: () => true, directives: [{ selector: 'tracking', attributes: [], events: [], conditionalBindings: [] }] }))]
      });
      expect(instances).toHaveLength(before + 1);

      TrackingDirective.source.set(1);
      await flush();

      expect(instances).toHaveLength(before + 1);
    });

    it('stops reacting once the context is destroyed', async () => {
      const enabled = signal(false);
      const context = createRoot();
      const element = render(document.createElement('div'), context, {
        conditionalBindings: [ifBinding(
          branch({ condition: () => enabled(), attributes: [attribute('data-on')] }),
          branch({ attributes: [attribute('data-off')] })
        )]
      });

      context.unlisten();
      enabled.set(true);
      await flush();

      expect(element.getAttributeNames()).toEqual([]);
    });
  });

  describe('directives', () => {
    const directive = (overrides: Record<string, unknown> = {}) => ({ selector: 'label', attributes: [], events: [], conditionalBindings: [], ...overrides });
    const branch = (overrides: Record<string, unknown> = {}) => ({ attributes: [], events: [], conditionalBindings: [], ...overrides });
    const label = (value: string) => ({ name: 'label', value, setter: _setProperty, unbind: _setExpressionProperty, defaultValue: 'default' });
    const lastInstance = () => LabelDirective.instances.at(-1)!;

    it('instantiates the directive registered for the selector on the element', () => {
      const element = render(document.createElement('div'), createRoot(), { directives: [directive()] });

      expect(lastInstance().getElement()).toBe(element);
    });

    it('binds the directive properties before reacting to changes', () => {
      render(document.createElement('div'), createRoot(), {
        directives: [directive({ attributes: [{ name: 'label', value: 'bound', setter: _setProperty }] })]
      });

      expect(lastInstance().seen).toEqual(['bound']);
    });

    it('follows reactive directive properties', async () => {
      const label = signal('first');
      render(document.createElement('div'), createRoot(), {
        directives: [directive({ attributes: [{ name: 'label', value: () => label(), setter: _setReactiveProperty }] })]
      });

      label.set('second');
      await flush();

      expect(lastInstance().label()).toBe('second');
      expect(lastInstance().seen).toEqual(['first', 'second']);
    });

    it('listens to the directive events on the element', () => {
      const onChange = vi.fn();
      render(document.createElement('div'), createRoot({ onChange }), {
        directives: [directive({ events: [{ name: 'change', handler: 'onChange', parameters: [(event: Event) => event.type] }] })]
      });

      lastInstance().dispatchEvent(new Event('change'));

      expect(onChange).toHaveBeenCalledWith('change');
    });

    it('disposes the directive when the context is destroyed', () => {
      const context = createRoot();
      render(document.createElement('div'), context, { directives: [directive()] });
      const instance = lastInstance();
      expect(instance.unlisten).not.toHaveBeenCalled();

      context.unlisten();

      expect(instance.unlisten).toHaveBeenCalledOnce();
    });

    it('binds the properties of a conditional binding only while its condition is true, then resets them', async () => {
      const enabled = signal(false);
      render(document.createElement('div'), createRoot(), {
        directives: [directive({
          conditionalBindings: [{
            branches: [branch({ condition: () => enabled(), attributes: [label('conditional')] })]
          }]
        })]
      });
      const instance = lastInstance();
      expect(instance.label()).toBe('initial');

      enabled.set(true);
      await flush();
      expect(instance.label()).toBe('conditional');

      enabled.set(false);
      await flush();
      expect(instance.label()).toBe('default');
      expect(LabelDirective.instances.at(-1)).toBe(instance);
    });

    it('binds the properties of a conditional binding already true before reacting to changes', () => {
      render(document.createElement('div'), createRoot(), {
        directives: [directive({
          conditionalBindings: [{ branches: [branch({ condition: () => true, attributes: [{ name: 'label', value: 'conditional', setter: _setProperty }] })] }]
        })]
      });

      expect(lastInstance().seen).toEqual(['conditional']);
    });

    it('binds the properties of the selected branch of an @if chain, without applying the directive again', async () => {
      const enabled = signal(false);
      render(document.createElement('div'), createRoot(), {
        directives: [directive({
          conditionalBindings: [{
            branches: [
              branch({ condition: () => enabled(), attributes: [label('if')] }),
              branch({ attributes: [label('else')] })
            ]
          }]
        })]
      });
      const instance = lastInstance();
      expect(instance.label()).toBe('else');

      enabled.set(true);
      await flush();
      expect(instance.label()).toBe('if');

      enabled.set(false);
      await flush();
      expect(instance.label()).toBe('else');
      expect(LabelDirective.instances.at(-1)).toBe(instance);
    });

    it('binds the properties of the selected branch of a @switch', async () => {
      const mode = signal(1);
      render(document.createElement('div'), createRoot(), {
        directives: [directive({
          conditionalBindings: [{
            expression: () => mode(),
            branches: [
              branch({ condition: [1, 2], attributes: [label('case')] }),
              branch({ condition: null, attributes: [label('default')] })
            ]
          }]
        })]
      });
      const instance = lastInstance();
      expect(instance.label()).toBe('case');

      mode.set(3);
      await flush();
      expect(instance.label()).toBe('default');
    });

    it('listens to the events of a conditional binding only while its condition is true', async () => {
      const onChange = vi.fn();
      const enabled = signal(true);
      render(document.createElement('div'), createRoot({ onChange }), {
        directives: [directive({
          conditionalBindings: [{
            branches: [branch({
              condition: () => enabled(),
              events: [{ name: 'change', handler: 'onChange', parameters: [] }],
              conditionalBindings: [{ branches: [branch({ condition: () => true, events: [{ name: 'nested', handler: 'onChange', parameters: [] }] })] }]
            })]
          }]
        })]
      });

      lastInstance().dispatchEvent(new Event('change'));
      lastInstance().dispatchEvent(new Event('nested'));
      expect(onChange).toHaveBeenCalledTimes(2);

      enabled.set(false);
      await flush();
      lastInstance().dispatchEvent(new Event('change'));
      lastInstance().dispatchEvent(new Event('nested'));
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('throws when no directive is registered for the selector', () => {
      expect(() => render(document.createElement('div'), createRoot(), { directives: [directive({ selector: 'missing' })] })).toThrow('No directive registered for selector "missing"');
    });
  });
});
