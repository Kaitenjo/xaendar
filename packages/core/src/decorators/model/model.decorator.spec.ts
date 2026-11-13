import type { AccessorDecorator, Function } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { INTERNAL_ALIAS_TO_ATTRIBUTE, INTERNAL_REQUIRED_INPUTS } from '../../costants';
import type { Aliased } from '../../signals/types/aliased.type';
import type { InputSignal } from '../../signals/types/input-signal.type';
import type { ModelSignal } from '../../signals/types/model-signal.type';
import type { EventHost } from '../../types/event/event-host.type';
import type { ModelDecoratorOptions } from '../../types/model/model-decorator-options.type';
import type { PropertyDecoratorReturnType } from '../../types/property/property-return-type.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { Model } = await import('./model.decorator');
const { isModelSignal } = await import('../../signals/model/model-instance.symbol');

type Metadata = { [INTERNAL_ALIAS_TO_ATTRIBUTE]?: Record<string, string>, [INTERNAL_REQUIRED_INPUTS]?: Set<string> };
type Decorated<Value> = { init(this: unknown): ModelSignal<Value>, set(this: unknown, value: unknown): void };
type Host = { events: CustomEvent[], dispatchEvent(event: CustomEvent): boolean } & Record<string, unknown>;

/**
 * A host recording the events dispatched on it.
 */
function createHost(): Host {
  const events = new Array<CustomEvent>();
  return { events, dispatchEvent: (event: CustomEvent) => events.push(event) > 0 };
}

/**
 * Applies `@Model` to an accessor, with a getter returning the model `init` creates for the host.
 */
function setup<Value>(value?: Value, options?: ModelDecoratorOptions<Value>, name: string | symbol = 'value', metadata: Metadata = {}, required = false): Decorated<Value> & { host: Host, model: () => ModelSignal<Value> } {
  const host = createHost();
  let stored: ModelSignal<Value> | undefined;
  const decorator = required
    ? Model.required<Value, never>(options as ModelDecoratorOptions<Value, never>)
    : Model<ModelSignal<Value>, Value, never>(value, options as ModelDecoratorOptions<Value, never>);
  const decorated = decorator({ get: () => stored!, set: vi.fn() } as unknown as Parameters<typeof decorator>[0], { name, metadata } as unknown as Parameters<typeof decorator>[1]) as unknown as Decorated<Value>;

  return {
    host,
    init: decorated.init,
    set: decorated.set,
    model: () => stored ??= decorated.init.call(host)
  };
}

describe('Model decorator', () => {
  it('throws for symbol properties', () => {
    expect(() => setup(undefined, undefined, Symbol('value'))).toThrow('Symbol properties are not supported');
  });

  it('creates a model holding the default value, one per instance', () => {
    const decorated = setup(1);
    const first = decorated.init.call(createHost());
    const second = decorated.init.call(createHost());

    expect(isModelSignal(first)).toBe(true);
    expect(first).not.toBe(second);
    first.set(2);
    expect([first(), second()]).toEqual([2, 1]);
  });

  it('registers the model as an input, by its name or by its alias', () => {
    const metadata: Metadata = {};
    setup(0, undefined, 'value', metadata);
    setup(false, { alias: 'on' }, 'checked', metadata);

    expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ value: 'value', on: 'checked' });
    expect(metadata[INTERNAL_REQUIRED_INPUTS]).toBeUndefined();
  });

  it('dispatches the event of change named after the model, or after its alias, on the host', () => {
    const plain = setup(0);
    plain.model().set(1);
    const aliased = setup(false, { alias: 'on' }, 'checked');
    aliased.model().set(true);

    expect(plain.host.events.map(event => [event.type, event.detail])).toEqual([['valueChange', 1]]);
    expect(aliased.host.events.map(event => [event.type, event.detail])).toEqual([['onChange', true]]);
  });

  it('dispatches the event of change with the options of the decorator', () => {
    const decorated = setup(0, { event: { bubbles: true, composed: true } });
    decorated.model().set(1);

    expect([decorated.host.events[0].bubbles, decorated.host.events[0].composed]).toEqual([true, true]);
  });

  it('compares the values with the equality of the decorator', () => {
    const decorated = setup({ id: 1 }, { equals: (previous: { id: number }, next: { id: number }) => previous.id === next.id });
    decorated.model().set({ id: 1 });
    decorated.model().set({ id: 2 });

    expect(decorated.host.events.map(event => event.detail)).toEqual([{ id: 2 }]);
  });

  it('writes a value assigned to the element quietly', () => {
    const decorated = setup(0);
    const value = decorated.model();
    decorated.set.call(decorated.host, 5);

    expect(value()).toBe(5);
    expect(decorated.host.events).toEqual([]);
  });

  it('writes the value assigned before the upgrade into the model quietly, removing the own property', () => {
    const decorated = setup(0);
    decorated.host.value = 7;
    const value = decorated.model();

    expect(value()).toBe(7);
    expect(Object.hasOwn(decorated.host, 'value')).toBe(false);
    expect(decorated.host.events).toEqual([]);
  });

  describe('required', () => {
    it('creates a model without value, registered as required', () => {
      const metadata: Metadata = {};
      const decorated = setup<string>(undefined, { alias: 'name' }, 'label', metadata, true);

      expect(decorated.model()()).toBeUndefined();
      expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ name: 'label' });
      expect(metadata[INTERNAL_REQUIRED_INPUTS]).toEqual(new Set(['label']));
    });

    it('dispatches the event of change named after its alias', () => {
      const decorated = setup<string>(undefined, { alias: 'name' }, 'label', {}, true);
      decorated.model().set('a');

      expect(decorated.host.events.map(event => event.type)).toEqual(['nameChange']);
    });
  });
});

describe('types of @Model', () => {
  /**
   * The decorator of an accessor of a type: assigning a decorator to it checks it as TypeScript checks a decorator applied to the accessor.
   */
  type DecoratorOf<Value> = Function<Parameters<AccessorDecorator<EventHost, Value, WebComponentMetadata>>, PropertyDecoratorReturnType<EventHost, Value, never>>;

  it('requires the type of the accessor to be a model declaring the alias', () => {
    const check = () => {
      const plain: DecoratorOf<ModelSignal<number>> = Model(0);
      const aliased: DecoratorOf<Aliased<ModelSignal<boolean>, 'on'>> = Model(false, { alias: 'on' });
      const required: DecoratorOf<Aliased<ModelSignal<string>, 'name'>> = Model.required({ alias: 'name' });
      const options: DecoratorOf<ModelSignal<number>> = Model(0, { equals: Object.is, event: { bubbles: true } });
      // @ts-expect-error a model is not a plain input
      const input: DecoratorOf<InputSignal<number>> = Model(0);
      // @ts-expect-error the type of the accessor does not declare the alias
      const undeclared: DecoratorOf<ModelSignal<number>> = Model(0, { alias: 'other' });
      // @ts-expect-error the type of the accessor declares an alias @Model.required does not
      const missingRequired: DecoratorOf<Aliased<ModelSignal<string>, 'one'>> = Model.required();
      // @ts-expect-error a model has no transform
      const transformed: DecoratorOf<ModelSignal<number>> = Model(0, { transform: (value: string) => Number(value) });
      return [plain, aliased, required, options, input, undeclared, missingRequired, transformed];
    };

    expect(check).toBeTypeOf('function');
  });
});
