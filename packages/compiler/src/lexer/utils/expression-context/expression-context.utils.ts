import { Lexer } from '../../lexer/lexer';
import type { ExpressionContext } from '../../types/expression-context/expression-context.type';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';

/**
 * The part of an identifier written right before an offset.
 */
const PARTIAL_IDENTIFIER = /[\w$]*$/;

/**
 * The identifier written at the offset when no identifier is, read from the component like any unknown name, so
 * that the members of the component are proposed there.
 */
const PLACEHOLDER = '__xaendarCompletion__';

/**
 * The character closing each construct an expression can open.
 */
const CLOSERS: Readonly<Record<string, string>> = { '(': ')', '[': ']', '{': '}', '`': '`' };

/**
 * The character opening each construct closed by a parenthesis, a bracket or a brace.
 */
const OPENERS: Readonly<Record<string, string>> = { ')': '(', ']': '[', '}': '{' };

/**
 * The state of a scan of an expression.
 */
type ScanState = {
  /**
   * The constructs open at the scanned character, innermost last: parentheses, brackets, braces (`{` or `${`) and
   * template literals.
   */
  readonly nesting: string[];
  /**
   * The quote of the string literal the scanned character is in, if any.
   */
  quote: string | undefined;
};

/**
 * Tells where an expression is being written at an offset of a template, by lexing the template up to it, and closes
 * the expression there (see {@link ExpressionContext.source}): the template may not compile (e.g. while the user is
 * typing), as long as it can be lexed up to the offset. Nothing is being written in a string literal.
 *
 * @example
 * getExpressionContext('<b>{ ti</b>', 7);                  // { kind: 'interpolation', span: { start: 5, end: 7 }, source: '<b>{ ti }</b>' }
 * getExpressionContext('<b (click)="">x</b>', 12);         // { kind: 'handler', span: { start: 12, end: 12 }, source: '<b (click)="__xaendarCompletion__()">x</b>' }
 * getExpressionContext('<b (click)="pick()">x</b>', 17);   // { kind: 'argument', span: { start: 17, end: 17 }, source: '<b (click)="pick(__xaendarCompletion__, $event)">x</b>' }
 * getExpressionContext('@if (ok', 7);                      // { kind: 'condition', span: { start: 5, end: 7 }, source: '@if (ok) {}' }
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @returns The expression being written, `undefined` if the offset is not in an interpolation, in the handler of an
 *   event or in the condition of `@if`, `@else if`, `@for` or `@switch`.
 */
export function getExpressionContext(source: string, offset: number): ExpressionContext | undefined {
  const before = source.slice(0, offset);
  const lexer = new Lexer(before);
  try {
    lexer.tokenize();
  } catch {
    return undefined;
  }

  const partial = PARTIAL_IDENTIFIER.exec(before)![0];
  const span = { start: offset - partial.length, end: offset };
  // The template up to the offset, followed by the placeholder when no identifier is written
  const head = `${before}${partial ? '' : PLACEHOLDER}`;
  const { tokens } = lexer;
  // The `{` opening an interpolation, or the `(` opening a condition, follows the last token emitted
  const lastToken = tokens.findLast(token => token.type !== TokenType.EOF);

  switch (lexer.state) {
    case LexerState.INTERPOLATION:
    case LexerState.INTERPOLATION_EXPRESSION: {
      const state: ScanState = { nesting: [], quote: undefined };
      scanExpression(before, before.indexOf('{', lastToken?.span.end ?? 0) + 1, offset, state, '}');
      if (!isClosable(state)) {
        return undefined;
      }

      // The expression goes on after the offset up to the `}` closing it, if any: the template after the `}` is kept
      const end = scanExpression(source, offset, source.length, { nesting: [...state.nesting], quote: undefined }, '}');
      const after = end === -1 ? source.slice(offset) : source.slice(end + 1);
      return { kind: 'interpolation', span, source: `${head}${closersOf(state)} }${after}` };
    }

    case LexerState.FLOW_CONTROL_CONDITION: {
      // The keyword (`@if`, `@else if`, `@for`, `@switch`) is the last token, the condition starts after its `(`
      const open = before.indexOf('(', lastToken!.span.end);
      // The condition of a `@for` starts with the name of its item, written before ` of ` (or the `;` of an iterable without item)
      const isForItem = lastToken!.type === TokenType.FOR && !/\sof\s|;/.test(before.slice(open + 1, span.start));
      if (open === -1 || isForItem) {
        return undefined;
      }

      const state: ScanState = { nesting: [], quote: undefined };
      scanExpression(before, open + 1, offset, state, ')');
      if (!isClosable(state)) {
        return undefined;
      }

      // The condition goes on after the offset up to the `)` closing it, if any, followed by its block, empty when not written yet
      const end = scanExpression(source, offset, source.length, { nesting: [...state.nesting], quote: undefined }, ')');
      const after = end === -1 ? source.slice(offset) : source.slice(end + 1);
      return { kind: 'condition', span, source: `${head}${closersOf(state)})${/^\s*\{/.test(after) ? '' : ' {}'}${after}` };
    }

    case LexerState.EVENT_HANDLER:
    case LexerState.EVENT_PARAMETER: {
      // The handler is written between the double quotes after the event, up to the one closing it
      const handlerStart = tokens.findLast(token => token.type === TokenType.EVENT)!.span.end;
      const handlerEnd = source.indexOf('"', offset);
      const call = before.indexOf('(', handlerStart);
      if (handlerEnd === -1) {
        return undefined;
      }

      if (call === -1) {
        return span.start === handlerStart ? { kind: 'handler', span, source: `${head}()${source.slice(handlerEnd)}` } : undefined;
      }

      const state: ScanState = { nesting: [], quote: undefined };
      scanExpression(before, call + 1, offset, state, ')');
      return isClosable(state)
        ? { kind: 'argument', span, source: `${head}${closersOf(state)}, $event)${source.slice(handlerEnd)}` }
        : undefined;
    }

    default:
      return undefined;
  }
}

