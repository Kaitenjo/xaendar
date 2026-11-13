import { DIRECTIVE_ORDER, INTERNAL_HOST_LISTENERS, INTERNAL_HOST_PROPERTIES } from '../../costants';
import { HostStylingRun } from '../../models/host-styling-run/host-styling-run';
import { _bindEffect } from '../../signals/effect/effect';
import type { _Context } from '../../types/context.type';
import type { EventHost } from '../../types/event/event-host.type';
import type { HostPropertyBinding } from '../../types/host/host-property-binding.type';
import type { HostPropertyGroups } from '../../types/host/host-property-groups.type';
import type { StylingAttribute } from '../../types/styling/styling-attribute.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { addCleanup } from '../context/context.util';
import { applyHostStyling, registerHostStyling } from '../host-styling/host-styling.util';
import { _isKey } from '../key-event/key-event.util';
import { writeAttribute } from '../write-attribute/write-attribute.util';

/**
 * The host properties of each class split by what they write, computed once per list of the metadata of a class.
 */
const groupsCache = new WeakMap<readonly HostPropertyBinding[], HostPropertyGroups>();

/**
 * Adds a binding or a listener to the metadata of the class being decorated. The metadata of a subclass inherits from
 * the one of its parent class: the list of the parent is copied into the metadata of the class, so the bindings of the
 * parent stay and the ones of the class do not reach the parent.
 *
 * @param metadata - The metadata of the class being decorated, holding the list under `key`.
 * @param key - The key of the list.
 * @param entry - The binding or the listener to add.
 */
export function _addHostMetadata<Key extends typeof INTERNAL_HOST_PROPERTIES | typeof INTERNAL_HOST_LISTENERS, Entry>(metadata: { [K in Key]?: NoInfer<Entry>[] }, key: Key, entry: Entry): void {
  let entries = metadata[key];
  if (!entries || !Object.hasOwn(metadata, key)) {
    entries = entries ? entries.slice() : new Array<Entry>();
    metadata[key] = entries;
  }

  entries.push(entry);
}

/**
 * Binds the host element of a web component or of a custom directive as its `@HostProperty` and `@HostListener`
 * declare: each attribute is written inside an effect, so it is written again only when it reads a signal, the
 * properties of `class` and of `style` are bound as one source of each attribute (see `HostStylingRun`), merged key by
 * key with the other sources writing it, and each listener is added to the element, or to the window or the document it
 * names, the one of a key event calling the method only for its key. When the context is cleared the effects are disposed, the attributes removed, the keys of `class` and `style`
 * of the owner taken away, giving back the value of the sources below, and the listeners removed.
 *
 * @param owner - The web component or the custom directive.
 * @param element - Its host element: the component itself, or the element the directive is applied to.
 * @param context - The context the bindings live in.
 */
export function _bindHost(owner: EventHost, element: Element, context: _Context): void {
  const metadata = (owner.constructor as unknown as Record<symbol, WebComponentMetadata | undefined>)[Symbol.for('Symbol.metadata')];

  const groups = getGroups(metadata);
  if (groups) {
    const { attributes } = groups;
    if (attributes?.length) {
      for (let i = 0; i < attributes.length; i++) {
        bindProperty(owner, element, attributes[i], context);
      }
    }

    if (groups.class?.length) {
      bindStyling(owner, element, context, 'class', groups.class);
    }

    if (groups.style?.length) {
      bindStyling(owner, element, context, 'style', groups.style);
    }
  }

  const listeners = metadata?.[INTERNAL_HOST_LISTENERS];
  if (listeners?.length) {
    for (let i = 0; i < listeners.length; i++) {
      const { name, target, options, read, key } = listeners[i];
      const eventTarget: EventTarget = target ? globalThis[target] : element;
      // A key event calls the method only for its key (see `_isKey`)
      const listener = key
        ? (event: Event) => _isKey(event as KeyboardEvent, key.key, key.modifiers, key.code) && read(owner).call(owner, event)
        : (event: Event) => read(owner).call(owner, event);
      eventTarget.addEventListener(name, listener, options);
      addCleanup(context, () => eventTarget.removeEventListener(name, listener, options));
    }
  }
}

/**
 * Writes the attributes, the classes and the style properties of the host element of a web component or of a custom
 * directive as its `@HostProperty` declare, once and without binding them: what the server writes on the tag of a
 * component it renders. The keys of `class` and `style` are merged with the other sources of the element, when it has
 * a state merging them.
 *
 * @param owner - The web component or the custom directive.
 * @param element - Its host element.
 */
