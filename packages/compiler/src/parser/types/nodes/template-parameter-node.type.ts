import type { Span } from '../../../types/span.type';

/**
 * A parameter of a template, e.g. `item: Item` in `<template #row(item: Item)>`: its content reads it as a signal.
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
   * The type of the parameter, as written in the template.
   */
  type: string;
  /**
   * Span of the type.
   */
  typeSpan: Span;
};
