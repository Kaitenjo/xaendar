import type { _Context, RenderElementStructuralDirective, RenderElementStructuralDirectiveConditionalBinding } from '@xaendar/core';
import type { ServerOutput } from './server-output.type';

/**
 * An element applying structural directives, as `_ssrStructural` writes it: the structural directives deciding whether
 * it is written, and the function writing it. A constant of the module of the template.
 */
export type ServerStructuralConfig = {
  /**
   * The structural directives applied to the element, left out when it applies none.
   */
  readonly structuralDirectives?: readonly RenderElementStructuralDirective[];
  /**
   * The conditional bindings applying structural directives to the element, left out when it declares none.
   */
  readonly structuralConditionalBindings?: readonly RenderElementStructuralDirectiveConditionalBinding[];
  /**
   * Writes the element in a context of its own: a function of the module, called with the component as `this`.
   *
   * @param out - The output.
   * @param context - The context of the element.
   */
  readonly render: (this: unknown, out: ServerOutput, context: _Context) => void;
  /**
   * Whether the element is the last node of its parent, written without the marker closing it, as the client renders it
   * without anchor. Left out when it is not.
   */
  readonly last?: true;
};
