import type { StringLiteral } from 'typescript';

/**
 * An option of a `@WebComponent` decorator assigned a string literal.
 */
export type ComponentStringOption = {
  /**
   * The name of the option.
   */
  readonly name: string;
  /**
   * The value of the option.
   */
  readonly literal: StringLiteral;
};
