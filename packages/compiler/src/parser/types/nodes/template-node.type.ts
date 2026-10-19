import type { Span } from '../../../types/span.type';
import type { ASTNode, ASTNodeWithSpan } from '../ast.type';
import type { ASTNodeType } from '../node.enum';
import type { TemplateParameterNode } from './template-parameter-node.type';
import type { ElementRefNode } from './element-ref-node.type';

/**
 * AST node representing the declaration of a template, e.g. `<template #row(item: Item)>…</template>`: its content is
 * rendered by each `@render` calling it, e.g. `@render row(item())`, and nowhere it is declared.
 */
export type TemplateNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a template.
   */
  type: ASTNodeType.Template;
  /**
   * Span of the tag name in the opening tag, `template` in `<template`.
   */
  nameSpan: Span;
  /**
   * Span of the tag name in the closing tag, `undefined` for a self-closing tag.
   */
  closeNameSpan?: Span;
  /**
   * The element ref naming the template, e.g. `#row` in `<template #row(item: Item)>`.
   */
  ref: ElementRefNode;
  /**
   * The parameters of the template, in the order they are declared.
   */
  parameters: TemplateParameterNode[];
  /**
   * Child AST nodes rendered by each instance of the template.
   */
  children: ASTNode[];
}>
