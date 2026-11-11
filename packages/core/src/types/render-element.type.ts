import type { BlockPosition } from './block-position.type';
import type { RenderChildren } from './render-children.type';
import type { RenderElementAttribute } from './render-element-attribute.type';
import type { RenderElementConditionalBinding } from './render-element-conditional-binding.type';
import type { RenderElementDirective } from './render-element-directive.type';
import type { RenderElementEvent } from './render-element-event.type';
import type { RenderElementNamespace } from './render-element-namespace.type';
import type { RenderElementStructuralDirectiveConditionalBinding } from './render-element-structural-directive-conditional-binding.type';
import type { RenderElementStructuralDirective } from './render-element-structural-directive.type';

/**
 * Describes an element of a template, which `_renderElement` renders: its tag, its bindings, its directives and its
 * children. The lists the element does not declare are left out. An element applying structural directives is a block,
 * `last` when it is the last node of its parent (see `BlockPosition`).
 *
 * N.B. Deliberate, to save memory: a constant of the module of the template, written once by the compiler and read by
 * every element it describes, instead of the arrays and the descriptors an element would create at each render, in every
 * row of a table. The runtime never writes it: the state of an element lives in its context and its bindings. Do not
 * build it in the render code, nor keep state in it.
 */
export type RenderElement = BlockPosition & {
  /**
   * The tag name of the element.
   */
  readonly tagName: string;
  /**
   * The namespace the element is created in, the compiler knowing it from the place of the element in the template:
   * `1` for SVG, `2` for MathML, left out for HTML.
   */
  readonly namespace?: RenderElementNamespace;
  /**
   * The attributes of the element, and the classes it toggles, which come first so that writing `class` finds them.
   */
  readonly attributes?: readonly RenderElementAttribute[];
  /**
   * The event listeners of the element.
   */
  readonly events?: readonly RenderElementEvent[];
  /**
   * The conditional bindings of the element, but the structural directives they apply.
   */
  readonly conditionalBindings?: readonly RenderElementConditionalBinding[];
  /**
   * The directives applied to the element, once its own bindings are.
   */
  readonly directives?: readonly RenderElementDirective[];
  /**
   * The structural directives deciding whether the element is rendered.
   */
  readonly structuralDirectives?: readonly RenderElementStructuralDirective[];
  /**
   * The conditional bindings applying structural directives to the element.
   */
  readonly structuralConditionalBindings?: readonly RenderElementStructuralDirectiveConditionalBinding[];
  /**
   * Renders the children of the element, each time the element is created.
   */
  readonly children?: RenderChildren;
  /**
   * The element ref naming the element (`#name`), declared by the context of its scope: it is initialized with the
   * element as soon as the element is created, so that its own bindings and children read it.
   */
  readonly ref?: string;
};
