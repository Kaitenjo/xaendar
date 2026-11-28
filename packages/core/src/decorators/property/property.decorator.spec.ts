import type { AccessorDecorator, Function } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { INITIALIZE, INTERNAL_ALIAS_TO_ATTRIBUTE, INTERNAL_ATTRIBUTE_INPUTS, INTERNAL_HOST_ATTRIBUTES, INTERNAL_REQUIRED_INPUTS } from '../../costants';
import type { Aliased } from '../../signals/types/aliased.type';
import type { InputSignal } from '../../signals/types/input-signal.type';
import type { BindingHost } from '../../types/binding-host.type';
import type { PropertyDecoratorOptionsWithRequired } from '../../types/property-decorator-options-with-required.type';
import type { PropertyDecoratorOptions } from '../../types/property-decorator-options.type';
import type { PropertyDecoratorReturnType } from '../../types/property/property-return-type.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { Property } = await import('../property/property.decorator');
const { isInputSignal } = await import('../../signals/input/input-instance.symbol');
const { INPUT_SIGNAL_SET_SYMBOL } = await import('../../signals/input/input-set.symbol');
const { StructuralDirective } = await import('../../models/structural-directive/structural-directive');

type Metadata = { [INTERNAL_ALIAS_TO_ATTRIBUTE]?: Record<string, string>, [INTERNAL_REQUIRED_INPUTS]?: Set<string> };
type Decorated<ActualValue, IncomingValue = ActualValue> = {
  init(this: object, value: undefined): InputSignal<ActualValue, IncomingValue> | undefined,
  get(this: object): InputSignal<ActualValue, IncomingValue>,
  set(this: object, value: unknown): void
};
type Target = { get(this: object): unknown, set: ReturnType<typeof vi.fn> };
type Accessor<ActualValue, IncomingValue = ActualValue> = {
  read: () => InputSignal<ActualValue, IncomingValue>,
  assign: (value: unknown) => void,
  originalSet: ReturnType<typeof vi.fn>
};

/**
 * The getter and the setter of an accessor, backed by a storage per instance, as the private field of a real accessor.
 */
function createTarget(): Target {
  const storage = new WeakMap<object, unknown>();
  return {
    get(this: object) {
      return storage.get(this);
    },
    set: vi.fn(function (this: object, value: unknown) {
      storage.set(this, value);
    })
  };
}

/**
 * Applies a decorator to the accessor of the given name, whose context reads the accessor through the decorated getter.
 */
function apply<ActualValue, IncomingValue>(decorator: unknown, name: string | symbol, metadata: Metadata, target = createTarget()): Decorated<ActualValue, IncomingValue> {
  const access = { get: (object: object) => decorated.get.call(object) };
  const decorated = (decorator as (target: Target, context: unknown) => Decorated<ActualValue, IncomingValue>)(target, { name, metadata, access });
  return decorated;
}

function setup<ActualValue = unknown, IncomingValue = ActualValue>(
  value?: ActualValue,
  options?: PropertyDecoratorOptions<ActualValue, IncomingValue>,
  name: string | symbol = 'label',
  metadata: Metadata = {}
): Decorated<ActualValue, IncomingValue> {
  // The alias of the tests is a value of their own: the decorators are typed for an accessor without alias
  const decorator = Property<InputSignal<ActualValue, IncomingValue>, IncomingValue, ActualValue, never>(value, options as PropertyDecoratorOptions<ActualValue, IncomingValue, never>);
  return apply(decorator, name, metadata);
}

function setupRequired<ActualValue = unknown, IncomingValue = ActualValue>(
  options?: Omit<PropertyDecoratorOptionsWithRequired<ActualValue, IncomingValue>, 'required'>,
  name: string | symbol = 'label',
  metadata: Metadata = {}
): Decorated<ActualValue, IncomingValue> {
  const decorator = Property.required<ActualValue, IncomingValue, never>(options as Omit<PropertyDecoratorOptionsWithRequired<ActualValue, IncomingValue, never>, 'required'>);
  return apply(decorator, name, metadata);
}

