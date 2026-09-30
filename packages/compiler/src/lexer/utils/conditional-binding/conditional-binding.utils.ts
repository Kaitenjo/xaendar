import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';

/**
 * Matches the flow-control keywords a conditional binding is declared with among the bindings of a tag.
 * The trailing space tells a keyword apart from an event sharing its name, e.g. `@switch="onSwitch()"`.
 */
const KEYWORD = /^@(?:if|else|switch|case|default) /;
/**
 * Number of characters to peek to match `KEYWORD`: the length of the longest keyword.
 */
const LONGEST_KEYWORD_LENGTH = '@default '.length;

/**
 * Tells whether the `@` the cursor is positioned on starts a flow-control keyword of a conditional binding,
 * i.e. `@if`, `@else if`, `@else`, `@switch`, `@case` or `@default`, rather than an event binding or a directive.
 *
 * The keywords are recognised wherever a binding can be declared: it is up to the parser to reject the misplaced ones.
 *
 * @param cursor - The lexer cursor positioned on the `@` character.
 * @returns `true` if a flow-control keyword follows, `false` otherwise.
 */
export function isConditionalBindingKeyword(cursor: LexerCursor): boolean {
  return cursor.peekMatch(KEYWORD, LONGEST_KEYWORD_LENGTH);
}
