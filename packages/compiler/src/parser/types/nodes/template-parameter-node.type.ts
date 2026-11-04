import type { Expression } from 'typescript';
import type { Span } from '../../../types/span.type';

/**
 * A parameter of a template, e.g. `item: Item` in `<template row(item: Item)>`: its content reads it as a signal. A
 * parameter may be optional (`count?: number`) or have a default value (`dense: boolean = false`, or `dense = false`,
 * typed by its value): a `@render` may then leave out its argument, and only the last parameters may be so.
 */
export type TemplateParameterNode = {
  /**
   * The name of the parameter.
   */
  name: string;
  /**
   * Span of the name.
   */
  nameSpan: Span;
  /**
   * The type of the parameter, as written in the template, `undefined` when the type is the one of its default value.
   */
  type?: string;
  /**
   * Span of the type, `undefined` when the parameter has no type.
   */
  typeSpan?: Span;
  /**
   * Whether the parameter is optional, `count?: number`: its value is `undefined` when its argument is left out.
   */
  optional?: true;
  /**
   * The default value of the parameter, its value when its argument is left out: an expression reading what the
   * content of the template reads, and the parameters before it.
   */
  initializer?: Expression;
};
