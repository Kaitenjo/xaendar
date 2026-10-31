import { TokenType } from '../token-type.enum';
import type { TokenWithSpan } from '../token-with-span.type';

/**
 * Token emitted when the lexer consumes the declaration of a template on a `<template>`: its name and its parameters,
 * e.g. `row(item: Item)` in `<template row(item: Item)>`.
 */
export type TemplateDeclarationToken = TokenWithSpan<{
  /**
   * Discriminant identifying this token as the declaration of a template.
   */
  type: TokenType.TEMPLATE_DECLARATION;
  /**
   * The name of the template, then the text of its parameters (`item: Item` in `row(item: Item)`, empty in `empty()`)
   * if it declares them.
   */
  parts: [name: string, parameters?: string];
}>
