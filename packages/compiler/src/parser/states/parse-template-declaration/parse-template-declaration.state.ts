import type { TemplateDeclarationToken } from '../../../lexer/types/tokens/template-declaration-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { TemplateDeclarationNode } from '../../types/nodes/template-declaration-node.type';
import { assertDeclaredName } from '../../utils/identifier/identifier.utils';

/**
 * Parses the name of a TEMPLATE_DECLARATION token, e.g. `row` in `<template row(item: Item)>`, into a
 * `TemplateDeclarationNode`. Its parameters are parsed with the template (see `parseTemplateParameters`).
 *
 * @param cursor - Parser cursor positioned at the TEMPLATE_DECLARATION token; advanced past it.
 * @param token - The TEMPLATE_DECLARATION token.
 * @returns The parsed `TemplateDeclarationNode`.
 * @throws If the name is not an identifier, or is reserved.
 */
export function parseTemplateDeclaration(cursor: ParserCursor, token: TemplateDeclarationToken): TemplateDeclarationNode {
  cursor.advance();
  const [name] = token.parts;
  const nameSpan = cursor.findSpan(name, token.span.start);
  assertDeclaredName(name, nameSpan, 'template');

  return { name, nameSpan };
}
