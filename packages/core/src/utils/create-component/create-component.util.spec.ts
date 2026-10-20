// @vitest-environment happy-dom
import type { Constructor } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { input } = await import('../../signals/input/input');
const { computed, effect, signal } = await import('../../signals');
const { CustomDirective } = await import('../../models/custom-directive/custom-directive');
const { CustomElement } = await import('../../models/custom-element/custom-element');
const { Output } = await import('../../models/output/output');
const { StructuralDirective } = await import('../../models/structural-directive/structural-directive');
const { _Context } = await import('../context/context.util');
const { _defineRender } = await import('../render-registry/render-registry.util');
const { createComponent } = await import('./create-component.util');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

let counter = 0;

/**
 * Registers a component class as `@WebComponent` does, with an empty render function.
 */
function define<T extends Constructor<InstanceType<typeof CustomElement>>>(klass: T): T {
  const selector = `x-created-${counter++}`;
  Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: { selector } });
  _defineRender(klass, () => new _Context({} as never));
  customElements.define(selector, klass);
  return klass;
}

const Card = define(class Card extends CustomElement {
  public readonly heading = input<string>('default heading');
  public readonly count = input<number>(0);
  public readonly mode = input<'compact' | 'wide'>('wide');
  public readonly double = computed(() => this.count() * 2);
  public readonly changed = new Output<number>((value, _options?) => { this.dispatchEvent(new CustomEvent('changed', { detail: value })); });
  public readonly closed = new Output(() => { this.dispatchEvent(new CustomEvent('closed')); });
  public readonly headingOnInit = new Array<string>();
  public readonly destroyed = vi.fn();

  public onInit(): void {
    this.headingOnInit.push(this.heading());
  }

  public onDestroy(): void {
    this.destroyed();
  }
});

/**
 * Directive recording its instances, whether its element is mounted when it starts and its destruction.
 */
class Tooltip extends CustomDirective {
  public static readonly instances = new Array<Tooltip>();

  public readonly text = input<string>('');
  public readonly toggled = new Output<boolean>((value, _options?) => { this.dispatchEvent(new CustomEvent('toggled', { detail: value })); });
  public readonly destroyed = vi.fn();
  public mounted?: boolean;

  constructor() {
    super();
    Tooltip.instances.push(this);
  }

  public onInit(): void {
    this.mounted = this.element.isConnected;
  }

  public onDestroy(): void {
    this.destroyed();
  }
}

/**
 * Structural directive, which `createComponent` can't apply.
 */
class Visible extends StructuralDirective {
  public shouldRender(): boolean {
    return true;
  }
}

const lastTooltip = () => Tooltip.instances.at(-1)!;

