// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { RenderChildren } from '../../types/render-children.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { RenderElementConditionalBinding } from '../../types/render-element-conditional-binding.type';
import type { RenderElementDirective } from '../../types/render-element-directive.type';
import type { RenderElementStructuralDirective } from '../../types/render-element-structural-directive.type';
import type { RenderElement } from '../../types/render-element.type';
import type { TemplateExpression } from '../../types/template-expression.type';
import { CLEANUP, DIRECTIVE_ORDER, HEADER, LAYOUT, PARENT_NODE } from '../../costants';
import type { _Context } from '../../types/context.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { SVG_NS } = await import('../../costants');
const { input } = await import('../../signals/input/input');
const { _declare, _read, _scope, forEachChild, nodesEnd, STRUCTURAL_LAYOUT, EMPTY_LAYOUT, addCleanup, getNodeStrategy, clear, refresh, update } = await import('../context/context.util');
const { CREATE_NODES } = await import('../create-nodes/create-nodes.util');
const { ClaimNodes } = await import('../claim-nodes/claim-nodes.util');

/**
 * The nodes a context tracks, in mount order.
 */
const nodesOf = (context: Context): Node[] => context.slice(context[LAYOUT].nodes, nodesEnd(context)).filter(Boolean) as Node[];

/**
 * The scopes a scope holds: the ones of its containers, then the ones its cleanups hold, as the branch of a conditional
 * binding or the scope of a component created in code.
 */
function childrenOf(context: Context): Context[] {
  const children = new Array<Context>();
  forEachChild(context, (child, list) => list.push(child), children);
  const cleanup = context[CLEANUP];
  const cleanups = Array.isArray(cleanup) ? cleanup : cleanup ? [cleanup] : [];
  for (let i = 0; i < cleanups.length; i++) {
    const item = cleanups[i];
    if (typeof item !== 'function' && 'scope' in item) {
      children.push(item.scope as Context);
    }
  }

  return children;
}
const {
  _removeAttribute,
  _renderElement,
  _resetProperty,
  _setExpressionInput,
  _setExpressionProperty,
  _setInput,
  _setProperty,
  _setReactiveInput,
  _setReactiveProperty
} = await import('./render-element.util');
const { signal } = await import('../../signals');
const { AttributeUnbinding } = await import('../../models/attribute-unbinding/attribute-unbinding');
const { CustomDirective } = await import('../../models/custom-directive/custom-directive');
const { CustomElement } = await import('../../models/custom-element/custom-element');
const { StructuralDirective } = await import('../../models/structural-directive/structural-directive');
const { TemplateListener } = await import('../../models/template-listener/template-listener');
const { _defineDirective } = await import('../directive-registry/directive-registry.util');
const { _removeStyling, _setExpressionStyling, _setStyling } = await import('../styling-binding/styling-binding.util');
const { _getAppliedDirectives } = await import('../applied-directives/applied-directives.util');
const { _getElementRef } = await import('../element-refs/element-refs.util');

type Context = _Context;

/**
 * The bindings of a branch of a conditional binding of an element, without its condition.
 */
type ElementBindings = Omit<RenderElementConditionalBinding['branches'][number], 'condition'>;

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

/**
 * The layout of the contexts of the tests: the variables they read, then room for four nodes, then two containers.
 */
const ROOT_LAYOUT: _ScopeLayout = { size: HEADER + 10, nodes: HEADER + 4, containers: HEADER + 8, variables: ['label', 'enabled', 'suffix', 'panel'] };

/**
 * The first slot of a context free for a node, as the compiler gives them in order.
 */
function freeSlot(context: Context): number | undefined {
  for (let i = context[LAYOUT].nodes; i < nodesEnd(context); i++) {
    if (!context[i]) {
      return i;
    }
  }

  return undefined;
}

function createRoot(): Context {
  return _scope(null, ROOT_LAYOUT);
}

/**
 * Describes an attribute the way the module of a template does, for the setters and the unbinds called directly.
 */
const attributeOf = (name: string, value: RenderElementAttribute['value'] = ''): RenderElementAttribute => ({ name, value, setter: _setProperty });

/**
 * Renders a `div` described by `element`, returning it: the node mounted right before the anchor, or the last one
 * appended when there is none.
 */
const render = (parent: Element, context: Context, element: Omit<RenderElement, 'tagName'> = {}, anchor: Comment | null = null) => {
  // At the top of the context, the element, or the anchor of an element structural directives are applied to, gets a slot
  const top = context[PARENT_NODE] === null || context[PARENT_NODE] === parent;
  _renderElement(parent, context, anchor, Object.assign({ tagName: 'div', slot: top ? freeSlot(context) : undefined }, element));
  return (anchor ? anchor.previousSibling : parent.lastChild) as Element;
};

/**
 * Directive recording the values of its `label` input seen by the effect started in `onInit`.
 */
class LabelDirective extends CustomDirective {
  public static readonly instances = new Array<LabelDirective>();

  public readonly label = input<string>('initial');
  public readonly seen = new Array<string>();
  public readonly destroyed = vi.fn();
  public mounted?: boolean;

  constructor() {
    super();
    LabelDirective.instances.push(this);
  }

  public onInit(): void {
    this.mounted = !!this.element.parentNode;
    this.effect(() => { this.seen.push(this.label()); });
  }

  public onDestroy(): void {
    this.destroyed();
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

  public onInit(): undefined {
    TrackingDirective.source();
    TrackingDirective.instances.push(this);
  }
}

_defineDirective('tracking', TrackingDirective);

/**
 * Structural directive rendering the element while its `visible` input holds.
 */
class VisibleDirective extends StructuralDirective {
  public static readonly instances = new Array<VisibleDirective>();

  public readonly visible = input<boolean>(true);
  public readonly evaluations = vi.fn();

  constructor() {
    super();
    VisibleDirective.instances.push(this);
  }

  public shouldRender(): boolean | Promise<boolean> {
    this.evaluations();
    return this.visible();
  }
}

/**
 * Structural directive whose outcome is a promise settled by the test through `deferred`, created after reading its `visible` input.
 */
class AsyncVisibleDirective extends VisibleDirective {
  public deferred!: PromiseWithResolvers<boolean>;