/*
  Decorates the accessor `label` of an element: `read` reads it, `assign` assigns it, `originalSet` is the setter of its storage.
*/
function setupAccessor<ActualValue = unknown, IncomingValue = ActualValue>(
  value?: ActualValue,
  options?: PropertyDecoratorOptions<ActualValue, IncomingValue, never>
): Accessor<ActualValue, IncomingValue> {
  const element = {};
  const target = createTarget();
  const decorator = Property<InputSignal<ActualValue, IncomingValue>, IncomingValue, ActualValue, never>(value, options);
  const decorated = apply<ActualValue, IncomingValue>(decorator, 'label', {}, target);

  return { read: () => decorated.get.call(element), assign: newValue => decorated.set.call(element, newValue), originalSet: target.set };
}

function setValue<ActualValue, IncomingValue>(signal: InputSignal<ActualValue, IncomingValue>, value: IncomingValue): void {
  if (!isInputSignal(signal)) {
    throw new Error('Expected an InputSignal');
  }

  signal.set(value, INPUT_SIGNAL_SET_SYMBOL);
}

function resetValue<ActualValue>(signal: InputSignal<ActualValue>): void {
  if (!isInputSignal(signal)) {
    throw new Error('Expected an InputSignal');
  }

  signal.reset(INPUT_SIGNAL_SET_SYMBOL);
}

/**
 * Applies a decorator reflecting its input to the accessor of the given name, as the decorators of a class do: its
 * context has the metadata the host attribute goes into and the initializers run for each instance.
 */
function reflected(decorator: unknown, name = 'label'): { metadata: WebComponentMetadata, decorated: Decorated<unknown>, initializers: Array<(this: object) => void> } {
  const metadata = {} as WebComponentMetadata;
  const initializers = new Array<(this: object) => void>();
  const access = { get: (object: object) => decorated.get.call(object) };
  const context = { kind: 'accessor', name, static: false, metadata, access, addInitializer: (initializer: (this: object) => void) => initializers.push(initializer) };
  const decorated = (decorator as (target: Target, context: unknown) => Decorated<unknown>)(createTarget(), context);
  return { metadata, decorated, initializers };
}

