import { ExpressionScanner } from '../../../models/expression-scanner/expression-scanner.model';
import { Lexer } from '../../lexer/lexer';
import type { ExpressionContext } from '../../types/expression-context.type';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { findEnd } from '../balanced-text/balanced-text.utils';
import { isTriggerExpression } from '../trigger-context/trigger-context.utils';

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
 * The keywords whose parentheses hold no expression: the name of the error of a `@catch` and of an `@error`, the times
 * of a `@placeholder` and of a `@loading`.
 */
const WITHOUT_EXPRESSION: ReadonlySet<TokenType> = new Set([TokenType.CATCH, TokenType.ERROR, TokenType.PLACEHOLDER, TokenType.LOADING]);

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
 * getExpressionContext('@render row(it', 14);              // { kind: 'render', span: { start: 12, end: 14 }, source: '@render row(it)' }
 * getExpressionContext('@let a = it', 11);                 // { kind: 'let', span: { start: 9, end: 11 }, source: '@let a = it;' }
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @returns The expression being written, `undefined` if the offset is not in an interpolation, in the handler of an
 *   event, in the condition of `@if`, `@else if`, `@for` or `@switch`, in the expression of the `when` of a `@defer` or
 *   of a `@hydrate` or in the arguments of one of their triggers, in the arguments of a `@render`, or in the value of a
 *   `@let`.
 */
export function getExpressionContext(source: string, offset: number): ExpressionContext | undefined {
  const before = source.slice(0, offset);
  const lexer = new Lexer(before);
  let tokens: ReturnType<Lexer['tokenize']>;
  
  try {
    tokens = lexer.tokenize();
  } catch {
    return undefined;
  }

  const partial = PARTIAL_IDENTIFIER.exec(before)![0];
  const span = { start: offset - partial.length, end: offset };
  // The template up to the offset, followed by the placeholder when no identifier is written
  const head = `${before}${partial ? '' : PLACEHOLDER}`;
  // The `{` opening an interpolation, or the `(` opening a condition, follows the last token emitted
  const lastToken = tokens.findLast(token => token.type !== TokenType.EOF);

  switch (lexer.state) {
    case LexerState.INTERPOLATION: {
      const closed = closeExpression(source, before.indexOf('{', lastToken?.span.end ?? 0) + 1, offset, '}');
      return closed && { kind: 'interpolation', span, source: `${head}${closed.closers} }${closed.after}` };
    }

    case LexerState.FLOW_CONTROL_CONDITION: {
      // The keyword (`@if`, `@else if`, `@for`, `@switch`) is the last token, the condition starts after its `(`
      const open = before.indexOf('(', lastToken!.span.end);
      // The condition of a `@for` starts with the name of its item, written before ` of ` (or the `;` of an iterable without item)
      const isForItem = lastToken!.type === TokenType.FOR && !/\sof\s|;/.test(before.slice(open + 1, span.start));
      // The triggers of a @defer and of a @hydrate are keywords: only the expression of a when, and the arguments of a trigger, are expressions
      const isTriggerKeyword = (lastToken!.type === TokenType.DEFER || lastToken!.type === TokenType.HYDRATE) && !isTriggerExpression(before.slice(open + 1, span.start));
      if (open === -1 || isForItem || isTriggerKeyword || WITHOUT_EXPRESSION.has(lastToken!.type)) {
        return undefined;
      }

      const closed = closeExpression(source, open + 1, offset, ')');
      if (!closed) {
        return undefined;
      }

      // The condition is followed by its block, empty when not written yet
      const { closers, after } = closed;
      return { kind: 'condition', span, source: `${head}${closers})${/^\s*\{/.test(after) ? '' : ' {}'}${after}` };
    }

    case LexerState.RENDER: {
      // The keyword `@render` is the last token, the arguments start after the `(` following the name of the template
      const open = before.indexOf('(', lastToken!.span.end);
      const closed = open === -1 ? undefined : closeExpression(source, open + 1, offset, ')');
      return closed && { kind: 'render', span, source: `${head}${closed.closers})${closed.after}` };
    }

    case LexerState.LET: {
      // The keyword `@let` is the last token, the value starts after the `=` following the name
      const equal = before.indexOf('=', lastToken!.span.end);
      const closed = equal === -1 ? undefined : closeExpression(source, equal + 1, offset, ';');
      return closed && { kind: 'let', span, source: `${head}${closed.closers};${closed.after}` };
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

      // The arguments after the offset are dropped up to the double quote closing the handler
      const closed = closeExpression(source, call + 1, offset, ')');
      return closed && { kind: 'argument', span, source: `${head}${closed.closers}, $event)${source.slice(handlerEnd)}` };
    }

    default:
      return undefined;
  }
}

/**
 * Closes an expression at an offset: the groups and the template literals open there are closed, and the expression
 * written after the offset is dropped up to the character ending it, if any (see `findEnd`).
 *
 * @param source - The source of the template.
 * @param start - The offset the expression starts at.
 * @param offset - The offset the expression is closed at.
 * @param terminator - The character ending the expression: the `}` of an interpolation, the `)` of a condition or of the
 *   call of an event, the `;` ending the value of a `@let`.
 * @returns The characters closing the groups open at the offset, and the template after the character ending the
 *   expression (after the offset when none does), `undefined` if the offset is in a string or in the text of a template
 *   literal, where nothing is being written.
 */
function closeExpression(source: string, start: number, offset: number, terminator: string): { closers: string, after: string } | undefined {
  const scanner = new ExpressionScanner();
  findEnd(source, start, terminator, scanner, offset);
  if (!scanner.isCode) {
    return undefined;
  }

  const { closers } = scanner;
  const end = findEnd(source, offset, terminator, scanner);
  return { closers, after: end === undefined ? source.slice(offset) : source.slice(end + 1) };
}
