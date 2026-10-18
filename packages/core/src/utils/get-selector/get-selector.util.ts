import type { Constructor } from '@xaendar/types';
import { INTERNAL_SELECTOR } from '../../costants';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';

/**
 * Reads the selector a web component class has been registered with, from the metadata
 * stored by the `WebComponent` decorator.
 *
 * @param constructor - The class of a web component decorated with `@WebComponent`.
 * @returns The selector the component is registered with.
 * @throws When the class is not decorated with `@WebComponent`.
 */
export function getSelector(constructor: Constructor<HTMLElement>): string {
  const metadata = getWebComponentMetadata(constructor)
  const selector = metadata?.[INTERNAL_SELECTOR];
  if (!selector) {
    throw new Error(`${constructor.name} does not seem to be decorated with @WebComponent`);
  }

  return selector;
}