describe('Property decorator', () => {
  it('throws for symbol properties', () => {
    expect(() => setup(undefined, undefined, Symbol('label'))).toThrow('Symbol properties are not supported');
  });

  it('creates an input signal without default value', () => {
    expect(setup().get.call({})()).toBeUndefined();
  });

  it('creates an input signal with the default value', () => {
    expect(setup(5).get.call({})()).toBe(5);
  });

  it('creates a separate signal for each instance, the same one at every read', () => {
    const decorated = setup(1);
    const firstElement = {};
    const first = decorated.get.call(firstElement);
    const second = decorated.get.call({});
    expect(first).not.toBe(second);
    expect(decorated.get.call(firstElement)).toBe(first);

    setValue(first, 2);
    expect(first()).toBe(2);
    expect(second()).toBe(1);
  });

  it('accepts an object as default value', () => {
    const value = { a: 1 };
    expect(setup(value).get.call({})()).toBe(value);
  });

  it('registers the property name as attribute in the metadata', () => {
    const metadata: Metadata = {};
    setup(undefined, undefined, 'label', metadata);
    expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ label: 'label' });
  });

  it('registers the alias as attribute in the metadata', () => {
    const metadata: Metadata = {};
    setup('a', { alias: 'my-label' }, 'label', metadata);
    expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ 'my-label': 'label' });
  });

  it('accumulates the aliases of multiple properties in the same metadata', () => {
    const metadata: Metadata = {};
    setup(undefined, undefined, 'first', metadata);
    setup(undefined, undefined, 'second', metadata);
    expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ first: 'first', second: 'second' });
  });

  it('keeps the aliases of a subclass out of the metadata of its parent and of its siblings', () => {
    const parent: Metadata = {};
    setup(undefined, undefined, 'label', parent);
    const child: Metadata = Object.create(parent);
    const sibling: Metadata = Object.create(parent);
    setup(undefined, { alias: 'hint' }, 'text', child);
    setup(undefined, undefined, 'count', sibling);

    expect(parent[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ label: 'label' });
    expect(child[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ label: 'label', hint: 'text' });
    expect(sibling[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ label: 'label', count: 'count' });
  });

  it('registers the aliases of a subclass whose parent declares no input', () => {
    const child: Metadata = Object.create({});
    setup(undefined, undefined, 'text', child);

    expect(child[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ text: 'text' });
  });

  it('forwards the transform option', () => {
    const signal = setup<number, string>(0, { transform: Number }).get.call({});
    setValue(signal, '7');
    expect(signal()).toBe(7);
  });

  it('creates the signal of an instance only when the accessor is first read, keeping it in its storage', () => {
    const target = createTarget();
    const decorated = apply(Property(1), 'label', {}, target);
    const element = {};
    expect(decorated.init.call(element, undefined)).toBeUndefined();
    expect(target.set).not.toHaveBeenCalled();

    const signal = decorated.get.call(element);
    expect(target.set).toHaveBeenCalledOnce();
    expect(target.get.call(element)).toBe(signal);
  });

  describe('value assigned before the upgrade', () => {
    it('becomes the initial value of the input, in place of the default', () => {
      const element = { label: 7 };
      expect(setup(5).init.call(element, undefined)!()).toBe(7);
    });

    it('goes through the transform of the input', () => {
      const element = { label: '4' };
      expect(setup<number, string>(0, { transform: Number }).init.call(element, undefined)!()).toBe(4);
    });

    it('leaves the default as the value a reset goes back to', () => {
      const signal = setup(5).init.call({ label: 7 }, undefined)!;
      resetValue(signal);
      expect(signal()).toBe(5);
    });

    it('is removed from the element, so the accessor is no longer shadowed', () => {
      const element = { label: 7 };
      setup(5).init.call(element, undefined);
      expect(Object.hasOwn(element, 'label')).toBe(false);
    });

    it('is read from the name of the property, not from its alias', () => {
      const element = { label: 7, 'my-label': 9 };
      expect(setup(5, { alias: 'my-label' }).init.call(element, undefined)!()).toBe(7);
      expect(element).toEqual({ 'my-label': 9 });
    });

    it('leaves the other inputs to their default, created lazily', () => {
      const element = { other: 7 };
      const decorated = setup(5);
      expect(decorated.init.call(element, undefined)).toBeUndefined();
      expect(decorated.get.call(element)()).toBe(5);
      expect(element).toEqual({ other: 7 });
    });
  });

  describe('assignment', () => {
    it('writes the value into the input signal of the element', () => {
      const { read, assign } = setupAccessor(1);
      const signal = read();
      assign(3);
      expect(signal()).toBe(3);
    });

    it('creates the input signal on the first assignment, keeping it in the accessor', () => {
      const { read, assign, originalSet } = setupAccessor(1);
      assign(3);
      expect(originalSet).toHaveBeenCalledOnce();
      expect(read()()).toBe(3);

      assign(4);
      expect(originalSet).toHaveBeenCalledOnce();
    });

    it('applies the transform of the input', () => {
      const { read, assign } = setupAccessor<number, string>(0, { transform: Number });
      assign('7');
      expect(read()()).toBe(7);
    });

    it('notifies the readers of the input', () => {
      const { read, assign } = setupAccessor(1);
      const signal = read();
      const doubled = new Signal.Computed(() => signal() * 2);
      expect(doubled.get()).toBe(2);

      assign(4);
      expect(doubled.get()).toBe(8);
    });
  });

  describe('required', () => {
    it('creates an input signal with no default value', () => {
      expect(setupRequired().get.call({})()).toBeUndefined();
    });

    it('registers the alias in the metadata', () => {
      const metadata: Metadata = {};
      setupRequired({ alias: 'user-id' }, 'userId', metadata);
      expect(metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]).toEqual({ 'user-id': 'userId' });
    });

    it('registers the name of the property among the required inputs, an optional input registering nothing', () => {
      const metadata: Metadata = {};
      setup(undefined, undefined, 'optional', metadata);
      expect(metadata[INTERNAL_REQUIRED_INPUTS]).toBeUndefined();

      setupRequired({ alias: 'user-id' }, 'userId', metadata);
      setupRequired(undefined, 'name', metadata);
      expect(metadata[INTERNAL_REQUIRED_INPUTS]).toEqual(new Set(['userId', 'name']));
    });

    it('keeps the required inputs of a subclass out of the metadata of its parent, an accessor declared again as optional no longer required', () => {
      const parent: Metadata = {};
      setupRequired(undefined, 'name', parent);
      setupRequired(undefined, 'kind', parent);
      const child: Metadata = Object.create(parent);
      setup(undefined, undefined, 'name', child);
      setupRequired(undefined, 'extra', child);

      expect(parent[INTERNAL_REQUIRED_INPUTS]).toEqual(new Set(['name', 'kind']));
      expect(child[INTERNAL_REQUIRED_INPUTS]).toEqual(new Set(['kind', 'extra']));
    });

    it('forwards the transform option', () => {
      const signal = setupRequired<number, string>({ transform: Number }).get.call({});
      setValue(signal, '3');
      expect(signal()).toBe(3);
    });
  });
});

