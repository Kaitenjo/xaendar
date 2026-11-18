import type { Constructor, Dictionary } from '@xaendar/types';
import { DIRECTIVE_ORDER, INTERNAL_ALIAS_TO_ATTRIBUTE, INTERNAL_EVENTS, INTERNAL_HOST_DIRECTIVES, SET_DIRECTIVE_ELEMENT, SET_DIRECTIVE_EVENTS } from '../../costants';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import type { SettableInputSignal } from '../../signals/types/settable-input-signal.type';
import type { ExposedInput } from '../../types/web-component/exposed-input.type';
import type { Exposure } from '../../types/web-component/exposure.type';
import type { HostDirectiveMember } from '../../types/web-component/host-directive-member.type';
import type { HostDirectiveOptions } from '../../types/web-component/host-directive-options.type';
import type { HostDirectives } from '../../types/web-component/host-directives.type';
import type { ResolvedHostDirective } from '../../types/web-component/resolved-host-directive.type';
import type { ResolvedHostDirectives } from '../../types/web-component/resolved-host-directives.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';

/**
 * The key the decorators keep the metadata of a class under (see `getWebComponentMetadata`).
 */
const METADATA_KEY = Symbol.for('Symbol.metadata');

/**
 * Shared empty array whose iterators the methods of `EMPTY_MAP` return.
 */
const NO_ENTRIES = new Array<unknown>();

/**
 * Shared fallback object to access hostDirectives property in Custom Element
 * without creating an empty map for every single CustomElement instance
 */
const EMPTY_MAP = {
  forEach(_: (value: unknown, key: unknown, map: ReadonlyMap<unknown, unknown>) => void, __?: unknown): void { },
  get(_: unknown) {
    return undefined;
  },
  has(_: unknown) {
    return false;
  },
  keys() {
    return NO_ENTRIES[Symbol.iterator]();
  },
  values() {
    return NO_ENTRIES[Symbol.iterator]();
  },
  entries() {
    return NO_ENTRIES[Symbol.iterator]();
  },
  [Symbol.iterator]() {
    return this.entries();
  },
  size: 0
};

/**
 * The events of a host directive whose component exposes none of them, shared by all of them.
 */
const NO_EVENTS: ReadonlyMap<string, string> = new Map();

/**
 * The host directives of a class neither declaring nor inheriting any.
 */
const NO_HOST_DIRECTIVES: ResolvedHostDirectives = Object.freeze({ directives: Object.freeze([]), inputs: null });

/**
 * The host directives of the component classes, resolved once per class (see {@link _resolveHostDirectives}).
 */
const RESOLVED = new WeakMap<object, ResolvedHostDirectives>();

/**
 * The descriptors of the accessors exposing the inputs of the host directives on the prototypes of their components, by
 * class of directive and name of the property of the input (see {@link getExposedAccessor}).
 */
const EXPOSED_ACCESSORS = new WeakMap<Constructor<CustomDirective>, Map<string, PropertyDescriptor>>();

/**
 * The values the templates bound to the exposed inputs of an element whose class was not defined yet, by the name the
 * inputs are exposed with: the element takes them when it is constructed (see {@link _createHostDirectives}).
 *
 * N.B. Kept apart from the element, so that a binding before the upgrade adds no property to the element, which the
 * class would have to remove, changing its shape. Do not assign them to the element as code outside the templates does.
 */
const PENDING_INPUTS = new WeakMap<Element, Dictionary<string, unknown>>();

/**
 * Creates the host directives of a component, the ones `@WebComponent` declares on its class and on its ancestors (see
 * {@link _resolveHostDirectives}): each directive is instantiated and applied to the component element, and takes the
 * values bound to its exposed inputs before the element was upgraded, by the templates or by code outside them.
 *
 * @param element - The component the directives are applied to.
 * @returns The instances of the directives, keyed by the class of the directive, empty when the component has none.
 * @throws When the host directives of the class cannot be resolved (see {@link _resolveHostDirectives}).
 */
export function _createHostDirectives(element: CustomElement): HostDirectives {
  const { directives, inputs } = _resolveHostDirectives(element.constructor);
  if (!directives.length) {
    return EMPTY_MAP as HostDirectives;
  }

  const instances = new Map<Constructor<CustomDirective>, CustomDirective>();
  for (let i = 0; i < directives.length; i++) {
    const { directive: Directive, events } = directives[i];
    const directive = new Directive();
    directive[SET_DIRECTIVE_ELEMENT] = element;
    directive[DIRECTIVE_ORDER] = i;
    directive[SET_DIRECTIVE_EVENTS] = events;
    instances.set(Directive, directive);
  }

  if (inputs) {
    restorePreUpgradeInputs(element, instances, inputs);
  }

  return instances as unknown as HostDirectives;
}

