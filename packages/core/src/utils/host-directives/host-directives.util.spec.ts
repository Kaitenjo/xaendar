// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DIRECTIVE_ORDER } from '../../costants';
import type { CustomElement as HostElement } from '../../models/custom-element/custom-element';
import type { EventOptions } from '../../models/event-options/event-options';
import type { HostDirectiveOptions } from '../../types/web-component/host-directive-options.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { CustomDirective } = await import('../../models/custom-directive/custom-directive');
const { CustomElement } = await import('../../models/custom-element/custom-element');
const { Output } = await import('../../models/output/output');
const { input } = await import('../../signals/input/input');
const { createModelPrototype, model } = await import('../../signals/model/model');
const { _scope, EMPTY_LAYOUT } = await import('../context/context.util');
const { _resetExposedInput, _setExposedInput, _setExpressionExposedInput, _setReactiveExposedInput } = await import('../render-element/render-element.util');
const { _defineRender } = await import('../render-registry/render-registry.util');
const { _resolveHostDirectives } = await import('./host-directives.util');

type Element = HostElement & Record<string, unknown>;
type Declaration = typeof TooltipDirective | typeof PlainDirective | typeof ToggleDirective | HostDirectiveOptions;

/**
 * Directive declaring an input, aliased, and two outputs.
 */
class TooltipDirective extends CustomDirective {
  public readonly text = input<string>('');
  public readonly position = input<string>('top');
  public readonly opened = new Output<unknown>((detail: unknown, _options?: EventOptions) => {
    this.dispatchEvent(new CustomEvent('opened', { detail, bubbles: true }));
  });
  public readonly closed = new Output(() => this.dispatchEvent(new CustomEvent('closed')));
  public readonly fake = { dispatch: () => undefined };
}

Object.defineProperty(TooltipDirective, Symbol.for('Symbol.metadata'), { value: { aliasToAttribute: { text: 'text', pos: 'position' }, events: new Set(['opened', 'closed']) } });

/**
 * Directive declaring an input and an event named like the ones of the tooltip.
 */
class LabelDirective extends CustomDirective {
  public readonly text = input<string>('');
  public readonly opened = new Output(() => undefined);
}

Object.defineProperty(LabelDirective, Symbol.for('Symbol.metadata'), { value: { aliasToAttribute: { text: 'text' }, events: new Set(['opened']) } });

/**
 * Directive counting the reads of its input and of its output, as the accessors of `@Property` and `@Event` create
 * them when first read.
 */
class CountingDirective extends CustomDirective {
  public reads = new Array<string>();
  private readonly _text = input<string>('');
  private readonly _opened = new Output(() => undefined);

  public get text() {
    this.reads.push('text');
    return this._text;
  }

  public get opened() {
    this.reads.push('opened');
    return this._opened;
  }
}

Object.defineProperty(CountingDirective, Symbol.for('Symbol.metadata'), { value: { aliasToAttribute: { text: 'text' }, events: new Set(['opened']) } });

/**
 * Directive declaring two models, one aliased, and an input.
 */
class ToggleDirective extends CustomDirective {
  public readonly checked = model<boolean>(createModelPrototype(false, { name: 'checkedChange', event: undefined, equals: Object.is }), this, undefined);
  public readonly state = model<boolean>(createModelPrototype(false, { name: 'onChange', event: undefined, equals: Object.is }), this, undefined);
  public readonly text = input<string>('');
}

Object.defineProperty(ToggleDirective, Symbol.for('Symbol.metadata'), { value: { aliasToAttribute: { checked: 'checked', on: 'state', text: 'text' }, events: new Set(['checkedChange', 'onChange']) } });

/**
 * Directive declaring nothing.
 */
class PlainDirective extends CustomDirective { }

let counter = 0;

/**
 * Builds a component class whose `@WebComponent` declares the given host directives, as it would store them in its
 * metadata, along with the other metadata given, extending a parent class whose metadata it inherits.
 */
function defineClass(hostDirectives?: Declaration[], metadata: Partial<WebComponentMetadata> = {}, Parent: typeof HostElement = CustomElement): typeof HostElement {
  const klass = class extends Parent { };
  const parentMetadata = (Parent as unknown as Record<symbol, object | undefined>)[Symbol.for('Symbol.metadata')];
  const own = Object.assign(Object.create(parentMetadata ?? null) as Partial<WebComponentMetadata>, metadata);
  if (hostDirectives) {
    own.hostDirectives = hostDirectives;
  }

  Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: own });
  return klass;
}

