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
};
