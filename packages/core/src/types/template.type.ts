import type { _Context } from '../utils/context/context.util';
import type { RenderTemplate } from './render-template.type';

/**
 * A template declared in a template, e.g. `<template row(item: Item)>`, as the scope declaring it holds it.
 */
export type _Template = {
  /**
   * The context of the scope declaring the template: the content of the template reads the names visible there.
   */
  readonly context: _Context;
  /**
   * Renders an instance of the template.
   */
  readonly render: RenderTemplate;
  /**
   * The names of the parameters of the template, in order: a `@render` passing other arguments to an instance updates
   * them by name (see `_renderTemplate`). A constant of the module of the compiled code, shared by every instance.
   */
  readonly parameters: readonly string[];
};
