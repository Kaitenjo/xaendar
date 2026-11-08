import { LOADING_PARAMETERS, PLACEHOLDER_PARAMETERS } from '../../../parser/utils/block-parameters/block-parameters.utils';
import { ExpressionScanner } from '../../../models/expression-scanner/expression-scanner.model';
import { splitTopLevel } from '../balanced-text/balanced-text.utils';
import { DEFER_TRIGGER_KEYWORDS, HYDRATE_TRIGGER_KEYWORDS } from '../../../parser/utils/triggers/triggers.utils';
import { Lexer } from '../../lexer/lexer';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { TriggerContext } from '../../types/trigger-context.type';

/**
 * The name of a trigger being written at the end of its part, after `prefetch` or not.
 */
const TRIGGER_NAME = /^(prefetch\s+)?([a-z]*)$/;

/**
 * The name of a parameter being written at the end of its part.
 */
const PARAMETER_NAME = /^[a-z]*$/;

/**
 * The name a part written before starts with, after `prefetch` or not.
 */
const PART_NAME = /^(prefetch\s+)?([a-z]+)/;

/**
 * The trigger reading an expression, after `prefetch` or not, followed by the expression.
 */
const WHEN = /^(prefetch\s+)?when\s/;

/**
 * Tells what name is being written at an offset of a template between the parentheses of a block taking keywords: a
 * trigger of a `@defer` or of a `@hydrate`, after `prefetch` too, or a parameter of a `@placeholder` or of a `@loading`.
 * The template may not compile (e.g. while the user is typing), as long as it can be lexed up to the offset.
 *
 * @example
 * getTriggerContext('@defer (idle, ho', 16);      // { names: ['load', 'timer', 'visible', 'interaction', 'hover', 'when', 'prefetch'], span: { start: 14, end: 16 } }
 * getTriggerContext('@loading (after 1s, ', 20);  // { names: ['minimum'], span: { start: 20, end: 20 } }
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @returns The names that can be written there, `undefined` if the offset is not on the name of a trigger or of a
 *   parameter.
 */
export function getTriggerContext(source: string, offset: number): TriggerContext | undefined {
  const written = findWrittenParts(source, offset);
  if (!written) {
    return undefined;
  }

  const { block, parts } = written;
  const current = parts[parts.length - 1];
  switch (block) {
    case TokenType.PLACEHOLDER:
    case TokenType.LOADING: {
      if (!PARAMETER_NAME.test(current)) {
        return undefined;
      }

      // The parameters already written before
      const declared = new Set<string>();
      for (let i = 0; i < parts.length - 1; i++) {
        const name = PART_NAME.exec(parts[i]);
        if (name) {
          declared.add(name[2]);
        }
      }

      const parameters: TriggerContext['names'] = block === TokenType.PLACEHOLDER ? PLACEHOLDER_PARAMETERS : LOADING_PARAMETERS;
      return { names: parameters.filter(name => !declared.has(name)), span: { start: offset - current.length, end: offset } };
    }

    default: {
      const match = TRIGGER_NAME.exec(current);
      if (!match) {
        return undefined;
      }

      // The triggers already written in the same list, the one of the triggers following prefetch or the other one
      const prefetch = !!match[1];
      const declared = new Set<string>();
      for (let i = 0; i < parts.length - 1; i++) {
        const name = PART_NAME.exec(parts[i]);
        if (name && !!name[1] === prefetch) {
          declared.add(name[2]);
        }
      }

      const keywords = block === TokenType.DEFER ? DEFER_TRIGGER_KEYWORDS : HYDRATE_TRIGGER_KEYWORDS;
      const names = new Array<TriggerContext['names'][number]>();
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        // never stands alone, and loads nothing to prefetch
        if (!declared.has(keyword) && (keyword !== 'never' || (!prefetch && parts.length === 1))) {
          names.push(keyword);
        }
      }

      if (!declared.has('when')) {
        names.push('when');
      }

      if (!prefetch) {
        names.push('prefetch');
      }

      return { names, span: { start: offset - match[2].length, end: offset } };
    }
  }
}

/**
 * Tells whether an expression is being written at the end of the triggers of a `@defer` or of a `@hydrate`: the one of a
 * `when`, after `prefetch` too, or an argument of a trigger, between its parentheses.
 *
 * @example
 * isTriggerExpression('idle, when rea');   // true
 * isTriggerExpression('idle, hover(mo');   // true
 * isTriggerExpression('idle, ho');         // false
 *
 * @param text - The text from the parenthesis opening the triggers to the offset.
 * @returns `true` when the last trigger is an expression or has its parentheses open.
 */
export function isTriggerExpression(text: string): boolean {
  const parts = splitTopLevel(text);
  const part = text.slice(parts[parts.length - 1].start);
  if (WHEN.test(part)) {
    return true;
  }

  // The arguments of a trigger are open when the part doesn't end outside of any group
  const scanner = new ExpressionScanner();
  scanner.readText(part);
  return !scanner.isTopLevel;
}

/**
 * Finds the parts written between the parentheses of a block taking keywords, separated by commas, up to an offset of
 * a template.
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @returns The keyword of the block and the parts, the last one as written up to the offset, `undefined` when the offset
 *   is not between the parentheses of a `@defer`, a `@hydrate`, a `@placeholder` or a `@loading`.
 */
function findWrittenParts(source: string, offset: number): { block: TokenType, parts: string[] } | undefined {
  const before = source.slice(0, offset);
  const lexer = new Lexer(before);
  let tokens: ReturnType<Lexer['tokenize']>;
  try {
    tokens = lexer.tokenize();
  } catch {
    return undefined;
  }

  // The keyword of the block is the last token, its parameters start after its `(`
  const lastToken = tokens.findLast(token => token.type !== TokenType.EOF);
  switch (lexer.state === LexerState.FLOW_CONTROL_CONDITION ? lastToken?.type : undefined) {
    case TokenType.DEFER:
    case TokenType.HYDRATE:
    case TokenType.PLACEHOLDER:
    case TokenType.LOADING: {
      const start = before.indexOf('(', lastToken!.span.end) + 1;
      const written = splitTopLevel(before.slice(start));
      const parts = written.map(({ text }) => text);
      // The last part keeps the spaces written before the offset
      parts[parts.length - 1] = before.slice(start + written[written.length - 1].start);
      return { block: lastToken!.type, parts };
    }

    default:
      return undefined;
  }
}
