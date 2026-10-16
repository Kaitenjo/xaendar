import { ComponentMetadata } from './component-metadata/component-metadata.type';
import { DirectiveMetadata } from './directive-metadata.type';

/**
 * Union type of context import types for type-checker.
 * 
 * Stores metadata for components and directives extracted from decorators.
 * The other symbols a template imports (functions, constants, enums, classes, types) are described by `ImportedSymbol`.
 */
export type ComponentOrDirectiveMetadata =
  | ComponentMetadata
  | DirectiveMetadata;