describe('types of @Property', () => {
  /**
   * The decorator of an accessor of a type: assigning a decorator to it checks it as TypeScript checks a decorator applied to the accessor.
   */
  type DecoratorOf<Value> = Function<Parameters<AccessorDecorator<BindingHost, Value, WebComponentMetadata>>, PropertyDecoratorReturnType<BindingHost, Value, never>>;

  it('requires the type of the accessor to declare the alias and the type the transform takes', () => {
    const check = () => {
      const aliased: DecoratorOf<Aliased<InputSignal<string>, 'user-id'>> = Property('', { alias: 'user-id' });
      const transformed: DecoratorOf<Aliased<InputSignal<number, string>, 'size'>> = Property(0, { alias: 'size', transform: (value: string) => Number(value) });
      const required: DecoratorOf<Aliased<InputSignal<string>, 'name'>> = Property.required({ alias: 'name' });
      // @ts-expect-error the type of the accessor does not declare the alias
      const undeclared: DecoratorOf<InputSignal<string>> = Property('', { alias: 'other' });
      // @ts-expect-error the type of the accessor declares another alias
      const different: DecoratorOf<Aliased<InputSignal<string>, 'one'>> = Property('', { alias: 'other' });
      // @ts-expect-error the type of the accessor declares an alias the decorator does not
      const missing: DecoratorOf<Aliased<InputSignal<string>, 'one'>> = Property('');
      // @ts-expect-error the type of the accessor declares an alias @Property.required does not
      const missingRequired: DecoratorOf<Aliased<InputSignal<string>, 'one'>> = Property.required();
      // @ts-expect-error the type of the accessor does not declare the type the transform takes
      const untransformed: DecoratorOf<InputSignal<number>> = Property(0, { transform: (value: string) => Number(value) });
      return [aliased, transformed, required, undeclared, different, missing, missingRequired, untransformed];
    };

    expect(check).toBeTypeOf('function');
  });
  describe('reflect', () => {
    it('reflects the input on the attribute of its name in kebab-case, read through the accessor', () => {
      const { metadata, decorated } = reflected(Property(false, { reflect: true }), 'showValue');
      const element = {};
      const [binding] = metadata[INTERNAL_HOST_ATTRIBUTES]!;

      expect(binding).toEqual({ name: 'show-value', kind: 'attribute', read: expect.any(Function) });
      expect(binding.read(element as never)).toBe(decorated.get.call(element));
    });

    it('reflects the input on its alias, or on the attribute it names', () => {
      const aliased = Property<InputSignal<string>, string, string, never>('', { alias: 'userId', reflect: true } as unknown as PropertyDecoratorOptions<string, string, never>);
      const named = Property(0, { reflect: 'data-size' });

      expect(reflected(aliased).metadata[INTERNAL_HOST_ATTRIBUTES]![0].name).toBe('user-id');
      expect(reflected(named).metadata[INTERNAL_HOST_ATTRIBUTES]![0].name).toBe('data-size');
    });

    it('reflects a required input', () => {
      expect(reflected(Property.required({ reflect: true }), 'level').metadata[INTERNAL_HOST_ATTRIBUTES]![0].name).toBe('level');
    });

    it('declares no host attribute without reflect', () => {
      expect(reflected(Property(false, { reflect: false })).metadata[INTERNAL_HOST_ATTRIBUTES]).toBeUndefined();
    });

    it('rejects the classes and the style, which @HostAttribute binds, and the attributes the browser runs', () => {
      for (const name of ['class', 'style', 'class.on', 'style.width.px']) {
        expect(() => reflected(Property(false, { reflect: name }))).toThrow(`@Property on label reflects the input on "${name}": reflect names an attribute, while the classes and the style are bound with @HostAttribute`);
      }

      expect(() => reflected(Property('', { reflect: 'onclick' }))).toThrow('@HostAttribute(\'onclick\') writes code the browser runs');
    });

    it('rejects a structural directive, which holds no element, once an instance is created', () => {
      class Gate extends StructuralDirective {
        public shouldRender(): boolean {
          return true;
        }
      }
      const { initializers } = reflected(Property(false, { reflect: true }), 'open');

      expect(() => initializers[0].call(new Gate())).toThrow('@Property on open of Gate reflects the input on "open": a structural directive holds no element to write the attribute on');
      expect(() => initializers[0].call({})).not.toThrow();
    });
  });
  describe('attribute', () => {
    it('registers the input under the attribute named after it, its alias, or the string given, marking the reflected one', () => {
      const deduced = reflected(Property(false, { attribute: true, reflect: true }), 'showValue').metadata[INTERNAL_ATTRIBUTE_INPUTS];
      const aliased = reflected(Property<InputSignal<number>, number, number, never>(0, { alias: 'userSize', attribute: true, reflect: 'other' } as unknown as PropertyDecoratorOptions<number, number, never>), 'size').metadata[INTERNAL_ATTRIBUTE_INPUTS];
      const named = reflected(Property('', { attribute: 'data-label' })).metadata[INTERNAL_ATTRIBUTE_INPUTS];

      expect(deduced).toEqual({ 'show-value': { property: 'showValue', convert: expect.any(Function), reflects: true } });
      expect(aliased).toEqual({ 'user-size': { property: 'size', convert: expect.any(Function), reflects: false } });
      expect(named).toEqual({ 'data-label': { property: 'label', convert: expect.any(Function), reflects: false } });
    });

    it('takes the conversion of a required input or of an input with a transform from the function given', () => {
      const convert = (value: string) => value.length;
      const required = reflected(Property.required({ attribute: convert }), 'level').metadata[INTERNAL_ATTRIBUTE_INPUTS];
      const transformed = reflected(Property<InputSignal<number, string>>(0, { attribute: (value: string) => value, transform: (value: string) => Number(value) })).metadata[INTERNAL_ATTRIBUTE_INPUTS];

      expect(required!.level!.convert).toBe(convert);
      expect(transformed!.label!.convert('7')).toBe('7');
      expect(() => reflected(Property.required({ attribute: true }), 'level')).toThrow('@Property on level is written by the attribute "level", whose text cannot be converted');
    });

    it('rejects the classes and the style', () => {
      expect(() => reflected(Property('', { attribute: 'class' }))).toThrow('@Property on label is written by the attribute "class": the classes and the style are not the attribute of an input');
    });

    it('rejects a directive, which hears no attribute, once an instance is created', () => {
      const { initializers } = reflected(Property(0, { attribute: true }), 'size');
      class Tint { }

      expect(() => initializers[0].call(new Tint())).toThrow('@Property on size of Tint is written by the attribute "size": only a component hears its attributes, while the inputs of a directive are bound by the templates');
      expect(() => initializers[0].call({ [INITIALIZE]: () => undefined })).not.toThrow();
    });
  });
});