export function _applyHostProperties(owner: EventHost, element: Element): void {
  const metadata = (owner.constructor as unknown as Record<symbol, WebComponentMetadata | undefined>)[Symbol.for('Symbol.metadata')];
  const groups = getGroups(metadata);
  if (!groups) {
    return;
  }

  const { attributes } = groups;
  if (attributes?.length) {
    for (let i = 0; i < attributes.length; i++) {
      applyProperty(owner, element, attributes[i]);
    }
  }

  if (groups.class?.length) {
    applyHostStyling(createRun(owner, element, 'class', groups.class));
  }

  if (groups.style?.length) {
    applyHostStyling(createRun(owner, element, 'style', groups.style));
  }
}

/**
 * Gives the host properties a class declares split by what they write, computed once per class.
 *
 * @param metadata - The metadata of the class.
 * @returns The groups, `undefined` when the class declares no host property.
 */
function getGroups(metadata: WebComponentMetadata | undefined): HostPropertyGroups | undefined {
  const properties = metadata?.[INTERNAL_HOST_PROPERTIES];
  if (!properties?.length) {
    return undefined;
  }

  let groups = groupsCache.get(properties);
  if (!groups) {
    groups = {
      attributes: filterKind(properties, 'attribute'),
      class: filterKind(properties, 'class'),
      style: filterKind(properties, 'style')
    };
    groupsCache.set(properties, groups);
  }

  return groups;
}

/**
 * Gives the host properties of a kind.
 *
 * @param properties - The host properties of a class.
 * @param kind - The kind.
 * @returns The properties of the kind, `null` for none.
 */
function filterKind(properties: readonly HostPropertyBinding[], kind: HostPropertyBinding['kind']): HostPropertyBinding[] | null {
  const filtered = properties.filter(property => property.kind === kind);
  return filtered.length ? filtered : null;
}

/**
 * Binds the host properties of `class` or of `style` of an owner as one source of the attribute, registered among the
 * sources of the element, then run in an effect and disposed with the context.
 *
 * @param owner - The web component or the custom directive.
 * @param element - Its host element.
 * @param context - The context the binding lives in.
 * @param attribute - The attribute.
 * @param bindings - The host properties of the attribute.
 */
function bindStyling(owner: EventHost, element: Element, context: _Context, attribute: StylingAttribute, bindings: readonly HostPropertyBinding[]): void {
  const run = createRun(owner, element, attribute, bindings);
  registerHostStyling(run);
  _bindEffect(context, applyHostStyling, run);
  addCleanup(context, run);
}

/**
 * Creates the run of the host properties of `class` or of `style` of an owner: of the level of the component when the
 * owner is its element, of the level of the directives otherwise, with the order of the directive.
 *
 * @param owner - The web component or the custom directive.
 * @param element - Its host element.
 * @param attribute - The attribute.
 * @param bindings - The host properties of the attribute.
 * @returns The run.
 */
function createRun(owner: EventHost, element: Element, attribute: StylingAttribute, bindings: readonly HostPropertyBinding[]): HostStylingRun {
  return (owner as unknown) === element
    ? new HostStylingRun(owner, element, attribute, bindings, 2, 0)
    : new HostStylingRun(owner, element, attribute, bindings, 1, (owner as unknown as Record<symbol, number>)[DIRECTIVE_ORDER]);
}

/**
 * Binds an attribute of the host element to a member of the owner (see {@link applyProperty}).
 *
 * @param owner - The web component or the custom directive.
 * @param element - Its host element.
 * @param binding - The attribute, and how to read the member.
 * @param context - The context the binding lives in.
 */
function bindProperty(owner: EventHost, element: Element, binding: HostPropertyBinding, context: _Context): void {
  _bindEffect(context, applyProperty, owner, element, binding);
  addCleanup(context, () => writeAttribute(element, binding.name, null));
}

/**
 * Writes an attribute of the host element by the value of a member of the owner. A member holding a function, such as a
 * signal, is called to get the value.
 *
 * @param owner - The web component or the custom directive.
 * @param element - Its host element.
 * @param binding - The attribute, and how to read the member.
 */
function applyProperty(owner: EventHost, element: Element, { name, read }: HostPropertyBinding): void {
  const member = read(owner);
  writeAttribute(element, name, typeof member === 'function' ? member() : member);
}
