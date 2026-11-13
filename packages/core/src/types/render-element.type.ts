import type { BlockPosition } from './block-position.type';
import type { RenderChildren } from './render-children.type';
import type { RenderElementAttribute } from './render-element-attribute.type';
import type { RenderElementConditionalBinding } from './render-element-conditional-binding.type';
import type { RenderElementDirective } from './render-element-directive.type';
import type { RenderElementEvent } from './render-element-event.type';
import type { RenderElementNamespace } from './render-element-namespace.type';
import type { RenderElementStructuralDirectiveConditionalBinding } from './render-element-structural-directive-conditional-binding.type';
import type { RenderElementStructuralDirective } from './render-element-structural-directive.type';
import type { _RenderElementTemplate } from './render-element-template.type';

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
   * The HTML of the static content of a standard `<template>` element, assigned to its `innerHTML` when the element is
   * created: an element adopted from the HTML of the server already holds it, in its `content`. Left out for any other
   * element, and for a `<template>` without content.
   */
  readonly content?: string;
  /**
   * The templates written among the children of the element of a component, which the component reads with
   * `@Query.contentTemplate`: passed to it before it is connected. Left out when there are none.
   */
  readonly templates?: readonly _RenderElementTemplate[];
  /**
   * The element ref naming the element (`#name`), declared by the context of its scope: it is initialized with the
   * element as soon as the element is created, so that its own bindings and children read it.
   */
  readonly ref?: string;
  /**
   * The slot of the element ref, written with {@link ref}, in the context rendering the element, which always declares
   * it: an element ref is declared by the scope rendering its element, among the children of the elements of the scope
   * too, and an element structural directives are applied to, rendered in a scope of its own, declares none.
   */
  readonly refSlot?: number;
  /**
   * The slot of the element in the context rendering it, given by the compiler to an element at the top of the block
   * of a scope: left out for the others, which no scope tracks. The one of an element structural directives are applied
   * to is the slot of its anchor, the element itself being the only node of a scope of its own.
   */
  readonly slot?: number;
};
