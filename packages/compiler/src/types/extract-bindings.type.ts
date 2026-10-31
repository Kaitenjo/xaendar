import type { ComponentMetadata } from './component-metadata.type';
import type { ResolvedClass } from './resolved-class.type';

/**
 * Extracts the properties and the events of a directive, inherited ones included.
 *
 * @param directive - The class of the directive, with the file declaring it.
 * @returns The properties, keyed by their alias or name, and the events, keyed by name; `undefined` when the class can't be read.
 */
export type ExtractBindings = (directive: ResolvedClass) => Pick<ComponentMetadata, 'properties' | 'events'> | undefined;
