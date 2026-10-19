// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { CustomElement as HostElement } from '../../models/custom-element/custom-element';
import type { HostDirectiveOptions } from '../../types/web-component/host-directive-options.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { CustomDirective } = await import('../../models/custom-directive/custom-directive');
const { CustomElement } = await import('../../models/custom-element/custom-element');
const { Output } = await import('../../models/output/output');
const { input } = await import('../../signals/input/input');
const { _Context } = await import('../context/context.util');
const { _setProperty } = await import('../render-element/render-element.util');

/**
 * Directive declaring an input, aliased, and two outputs.
 */
class TooltipDirective extends CustomDirective {
  public readonly text = input<string>('');
  public readonly position = input<string>('top');
  public readonly opened = new Output<unknown>((detail?: unknown) => this.dispatchEvent(new CustomEvent('opened', { detail, bubbles: true })));
  public readonly closed = new Output(() => this.dispatchEvent(new CustomEvent('closed')));
  public readonly fake = { emit: () => undefined };
}

Object.defineProperty(TooltipDirective, Symbol.for('Symbol.metadata'), { value: { aliasToAttribute: { pos: 'position' } } });

/**
 * Directive declaring an input named like one of the tooltip.
 */
class LabelDirective extends CustomDirective {
  public readonly text = input<string>('');
}

/**
 * Directive declaring nothing.
 */
class PlainDirective extends CustomDirective { }

let counter = 0;

/**
 * Builds a component whose `@WebComponent` declares the given host directives, as it would store them in its metadata.
 */
function create(hostDirectives?: Array<typeof TooltipDirective | typeof PlainDirective | HostDirectiveOptions>, componentInputs?: Record<string, string>): HostElement {
  const klass = class extends CustomElement { };
  if (hostDirectives || componentInputs) {
    Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: { hostDirectives, aliasToAttribute: componentInputs } });
  }

  const name = `x-host-${counter++}`;
  customElements.define(name, klass);

  return document.createElement(name) as HostElement;
}

describe('_createHostDirectives', () => {
  it('creates none for a component declaring none', () => {
    expect(create().hostDirectives.size).toBe(0);
    expect(create([]).hostDirectives.size).toBe(0);
  });

  it('does not inherit the host directives of the parent class, as the compiler does not see them', () => {
    const parentMetadata = { hostDirectives: [TooltipDirective] };
    const Parent = class extends CustomElement { };
    Object.defineProperty(Parent, Symbol.for('Symbol.metadata'), { value: parentMetadata });
    const Child = class extends Parent { };
    // The metadata of a decorated subclass has the one of its parent as prototype
    Object.defineProperty(Child, Symbol.for('Symbol.metadata'), { value: Object.create(parentMetadata) });
    const name = `x-host-${counter++}`;
    customElements.define(name, Child);

    expect((document.createElement(name) as HostElement).hostDirectives.size).toBe(0);
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

  describe('inputs', () => {
    it('does not expose any input unless asked to', () => {
      const element = create([TooltipDirective, { directive: PlainDirective, properties: [] }]) as unknown as Record<string, unknown>;

      expect(Object.hasOwn(element, 'text')).toBe(false);
    });

    it('exposes an input on the component, as the input signal of the directive', () => {
      const element = create([{ directive: TooltipDirective, properties: ['text'] }]);
      const directive = element.hostDirectives.get(TooltipDirective)!;

      expect((element as unknown as Record<string, unknown>).text).toBe(directive.text);
      expect(Object.hasOwn(element, 'position')).toBe(false);
    });

    it('exposes an input under another name', () => {
      const element = create([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }, 'position'] }]) as unknown as Record<string, unknown>;
      const directive = (element as unknown as HostElement).hostDirectives.get(TooltipDirective)!;

      expect(element.label).toBe(directive.text);
      expect(Object.hasOwn(element, 'text')).toBe(false);
      expect(element.position).toBe(directive.position);
    });

    it('reaches an input by the alias the directive declares for it', () => {
      const element = create([{ directive: TooltipDirective, properties: [{ name: 'pos', alias: 'place' }] }]) as unknown as Record<string, unknown>;

      expect(element.place).toBe((element as unknown as HostElement).hostDirectives.get(TooltipDirective)?.position);
    });

    it('binds the exposed input as the template runtime does, setting the one of the directive', () => {
      const element = create([{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'label' }] }]);
      const context = new _Context({} as never);
      _setProperty(context, element, 'label', 'hello');

      expect(element.hostDirectives.get(TooltipDirective)?.text()).toBe('hello');
    });

    it('throws when the directive does not declare the input', () => {
      expect(() => create([{ directive: TooltipDirective, properties: ['missing'] }])).toThrow('TooltipDirective does not declare an input named "missing"');
      expect(() => create([{ directive: TooltipDirective, properties: ['element'] }])).toThrow('does not declare an input named "element"');
    });

    it('throws when the name is the one of an input of the component', () => {
      expect(() => create([{ directive: TooltipDirective, properties: ['text'] }], { text: 'text' })).toThrow('already has an input named "text"');
    });

    it('throws when the name is the one of an input exposed by another host directive', () => {
      expect(() => create([{ directive: TooltipDirective, properties: ['text'] }, { directive: LabelDirective, properties: ['text'] }])).toThrow('LabelDirective cannot expose');
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
      element.hostDirectives.get(TooltipDirective)?.opened.emit();

      expect(heard).toEqual([]);
    });

    it('dispatches an exposed event on the component', () => {
      const element = create([{ directive: TooltipDirective, events: ['opened'] }]);
      const heard = listen(element);
      const directive = element.hostDirectives.get(TooltipDirective)!;
      directive.opened.emit({ id: 1 });
      directive.closed.emit();

      expect(heard).toEqual(['opened']);
    });

    it('dispatches an exposed event under another name, keeping what it carries', () => {
      const element = create([{ directive: TooltipDirective, events: [{ name: 'opened', alias: 'shown' }] }]);
      const listener = vi.fn();
      element.addEventListener('shown', listener);
      const heard = listen(element);
      element.hostDirectives.get(TooltipDirective)?.opened.emit({ id: 1 });

      expect(heard).toEqual(['shown']);
      expect(listener.mock.calls[0][0].detail).toEqual({ id: 1 });
      expect(listener.mock.calls[0][0].bubbles).toBe(true);
    });

    it('throws when the directive does not declare the event', () => {
      expect(() => create([{ directive: TooltipDirective, events: ['missing'] }])).toThrow('TooltipDirective does not declare an event named "missing"');
      expect(() => create([{ directive: TooltipDirective, events: ['text'] }])).toThrow('does not declare an event named "text"');
      expect(() => create([{ directive: TooltipDirective, events: ['fake'] }])).toThrow('does not declare an event named "fake"');
    });
  });
});
