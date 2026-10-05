import type { Constructor } from '@xaendar/types';
import { INTERNAL_SELECTOR } from '../../costants';

/**
 * Reads the selector a web component class has been registered with, from the metadata
 * stored by the `WebComponent` decorator.
 *
 * @param constructor - The class of a web component decorated with `@WebComponent`.
 * @returns The selector the component is registered with.
 * @throws When the class is not decorated with `@WebComponent`.
 */
export function getSelector(constructor: Constructor<HTMLElement>): string {
  const metadata = (constructor as unknown as { [key: symbol]: { [INTERNAL_SELECTOR]?: string } | undefined })[Symbol.for('Symbol.metadata')];
  const selector = metadata?.[INTERNAL_SELECTOR];
  if (!selector) {
    throw new Error(`${constructor.name} does not seems to be decorated with @WebComponent`);
  }

  return selector;
}
