import { INTERNAL_HOST_EVENTS, INTERNAL_HOST_PROPERTIES } from '../../costants';
import { effect } from '../../signals/effect/effect';
import type { EventHost } from '../../types/event/event-host.type';
import type { HostPropertyBinding } from '../../types/host/host-property-binding.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { restoreToggledClasses, toggleClass, untoggleClass } from '../class-toggle/class-toggle.util';
import type { _Context } from '../context/context.util';

/**
 * Adds a binding or a listener to the metadata of the class being decorated. The metadata of a subclass inherits from
 * the one of its parent class: the list of the parent is copied into the metadata of the class, so the bindings of the
 * parent stay and the ones of the class do not reach the parent.
 *
 * @param metadata - The metadata of the class being decorated, holding the list under `key`.
 * @param key - The key of the list.
 * @param entry - The binding or the listener to add.
 */
export function _addHostMetadata<Key extends typeof INTERNAL_HOST_PROPERTIES | typeof INTERNAL_HOST_EVENTS, Entry>(metadata: { [K in Key]?: NoInfer<Entry>[] }, key: Key, entry: Entry): void {
  let entries = metadata[key];
  if (!entries || !Object.hasOwn(metadata, key)) {
    entries = entries ? entries.slice() : new Array<Entry>();
    metadata[key] = entries;
  }

  entries.push(entry);
}

/**
 * Binds the host element of a web component or of a custom directive as its `@HostProperty` and `@HostEvent` declare:
 * each attribute and class is written inside an effect, so it is written again only when it reads a signal, and each
 * listener is added to the element. When the context is cleared the effects are disposed, the attributes removed, the
 * classes taken away and the listeners removed.
 *
 * @param owner - The web component or the custom directive.
 * @param element - Its host element: the component itself, or the element the directive is applied to.
 * @param context - The context the bindings live in.
 */
export function _bindHost(owner: EventHost, element: Element, context: _Context): void {
  const metadata = (owner.constructor as unknown as Record<symbol, WebComponentMetadata | undefined>)[Symbol.for('Symbol.metadata')];

  const properties = metadata?.[INTERNAL_HOST_PROPERTIES];
  if (properties?.length) {
    for (let i = 0; i < properties.length; i++) {
      bindProperty(owner, element, properties[i], context);
    }
  }

  const events = metadata?.[INTERNAL_HOST_EVENTS];
  if (events?.length) {
    for (let i = 0; i < events.length; i++) {
      const { name, options, read } = events[i];
      const listener = (event: Event) => read(owner).call(owner, event);
      element.addEventListener(name, listener, options);
      context.addUnlistener(() => element.removeEventListener(name, listener, options));
    }
  }
}

/**
 * Binds an attribute or a class of the host element to a member of the owner. A member holding a function, such as a
 * signal, is called to get the value.
 *
 * @param owner - The web component or the custom directive.
 * @param element - Its host element.
 * @param binding - The attribute or the class, and how to read the member.
 * @param context - The context the binding lives in.
 */
function bindProperty(owner: EventHost, element: Element, { name, isClass, read }: HostPropertyBinding, context: _Context): void {
  context.addUnlistener(effect(() => {
    const member = read(owner);
    const value = typeof member === 'function' ? member() : member;
    isClass ? toggleClass(element, name, Boolean(value)) : writeAttribute(element, name, value);
  }));

  context.addUnlistener(isClass ? () => untoggleClass(element, name) : () => writeAttribute(element, name, null));
}

/**
 * Writes an attribute of the host element: `null`, `undefined` and `false` remove it, `true` writes it empty, any
 * other value is written as a string. Writing `class` keeps the classes toggled by class bindings.
 *
 * @param element - The host element.
 * @param name - The name of the attribute.
 * @param value - The value.
 */
function writeAttribute(element: Element, name: string, value: unknown): void {
  switch (value) {
    case null:
    case undefined:
    case false:
      element.removeAttribute(name);
      break;
    case true:
      element.setAttribute(name, '');
      break;
    default:
      element.setAttribute(name, String(value));
  }

  restoreToggledClasses(element, name);
}
