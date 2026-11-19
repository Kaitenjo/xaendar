import type { ComponentMetadata } from './component-metadata.type';
import type { DirectiveMetadata } from './directive-metadata.type';
import type { LibraryComponentMetadata } from './library-component-metadata.type';
import type { LibraryDirectiveMetadata } from './library-directive-metadata.type';

/**
 * Union type of context import types for type-checker.
 *
 * Stores metadata for components and directives extracted from decorators, or read from the manifest of a compiled
 * library (`library`).
 * The other symbols a template imports (functions, constants, enums, classes, types) are described by `ImportedSymbol`.
 */
export type ComponentOrDirectiveMetadata =
  | ComponentMetadata
  | DirectiveMetadata
  | LibraryComponentMetadata
  | LibraryDirectiveMetadata;