/**
 * Registers a component class under a new name.
 */
function register(klass: typeof HostElement): string {
  const name = `x-host-${counter++}`;
  customElements.define(name, klass);
  return name;
}

/**
 * Builds a component whose `@WebComponent` declares the given host directives and creates an element of it.
 */
function create(hostDirectives?: Declaration[], metadata?: Partial<WebComponentMetadata>): Element {
  return document.createElement(register(defineClass(hostDirectives, metadata))) as Element;
}

describe('_createHostDirectives', () => {
  it('creates none for a component declaring none', () => {
    expect(create().hostDirectives.size).toBe(0);
    expect(create([]).hostDirectives.size).toBe(0);
  });

  it('shares one empty map among the components declaring none, which reads as an empty Map', () => {
    const hostDirectives = create().hostDirectives;
    const forEach = vi.fn();
    hostDirectives.forEach(forEach);

    expect(create([]).hostDirectives).toBe(hostDirectives);
    expect(forEach).not.toHaveBeenCalled();
    expect(hostDirectives.get(TooltipDirective)).toBeUndefined();
    expect(hostDirectives.has(TooltipDirective)).toBe(false);
    expect(Array.from(hostDirectives.keys())).toEqual([]);
    expect(Array.from(hostDirectives.values())).toEqual([]);
    expect(Array.from(hostDirectives.entries())).toEqual([]);
    expect(Array.from(hostDirectives)).toEqual([]);
  });

  it('creates an instance of a directive declared by its class, applied to the component', () => {
    const element = create([TooltipDirective]);
    const directive = element.hostDirectives.get(TooltipDirective);

    expect(directive).toBeInstanceOf(TooltipDirective);
    expect(directive?.element).toBe(element);
    expect(element.hostDirectives.size).toBe(1);
  });

  it('creates an instance of a directive declared by its options', () => {
    const element = create([{ directive: TooltipDirective }]);

    expect(element.hostDirectives.get(TooltipDirective)).toBeInstanceOf(TooltipDirective);
  });

  it('creates every directive, in declaration order, each one with its own instance', () => {
    const first = create([TooltipDirective, PlainDirective]);
    const second = create([TooltipDirective, PlainDirective]);

    expect(Array.from(first.hostDirectives.keys())).toEqual([TooltipDirective, PlainDirective]);
    expect(first.hostDirectives.get(TooltipDirective)).not.toBe(second.hostDirectives.get(TooltipDirective));
  });

  it('gets undefined for a directive that is not a host directive', () => {
    expect(create([TooltipDirective]).hostDirectives.get(PlainDirective)).toBeUndefined();
  });

  it('throws when a directive is declared twice', () => {
    expect(() => create([TooltipDirective, { directive: TooltipDirective }])).toThrow('declares the host directive TooltipDirective more than once');
  });

  describe('inheritance', () => {
    it('applies the host directives of the ancestors first, then the ones of the class, in order', () => {
      const Parent = defineClass([TooltipDirective]);
      const Child = defineClass([PlainDirective], {}, Parent);
      const element = document.createElement(register(Child)) as Element;

      expect(Array.from(element.hostDirectives.keys())).toEqual([TooltipDirective, PlainDirective]);
      expect(Array.from(element.hostDirectives.values()).map(directive => directive[DIRECTIVE_ORDER])).toEqual([0, 1]);
    });

    it('inherits the host directives of the parent class, also when the class declares none or has no metadata of its own', () => {
      const Parent = defineClass([{ directive: TooltipDirective, properties: ['text'] }]);
      const Decorated = defineClass(undefined, {}, Parent);
      const Undecorated = class extends Parent { };

      const decorated = document.createElement(register(Decorated)) as Element;
      const undecorated = document.createElement(register(Undecorated)) as Element;

      expect(Array.from(decorated.hostDirectives.keys())).toEqual([TooltipDirective]);
      expect(Array.from(undecorated.hostDirectives.keys())).toEqual([TooltipDirective]);
      expect(_resolveHostDirectives(Undecorated)).toBe(_resolveHostDirectives(Parent));
      expect(undecorated.text).toBe(undecorated.hostDirectives.get(TooltipDirective)?.text);
    });

    it('throws when a class declares a directive one of its ancestors declares', () => {
      const Parent = defineClass([TooltipDirective]);

      expect(() => _resolveHostDirectives(defineClass([PlainDirective, TooltipDirective], {}, Parent))).toThrow('declares the host directive TooltipDirective more than once');
    });

    it('throws when an exposure of an ancestor has the name of an input, of a member or of an event of the class', () => {
      const Parent = defineClass([{ directive: TooltipDirective, properties: ['text'], events: ['opened'] }]);
      const Member = class extends Parent {
        public text(): void { }
      };

      expect(() => _resolveHostDirectives(defineClass(undefined, { aliasToAttribute: { text: 'content' } }, Parent))).toThrow('already has an input named "text", which TooltipDirective cannot expose');
      expect(() => _resolveHostDirectives(Member)).toThrow('already has a member named "text", which TooltipDirective cannot expose as an input');
      expect(() => _resolveHostDirectives(defineClass(undefined, { events: new Set(['opened']) }, Parent))).toThrow('already has an event named "opened", which TooltipDirective cannot expose');
    });

    it('throws when a host directive of the class exposes a name a host directive of an ancestor exposes', () => {
      const Parent = defineClass([{ directive: TooltipDirective, properties: ['text'], events: ['opened'] }]);

      expect(() => _resolveHostDirectives(defineClass([{ directive: LabelDirective, properties: ['text'] }], {}, Parent))).toThrow('already has an input named "text", which LabelDirective cannot expose');
      expect(() => _resolveHostDirectives(defineClass([{ directive: LabelDirective, events: ['opened'] }], {}, Parent))).toThrow('already has an event named "opened", which LabelDirective cannot expose');
    });
  });

  describe('inputs', () => {
    it('does not expose any input unless asked to', () => {
      const klass = defineClass([TooltipDirective, { directive: PlainDirective, properties: [] }]);

      expect('text' in klass.prototype).toBe(false);
    });

    it('exposes an input through an accessor on the prototype of the class, returning the input signal of the directive', () => {
      const klass = defineClass([{ directive: TooltipDirective, properties: ['text'] }]);
      const element = document.createElement(register(klass)) as Element;
      const directive = element.hostDirectives.get(TooltipDirective)!;

      expect(element.text).toBe(directive.text);
      expect(Object.hasOwn(element, 'text')).toBe(false);
      expect(Object.getOwnPropertyDescriptor(klass.prototype, 'text')?.get).toBeTypeOf('function');
      expect('position' in element).toBe(false);
    });

    it('writes into the input of the directive a value assigned to the exposed property, as to an input of the component', () => {
      const element = create([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }] }]);
      element.label = 'hello';

      expect(element.hostDirectives.get(TooltipDirective)?.text()).toBe('hello');
      expect(Object.hasOwn(element, 'label')).toBe(false);
    });

    it('exposes an input under another name, or by the alias the directive declares for it', () => {
      const element = create([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }, 'pos', { name: 'pos', alias: 'place' }] }]);
      const directive = element.hostDirectives.get(TooltipDirective)!;

      expect(element.label).toBe(directive.text);
      expect('text' in element).toBe(false);
      expect(element.pos).toBe(directive.position);
      expect(element.place).toBe(directive.position);
    });

    it('reads no input nor event of the directive while exposing them, the accessor of the element reading the input then', () => {
      const element = create([{ directive: CountingDirective, properties: ['text'], events: ['opened'] }]);
      const directive = element.hostDirectives.get(CountingDirective)!;
      expect(directive.reads).toEqual([]);

      expect(element.text).toBe(directive.text);
      expect(directive.reads).toEqual(['text', 'text']);
    });

    it('shares the accessor of an exposed input among the components exposing it, and resolves a class once', () => {
      const first = defineClass([{ directive: TooltipDirective, properties: ['text'] }]);
      const second = defineClass([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }] }]);

      expect(_resolveHostDirectives(first)).toBe(_resolveHostDirectives(first));
      _resolveHostDirectives(second);
      expect(Object.getOwnPropertyDescriptor(first.prototype, 'text')?.get).toBe(Object.getOwnPropertyDescriptor(second.prototype, 'label')?.get);
    });

    it('writes into an exposed input the value code outside the templates assigned to the element before its upgrade', () => {
      const name = `x-host-${counter++}`;
      const element = document.createElement(name) as Element;
      element.label = 'early';
      const klass = defineClass([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }] }]);
      _defineRender(klass, () => _scope(null, EMPTY_LAYOUT));
      customElements.define(name, klass);

      document.body.appendChild(element);

      const directive = element.hostDirectives.get(TooltipDirective)!;
      element.remove();
      expect(directive.text()).toBe('early');
      expect(Object.hasOwn(element, 'label')).toBe(false);
      expect(element.label).toBe(directive.text);
    });

    it('throws when the directive does not declare the input, or it is named by the property of an input declaring an alias', () => {
      expect(() => create([{ directive: TooltipDirective, properties: ['missing'] }])).toThrow('TooltipDirective does not declare an input named "missing"');
      expect(() => create([{ directive: TooltipDirective, properties: ['element'] }])).toThrow('does not declare an input named "element"');
      expect(() => create([{ directive: TooltipDirective, properties: ['position'] }])).toThrow('does not declare an input named "position"');
      expect(() => create([{ directive: PlainDirective, properties: ['text'] }])).toThrow('PlainDirective does not declare an input named "text"');
    });

    it('throws when the name is the one of an input of the component, or of an input another host directive exposes', () => {
      expect(() => create([{ directive: TooltipDirective, properties: ['text'] }], { aliasToAttribute: { text: 'text' } })).toThrow('already has an input named "text"');
      expect(() => create([{ directive: TooltipDirective, properties: ['text'] }, { directive: LabelDirective, properties: ['text'] }])).toThrow('LabelDirective cannot expose');
    });

    it('throws when the name is the one of a member of the component, of an ancestor or of HTMLElement', () => {
      const Member = class extends CustomElement {
        public label(): void { }
      };
      Object.defineProperty(Member, Symbol.for('Symbol.metadata'), { value: { hostDirectives: [{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }] }] } });

      expect(() => _resolveHostDirectives(Member)).toThrow('already has a member named "label", which TooltipDirective cannot expose as an input');
      expect(() => create([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'title' }] }])).toThrow('already has a member named "title"');
      expect(() => create([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'effect' }] }])).toThrow('already has a member named "effect"');
    });
  });

  describe('setters of the exposed inputs', () => {
    it('write into the input of the directive, by the name it is exposed with, and reset it', () => {
      const element = create([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }] }]);
      const context = _scope(null, EMPTY_LAYOUT);
      const text = element.hostDirectives.get(TooltipDirective)!.text;

      _setExposedInput(context, element, { name: 'label', value: 'literal', setter: _setExposedInput });
      expect(text()).toBe('literal');

      _setExpressionExposedInput(context, element, { name: 'label', value: () => 'expression', setter: _setExpressionExposedInput });
      expect(text()).toBe('expression');

      _resetExposedInput(context, element, { name: 'label', value: 'literal', setter: _setExposedInput });
      expect(text()).toBe('');
    });

    it('bind the input to an expression, written again when a signal it reads changes', async () => {
      const { signal } = await import('../../signals/signal/signal');
      const element = create([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }] }]);
      const context = _scope(null, EMPTY_LAYOUT);
      const source = signal('a');
      _setReactiveExposedInput(context, element, { name: 'label', value: () => source(), setter: _setReactiveExposedInput, update: _setExpressionExposedInput, effect: null } as never);
      source.set('b');
      await Promise.resolve();

      expect(element.hostDirectives.get(TooltipDirective)?.text()).toBe('b');
    });

    it('keep the values bound before the upgrade apart from the element, which takes them once it is constructed', () => {
      const name = `x-host-${counter++}`;
      const element = document.createElement(name) as Element;
      const context = _scope(null, EMPTY_LAYOUT);
      _setExposedInput(context, element, { name: 'label', value: 'early', setter: _setExposedInput });
      _setExposedInput(context, element, { name: 'place', value: 'bottom', setter: _setExposedInput });
      _resetExposedInput(context, element, { name: 'place', value: 'bottom', setter: _setExposedInput });
      expect(Object.hasOwn(element, 'label')).toBe(false);

      const klass = defineClass([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }, { name: 'pos', alias: 'place' }] }]);
      _defineRender(klass, () => _scope(null, EMPTY_LAYOUT));
      customElements.define(name, klass);
      document.body.appendChild(element);

      const directive = element.hostDirectives.get(TooltipDirective)!;
      element.remove();
      expect(directive.text()).toBe('early');
      expect(directive.position()).toBe('top');
    });

    it('drop nothing for an element whose class is not defined and that holds no value', () => {
      const element = document.createElement(`x-host-${counter++}`);

      expect(() => _resetExposedInput(_scope(null, EMPTY_LAYOUT), element, { name: 'label', value: '', setter: _setExposedInput })).not.toThrow();
    });
  });

  describe('outputs', () => {
    /**
     * Listens to the events of a component, returning the names of the ones it hears.
     */
    function listen(element: HostElement): string[] {
      const heard = new Array<string>();
      for (const name of ['opened', 'closed', 'shown']) {
        element.addEventListener(name, event => heard.push(event.type));
      }

      return heard;
    }

    it('does not dispatch any event on the component unless asked to', () => {
      const element = create([TooltipDirective]);
      const heard = listen(element);
      element.hostDirectives.get(TooltipDirective)?.opened.dispatch(undefined);

      expect(heard).toEqual([]);
    });

    it('dispatches an exposed event on the component', () => {
      const element = create([{ directive: TooltipDirective, events: ['opened'] }]);
      const heard = listen(element);
      const directive = element.hostDirectives.get(TooltipDirective)!;
      directive.opened.dispatch({ id: 1 });
      directive.closed.dispatch();

      expect(heard).toEqual(['opened']);
    });

    it('dispatches an exposed event under another name, keeping what it carries', () => {
      const element = create([{ directive: TooltipDirective, events: [{ name: 'opened', alias: 'shown' }] }]);
      const listener = vi.fn();
      element.addEventListener('shown', listener);
      const heard = listen(element);
      element.hostDirectives.get(TooltipDirective)?.opened.dispatch({ id: 1 });

      expect(heard).toEqual(['shown']);
      expect(listener.mock.calls[0][0].detail).toEqual({ id: 1 });
      expect(listener.mock.calls[0][0].bubbles).toBe(true);
    });

    it('throws when the directive does not declare the event', () => {
      expect(() => create([{ directive: TooltipDirective, events: ['missing'] }])).toThrow('TooltipDirective does not declare an event named "missing"');
      expect(() => create([{ directive: TooltipDirective, events: ['text'] }])).toThrow('does not declare an event named "text"');
      expect(() => create([{ directive: TooltipDirective, events: ['fake'] }])).toThrow('does not declare an event named "fake"');
    });

    it('throws when the name is the one of an event of the component, or of an event another host directive exposes', () => {
      expect(() => create([{ directive: TooltipDirective, events: ['opened'] }], { events: new Set(['opened']) })).toThrow('already has an event named "opened", which TooltipDirective cannot expose');
      expect(() => create([{ directive: TooltipDirective, events: ['opened'] }, { directive: LabelDirective, events: ['opened'] }])).toThrow('already has an event named "opened", which LabelDirective cannot expose');
    });

    it('dispatches the exposed event of change of a model, by the name of the model or by its alias', () => {
      const element = create([{ directive: ToggleDirective, events: ['checkedChange', { name: 'onChange', alias: 'stateChange' }] }]);
      const heard = new Array<unknown>();
      for (const name of ['checkedChange', 'onChange', 'stateChange']) {
        element.addEventListener(name, event => heard.push([event.type, (event as CustomEvent).detail]));
      }

      const directive = element.hostDirectives.get(ToggleDirective)!;
      directive.checked.set(true);
      directive.state.set(true);

      expect(heard).toEqual([['checkedChange', true], ['stateChange', true]]);
    });

    it('throws when the event is not the one of change of a model', () => {
      expect(() => create([{ directive: ToggleDirective, events: ['stateChange'] }])).toThrow('ToggleDirective does not declare an event named "stateChange"');
      expect(() => create([{ directive: ToggleDirective, events: ['textChange'] }])).toThrow('does not declare an event named "textChange"');
      expect(() => create([{ directive: ToggleDirective, events: ['Change'] }])).toThrow('does not declare an event named "Change"');
      expect(() => create([{ directive: PlainDirective, events: ['valueChange'] }])).toThrow('does not declare an event named "valueChange"');
    });
  });
});
