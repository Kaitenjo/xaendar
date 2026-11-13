import { INTERNAL_ALIAS_TO_ATTRIBUTE, INTERNAL_REQUIRED_INPUTS } from '../../costants';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';

/**
 * Registers an input, declared by `@Property` or `@Model`, in the metadata of its class: the name it is bound with,
 * its alias or the name of its property, and whether it is required.
 *
 * The metadata of a subclass inherits from the one of its parent class: the map and the set of the parent are copied
 * into the metadata of the class before they change, so the inputs of the parent stay visible and the ones of the class
 * do not reach the parent.
 *
 * @param metadata - The metadata of the class declaring the input.
 * @param propertyKey - The name of the property of the input.
 * @param alias - The alias of the input, `undefined` without one.
 * @param required - Whether the input is required: an accessor declared again overrides the inherited one, required or not.
 */
export function registerInput(metadata: Partial<WebComponentMetadata>, propertyKey: string, alias: string | undefined, required: boolean): void {
  if (!Object.hasOwn(metadata, INTERNAL_ALIAS_TO_ATTRIBUTE)) {
    metadata[INTERNAL_ALIAS_TO_ATTRIBUTE] = Object.assign({}, metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]);
  }

  metadata[INTERNAL_ALIAS_TO_ATTRIBUTE]![alias ?? propertyKey] = propertyKey;
  if (required || metadata[INTERNAL_REQUIRED_INPUTS]?.has(propertyKey)) {
    if (!Object.hasOwn(metadata, INTERNAL_REQUIRED_INPUTS)) {
      metadata[INTERNAL_REQUIRED_INPUTS] = new Set(metadata[INTERNAL_REQUIRED_INPUTS]);
    }

    required ? metadata[INTERNAL_REQUIRED_INPUTS]!.add(propertyKey) : metadata[INTERNAL_REQUIRED_INPUTS]!.delete(propertyKey);
  }
}
