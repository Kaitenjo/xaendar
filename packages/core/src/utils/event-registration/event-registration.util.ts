import { INTERNAL_EVENTS } from '../../costants';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';

/**
 * Registers an event, declared by `@Event` or the event of change of a `@Model`, in the metadata of its class, so that a
 * component can expose it for a host directive without reading the accessor, which would create the output or the model.
 *
 * The metadata of a subclass inherits from the one of its parent class: the set of the parent is copied into the metadata
 * of the class before it changes, so the events of the parent stay visible and the ones of the class do not reach the parent.
 *
 * @param metadata - The metadata of the class declaring the event.
 * @param name - The name of the event.
 */
export function registerEvent(metadata: Partial<WebComponentMetadata>, name: string): void {
  if (!Object.hasOwn(metadata, INTERNAL_EVENTS)) {
    metadata[INTERNAL_EVENTS] = new Set(metadata[INTERNAL_EVENTS]);
  }

  metadata[INTERNAL_EVENTS]!.add(name);
}