/**
 * Resolves the host directives of a component class, once per class: the ones `@WebComponent` declares on its
 * ancestors first, then the ones of the class, the inputs and the events they expose checked as if the classes of the
 * chain and their host directives were one. Each input the class exposes gets an accessor on its prototype, so that code
 * outside the templates sets it as an input of the component: its getter returns the input signal of the directive,
 * created only when read, and its setter writes into it.
 *
 * @param klass - The class of the component, or of a directive, which has none.
 * @returns The host directives of the class.
 * @throws When a directive is declared twice along the chain, when a directive does not declare an input or an event it
 *   exposes, when an input is exposed with the name of an input or of a member of the component or of an input another
 *   host directive exposes, or an event with the name of an event of the component or of an event another host
 *   directive exposes.
 */
export function _resolveHostDirectives(klass: object): ResolvedHostDirectives {
  let resolved = RESOLVED.get(klass);
  if (!resolved) {
    resolved = computeHostDirectives(klass);
    RESOLVED.set(klass, resolved);
  }

  return resolved;
}

/**
 * Gets the input signal of a host directive of a component exposed under a name, created then if it was not yet.
 *
 * @param element - The component, constructed.
 * @param name - The name the input is exposed with.
 * @returns The input signal.
 */
export function _exposedInputOf(element: CustomElement, name: string): SettableInputSignal {
  return inputOf(element.hostDirectives as unknown as ReadonlyMap<Constructor<CustomDirective>, CustomDirective>, _resolveHostDirectives(element.constructor).inputs![name]!);
}

/**
 * Keeps the value a template binds to an exposed input of an element whose class is not defined yet, until the element is
 * constructed (see {@link PENDING_INPUTS}).
 *
 * @param element - The element, not upgraded yet.
 * @param name - The name the input is exposed with.
 * @param value - The value.
 */
export function _keepPendingInput(element: Element, name: string, value: unknown): void {
  let pending = PENDING_INPUTS.get(element);
  if (!pending) {
    pending = Object.create(null) as Dictionary<string, unknown>;
    PENDING_INPUTS.set(element, pending);
  }

  pending[name] = value;
}

/**
 * Forgets the value a template bound to an exposed input of an element whose class is not defined yet, as the branch
 * binding it is no longer selected: the input keeps its default value once the element is constructed.
 *
 * @param element - The element, not upgraded yet.
 * @param name - The name the input is exposed with.
 */
export function _dropPendingInput(element: Element, name: string): void {
  const pending = PENDING_INPUTS.get(element);
  if (pending) {
    delete pending[name];
  }
}

/**
 * Computes the host directives of {@link _resolveHostDirectives}: the ones of the parent class, resolved first, followed
 * by the ones the class declares itself, if any.
 *
 * @param klass - The class.
 * @returns The host directives of the class.
 * @throws See {@link _resolveHostDirectives}.
 */
function computeHostDirectives(klass: object): ResolvedHostDirectives {
  const parent = Object.getPrototypeOf(klass) as object | null;
  const inherited = parent && parent !== Function.prototype ? _resolveHostDirectives(parent) : NO_HOST_DIRECTIVES;
  // Only the metadata of the class itself: an undecorated class reads the one of its parent through its prototype
  const metadata = Object.hasOwn(klass, METADATA_KEY) ? getWebComponentMetadata(klass) : undefined;
  const declarations = metadata && Object.hasOwn(metadata, INTERNAL_HOST_DIRECTIVES) ? metadata[INTERNAL_HOST_DIRECTIVES] : undefined;
  if (!inherited.directives.length && !declarations?.length) {
    return NO_HOST_DIRECTIVES;
  }

  const className = (klass as { name: string }).name;
  const prototype = (klass as { prototype: object }).prototype;
  // The inputs, the events and the members of the class are checked against every exposure of the chain
  checkInherited(inherited, className, metadata, prototype);
  if (!declarations?.length) {
    return inherited;
  }

  const directives = inherited.directives.slice();
  let inputs = inherited.inputs ? Object.assign(Object.create(null) as Dictionary<string, ExposedInput>, inherited.inputs) : null;
  for (let i = 0; i < declarations.length; i++) {
    const declaration = declarations[i];
    const { directive: Directive, properties, events }: HostDirectiveOptions = typeof declaration === 'function' ? { directive: declaration } : declaration;
    if (directives.some(resolved => resolved.directive === Directive)) {
      throw new Error(`${className} declares the host directive ${Directive.name} more than once`);
    }

    directives.push({ directive: Directive, events: resolveEvents(Directive, events, className, metadata, directives) });
    if (properties?.length) {
      inputs = exposeInputs(Directive, properties, className, metadata, prototype, inputs);
    }
  }

  return { directives, inputs };
}

