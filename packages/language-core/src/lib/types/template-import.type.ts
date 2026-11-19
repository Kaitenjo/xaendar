import type { ImportNode, ImportSpecifier, ComponentOrDirectiveMetadata } from '@xaendar/compiler';

/**
 * A symbol imported by a template through an `@import` statement.
 */
export type TemplateImport = {
  /**
   * The `@import` statement.
   */
  readonly node: ImportNode;
  /**
   * The specifier importing the symbol.
   */
  readonly specifier: ImportSpecifier;
  /**
   * The metadata of the imported component or directive.
   */
  readonly metadata: ComponentOrDirectiveMetadata;
};
