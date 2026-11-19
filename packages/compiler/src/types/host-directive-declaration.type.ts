import type { Expression } from 'typescript';
import type { Exposure } from './exposure.type';

/**
 * A host directive declared in the `hostDirectives` of a `@WebComponent`, as written in the decorator.
 */
export type HostDirectiveDeclaration = {
  /**
   * The expression naming the class of the directive.
   */
  directive: Expression,
  /**
   * The inputs the component exposes, when the declaration lists them as an array literal.
   */
  properties?: Exposure[],
  /**
   * The events the component exposes, when the declaration lists them as an array literal.
   */
  events?: Exposure[]
};
