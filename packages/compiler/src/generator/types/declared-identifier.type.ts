import type { IdentifierKind } from './identifier-kind.type';

/**
 * An identifier a scope of a template declares, as the generator reads it.
 */
export type DeclaredIdentifier = {
  /**
   * What the identifier holds.
   */
  readonly kind: IdentifierKind;
  /**
   * The slot of the identifier in the runtime scope declaring it, `undefined` for an identifier read through
   * {@link expression}.
   */
  readonly slot?: number;
  /**
   * The identifier of the variable, unique in its template, which the bindings reading it list (see `getReads`):
   * `undefined` for an identifier read through {@link expression}.
   */
  readonly id?: number;
  /**
   * The expression reading the identifier, for one taking no slot: a template, a constant of the module.
   */
  readonly expression?: string;
};
