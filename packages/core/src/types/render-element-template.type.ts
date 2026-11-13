/**
 * A template passed as content to a component: a `<template name(…)>` written among the children of its element,
 * which the component reads with `@Query.contentTemplate`. It is declared by the scope rendering the element, whose
 * variables its content reads.
 *
 * N.B. Deliberate, to save memory: a constant of the module of the template, as the rest of the configuration of the
 * element (see `RenderElement`). Do not build it in the render code.
 */
export type _RenderElementTemplate = {
  /**
   * The name of the template, which the component queries it by.
   */
  readonly name: string;
  /**
   * The template: the constant of the module describing it in the browser, the function writing it on the server.
   */
  readonly template: unknown;
};