/**
 * Scans part of an expression, updating the constructs open and the string literal the scan is in, exactly like the
 * lexer reads an interpolation: braces, quotes and backticks in a string literal are part of it.
 *
 * @param text - The text holding the expression.
 * @param start - The offset the scan starts at.
 * @param end - The offset the scan ends at, excluded.
 * @param state - The state at `start`, updated to the one at the end of the scan.
 * @param closer - The character closing the construct the expression is in: the `}` of an interpolation, the `)` of a
 *   condition or of the call of an event.
 * @returns The offset of the character closing the construct the expression is in, which stops the scan, `-1` if none is met.
 */
function scanExpression(text: string, start: number, end: number, state: ScanState, closer: '}' | ')'): number {
  const { nesting } = state;
  for (let i = start; i < end; i++) {
    const char = text[i];
    if (state.quote) {
      // An escaped character never closes the string
      if (char === '\\') {
        i++;
      } else if (char === state.quote) {
        state.quote = undefined;
      }
    } else if (nesting.at(-1) === '`') {
      // An escaped character never closes the template literal, nor starts a substitution
      if (char === '\\') {
        i++;
      } else if (char === '`') {
        nesting.pop();
      } else if (char === '$' && text[i + 1] === '{') {
        nesting.push('{');
        i++;
      }
    } else {
      switch (char) {
        case '\'':
        case '"':
          state.quote = char;
          break;

        case '(':
        case '[':
        case '{':
        case '`':
          nesting.push(char);
          break;

        case ')':
        case ']':
        case '}': {
          // Like for the lexer, the character closing the expression is the first one outside of every construct it opens
          const opener = nesting.lastIndexOf(OPENERS[char]);
          if (opener !== -1) {
            nesting.length = opener;
          } else if (char === closer) {
            return i;
          }
          break;
        }
      }
    }
  }

  return -1;
}

/**
 * Tells whether an expression can be closed where a scan ended: not in a string literal, nor in the text of a
 * template literal.
 *
 * @param state - The state at the end of the scan.
 * @returns `true` if the expression can be closed.
 */
function isClosable({ nesting, quote }: ScanState): boolean {
  return !quote && nesting.at(-1) !== '`';
}

/**
 * Returns the characters closing the constructs open where a scan ended, the innermost first.
 *
 * @param state - The state at the end of the scan.
 * @returns The closing characters.
 */
function closersOf({ nesting }: ScanState): string {
  return nesting.map(opener => CLOSERS[opener]).reverse().join('');
}
