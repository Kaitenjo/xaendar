// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { MATHML_NS, SVG_NS } = await import('../costants');
const { input } = await import('../signals/input/input');
const { _Context } = await import('./context.util');
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
const { signal } = await import('../signals');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

function createRoot(root: Record<string, unknown> = {}) {
  return new _Context(root as never, { createElement: _createElement } as never);
}

const render = (
  parent: Element,
  context: InstanceType<typeof _Context>,
  { attributes = [], events = [], dynamicBindings = [], anchor = null }: { attributes?: unknown[], events?: unknown[], dynamicBindings?: unknown[], anchor?: Comment | null } = {}
) => _renderElement(parent, context, anchor, 'div', attributes as never, events as never, dynamicBindings as never);

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

  describe('dynamic bindings', () => {
    const attribute = (name: string) => ({ name, value: 'on', setter: _setProperty, unbind: _removeAttribute });

    it('applies attributes only while the condition is true', async () => {
      const enabled = signal(false);
      const element = render(document.createElement('div'), createRoot(), {
        dynamicBindings: [{ condition: () => enabled(), attributes: [attribute('data-on')], events: [], dynamicBindings: [] }]
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
        dynamicBindings: [{
          condition: () => enabled(),
          attributes: [],
          events: [{ name: 'click', handler: 'onClick', parameters: [] }],
          dynamicBindings: []
        }]
      });

      element.dispatchEvent(new Event('click'));
      expect(onClick).toHaveBeenCalledTimes(1);

      enabled.set(false);
      await flush();
      element.dispatchEvent(new Event('click'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('supports nested dynamic bindings', async () => {
      const inner = signal(false);
      const element = render(document.createElement('div'), createRoot(), {
        dynamicBindings: [{
          condition: () => true,
          attributes: [],
          events: [],
          dynamicBindings: [{ condition: () => inner(), attributes: [attribute('data-inner')], events: [], dynamicBindings: [] }]
        }]
      });
      expect(element.hasAttribute('data-inner')).toBe(false);

      inner.set(true);
      await flush();

      expect(element.getAttribute('data-inner')).toBe('on');
    });

    it('stops reacting once the context is destroyed', async () => {
      const enabled = signal(false);
      const context = createRoot();
      const element = render(document.createElement('div'), context, {
        dynamicBindings: [{ condition: () => enabled(), attributes: [attribute('data-on')], events: [], dynamicBindings: [] }]
      });

      context.unlisten();
      enabled.set(true);
      await flush();

      expect(element.hasAttribute('data-on')).toBe(false);
    });
  });
});