  public override shouldRender(): Promise<boolean> {
    this.evaluations();
    this.visible();
    this.deferred = Promise.withResolvers<boolean>();
    return this.deferred.promise;
  }
}

_defineDirective('visible', VisibleDirective);
_defineDirective('asyncVisible', AsyncVisibleDirective);

/**
 * Lets every pending microtask run, including the ones queued by other microtasks, e.g. a settled promise writing a flag.
 */
const settle = () => new Promise<void>(resolve => setTimeout(resolve));


describe('property setters', () => {
  it('_setProperty sets a literal attribute', () => {
    const element = document.createElement('div');
    _setProperty(createRoot(), element, attributeOf('title', 'hello'));
    expect(element.getAttribute('title')).toBe('hello');
  });

  it('_setExpressionProperty evaluates the expression once', () => {
    const element = document.createElement('div');
    _setExpressionProperty(createRoot(), element, attributeOf('title', () => 5));
    expect(element.getAttribute('title')).toBe('5');
  });

  it('_setExpressionProperty calls the expression with the component of the context as this and the context', () => {
    const element = document.createElement('div');
    const component = { title: 'from component' };
    const context = _scope(createRoot(), EMPTY_LAYOUT, undefined, component);
    const expression = vi.fn(function (this: typeof component, _context: Context) {
      return this.title;
    });

    _setExpressionProperty(context, element, attributeOf('title', expression));

    expect(expression).toHaveBeenCalledExactlyOnceWith(context);
    expect(element.getAttribute('title')).toBe('from component');
  });

  it('_setReactiveProperty follows the signals it reads', async () => {
    const element = document.createElement('div');
    const title = signal('a');
    _setReactiveProperty(createRoot(), element, attributeOf('title', () => title()));
    expect(element.getAttribute('title')).toBe('a');

    title.set('b');
    await flush();

    expect(element.getAttribute('title')).toBe('b');
  });

  it('_setReactiveProperty evaluates the expression again when a variable of the template it reads changes', () => {
    const element = document.createElement('div');
    const context = createRoot();
    context[HEADER] = 'first';
    _setReactiveProperty(context, element, { name: 'title', value: scope => scope[HEADER], setter: _setReactiveProperty, reads: [0] });
    expect(element.getAttribute('title')).toBe('first');

    update(context, HEADER, 'second');
    refresh(context, [0]);

    expect(element.getAttribute('title')).toBe('second');
  });

  it('_setReactiveProperty removes the attribute while the value is null or undefined, and writes it again for another one', async () => {
    const element = document.createElement('div');
    const title = signal<string | null | undefined>(null);
    _setReactiveProperty(createRoot(), element, attributeOf('title', () => title()));
    expect(element.hasAttribute('title')).toBe(false);

    title.set('a');
    await flush();
    expect(element.getAttribute('title')).toBe('a');

    title.set(undefined);
    await flush();
    expect(element.hasAttribute('title')).toBe(false);

    title.set('b');
    await flush();
    expect(element.getAttribute('title')).toBe('b');
  });

  it('_setExpressionProperty removes the attribute for null and undefined', () => {
    const element = document.createElement('div');
    element.setAttribute('title', 'a');
    element.setAttribute('lang', 'b');

    _setExpressionProperty(createRoot(), element, attributeOf('title', () => null));
    _setExpressionProperty(createRoot(), element, attributeOf('lang', () => undefined));

    expect(element.getAttributeNames()).toEqual([]);
  });

  it('_setExpressionProperty writes a boolean as @HostProperty does, and 0 as text', () => {
    const element = document.createElement('div');
    element.setAttribute('title', 'a');
    _setExpressionProperty(createRoot(), element, attributeOf('title', () => false));
    _setExpressionProperty(createRoot(), element, attributeOf('hidden', () => true));
    _setExpressionProperty(createRoot(), element, attributeOf('aria-busy', () => false));
    _setExpressionProperty(createRoot(), element, attributeOf('tabindex', () => 0));
    expect(element.hasAttribute('title')).toBe(false);
    expect(element.getAttribute('hidden')).toBe('');
    expect(element.getAttribute('aria-busy')).toBe('false');
    expect(element.getAttribute('tabindex')).toBe('0');
  });

  it('_setReactiveProperty stops following once the context is destroyed', async () => {
    const element = document.createElement('div');
    const context = createRoot();
    const title = signal('a');
    _setReactiveProperty(context, element, attributeOf('title', () => title()));

    clear(context);
    title.set('b');
    await flush();

    expect(element.getAttribute('title')).toBe('a');
  });

  it('_removeAttribute removes the attribute', () => {
    const element = document.createElement('div');
    element.setAttribute('title', 'x');
    _removeAttribute(createRoot(), element, attributeOf('title'));
    expect(element.hasAttribute('title')).toBe(false);
  });

  describe('input signal properties', () => {
    it('never writes an input as an attribute: an input the compiler did not recognize throws', () => {
      const element = document.createElement('div') as unknown as HTMLElement & { label: ReturnType<typeof input<string>> };
      element.label = input<string>('initial');

      expect(() => _setProperty(createRoot(), element, attributeOf('label', 'updated'))).toThrow('"label" is an input of HTMLDivElement, bound as an attribute: an input declaring an alias is bound by its alias');
      expect(() => _setExpressionProperty(createRoot(), element, attributeOf('label', () => 'updated'))).toThrow('"label" is an input of HTMLDivElement, bound as an attribute');
      expect(element.label()).toBe('initial');
      expect(element.hasAttribute('label')).toBe(false);
      expect(() => _setProperty(createRoot(), new LabelDirective(), attributeOf('label', 'updated'))).toThrow('"label" is an input of LabelDirective, bound as an attribute');
    });

    it('sets the value of an input signal of a directive, by the name of its property, never by its alias', () => {
      const directive = new LabelDirective();

      _setInput(createRoot(), directive, attributeOf('label', 'updated'));

      expect(directive.label()).toBe('updated');
      expect(() => _setInput(createRoot(), directive, attributeOf('my-label', 'aliased'))).toThrow('LabelDirective does not declare a property named "my-label"');
    });

    it('sets the input named like the alias of another one, never the one the alias names', () => {
      class Crossed extends HTMLElement {
        internalValue = input<string>('internal');
        value = input<string>('value');
      }
      Object.defineProperty(Crossed, Symbol.for('Symbol.metadata'), { value: { aliasToAttribute: { value: 'internalValue', initialValue: 'value' } } });
      customElements.define('x-crossed', Crossed);
      const element = document.createElement('x-crossed') as Crossed;

      _setInput(createRoot(), element, attributeOf('value', 'set'));

      expect(element.value()).toBe('set');
      expect(element.internalValue()).toBe('internal');
    });

    it('throws when a directive does not declare the property', () => {
      const directive = new LabelDirective();

      expect(() => _setProperty(createRoot(), directive, attributeOf('missing', 'value'))).toThrow('LabelDirective does not declare a property named "missing"');
      expect(() => _setInput(createRoot(), directive, attributeOf('missing', 'value'))).toThrow('LabelDirective does not declare a property named "missing"');
    });

    it('sets the value of an input signal of a structural directive', () => {
      const directive = new VisibleDirective();

      _setExpressionInput(createRoot(), directive, attributeOf('visible', () => false));

      expect(directive.visible()).toBe(false);
    });

    it('throws when a structural directive does not declare the property', () => {
      expect(() => _setInput(createRoot(), new VisibleDirective(), attributeOf('missing', 'value'))).toThrow('VisibleDirective does not declare a property named "missing"');
    });

    it('falls back to the attribute for properties that are not input signals', () => {
      const element = document.createElement('div') as unknown as HTMLElement & { custom: string };
      element.custom = 'not-a-signal';

      _setProperty(createRoot(), element, attributeOf('custom', 'value'));

      expect(element.getAttribute('custom')).toBe('value');
    });
  });

  describe('_resetProperty', () => {
    it('sets an input signal back to its initial value, without applying the transform', () => {
      const element = document.createElement('div') as unknown as HTMLElement & { label: ReturnType<typeof input<string>> };
      element.label = input<string>('initial', { transform: value => value.toUpperCase() });
      _setInput(createRoot(), element, attributeOf('label', 'updated'));
      expect(element.label()).toBe('UPDATED');

      _resetProperty(createRoot(), element, attributeOf('label'));

      expect(element.label()).toBe('initial');
    });

    it('resets an input of a directive by the name of its property', () => {
      const directive = new LabelDirective();
      _setInput(createRoot(), directive, attributeOf('label', 'updated'));

      _resetProperty(createRoot(), directive, attributeOf('label'));

      expect(directive.label()).toBe('initial');
    });

    it('throws when a directive does not declare the property', () => {
      expect(() => _resetProperty(createRoot(), new LabelDirective(), attributeOf('missing'))).toThrow('LabelDirective does not declare a property named "missing"');
    });

    it('removes the attribute of a property that is not an input signal', () => {
      const element = document.createElement('div');
      element.setAttribute('custom', 'value');

      _resetProperty(createRoot(), element, attributeOf('custom'));

      expect(element.hasAttribute('custom')).toBe(false);
    });

    it('removes the value of an input assigned to an element whose class is not defined yet', () => {
      const element = document.createElement('x-not-defined-reset');
      _setInput(createRoot(), element, attributeOf('label', 'early'));

      _resetProperty(createRoot(), element, attributeOf('label'));

      expect(Object.hasOwn(element, 'label')).toBe(false);
    });
  });

  describe('component inputs', () => {
    it('set the input signal of a component, by the name of its property', async () => {
      const element = document.createElement('div') as unknown as HTMLElement & { label: ReturnType<typeof input<string>> };
      element.label = input<string>('initial');
      const label = signal('reactive');

      _setInput(createRoot(), element, attributeOf('label', 'literal'));
      expect(element.label()).toBe('literal');
      _setExpressionInput(createRoot(), element, attributeOf('label', () => 'expression'));
      expect(element.label()).toBe('expression');
      _setReactiveInput(createRoot(), element, attributeOf('label', () => label()));
      expect(element.label()).toBe('reactive');
      label.set('changed');
      await flush();

      expect(element.label()).toBe('changed');
      expect(element.hasAttribute('label')).toBe(false);
    });

    it('assign the property of an element whose class is not defined yet, as is, not as an attribute', async () => {
      const element = document.createElement('x-not-defined-input') as HTMLElement & { items?: unknown, count?: unknown };
      const items = [1, 2];
      const count = signal(1);

      _setExpressionInput(createRoot(), element, attributeOf('items', () => items));
      _setReactiveInput(createRoot(), element, attributeOf('count', () => count()));
      count.set(2);
      await flush();

      expect(element.items).toBe(items);
      expect(element.count).toBe(2);
      expect(element.hasAttribute('items')).toBe(false);
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

  it('creates a standard <template> holding its static content, which the code using it clones', () => {
    const parent = document.createElement('div');
    _renderElement(parent, createRoot(), null, { tagName: 'template', content: '<li class="a">x</li>' });

    const template = parent.firstChild as HTMLTemplateElement;
    expect(template.childNodes).toHaveLength(0);
    expect(template.innerHTML).toBe('<li class="a">x</li>');
    expect(parent.appendChild(template.content.cloneNode(true)) && parent.lastChild).toMatchObject({ tagName: 'LI', textContent: 'x' });
  });

  it('adopts a standard <template> the server wrote without writing its content again', () => {
    const parent = document.createElement('section');
    parent.innerHTML = '<template><li>server</li></template>';
    const template = parent.firstChild as HTMLTemplateElement;
    const item = template.content.firstChild;
    const context = _scope(null, EMPTY_LAYOUT, new ClaimNodes('x-host'));

    _renderElement(parent, context, null, { tagName: 'template', content: '<li>client</li>' });

    expect(parent.firstChild).toBe(template);
    expect(template.content.firstChild).toBe(item);
  });

  it('inserts the element before the anchor', () => {
    const parent = document.createElement('div');
    const anchor = document.createComment('anchor');
    parent.appendChild(anchor);

    const element = render(parent, createRoot(), {}, anchor);

    expect(element.nextSibling).toBe(anchor);
  });

  it('gets the element from the strategy of its context and mounts it through that strategy', () => {
    const parent = document.createElement('div');
    const anchor = parent.appendChild(document.createComment('anchor'));
    const created = document.createElement('article');
    const element = vi.fn(() => created);
    const mount = vi.fn(CREATE_NODES.mount);
    const context = _scope(null, EMPTY_LAYOUT, Object.assign({}, CREATE_NODES, { element, mount }));

    _renderElement(parent, context, anchor, { tagName: 'article' });
    _renderElement(parent, context, anchor, { tagName: 'circle', namespace: 1 });

    expect(element.mock.calls).toEqual([[context, parent, 'article', undefined], [context, parent, 'circle', 1]]);
    expect(mount).toHaveBeenCalledWith(created, parent, anchor);
    expect(parent.firstChild).toBe(created);
  });

  it('removes the element when the context is destroyed', () => {
    const parent = document.createElement('div');
    const context = createRoot();
    render(parent, context);

    clear(context);

    expect(parent.childNodes.length).toBe(0);
  });

  it('returns nothing', () => {
    expect(_renderElement(document.createElement('div'), createRoot(), null, { tagName: 'div' })).toBeUndefined();
  });

  it('initializes the element ref naming the element, declared by its scope, before binding it and rendering its children', () => {
    const parent = document.createElement('div');
    const scope = createRoot();
    _declare(scope, HEADER + 3);
    const seen = new Array<unknown>();
    const children = vi.fn<RenderChildren>((_element, parentContext) => {
      seen.push(_read(parentContext, 0, HEADER + 3));
      return _scope(parentContext, EMPTY_LAYOUT);
    });

    _renderElement(parent, scope, null, {
      tagName: 'section',
      attributes: [{ name: 'title', value: () => seen.push(scope[HEADER + 3]), setter: _setExpressionProperty }],
      children,
      ref: 'panel',
      refSlot: HEADER + 3
    });
    const element = parent.firstElementChild;

    expect(element?.tagName).toBe('SECTION');
    expect(scope[HEADER + 3]).toBe(element);
    expect(_getElementRef(element!)).toBe('panel');
    expect(seen).toEqual([element, element]);
  });

  it('calls the same function of the module for every element rendered from one configuration, with the component and the context of each', async () => {
    const suffix = signal('!');
    const title = vi.fn(function (this: unknown, context: Context) {
      return `${context[HEADER]}${suffix()}`;
    });
    const config: RenderElement = { tagName: 'div', attributes: [{ name: 'title', value: title, setter: _setReactiveProperty }] };
    const component = { name: 'component' };
    const componentContext = _scope(createRoot(), EMPTY_LAYOUT, undefined, component);
    const first = _scope(componentContext, EMPTY_LAYOUT);
    first[HEADER] = 'first';
    const second = _scope(componentContext, EMPTY_LAYOUT);
    second[HEADER] = 'second';
    const parent = document.createElement('section');

    _renderElement(parent, first, null, config);
    _renderElement(parent, second, null, config);
    suffix.set('?');
    await flush();

    expect(title).toHaveBeenCalledTimes(4);
    expect(title.mock.calls.filter(([context]) => context === first)).toHaveLength(2);
    expect(title.mock.calls.filter(([context]) => context === second)).toHaveLength(2);
    expect(title.mock.contexts).toEqual([component, component, component, component]);
    expect([...parent.children].map(element => element.getAttribute('title'))).toEqual(['first?', 'second?']);
  });

  it('renders the children in the element, destroying them together with the context', () => {
    const unlisten = vi.fn();
    const children = vi.fn<RenderChildren>((element, parentContext) => {
      element.appendChild(document.createElement('span'));
      const childrenContext = _scope(parentContext, EMPTY_LAYOUT);
      addCleanup(childrenContext, unlisten);
      return childrenContext;
    });
    const context = createRoot();
    const element = render(document.createElement('div'), context, { children });

    expect(children).toHaveBeenCalledExactlyOnceWith(element, context);
    expect(element.firstChild!.nodeName).toBe('SPAN');

    clear(context);

    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('renders in the context of the element the children rendering in it, which track no node rendered into the element', () => {
    const unlisten = vi.fn();
    const context = createRoot();
    const children = vi.fn<RenderChildren>((element, childrenContext) => {
      render(element, childrenContext);
      CREATE_NODES.text(childrenContext, element, null, 'text', false);
      addCleanup(childrenContext, unlisten);
      return undefined;
    });
    const parent = document.createElement('section');
    const element = render(parent, context, { children });

    expect(children).toHaveBeenCalledExactlyOnceWith(element, context);
    expect(element.childNodes).toHaveLength(2);
    expect(nodesOf(context)).toEqual([element]);
    expect(childrenOf(context)).toEqual([]);

    clear(context);

    expect(unlisten).toHaveBeenCalledOnce();
    expect(parent.childNodes).toHaveLength(0);
    expect(element.childNodes).toHaveLength(2);
  });

  it('tracks the nodes of the context the element is rendered in again once its children are rendered, and when they throw', () => {
    const context = createRoot();
    const parent = document.createElement('section');
    render(parent, context, { children: () => undefined });
    const second = render(parent, context);
    expect(() => render(parent, context, {
      children: () => {
        throw new Error('boom');
      }
    })).toThrow('boom');
    const third = render(parent, context);

    expect(nodesOf(context)).toHaveLength(4);
    expect(nodesOf(context)).toContain(second);
    expect(nodesOf(context)).toContain(third);
  });

  it('renders the children in the context of the element with their own strategy, while they render, when it differs from the one of the element', () => {
    const own = Object.assign({}, CREATE_NODES);
    const strategy = Object.assign({}, CREATE_NODES, { children: () => own });
    const context = _scope(null, EMPTY_LAYOUT, strategy);
    const unlisten = vi.fn();
    const strategies = new Array<unknown>();
    const children = vi.fn<RenderChildren>((element, childrenContext) => {
      strategies.push(getNodeStrategy(childrenContext));
      CREATE_NODES.text(childrenContext, element, null, 'text', false);
      addCleanup(childrenContext, unlisten);
      return undefined;
    });
    const element = render(document.createElement('section'), context, { children });

    expect(children).toHaveBeenCalledExactlyOnceWith(element, context);
    expect(strategies).toEqual([own]);
    expect(getNodeStrategy(context)).toBe(strategy);
    expect(childrenOf(context)).toEqual([]);
    expect(element.textContent).toBe('text');

    clear(context);
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('gives the context of the element its strategy back when the children rendering with their own throw', () => {
    const own = Object.assign({}, CREATE_NODES);
    const strategy = Object.assign({}, CREATE_NODES, { children: () => own });
    const context = _scope(null, EMPTY_LAYOUT, strategy);

    expect(() => render(document.createElement('section'), context, {
      children: () => {
        throw new Error('boom');
      }
    })).toThrow('boom');
    expect(getNodeStrategy(context)).toBe(strategy);
  });

  it('registers in the context of the element the context the children create for themselves with their own strategy', () => {
    const own = Object.assign({}, CREATE_NODES);
    const strategy = Object.assign({}, CREATE_NODES, { children: () => own });
    const context = _scope(null, STRUCTURAL_LAYOUT, strategy);
    const unlisten = vi.fn();
    const children = vi.fn<RenderChildren>((_element, childrenContext) => {
      const ownContext = _scope(childrenContext, EMPTY_LAYOUT);
      addCleanup(ownContext, unlisten);
      return ownContext;
    });
    render(document.createElement('section'), context, { children });

    expect(childrenOf(context)).toHaveLength(1);
    expect(getNodeStrategy(childrenOf(context)[0])).toBe(own);

    clear(context);
    expect(unlisten).toHaveBeenCalledOnce();
  });

  describe('attributes', () => {
    it('applies attributes through their setter, which receives the whole descriptor', () => {
      const setter = vi.fn(_setProperty);
      const attribute: RenderElementAttribute = { name: 'title', value: 'hi', setter };
      const context = createRoot();
      const element = render(document.createElement('div'), context, { attributes: [attribute] });

      expect(setter).toHaveBeenCalledExactlyOnceWith(context, element, attribute);
      expect(element.getAttribute('title')).toBe('hi');
    });

    it('removes the attribute on destroy when unbind is _removeAttribute', () => {
      const context = createRoot();
      const element = render(document.createElement('div'), context, {
        attributes: [{ name: 'title', value: 'hi', setter: _setProperty, unbind: _removeAttribute }]
      });

      clear(context);

      expect(element.hasAttribute('title')).toBe(false);
    });

    it('resets the property on destroy when unbind is _resetProperty', () => {
      const context = createRoot();
      const element = render(document.createElement('div'), context, {
        attributes: [{ name: 'title', value: () => 'hi', setter: _setExpressionProperty, unbind: _resetProperty }]
      });
      expect(element.getAttribute('title')).toBe('hi');

      clear(context);

      expect(element.hasAttribute('title')).toBe(false);
    });

    it('registers no unbinding for attributes declaring no unbind', () => {
      const dispose = vi.spyOn(AttributeUnbinding.prototype, 'dispose');
      const context = createRoot();
      const element = render(document.createElement('div'), context, {
        attributes: [{ name: 'title', value: 'hi', setter: _setProperty }]
      });

      clear(context);

      expect(dispose).not.toHaveBeenCalled();
      expect(element.getAttribute('title')).toBe('hi');
      dispose.mockRestore();
    });
  });

  describe('events', () => {
    it('calls the handler with the component as this, the context and the event', () => {
      const handler = vi.fn();
      const component = { name: 'component' };
      const context = _scope(createRoot(), EMPTY_LAYOUT, undefined, component);
      const element = render(document.createElement('div'), context, { events: [{ name: 'click', handler }] });
      const event = new Event('click');

      element.dispatchEvent(event);

      expect(handler).toHaveBeenCalledExactlyOnceWith(context, event);
      expect(handler.mock.contexts).toEqual([component]);
    });

    it('calls the handler with the event, which it reads after the context', () => {
      const onClick = vi.fn();
      const element = render(document.createElement('div'), createRoot(), {
        events: [{ name: 'click', handler: (_context, $event) => onClick($event.type, 'extra') }]
      });

      element.dispatchEvent(new Event('click'));

      expect(onClick).toHaveBeenCalledWith('click', 'extra');
    });

    it('listens with an object handling the events, removed from the element when the context is cleared', () => {
      const created = document.createElement('div');
      const add = vi.spyOn(created, 'addEventListener');
      const remove = vi.spyOn(created, 'removeEventListener');
      const context = _scope(null, EMPTY_LAYOUT, Object.assign({}, CREATE_NODES, { element: () => created }));
      render(document.createElement('section'), context, { events: [{ name: 'click', handler: vi.fn() }] });

      const [name, listener] = add.mock.calls[0];
      expect(name).toBe('click');
      expect(listener).toBeInstanceOf(TemplateListener);

      clear(context);

      expect(remove).toHaveBeenCalledExactlyOnceWith('click', listener);
    });

    it('detaches the listener when the context is destroyed', () => {
      const onClick = vi.fn();
      const context = createRoot();
      const element = render(document.createElement('div'), context, {
        events: [{ name: 'click', handler: onClick }]
      });

      clear(context);
      element.dispatchEvent(new Event('click'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('conditional bindings', () => {
    const attribute = (name: string, value = 'on'): RenderElementAttribute => ({ name, value, setter: _setProperty, unbind: _removeAttribute });
    const ifBinding = (...branches: Array<ElementBindings & { readonly condition?: TemplateExpression<unknown> }>): RenderElementConditionalBinding => ({ branches });
    const switchBinding = (expression: TemplateExpression<unknown>, ...branches: Array<ElementBindings & { readonly condition: readonly unknown[] | null }>): RenderElementConditionalBinding => ({ expression, branches });

    it('merges the class and the style of a branch with the ones of the element, giving them back when it is no longer selected', async () => {
      const enabled = signal(true);
      const element = render(document.createElement('div'), createRoot(), {
        styling: 3,
        attributes: [
          { name: 'class', text: 'base wide', statics: ['base', true, 'wide', true], setter: _setStyling },
          { name: 'style', text: 'width: 1px', statics: ['width', '1px'], setter: _setStyling }
        ],
        conditionalBindings: [ifBinding({
          condition: () => enabled(),
          styling: 3,
          attributes: [
            { name: 'class', keys: ['wide', 'on'], values: [() => false, () => true], setter: _setExpressionStyling, unbind: _removeStyling },
            { name: 'style', keys: ['width'], values: [() => 2], units: ['px'], setter: _setExpressionStyling, unbind: _removeStyling }
          ]
        })]
      });
      expect(element.className).toBe('base on');
      expect((element as HTMLElement).style.getPropertyValue('width')).toBe('2px');

      enabled.set(false);
      await flush();
      expect(element.className).toBe('base wide');
      expect((element as HTMLElement).style.getPropertyValue('width')).toBe('1px');
    });

    it('gives the directives of the template their order after the host directives', () => {
      const orders = new Array<number>();
      const OrderDirective = class extends CustomDirective {
        public onInit(): void {
          orders.push(this[DIRECTIVE_ORDER]);
        }
      };
      _defineDirective('order', OrderDirective);
      render(document.createElement('div'), createRoot(), { directives: [{ selector: 'order' }, { selector: 'order', order: 1 }] });
      expect(orders).toEqual([0, 1]);
    });

    it('applies attributes only while the condition is true', async () => {
      const enabled = signal(false);
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding({ condition: () => enabled(), attributes: [attribute('data-on')] })]
      });
      expect(element.hasAttribute('data-on')).toBe(false);

      enabled.set(true);
      await flush();
      expect(element.getAttribute('data-on')).toBe('on');

      enabled.set(false);
      await flush();
      expect(element.hasAttribute('data-on')).toBe(false);
    });

    it('calls the conditions with the component as this and the context of the branch, reading the variables of the scope', () => {
      const component = { enabled: true };
      const context = _scope(createRoot(), ROOT_LAYOUT, undefined, component);
      context[HEADER + 2] = 'scope';
      // The branch is a scope inside the one the element is rendered in
      const condition = vi.fn(function (this: typeof component, branchContext: Context) {
        return this.enabled && _read(branchContext, 1, HEADER + 2) === 'scope';
      });
      const element = render(document.createElement('div'), context, {
        conditionalBindings: [ifBinding({ condition, attributes: [attribute('data-on')] })]
      });

      expect(element.hasAttribute('data-on')).toBe(true);
      expect(condition.mock.contexts).toEqual([component]);
      expect(childrenOf(context)).toContain(condition.mock.calls[0][0]);
    });

    it('attaches events only while the condition is true', async () => {
      const onClick = vi.fn();
      const enabled = signal(true);
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding({ condition: () => enabled(), events: [{ name: 'click', handler: onClick }] })]
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
          ifBinding({ condition: () => first(), attributes: [attribute('data-first')] }),
          ifBinding({ condition: () => second(), attributes: [attribute('data-second')] })
        ]
      });
      expect(element.hasAttribute('data-first')).toBe(true);
      expect(element.hasAttribute('data-second')).toBe(false);

      second.set(true);
      await flush();

      expect(element.hasAttribute('data-first')).toBe(true);
      expect(element.hasAttribute('data-second')).toBe(true);
    });

    it('unbinds the attributes of a branch with a single cleanup, in the order they are declared, once per branch unbound', async () => {
      const dispose = vi.spyOn(AttributeUnbinding.prototype, 'dispose');
      const unbound = new Array<string>();
      const unbind = (context: Context, target: Element | object, bound: RenderElementAttribute) => {
        unbound.push(bound.name);
        _removeAttribute(context, target as Element, bound);
      };
      const enabled = signal(true);
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(
          {
            condition: () => enabled(),
            attributes: [
              { name: 'data-a', value: 'on', setter: _setProperty, unbind },
              { name: 'data-static', value: 'on', setter: _setProperty },
              { name: 'data-b', value: 'on', setter: _setProperty, unbind }
            ]
          },
          { attributes: [{ name: 'data-c', value: 'on', setter: _setProperty, unbind }] }
        )]
      });
      expect(dispose).not.toHaveBeenCalled();

      enabled.set(false);
      await flush();
      expect(dispose).toHaveBeenCalledOnce();
      expect(unbound).toEqual(['data-a', 'data-b']);
      expect(element.getAttributeNames()).toEqual(['data-static', 'data-c']);

      enabled.set(true);
      await flush();
      expect(dispose).toHaveBeenCalledTimes(2);
      expect(unbound).toEqual(['data-a', 'data-b', 'data-c']);
      dispose.mockRestore();
    });

    describe('@if chains', () => {
      it('applies the @else branch while the condition is false, swapping the branches reactively', async () => {
        const enabled = signal(false);
        const element = render(document.createElement('div'), createRoot(), {
          conditionalBindings: [ifBinding(
            { condition: () => enabled(), attributes: [attribute('data-on')] },
            { attributes: [attribute('data-off')] }
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
            { condition: () => enabled(), attributes: [attribute('title', 'first')] },
            { attributes: [attribute('title', 'second')] }
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
            { condition: () => value() === 1, attributes: [attribute('data-one')] },
            { condition: () => value() > 0, attributes: [attribute('data-positive')] },
            { attributes: [attribute('data-other')] }
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
            { condition: () => value() === 1, attributes: [attribute('data-one')] },
            { condition: () => value() === 2, attributes: [attribute('data-two')] }
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
            { condition: first, attributes: [attribute('data-first')] },
            { condition: second, attributes: [attribute('data-second')] }
          )]
        });

        other.set(1);
        await flush();

        expect(first).toHaveBeenCalledOnce();
        expect(second).not.toHaveBeenCalled();
      });

      it('selects the branch again when a variable of the template its conditions read changes', () => {
        const context = createRoot();
        context[HEADER + 1] = false;
        const element = render(document.createElement('div'), context, {
          conditionalBindings: [{ branches: [{ condition: scope => _read(scope, 1, HEADER + 1), attributes: [attribute('data-on')] }], reads: [1] }]
        });
        expect(element.hasAttribute('data-on')).toBe(false);

        update(context, HEADER + 1, true);
        refresh(context, [1]);

        expect(element.hasAttribute('data-on')).toBe(true);
      });
    });

    describe('@switch', () => {
      const branches = () => [
        { condition: ['a', 'b'], attributes: [attribute('data-letter')] },
        { condition: [1], attributes: [attribute('data-number')] },
        { condition: null, attributes: [attribute('data-default')] }
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
          conditionalBindings: [switchBinding(() => mode(), { condition: ['a', 'b'], attributes: [{ name: 'data-letter', value: 'on', setter, unbind }] })]
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
        conditionalBindings: [ifBinding({
          condition: () => true,
          conditionalBindings: [ifBinding({ condition: () => inner(), attributes: [attribute('data-inner')] })]
        })]
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
        conditionalBindings: [ifBinding({
          condition: () => outer(),
          conditionalBindings: [ifBinding({ condition: () => inner(), attributes: [attribute('data-inner')] })]
        })]
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
          { condition: () => outer(), conditionalBindings: [ifBinding({ condition: () => inner(), attributes: [attribute('data-if')] })] },
          { conditionalBindings: [switchBinding(() => inner(), { condition: [true], attributes: [attribute('data-else')] })] }
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
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding({
          condition: () => count() > 0,
          attributes: [{ name: 'data-positive', value: 'on', setter, unbind }],
          events: [{ name: 'click', handler: onClick }]
        })]
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
        conditionalBindings: [ifBinding({ condition: () => count() > 0, directives: [{ selector: 'label' }] })]
      });
      const instance = LabelDirective.instances.at(-1)!;

      count.set(2);
      await flush();

      expect(LabelDirective.instances.at(-1)).toBe(instance);
      expect(instance.destroyed).not.toHaveBeenCalled();
    });

    it('applies at once the directive of a branch selected once the element is mounted, only while the condition is true', async () => {
      const enabled = signal(false);
      const instances = LabelDirective.instances.length;
      const element = render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding({
          condition: () => enabled(),
          directives: [{ selector: 'label', attributes: [{ name: 'label', value: 'bound', setter: _setInput }] }]
        })]
      });
      expect(LabelDirective.instances).toHaveLength(instances);

      enabled.set(true);
      await flush();
      const instance = LabelDirective.instances.at(-1)!;
      expect(LabelDirective.instances).toHaveLength(instances + 1);
      expect(instance.element).toBe(element);
      expect(instance.mounted).toBe(true);
      expect(instance.seen).toEqual(['bound']);
      expect(instance.destroyed).not.toHaveBeenCalled();

      enabled.set(false);
      await flush();
      expect(instance.destroyed).toHaveBeenCalledOnce();

      enabled.set(true);
      await flush();
      expect(LabelDirective.instances).toHaveLength(instances + 2);
    });

    it('applies the directives of the branches selected before the element is mounted once it is, in the order they were selected', () => {
      const instances = LabelDirective.instances.length;
      const labelDirective = (label: string): RenderElementDirective => ({ selector: 'label', attributes: [{ name: 'label', value: label, setter: _setInput }] });
      render(document.createElement('div'), createRoot(), {
        conditionalBindings: [
          ifBinding({ condition: () => true, directives: [labelDirective('first')] }),
          ifBinding({ condition: () => true, directives: [labelDirective('second')] })
        ]
      });

      const applied = LabelDirective.instances.slice(instances);
      expect(applied.map(instance => instance.seen)).toEqual([['first'], ['second']]);
      expect(applied.map(instance => instance.mounted)).toEqual([true, true]);
    });

    it('disposes the directive of the previous branch before applying the one of the selected branch', async () => {
      const enabled = signal(true);
      const labelDirective = (label: string): RenderElementDirective => ({ selector: 'label', attributes: [{ name: 'label', value: label, setter: _setInput }] });
      render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding(
          { condition: () => enabled(), directives: [labelDirective('first')] },
          { directives: [labelDirective('second')] }
        )]
      });
      const first = LabelDirective.instances.at(-1)!;
      expect(first.seen).toEqual(['first']);

      enabled.set(false);
      await flush();
      const second = LabelDirective.instances.at(-1)!;

      expect(second).not.toBe(first);
      expect(second.seen).toEqual(['second']);
      expect(first.destroyed).toHaveBeenCalledOnce();
      expect(second.destroyed).not.toHaveBeenCalled();
    });

