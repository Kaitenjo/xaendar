import { TokenType } from '../token-type.enum';
import { TokenWithSpan } from '../token.type';

/**
 * Token emitted when the lexer consumes a template variable, e.g. `#name` in `<input #name />`, or the declaration of a
 * template, e.g. `#row(item: Item)` in `<template #row(item: Item)>`.
 */
export type TemplateVariableToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as a template variable.
   */
  type: TokenType.TEMPLATE_VARIABLE;
  /**
   * The name of the variable, then the text of the parameters of the template (`item: Item` in `#row(item: Item)`,
   * empty in `#empty()`) if it declares them.
   */
  parts: [name: string, parameters?: string];
}>
