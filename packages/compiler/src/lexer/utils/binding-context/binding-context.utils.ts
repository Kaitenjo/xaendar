import { Lexer } from '../../lexer/lexer';
import type { BindingContext } from '../../types/binding-context/binding-context.type';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { DirectiveToken } from '../../types/tokens/directive-token.type';
import type { StructuralDirectiveToken } from '../../types/tokens/structural-directive-token.type';
import type { TagOpenNameToken } from '../../types/tokens/tag-open-name-token.type';

/**
 * The part of a name written right before an offset: the characters an attribute or event name cannot hold end it.
 */
const PARTIAL_NAME = /[^\s(){}"'=<>/@*]*$/;

/**
 * Tells where a binding is being written at an offset of a template, by lexing the template up to it: the template
 * may not compile (e.g. while the user is typing), as long as it can be lexed up to the offset.
 *
 * @example
 * getBindingContext('<my-child la', 12);              // { kind: 'attribute', tagName: 'my-child', directive: undefined, span: { start: 10, end: 12 } }
 * getBindingContext('<my-child @@tooltip((sh', 23);  // { kind: 'event', tagName: 'my-child', directive: 'tooltip', span: { start: 21, end: 23 } }
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @returns The binding being written, `undefined` if the offset is not on the name of an attribute or event of an opening tag,
 *   or the tag is a `<template>`, which declares only its name and its parameters.
 */
export function getBindingContext(source: string, offset: number): BindingContext | undefined {
  const before = source.slice(0, offset);
  const start = offset - PARTIAL_NAME.exec(before)![0].length;
  /*
    A name starts after a space, a `(` or a `{`: checked first, as it is cheaper than lexing. The attribute state is
    also left open by its `=` or by the quote opening its value, the event state by its `)`
  */
  if (!/[\s({]/.test(before[start - 1])) {
    return undefined;
  }

  const lexer = new Lexer(before);
  let tokens: ReturnType<Lexer['tokenize']>;
  try {
    tokens = lexer.tokenize();
  } catch {
    return undefined;
  }

  const kind = getBindingKind(lexer.state);
  if (!kind) {
    return undefined;
  }

  const tagName = tokens.findLast((token): token is TagOpenNameToken => token.type === TokenType.TAG_OPEN_NAME)!.parts[0];
  if (tagName === 'template') {
    return undefined;
  }

  const inDirective = lexer.history.some(state => state === LexerState.DIRECTIVE || state === LexerState.STRUCTURAL_DIRECTIVE);
  const directive = inDirective
    ? tokens.findLast((token): token is DirectiveToken | StructuralDirectiveToken => token.type === TokenType.DIRECTIVE || token.type === TokenType.STRUCTURAL_DIRECTIVE)!.parts[0]
    : undefined;

  return { kind, tagName, directive, span: { start, end: offset } };
}

/**
 * Tells which name the lexer is expecting or reading in a state.
 *
 * @param state - The state the lexer ended in.
 * @returns The kind of the name, `undefined` if the state is not on a binding name.
 */
function getBindingKind(state: LexerState): BindingContext['kind'] | undefined {
  switch (state) {
    case LexerState.TAG_BODY:
    case LexerState.DIRECTIVE_BODY:
    case LexerState.CONDITIONAL_BINDING_BODY:
    case LexerState.ATTRIBUTE:
      return 'attribute';

    case LexerState.EVENT:
      return 'event';

    default:
      return undefined;
  }
}
