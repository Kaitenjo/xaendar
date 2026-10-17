import { BACKSLASH, DOUBLE_QUOTE, GRAVE_ACCENT, GREATER_THEN, LESS_THAN, LPAREN, RPAREN, SINGLE_QUOTE } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';

/**
 * Consumes a group up to the character closing the one opening it, already consumed, and the closing character too:
 * - `<…>`, e.g. the type arguments of a directive, `string, Map<string, number>` in `@@selector<string, Map<string, number>>(...)`;
 * - `(…)`, e.g. the type arguments of a web component, `string, (value: number) => void` in `<my-list(string, (value: number) => void)>`,
 *   or the parameters of a template, `item: Item` in `<template #row(item: Item)>`.
 *
 * The groups of the same kind nested in it don't close it, nor do the characters inside a string (an escaped quote
 * doesn't close the string), nor the `>` of the arrow of a function type.
 *
 * @param cursor - The lexer cursor positioned right after the character opening the group.
 * @param open - The character opening the group: {@link LESS_THAN} or {@link LPAREN}.
 * @returns The text of the group, without the characters enclosing it: empty for an empty group.
 * @throws If the input ends before the group is closed.
 */
export function lexGroup(cursor: LexerCursor, open: typeof LESS_THAN | typeof LPAREN): string {
  const close = open === LESS_THAN ? GREATER_THEN : RPAREN;
  let depth = 1;
  let text = '';
  let quote: number | undefined;
  let escaped = false;

  while (depth) {
    cursor.advance();
    const { code, value } = cursor.currentChar;

    if (escaped) {
      escaped = false;
    } else if (quote !== undefined) {
      escaped = code === BACKSLASH;
      quote = code === quote ? undefined : quote;
    } else {
      switch (code) {
        case SINGLE_QUOTE:
        case DOUBLE_QUOTE:
        case GRAVE_ACCENT:
          quote = code;
          break;

        case open:
          depth++;
          break;

        case close:
          // The `>` of the arrow of a function type (`() => void`) closes nothing
          if (code !== GREATER_THEN || !text.endsWith('=')) {
            depth--;
          }
          break;
      }
    }

    if (depth) {
      text = `${text}${value}`;
    }
  }

  return text;
}
