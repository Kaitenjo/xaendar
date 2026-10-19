import type { Constructor } from '@xaendar/types';
import { INTERNAL_SELECTOR } from '../../costants';
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
  const error = new Error(`${constructor.name} does not seem to be decorated with @WebComponent`);
  if (Object.hasOwn(constructor, Symbol.for('Symbol.metadata'))) {
    throw error;
  }

  const metadata = getWebComponentMetadata(constructor);
  if (!metadata || !Object.hasOwn(metadata, INTERNAL_SELECTOR)) {
    throw error;
  }

  const selector = metadata[INTERNAL_SELECTOR];
  if (!selector) {
    throw new Error(`${constructor.name} does not seem to be decorated with @WebComponent`);
  }

  return selector;
}
