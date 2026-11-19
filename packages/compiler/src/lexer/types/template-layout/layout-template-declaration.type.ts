/**
 * A `<template>` declaring itself with its name and its parameters, `name(parameters)`.
 */
export type LayoutTemplateDeclaration = {
  /**
   * Discriminant identifying the item as the declaration of a template.
   */
  readonly kind: 'declaration';
  /**
   * The name of the template.
   */
  readonly name: string;
  /**
   * The parameters as written between the parentheses.
   */
  readonly parameters: string;
};