describe('createComponent', () => {
  it('appends the component to the target and returns its element', () => {
    const target = document.createElement('div');
    document.body.append(target);
    target.append(document.createElement('span'));

    const { element } = createComponent(Card, { target });

    expect(element).toBeInstanceOf(Card);
    expect(target.lastChild).toBe(element);
    expect(element.isConnected).toBe(true);
  });

  it('sets the inputs before the component is initialized', () => {
    const { element } = createComponent(Card, { target: document.body, properties: [{ heading: () => 'Hello' }] });

    expect(element.headingOnInit).toEqual(['Hello']);
  });

  it('updates an input when a signal read by its getter changes', async () => {
    const heading = signal('first');
    const { element } = createComponent(Card, { target: document.body, properties: [{ heading: () => heading() }] });

    heading.set('second');
    await flush();

    expect(element.heading()).toBe('second');
  });

  it('binds a group of inputs only while its condition holds, resetting them to their default value', async () => {
    const enabled = signal(false);
    const { element } = createComponent(Card, { target: document.body, properties: [{ heading: () => 'fixed' }, { condition: () => enabled(), count: () => 5, mode: () => 'compact' }] });
    expect([element.count(), element.mode()]).toEqual([0, 'wide']);

    enabled.set(true);
    await flush();
    expect([element.count(), element.mode()]).toEqual([5, 'compact']);

    enabled.set(false);
    await flush();
    expect([element.heading(), element.count(), element.mode()]).toEqual(['fixed', 0, 'wide']);
  });

  it('throws when an input is bound by more than one group', () => {
    expect(() => createComponent(Card, { target: document.body, properties: [{ count: () => 1 }, { condition: () => true, count: () => 2 }] }))
      .toThrow('Property "count" is bound by more than one group');
  });

  it('listens to the events of the component and to the native ones', () => {
    const onChanged = vi.fn();
    const onClick = vi.fn();
    const { element } = createComponent(Card, { target: document.body, events: [{ changed: event => onChanged(event.detail), click: onClick }] });

    element.changed.emit(3);
    element.click();

    expect(onChanged).toHaveBeenCalledWith(3);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('listens to a group of events only while its condition holds', async () => {
    const enabled = signal(true);
    const onClosed = vi.fn();
    const { element } = createComponent(Card, { target: document.body, events: [{ condition: () => enabled(), closed: onClosed }] });

    element.closed.emit();
    enabled.set(false);
    await flush();
    element.closed.emit();

    expect(onClosed).toHaveBeenCalledOnce();
  });

  it('throws when the class is not decorated with @WebComponent', () => {
    const Undecorated = class Undecorated extends CustomElement { };

    expect(() => createComponent(Undecorated, { target: document.body })).toThrow('Undecorated does not seem to be decorated with @WebComponent');
  });

  it('is not tracked by an effect it is created in', async () => {
    const heading = signal('first');
    const runs = vi.fn();
    const dispose = effect(() => {
      runs();
      createComponent(Card, { target: document.body, properties: [{ heading: () => heading() }] });
    });

    heading.set('second');
    await flush();
    dispose();

    expect(runs).toHaveBeenCalledOnce();
  });

  describe('directives', () => {
    it('applies a directive given by its class, once the component is mounted', () => {
      const { element } = createComponent(Card, { target: document.body, directives: [Tooltip] });

      expect(lastTooltip().element).toBe(element);
      expect(lastTooltip().mounted).toBe(true);
    });

    it('binds the inputs and listens to the events of a directive, also conditionally', async () => {
      const enabled = signal(false);
      const onToggled = vi.fn();
      const onConditionalToggled = vi.fn();
      createComponent(Card, {
        target: document.body,
        directives: [{
          directive: Tooltip,
          properties: [{ condition: () => enabled(), text: () => 'Hint' }],
          events: [{ toggled: event => onToggled(event.detail) }, { condition: () => enabled(), toggled: onConditionalToggled }]
        }]
      });
      const tooltip = lastTooltip();
      expect(tooltip.text()).toBe('');

      enabled.set(true);
      await flush();
      tooltip.toggled.emit(true);

      expect(tooltip.text()).toBe('Hint');
      expect(onToggled).toHaveBeenCalledWith(true);
      expect(onConditionalToggled).toHaveBeenCalledOnce();
    });

    it('applies a directive only while its condition holds, a new instance each time it holds again', async () => {
      const enabled = signal(true);
      createComponent(Card, { target: document.body, directives: [{ directive: Tooltip, condition: () => enabled(), properties: [{ text: () => 'Hint' }] }] });
      const first = lastTooltip();
      expect([first.mounted, first.text()]).toEqual([true, 'Hint']);

      enabled.set(false);
      await flush();
      expect(first.destroyed).toHaveBeenCalledOnce();

      enabled.set(true);
      await flush();
      expect(lastTooltip()).not.toBe(first);
      expect(lastTooltip().text()).toBe('Hint');
    });

    it('throws when a directive is not a custom directive', () => {
      expect(() => createComponent(Card, { target: document.body, directives: [Visible as never] })).toThrow('Directive Visible is not a CustomDirective');
    });
  });

  describe('destroy', () => {
    it('removes the element, destroying the component and its directives and unbinding its inputs', async () => {
      const target = document.createElement('div');
      document.body.append(target);
      const heading = signal('first');
      const { element, destroy } = createComponent(Card, { target, properties: [{ heading: () => heading() }], directives: [Tooltip] });

      destroy();
      heading.set('second');
      await flush();

      expect(target.childNodes).toHaveLength(0);
      expect(element.destroyed).toHaveBeenCalledOnce();
      expect(lastTooltip().destroyed).toHaveBeenCalledOnce();
      expect(element.heading()).toBe('first');
    });
  });

  it('types the bindings after the inputs and the events of the component and of each directive', () => {
    const check = () => {
      // A native event gets the type its map declares, a literal value is kept for an input typed as a union of literals
      createComponent(Card, { target: document.body, properties: [{ mode: () => 'compact' }], events: [{ click: event => event.clientX }] });
      // @ts-expect-error a computed signal is not an input
      createComponent(Card, { target: document.body, properties: [{ double: () => 1 }] });
      // @ts-expect-error the value of an input has its type
      createComponent(Card, { target: document.body, properties: [{ count: () => 'one' }] });
      // @ts-expect-error the detail of an event is the value of its output
      createComponent(Card, { target: document.body, events: [{ changed: event => event.detail.toUpperCase() }] });
      // @ts-expect-error an input is not an event
      createComponent(Card, { target: document.body, events: [{ heading: () => 'x' }] });
      // @ts-expect-error the value of a directive input has its type
      createComponent(Card, { target: document.body, directives: [{ directive: Tooltip, properties: [{ text: () => 1 }] }] });
      // @ts-expect-error the detail of a directive event is the value of its output
      createComponent(Card, { target: document.body, directives: [{ directive: Tooltip, events: [{ toggled: event => event.detail.toUpperCase() }] }] });
    };

    expect(check).toBeTypeOf('function');
  });
});