/**
 * Checks the exposures inherited from the ancestors against the inputs and the events of the class, which the
 * ancestors did not know, and against the members the class declares itself, which would hide their accessors.
 *
 * @param inherited - The host directives of the parent class.
 * @param className - The name of the class.
 * @param metadata - The metadata of the class itself, `undefined` for an undecorated one.
 * @param prototype - The prototype of the class.
 * @throws When an exposure of an ancestor has the name of an input, of an event or of a member of the class.
 */
function checkInherited({ directives, inputs }: ResolvedHostDirectives, className: string, metadata: WebComponentMetadata | undefined, prototype: object): void {
  if (inputs) {
    const componentInputs = metadata?.[INTERNAL_ALIAS_TO_ATTRIBUTE];
    for (const name in inputs) {
      if (componentInputs?.[name]) {
        throw new Error(`${className} already has an input named "${name}", which ${inputs[name]!.directive.name} cannot expose`);
      }

      if (Object.hasOwn(prototype, name)) {
        throw new Error(`${className} already has a member named "${name}", which ${inputs[name]!.directive.name} cannot expose as an input`);
      }
    }
  }

  const componentEvents = metadata?.[INTERNAL_EVENTS];
  if (componentEvents?.size) {
    for (let i = 0; i < directives.length; i++) {
      for (const [, alias] of directives[i].events) {
        if (componentEvents.has(alias)) {
          throw new Error(`${className} already has an event named "${alias}", which ${directives[i].directive.name} cannot expose`);
        }
      }
    }
  }
}

/**
 * Collects the events of a host directive its component exposes: its outputs and the events of change of its models,
 * found in the metadata of the directive, not read, so that no output nor model is created.
 *
 * @param Directive - The class of the host directive.
 * @param members - The events to expose, see {@link HostDirectiveOptions.events}.
 * @param className - The name of the class of the component.
 * @param metadata - The metadata of the class of the component.
 * @param directives - The host directives resolved so far, whose exposed events the names are checked against.
 * @returns A map from the name of the event the directive dispatches to the name it is dispatched with on the component.
 * @throws When the directive does not declare an event it exposes, or when an event is exposed with the name of an event
 *   of the component or of an event another host directive exposes.
 */
function resolveEvents(Directive: Constructor<CustomDirective>, members: HostDirectiveMember[] | undefined, className: string, metadata: WebComponentMetadata | undefined, directives: readonly ResolvedHostDirective[]): ReadonlyMap<string, string> {
  if (!members?.length) {
    return NO_EVENTS;
  }

  const declared = getWebComponentMetadata(Directive)?.[INTERNAL_EVENTS];
  const events = new Map<string, string>();
  for (let i = 0; i < members.length; i++) {
    const { name, alias } = toExposure(members[i]);
    if (!declared?.has(name)) {
      throw new Error(`${Directive.name} does not declare an event named "${name}"`);
    }

    if (metadata?.[INTERNAL_EVENTS]?.has(alias) || isExposedEvent(directives, alias)) {
      throw new Error(`${className} already has an event named "${alias}", which ${Directive.name} cannot expose`);
    }

    events.set(name, alias);
  }

  return events;
}

/**
 * Tells whether another host directive exposes an event under a name.
 *
 * @param directives - The host directives resolved so far.
 * @param alias - The name.
 * @returns `true` when one of them exposes an event under the name.
 */
