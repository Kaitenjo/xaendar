import type { RenderTemplate } from './render-template.type';

/**
 * A template declared by a `<template name(…)>`, the value its scope holds under its name: a constant of the module of
 * the template, shared by every instance of the scope declaring it. A `@render` finds the scope declaring it, whose
 * names the content reads, by its name (see `_Context.ownerOf`).
 *
 * N.B. Deliberate, to save memory: a constant of the module instead of an object, holding the context and a bound
 * function, created for every instance of the scope declaring the template. Do not keep the context in it.
 */
export type _Template = {
  /**
   * Renders an instance of the template: a function of the module, called as it is.
   */
  readonly render: RenderTemplate;
  /**
   * The names of the parameters of the template, in order, which the instances are updated by.
   */
  readonly parameters: readonly string[];
};
