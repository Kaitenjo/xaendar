import type { RenderTemplate } from './render-template.type';

/**
 * A template declared by a `<template name(…)>`: a constant of the module of the template, shared by every instance of
 * the scope declaring it, which takes no slot of the scope. A `@render` finds the scope declaring it, whose variables
 * the content reads, by how many scopes up it is (see `RenderTemplateConfig`).
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
   * The identifiers of the parameters of the template, unique in their template, in order: the slots following the
   * header of the context of an instance hold their values, which the instances are updated by.
   */
  readonly parameters: readonly number[];
};