function isExposedEvent(directives: readonly ResolvedHostDirective[], alias: string): boolean {
  for (let i = 0; i < directives.length; i++) {
    for (const [, exposed] of directives[i].events) {
      if (exposed === alias) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Exposes the inputs of a host directive on its component: each one gets an accessor on the prototype of the class
 * (see {@link getExposedAccessor}). The inputs are found in the metadata of the directive, by the name they are bound
 * with (the alias, when they declare one), and not read, so that their signals are created only when something reads
 * them.
 *
 * @param Directive - The class of the host directive.
 * @param members - The inputs to expose, see {@link HostDirectiveOptions.properties}.
 * @param className - The name of the class of the component.
 * @param metadata - The metadata of the class of the component.
 * @param prototype - The prototype of the class of the component, which the accessors are defined on.
 * @param inputs - The inputs exposed so far, by the name they are exposed with, `null` for none.
 * @returns The inputs exposed so far, the ones of the directive added.
 * @throws When the directive does not declare an input it exposes, or when an input is exposed with the name of an input
 *   or of a member of the component, or of an input another host directive exposes.
 */
function exposeInputs(Directive: Constructor<CustomDirective>, members: HostDirectiveMember[], className: string, metadata: WebComponentMetadata | undefined, prototype: object, inputs: Dictionary<string, ExposedInput> | null): Dictionary<string, ExposedInput> {
  const aliasToAttribute = getWebComponentMetadata(Directive)?.[INTERNAL_ALIAS_TO_ATTRIBUTE];
  const exposed = inputs ?? Object.create(null) as Dictionary<string, ExposedInput>;
  for (let i = 0; i < members.length; i++) {
    const { name, alias } = toExposure(members[i]);
    const property = aliasToAttribute?.[name];
    if (!property) {
      throw new Error(`${Directive.name} does not declare an input named "${name}"`);
    }

    if (metadata?.[INTERNAL_ALIAS_TO_ATTRIBUTE]?.[alias] || exposed[alias]) {
      throw new Error(`${className} already has an input named "${alias}", which ${Directive.name} cannot expose`);
    }

    // A member of the class, of an ancestor or of `HTMLElement` would be hidden by the accessor, or hide it
    if (alias in prototype) {
      throw new Error(`${className} already has a member named "${alias}", which ${Directive.name} cannot expose as an input`);
    }

    Object.defineProperty(prototype, alias, getExposedAccessor(Directive, property));
    exposed[alias] = { directive: Directive, property };
  }

  return exposed;
}

/**
 * Gets the descriptor of the accessor exposing an input of a host directive on the prototype of a component: its getter
 * returns the input signal of the instance of the directive applied to the element, created then if it was not yet, and
 * its setter writes into it, as the setter of an input of the component does.
 *
 * N.B. One descriptor per class of directive and input, shared by every component exposing it, so that exposing an input
 * creates neither its signal nor a function per component, and nothing per element. Do not define the accessor on the
 * element, nor read the input while exposing it.
 *
 * @param Directive - The class of the host directive.
 * @param property - The name of the property of the input.
 * @returns The descriptor.
 */
function getExposedAccessor(Directive: Constructor<CustomDirective>, property: string): PropertyDescriptor {
  let accessors = EXPOSED_ACCESSORS.get(Directive);
  if (!accessors) {
    accessors = new Map();
    EXPOSED_ACCESSORS.set(Directive, accessors);
  }

  let accessor = accessors.get(property);
  if (!accessor) {
    accessor = createExposedAccessor(Directive, property);
    accessors.set(property, accessor);
  }

  return accessor;
}

/**
 * Creates the descriptor of {@link getExposedAccessor}.
 *
 * @param Directive - The class of the host directive.
 * @param property - The name of the property of the input.
 * @returns The descriptor.
 */
function createExposedAccessor(Directive: Constructor<CustomDirective>, property: string): PropertyDescriptor {
  const input: ExposedInput = { directive: Directive, property };
  return {
    configurable: true,
    get(this: CustomElement): SettableInputSignal {
      return inputOf(this.hostDirectives as unknown as ReadonlyMap<Constructor<CustomDirective>, CustomDirective>, input);
    },
    set(this: CustomElement, value: unknown): void {
      inputOf(this.hostDirectives as unknown as ReadonlyMap<Constructor<CustomDirective>, CustomDirective>, input).set(value, INPUT_SIGNAL_SET_SYMBOL);
    }
  };
}

/**
 * Writes into the exposed inputs of a component the values bound before it was upgraded: the ones code outside the
 * templates assigned to the element, own properties hiding the accessors of the prototype, removed, then the ones the
 * templates kept apart (see {@link PENDING_INPUTS}).
 *
 * @param element - The component, being constructed.
 * @param instances - The instances of its host directives.
 * @param inputs - The inputs it exposes.
 */
function restorePreUpgradeInputs(element: CustomElement, instances: ReadonlyMap<Constructor<CustomDirective>, CustomDirective>, inputs: Readonly<Dictionary<string, ExposedInput>>): void {
  const properties = element as unknown as Record<string, unknown>;
  for (const name in inputs) {
    if (Object.hasOwn(element, name)) {
      const value = properties[name];
      delete properties[name];
      inputOf(instances, inputs[name]!).set(value, INPUT_SIGNAL_SET_SYMBOL);
    }
  }

  const pending = PENDING_INPUTS.get(element);
  if (pending) {
    PENDING_INPUTS.delete(element);
    for (const name in pending) {
      inputOf(instances, inputs[name]!).set(pending[name], INPUT_SIGNAL_SET_SYMBOL);
    }
  }
}

/**
 * Gets an exposed input of a host directive, created then if it was not yet.
 *
 * @param instances - The host directives of the component.
 * @param input - The exposed input.
 * @returns The input signal.
 */
function inputOf(instances: ReadonlyMap<Constructor<CustomDirective>, CustomDirective>, { directive, property }: ExposedInput): SettableInputSignal {
  return instances.get(directive)![property] as SettableInputSignal;
}

/**
 * Gets the name a member of a host directive is exposed with: a member given by its name only is exposed with it.
 *
 * @param member - The member, see {@link HostDirectiveOptions}.
 * @returns The name in the directive and the name it is exposed with.
 */
function toExposure(member: HostDirectiveMember): Exposure {
  return typeof member === 'string' ? { name: member, alias: member } : member;
}
