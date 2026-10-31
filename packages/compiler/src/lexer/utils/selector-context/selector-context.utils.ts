import type { SelectorContext } from '../../types/selector-context.type';
import { Lexer } from '../../lexer/lexer';
import { LexerState } from '../../types/lexer-state.enum';

/**
 * What ends right before an offset when a selector is being written: the `<` of a tag (spaces may follow it), the
 * `@@` of a directive or the `*` of a structural directive, then the part of the selector written so far.
 */
const SELECTOR_START = /(<\s*|@@|\*)([^\s(){}"'=<>/@*]*)$/;

/**
 * Tells whether the selector of a component or directive is being written at an offset of a template, by lexing the
 * template up to the symbol starting it: the template may not compile (e.g. while the user is typing), as long as it
 * can be lexed up to there.
 *
 * @example
 * getSelectorContext('<my-ch', 6);        // { kind: 'component', span: { start: 1, end: 6 } }
 * getSelectorContext('<div @@to', 9);     // { kind: 'directive', span: { start: 8, end: 9 } }
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @returns The selector being written, `undefined` if the offset is not on the selector of a component or directive.
 */
export function getSelectorContext(source: string, offset: number): SelectorContext | undefined {
  const before = source.slice(0, offset);
  const match = SELECTOR_START.exec(before);
  if (!match) {
    return undefined;
  }

  const [text, symbol, partial] = match;
  const symbolStart = offset - text.length;
  const lexer = new Lexer(before.slice(0, symbolStart));
  try {
    lexer.tokenize();
  } catch {
    return undefined;
  }

  const span = { start: offset - partial.length, end: offset };
  if (symbol.startsWith('<')) {
    return lexer.state === LexerState.TEXT ? { kind: 'component', span } : undefined;
  }

  // The symbol must start a binding of an opening tag, right after a space, a `{` or a `)`
  const isBinding = lexer.state === LexerState.TAG_BODY || lexer.state === LexerState.CONDITIONAL_BINDING_BODY;
  return isBinding && /[\s{)]$/.test(before.slice(0, symbolStart)) ? { kind: 'directive', span } : undefined;
}