    it('does not apply a directive again when a signal read while starting it changes', async () => {
      const instances = TrackingDirective.instances;
      const before = instances.length;
      render(document.createElement('div'), createRoot(), {
        conditionalBindings: [ifBinding({ condition: () => true, directives: [{ selector: 'tracking' }] })]
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
          { condition: () => enabled(), attributes: [attribute('data-on')] },
          { attributes: [attribute('data-off')] }
        )]
      });

      clear(context);
      enabled.set(true);
      await flush();

      expect(element.getAttributeNames()).toEqual([]);
    });
  });

  describe('mounting', () => {
    /**
     * Custom element recording, when it is connected, the attribute it finds and an event it dispatches.
     */
    class MountProbe extends HTMLElement {
      public found: Array<string | null> = [];

      public connectedCallback(): void {
        this.found = [this.getAttribute('data-static'), this.getAttribute('data-conditional')];
        this.dispatchEvent(new Event('ready'));
      }

      public disconnectedCallback(): void {
        this.dispatchEvent(new Event('gone'));
      }
    }
    customElements.define('x-mount-probe', MountProbe);

    it('removes the element before its listeners, which still receive the events it emits while it is removed', () => {
      const onGone = vi.fn();
      const parent = document.body.appendChild(document.createElement('div'));
      const context = createRoot();
      _renderElement(parent, context, null, { tagName: 'x-mount-probe', events: [{ name: 'gone', handler: onGone }], slot: HEADER + 4 });

      clear(context);

      expect(parent.firstChild).toBeNull();
      expect(onGone).toHaveBeenCalledOnce();
      parent.remove();
    });

    it('applies the attributes, the listeners and the conditional bindings before mounting the element', () => {
      const onReady = vi.fn();
      const onConditionalReady = vi.fn();
      const parent = document.body.appendChild(document.createElement('div'));
      _renderElement(parent, createRoot(), null, {
        tagName: 'x-mount-probe',
        attributes: [{ name: 'data-static', value: 'a', setter: _setProperty }],
        events: [{ name: 'ready', handler: onReady }],
        conditionalBindings: [{
          branches: [{
            condition: () => true,
            attributes: [{ name: 'data-conditional', value: 'b', setter: _setProperty, unbind: _removeAttribute }],
            events: [{ name: 'ready', handler: onConditionalReady }]
          }]
        }]
      });

      expect((parent.firstChild as MountProbe).found).toEqual(['a', 'b']);
      expect(onReady).toHaveBeenCalledOnce();
      expect(onConditionalReady).toHaveBeenCalledOnce();
      parent.remove();
    });

    it('connects the directives, including the ones of a conditional binding selected on creation, once the element is mounted', () => {
      const directive: RenderElementDirective = { selector: 'label' };
      render(document.createElement('div'), createRoot(), {
        conditionalBindings: [{ branches: [{ condition: () => true, directives: [directive] }] }],
        directives: [directive]
      });

      expect(LabelDirective.instances.slice(-2).map(instance => instance.mounted)).toEqual([true, true]);
    });
  });

  describe('directives', () => {
    const directive = (overrides: Partial<RenderElementDirective> = {}): RenderElementDirective => Object.assign({ selector: 'label' }, overrides);
    const label = (value: string): RenderElementAttribute => ({ name: 'label', value, setter: _setInput, unbind: _resetProperty });
    const lastInstance = () => LabelDirective.instances.at(-1)!;

    it('instantiates the directive registered for the selector on the element', () => {
      const element = render(document.createElement('div'), createRoot(), { directives: [directive()] });

      expect(lastInstance().element).toBe(element);
    });

    it('throws when the element is a component already declaring the directive as a host directive', () => {
      const klass = class extends CustomElement { };
      Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: { hostDirectives: [LabelDirective] } });
      customElements.define('host-el', klass);

      expect(() => _renderElement(document.createElement('div'), createRoot(), null, { tagName: 'host-el', directives: [directive()] }))
        .toThrow('Directive "label" is applied more than once on <host-el>: it is already a host directive of the component');
    });

    it('binds the directive properties before reacting to changes', () => {
      render(document.createElement('div'), createRoot(), {
        directives: [directive({ attributes: [{ name: 'label', value: 'bound', setter: _setInput }] })]
      });

      expect(lastInstance().seen).toEqual(['bound']);
    });

    it('follows reactive directive properties', async () => {
      const label = signal('first');
      render(document.createElement('div'), createRoot(), {
        directives: [directive({ attributes: [{ name: 'label', value: () => label(), setter: _setReactiveInput }] })]
      });

      label.set('second');
      await flush();

      expect(lastInstance().label()).toBe('second');
      expect(lastInstance().seen).toEqual(['first', 'second']);
    });

    it('resets the directive properties declaring an unbind when the context is destroyed', () => {
      const context = createRoot();
      render(document.createElement('div'), context, { directives: [directive({ attributes: [label('bound')] })] });
      const instance = lastInstance();
      expect(instance.label()).toBe('bound');

      clear(context);

      expect(instance.label()).toBe('initial');
    });

    it('listens to the directive events on the element', () => {
      const onChange = vi.fn();
      render(document.createElement('div'), createRoot(), {
        directives: [directive({ events: [{ name: 'change', handler: (_context, $event) => onChange($event.type) }] })]
      });

      lastInstance().dispatchEvent(new CustomEvent('change'));

      expect(onChange).toHaveBeenCalledWith('change');
    });

    it('disposes the directive when the context is destroyed', () => {
      const context = createRoot();
      render(document.createElement('div'), context, { directives: [directive()] });
      const instance = lastInstance();
      expect(instance.destroyed).not.toHaveBeenCalled();

      clear(context);

      expect(instance.destroyed).toHaveBeenCalledOnce();
    });

    it('registers the directive on its element for the queries, until it is disposed', () => {
      const context = createRoot();
      const element = render(document.createElement('div'), context, { directives: [directive()] });
      const instance = lastInstance();
      expect(_getAppliedDirectives(element, LabelDirective)).toEqual([instance]);

      clear(context);

      expect(_getAppliedDirectives(element, LabelDirective)).toBeUndefined();
    });

    it('binds the properties of a conditional binding only while its condition is true, then resets them', async () => {
      const enabled = signal(false);
      render(document.createElement('div'), createRoot(), {
        directives: [directive({
          conditionalBindings: [{ branches: [{ condition: () => enabled(), attributes: [label('conditional')] }] }]
        })]
      });
      const instance = lastInstance();
      expect(instance.label()).toBe('initial');

      enabled.set(true);
      await flush();
      expect(instance.label()).toBe('conditional');

      enabled.set(false);
      await flush();
      expect(instance.label()).toBe('initial');
      expect(LabelDirective.instances.at(-1)).toBe(instance);
    });

    it('binds the properties of a conditional binding already true before reacting to changes', () => {
      render(document.createElement('div'), createRoot(), {
        directives: [directive({
          conditionalBindings: [{ branches: [{ condition: () => true, attributes: [{ name: 'label', value: 'conditional', setter: _setInput }] }] }]
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
              { condition: () => enabled(), attributes: [label('if')] },
              { attributes: [label('else')] }
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
              { condition: [1, 2], attributes: [label('case')] },
              { condition: null, attributes: [label('default')] }
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
      render(document.createElement('div'), createRoot(), {
        directives: [directive({
          conditionalBindings: [{
            branches: [{
              condition: () => enabled(),
              events: [{ name: 'change', handler: onChange }],
              conditionalBindings: [{ branches: [{ condition: () => true, events: [{ name: 'nested', handler: onChange }] }] }]
            }]
          }]
        })]
      });

      lastInstance().dispatchEvent(new CustomEvent('change'));
      lastInstance().dispatchEvent(new CustomEvent('nested'));
      expect(onChange).toHaveBeenCalledTimes(2);

      enabled.set(false);
      await flush();
      lastInstance().dispatchEvent(new CustomEvent('change'));
      lastInstance().dispatchEvent(new CustomEvent('nested'));
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('throws when no directive is registered for the selector', () => {
      expect(() => render(document.createElement('div'), createRoot(), { directives: [directive({ selector: 'missing' })] })).toThrow('No directive registered for selector "missing"');
    });

    it('throws when the directive registered for the selector is a structural directive', () => {
      expect(() => render(document.createElement('div'), createRoot(), { directives: [directive({ selector: 'visible' })] })).toThrow('Directive VisibleDirective registered for selector "visible" is not a CustomDirective');
    });

    it('instantiates a directive given by its class in place of a selector', () => {
      const element = render(document.createElement('div'), createRoot(), { directives: [directive({ selector: LabelDirective })] });

      expect(lastInstance().element).toBe(element);
    });

    it('throws when a directive given by its class is a structural directive', () => {
      expect(() => render(document.createElement('div'), createRoot(), { directives: [directive({ selector: VisibleDirective as never })] })).toThrow('Directive VisibleDirective is not a CustomDirective');
    });

    it('names a directive given by its class when the component already declares it as a host directive', () => {
      const klass = class extends CustomElement { };
      Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: { hostDirectives: [LabelDirective] } });
      customElements.define('host-class-el', klass);

      expect(() => _renderElement(document.createElement('div'), createRoot(), null, { tagName: 'host-class-el', directives: [directive({ selector: LabelDirective })] }))
        .toThrow('Directive LabelDirective is applied more than once on <host-class-el>: it is already a host directive of the component');
    });
  });

  describe('structural directives', () => {
    const renderStructural = (
      parent: Element,
      context: Context,
      element: Pick<RenderElement, 'structuralDirectives' | 'structuralConditionalBindings' | 'children' | 'last'>,
      anchor: Comment | null = null
    ) => _renderElement(parent, context, anchor, Object.assign({ tagName: 'div', attributes: [{ name: 'id', value: 'target', setter: _setProperty }], slot: element.last ? undefined : freeSlot(context) }, element));
    const structural = (selector = 'visible', attributes?: RenderElementAttribute[]): RenderElementStructuralDirective => ({ selector, attributes });
    const visible = (value: () => boolean): RenderElementAttribute => ({ name: 'visible', value, setter: _setReactiveInput });
    const target = (parent: Element) => parent.querySelector('#target');
    const lastInstance = () => VisibleDirective.instances.at(-1)!;

    it('renders the element, before an anchor, while its structural directive returns true', () => {
      const parent = document.createElement('section');
      const result = renderStructural(parent, createRoot(), { structuralDirectives: [structural()] });

      expect(result).toBeUndefined();
      expect(parent.childNodes).toHaveLength(2);
      expect(parent.firstChild).toBe(target(parent));
      expect(parent.lastChild!.nodeType).toBe(Node.COMMENT_NODE);
      expect(parent.lastChild!.textContent).toBe('structural');
    });

    it('does not render the element while its structural directive returns false', () => {
      const parent = document.createElement('section');
      renderStructural(parent, createRoot(), { structuralDirectives: [structural('visible', [visible(() => false)])] });

      expect(target(parent)).toBeNull();
      expect(parent.childNodes).toHaveLength(1);
    });

    it('binds the properties of a structural directive before evaluating it', () => {
      const context = createRoot();
      const createElement = vi.spyOn(CREATE_NODES, 'element');
      renderStructural(document.createElement('section'), context, {
        structuralDirectives: [structural('visible', [{ name: 'visible', value: () => false, setter: _setExpressionInput }])]
      });

      expect(lastInstance().evaluations).toHaveBeenCalledOnce();
      expect(createElement).not.toHaveBeenCalled();
    });

    it('keeps the position given by the anchor the element is rendered before', async () => {
      const shown = signal(true);
      const parent = document.createElement('section');
      const sibling = parent.appendChild(document.createComment('sibling'));
      renderStructural(parent, createRoot(), { structuralDirectives: [structural('visible', [visible(() => shown())])] }, sibling);

      shown.set(false);
      await settle();
      parent.insertBefore(document.createElement('span'), sibling);
      shown.set(true);
      await settle();

      expect([...parent.childNodes].map(node => node.nodeName)).toEqual(['DIV', '#comment', 'SPAN', '#comment']);
    });

    it('renders the last element of its parent without anchor, appending it to the parent each time it is created', async () => {
      const shown = signal(true);
      const parent = document.createElement('section');
      parent.appendChild(document.createElement('span'));
      const context = createRoot();
      const block = vi.spyOn(CREATE_NODES, 'block');
      renderStructural(parent, context, { structuralDirectives: [structural('visible', [visible(() => shown())])], last: true });

      expect(block).toHaveBeenCalledExactlyOnceWith(context, parent, null, 'structural', 'xd-s', true, undefined);
      expect([...parent.childNodes].map(node => node.nodeName)).toEqual(['SPAN', 'DIV']);

      shown.set(false);
      await settle();
      expect([...parent.childNodes].map(node => node.nodeName)).toEqual(['SPAN']);

      shown.set(true);
      await settle();
      expect([...parent.childNodes].map(node => node.nodeName)).toEqual(['SPAN', 'DIV']);
      block.mockRestore();
    });

    it('adopts the last element of its parent the server rendered, which it closes with no marker', () => {
      const parent = document.createElement('section');
      parent.innerHTML = '<!--xd-s:1--><div id="target"></div>';
      const element = parent.lastChild;
      const context = _scope(null, EMPTY_LAYOUT, new ClaimNodes('x-host'));

      renderStructural(parent, context, { structuralDirectives: [structural()], last: true });

      expect(parent.innerHTML).toBe('<div id="target"></div>');
      expect(parent.firstChild).toBe(element);
    });

    it('creates and destroys the element as the outcome of its structural directive changes', async () => {
      const shown = signal(false);
      const parent = document.createElement('section');
      renderStructural(parent, createRoot(), { structuralDirectives: [structural('visible', [visible(() => shown())])] });
      expect(target(parent)).toBeNull();

      shown.set(true);
      await settle();
      const element = target(parent);
      expect(element).not.toBeNull();

      shown.set(false);
      await settle();
      expect(target(parent)).toBeNull();

      shown.set(true);
      await settle();
      expect(target(parent)).not.toBeNull();
      expect(target(parent)).not.toBe(element);
    });

    it('does not render the element again when the outcome is evaluated again without changing', async () => {
      const count = signal(1);
      const parent = document.createElement('section');
      renderStructural(parent, createRoot(), { structuralDirectives: [structural('visible', [visible(() => count() > 0)])] });
      const element = target(parent);

      count.set(2);
      await settle();

      expect(target(parent)).toBe(element);
    });

    it('creates the element again in its namespace', async () => {
      const shown = signal(true);
      const context = createRoot();
      const parent = document.createElementNS(SVG_NS, 'svg');
      _renderElement(parent as unknown as Element, context, null, { tagName: 'g', namespace: 1, attributes: [{ name: 'id', value: 'target', setter: _setProperty }], structuralDirectives: [structural('visible', [visible(() => shown())])] });

      shown.set(false);
      await settle();
      shown.set(true);
      await settle();

      expect(target(parent)!.namespaceURI).toBe(SVG_NS);
    });

    it('renders the children each time the element is created, destroying them together with the element', async () => {
      const shown = signal(true);
      const unlisten = vi.fn();
      const children = vi.fn<RenderChildren>((element, parentContext) => {
        element.appendChild(document.createElement('span'));
        const childrenContext = _scope(parentContext, EMPTY_LAYOUT);
        addCleanup(childrenContext, unlisten);
        return childrenContext;
      });
      const parent = document.createElement('section');
      renderStructural(parent, createRoot(), { structuralDirectives: [structural('visible', [visible(() => shown())])], children });

      expect(children).toHaveBeenCalledExactlyOnceWith(target(parent), expect.any(Array));
      expect(parent.querySelector('#target > span')).not.toBeNull();

      shown.set(false);
      await settle();
      expect(unlisten).toHaveBeenCalledOnce();

      shown.set(true);
      await settle();
      expect(children).toHaveBeenCalledTimes(2);
      expect(parent.querySelector('#target > span')).not.toBeNull();
    });

    it('renders the element only while every structural directive returns true', async () => {
      const first = signal(true);
      const second = signal(false);
      const parent = document.createElement('section');
      renderStructural(parent, createRoot(), {
        structuralDirectives: [structural('visible', [visible(() => first())]), structural('visible', [visible(() => second())])]
      });
      expect(target(parent)).toBeNull();

      second.set(true);
      await settle();
      expect(target(parent)).not.toBeNull();

      first.set(false);
      await settle();
      expect(target(parent)).toBeNull();
    });

    describe('conditional structural directives', () => {
      it('renders the element while no structural directive is applied', () => {
        const parent = document.createElement('section');
        renderStructural(parent, createRoot(), {
          structuralConditionalBindings: [{
            branches: [{ condition: () => false, structuralDirectives: [structural('visible', [visible(() => false)])] }]
          }]
        });

        expect(target(parent)).not.toBeNull();
      });

      it('creates the element when the structural directive returning false is destroyed, and destroys it when the directive is created again', async () => {
        const enabled = signal(true);
        const parent = document.createElement('section');
        renderStructural(parent, createRoot(), {
          structuralDirectives: [structural(), structural()],
          structuralConditionalBindings: [{
            branches: [{ condition: () => enabled(), structuralDirectives: [structural('visible', [visible(() => false)])] }]
          }]
        });
        expect(target(parent)).toBeNull();

        enabled.set(false);
        await settle();
        expect(target(parent)).not.toBeNull();

        enabled.set(true);
        await settle();
        expect(target(parent)).toBeNull();
      });

      it('applies the structural directives of the selected branch of a @switch', async () => {
        const mode = signal('hidden');
        const parent = document.createElement('section');
        renderStructural(parent, createRoot(), {
          structuralConditionalBindings: [{
            expression: () => mode(),
            branches: [
              { condition: ['hidden'], structuralDirectives: [structural('visible', [visible(() => false)])] },
              { condition: null }
            ]
          }]
        });
        expect(target(parent)).toBeNull();

        mode.set('shown');
        await settle();
        expect(target(parent)).not.toBeNull();
      });

      it('applies the structural directives of nested conditional bindings', async () => {
        const outer = signal(true);
        const inner = signal(false);
        const parent = document.createElement('section');
        renderStructural(parent, createRoot(), {
          structuralConditionalBindings: [{
            branches: [{
              condition: () => outer(),
              conditionalBindings: [{
                branches: [{ condition: () => inner(), structuralDirectives: [structural('visible', [visible(() => false)])] }]
              }]
            }]
          }]
        });
        expect(target(parent)).not.toBeNull();

        inner.set(true);
        await settle();
        expect(target(parent)).toBeNull();

        outer.set(false);
        await settle();
        expect(target(parent)).not.toBeNull();
      });

      it('never creates the element because of an intermediate state while a branch is selected in place of another', async () => {
        const first = signal(true);
        const hidden = signal(true);
        const context = createRoot();
        const createElement = vi.spyOn(CREATE_NODES, 'element');
        renderStructural(document.createElement('section'), context, {
          structuralConditionalBindings: [{
            branches: [
              { condition: () => first(), structuralDirectives: [structural('visible', [visible(() => false)])] },
              { structuralDirectives: [structural('visible', [visible(() => !hidden())]), structural()] }
            ]
          }]
        });

        first.set(false);
        await settle();
        first.set(true);
        await settle();
        expect(createElement).not.toHaveBeenCalled();

        first.set(false);
        hidden.set(false);
        await settle();
        expect(createElement).toHaveBeenCalledOnce();
      });

      it('never creates the element because of an intermediate state while different conditional bindings swap their structural directives', async () => {
        const swapped = signal(false);
        const context = createRoot();
        const createElement = vi.spyOn(CREATE_NODES, 'element');
        renderStructural(document.createElement('section'), context, {
          structuralConditionalBindings: [
            { branches: [{ condition: () => swapped(), structuralDirectives: [structural('visible', [visible(() => false)])] }] },
            { branches: [{ condition: () => !swapped(), structuralDirectives: [structural('visible', [visible(() => false)])] }] }
          ]
        });

        swapped.set(true);
        await settle();
        swapped.set(false);
        await settle();

        expect(createElement).not.toHaveBeenCalled();
      });
    });

    describe('asynchronous outcome', () => {
      it('renders the element once the outcome resolves to true', async () => {
        const parent = document.createElement('section');
        renderStructural(parent, createRoot(), { structuralDirectives: [structural('asyncVisible')] });
        expect(target(parent)).toBeNull();

        (lastInstance() as AsyncVisibleDirective).deferred.resolve(true);
        await settle();

        expect(target(parent)).not.toBeNull();
      });

      it('does not render the element when the outcome resolves to false', async () => {
        const parent = document.createElement('section');
        renderStructural(parent, createRoot(), { structuralDirectives: [structural(), structural('asyncVisible')] });

        (lastInstance() as AsyncVisibleDirective).deferred.resolve(false);
        await settle();

        expect(target(parent)).toBeNull();
      });

      it('keeps the element rendered while the outcome of a structural directive applied later is pending', async () => {
        const enabled = signal(false);
        const parent = document.createElement('section');
        renderStructural(parent, createRoot(), {
          structuralConditionalBindings: [{
            branches: [{ condition: () => enabled(), structuralDirectives: [structural('asyncVisible')] }]
          }]
        });
        const element = target(parent);

        enabled.set(true);
        await settle();
        expect(target(parent)).toBe(element);

        (lastInstance() as AsyncVisibleDirective).deferred.resolve(false);
        await settle();
        expect(target(parent)).toBeNull();
      });

      it('keeps the previous outcome while the one of a new evaluation is pending', async () => {
        const trigger = signal(true);
        const parent = document.createElement('section');
        renderStructural(parent, createRoot(), { structuralDirectives: [structural('asyncVisible', [visible(() => trigger())])] });
        const instance = lastInstance() as AsyncVisibleDirective;
        instance.deferred.resolve(true);
        await settle();
        const element = target(parent);

        trigger.set(false);
        await settle();
        expect(instance.evaluations).toHaveBeenCalledTimes(2);
        expect(target(parent)).toBe(element);

        instance.deferred.resolve(false);
        await settle();
        expect(target(parent)).toBeNull();
      });

      it('discards an outcome settling after a newer evaluation started', async () => {
        const trigger = signal(true);
        const parent = document.createElement('section');
        renderStructural(parent, createRoot(), { structuralDirectives: [structural('asyncVisible', [visible(() => trigger())])] });
        const instance = lastInstance() as AsyncVisibleDirective;
        const outdated = instance.deferred;

        trigger.set(false);
        await settle();
        outdated.resolve(true);
        await settle();
        expect(target(parent)).toBeNull();

        instance.deferred.resolve(true);
        await settle();
        expect(target(parent)).not.toBeNull();
      });

      it('discards an outcome settling after the context is destroyed', async () => {
        const context = createRoot();
        const parent = document.createElement('section');
        renderStructural(parent, context, { structuralDirectives: [structural('asyncVisible')] });

        clear(context);
        (lastInstance() as AsyncVisibleDirective).deferred.resolve(true);
        await settle();

        expect(parent.childNodes).toHaveLength(0);
      });
    });

    it('removes the element and stops evaluating the structural directives once the context is destroyed', async () => {
      const shown = signal(true);
      const context = createRoot();
      const parent = document.createElement('section');
      renderStructural(parent, context, { structuralDirectives: [structural('visible', [visible(() => shown())])] });
      const instance = lastInstance();

      clear(context);
      shown.set(false);
      await settle();

      expect(parent.childNodes).toHaveLength(0);
      expect(instance.evaluations).toHaveBeenCalledOnce();
    });

    it('throws when no directive is registered for a structural selector', () => {
      expect(() => renderStructural(document.createElement('section'), createRoot(), { structuralDirectives: [structural('missing')] })).toThrow('No directive registered for selector "missing"');
    });

    it('throws when the directive registered for a structural selector is not a structural directive', () => {
      expect(() => renderStructural(document.createElement('section'), createRoot(), { structuralDirectives: [structural('label')] })).toThrow('Directive LabelDirective registered for selector "label" is not a StructuralDirective');
    });
  });
});
