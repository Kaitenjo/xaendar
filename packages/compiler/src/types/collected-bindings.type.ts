import type { ComponentEventMetadata } from './component-event-metadata.type';
import type { ComponentPropertyMetadataWithSpan } from '../models/component-property-metadata-with-span/component-property-metadata-with-span.model';

/**
 * The `@Property` and `@Event` accessors of a class collected so far, own and inherited.
 */
export type CollectedBindings = {
  /**
   * The properties, keyed by their alias or name.
   */
  readonly properties: Map<string, ComponentPropertyMetadataWithSpan>;
  /**
   * The events, keyed by name.
   */
  readonly events: Map<string, ComponentEventMetadata>;
};
