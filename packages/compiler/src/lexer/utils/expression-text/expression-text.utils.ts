import { LESS_THAN, LPAREN } from '../../../costants/chars.constant';
import { ExpressionScanner } from '../../../models/expression-scanner/expression-scanner.model';
import type { ExpressionTextOptions } from '../../types/expression-text-options.type';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';

/**
 * Consumes an expression, or a type, up to the character ending it, not consumed: one of `terminators` that ends it
 * where the scanner reads it (see `ExpressionScanner.endsAt`), e.g. the `}` closing an interpolation, the `,` or the
 * `)` ending a parameter of an event handler. The literals and the groups of the text never end it.
 *
 * @param cursor - The lexer cursor positioned right before the text.
 * @param terminators - The characters that can end the text.
 * @param options - Whether the text holds types, and whether a cast closing it ends it. The whitespace before the `as`
 *   of the cast is not consumed.
 * @returns The text consumed.
 */
export function lexExpressionText(cursor: LexerCursor, terminators: string, options?: ExpressionTextOptions): string {
  const scanner = new ExpressionScanner(options?.types);
  let text = '';

  // A cast closes only an expression already written
  const endsAtCast = (): boolean => !!options?.cast && !!text && scanner.isTopLevel && cursor.peekKeywordAfterSpaces('as');

  for (let char = cursor.peek(); !scanner.endsAt(char, terminators) && !endsAtCast(); char = cursor.peek()) {
    cursor.advance();
    text = `${text}${cursor.currentChar.value}`;
    scanner.read(char);
  }

  return text;
}

/**
 * Consumes a group up to the character closing the one opening it, already consumed, and the closing character too
 * (see `lexExpressionText`):
 * - `<…>`, e.g. the type arguments of a directive, `string, Map<string, number>` in `@@selector<string, Map<string, number>>(...)`;
 * - `(…)`, e.g. the type arguments of a web component, `string, (value: number) => void` in `<my-list(string, (value: number) => void)>`,
 *   the parameters of a template, `item: Item` in `<template row(item: Item)>`, the condition of a block, the arguments
 *   of a `@render`.
 *
 * @param cursor - The lexer cursor positioned right after the character opening the group.
 * @param open - The character opening the group: {@link LESS_THAN} or {@link LPAREN}.
 * @returns The text of the group, without the characters enclosing it: empty for an empty group.
 * @throws If the input ends before the group is closed.
 */
export function lexGroup(cursor: LexerCursor, open: typeof LESS_THAN | typeof LPAREN): string {
  const types = open === LESS_THAN;
  const text = lexExpressionText(cursor, types ? '>' : ')', { types });

  // Consume the character closing the group
  cursor.advance();
  return text;
}
