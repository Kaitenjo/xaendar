import type { Constructor } from '@xaendar/types';
import { INTERNAL_EXTENDS, INTERNAL_SELECTOR } from '../../costants';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';

/**
 * Reads the selector a web component class has been registered with, from the metadata
 * stored by the `WebComponent` decorator.
 *
 * The metadata of a class is inherited: a subclass without decorators reads the metadata of its parent, and the one of
 * a subclass with other decorators has the metadata of its parent as prototype. Only a selector stored in the metadata
 * of the class itself counts, so that a subclass not decorated with `@WebComponent` is not taken for its parent.
 *
 * @param constructor - The class of a web component decorated with `@WebComponent`.
 * @returns The selector the component is registered with.
 * @throws When the class is not decorated with `@WebComponent`, also when its parent class is.
 */
export function getSelector(constructor: Constructor<HTMLElement>): string {
  return getOwnMetadata(constructor)[INTERNAL_SELECTOR];
}

/**
 * Reads the tag of the native element a web component class extends, declared by `extends` of its `WebComponent`: the
 * tag of its elements, whose `is` attribute is the selector of the component.
 *
 * @param constructor - The class of a web component decorated with `@WebComponent`.
 * @returns The tag the component extends, `undefined` for an autonomous custom element, whose tag is its selector.
 * @throws When the class is not decorated with `@WebComponent`, also when its parent class is.
 */
export function getExtendedTagName(constructor: Constructor<HTMLElement>): keyof HTMLElementTagNameMap | undefined {
  return getOwnMetadata(constructor)[INTERNAL_EXTENDS];
}

/**
 * Reads the metadata `WebComponent` stored in a class itself (see {@link getSelector}).
 *
 * @param constructor - The class of a web component decorated with `@WebComponent`.
 * @returns The metadata, holding the selector.
 * @throws When the class is not decorated with `@WebComponent`, also when its parent class is.
 */
function getOwnMetadata(constructor: Constructor<HTMLElement>): WebComponentMetadata {
  const metadata = Object.hasOwn(constructor, Symbol.for('Symbol.metadata')) ? getWebComponentMetadata(constructor) : undefined;
  if (!metadata || !Object.hasOwn(metadata, INTERNAL_SELECTOR) || !metadata[INTERNAL_SELECTOR]) {
    throw new Error(`${constructor.name} does not seem to be decorated with @WebComponent`);
  }

  return metadata;
}
