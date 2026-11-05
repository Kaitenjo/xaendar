import type { Span } from '../../../types/span.type';
import type { DeferTrigger } from '../../types/defer-trigger.type';
import type { HydrateTrigger } from '../../types/hydrate-trigger.type';
import { validateExpression } from '../expression-validator/expression-validator';

/**
 * The triggers of a `@hydrate` named by a keyword alone.
 */
const HYDRATE_KEYWORDS: ReadonlySet<Exclude<HydrateTrigger['kind'], 'when'>> = new Set(['load', 'idle', 'visible', 'interaction', 'never']);

/**
 * The triggers of a `@defer` named by a keyword alone: the ones of a `@hydrate` but `never`, since a `@defer` that never
 * renders its content would be its `@placeholder`.
 */
const DEFER_KEYWORDS: ReadonlySet<Exclude<DeferTrigger['kind'], 'when'>> = new Set(['load', 'idle', 'visible', 'interaction']);

/**
 * Parses the triggers of a `@hydrate`, written between its parentheses and separated by commas: `load`, `idle`,
 * `visible`, `interaction`, `never`, and `when` followed by an expression. A comma inside the expression, in a call or a
 * literal, separates nothing. `never` stands alone, since any other trigger would hydrate the content.
 *
 * @example
 * parseHydrateTriggers('visible, when ready()', 10); // [{ kind: 'visible', … }, { kind: 'when', expression: 'ready()', … }]
 *
 * @param source - The text between the parentheses.
 * @param offset - Where the text starts in the template.
 * @returns The triggers, in the order they are written.
 * @throws When there is no trigger, a trigger is unknown or declared twice, `never` is not alone, or the expression of
 *   `when` is not valid.
 */
export function parseHydrateTriggers(source: string, offset: number): HydrateTrigger[] {
  const triggers = parseTriggers(source, offset, '@hydrate', HYDRATE_KEYWORDS);
  const never = triggers.find(({ kind }) => kind === 'never');
  if (never && triggers.length > 1) {
    throw new Error('The trigger "never" stands alone: any other trigger would hydrate the content', { cause: never.span });
  }

  return triggers;
}

/**
 * Parses the triggers of a `@defer`, written as the ones of a `@hydrate` (see {@link parseHydrateTriggers}), without
 * `never`.
 *
 * @example
 * parseDeferTriggers('interaction, when ready()', 8); // [{ kind: 'interaction', … }, { kind: 'when', expression: 'ready()', … }]
 *
 * @param source - The text between the parentheses.
 * @param offset - Where the text starts in the template.
 * @returns The triggers, in the order they are written.
 * @throws When there is no trigger, a trigger is unknown or declared twice, or the expression of `when` is not valid.
 */
export function parseDeferTriggers(source: string, offset: number): DeferTrigger[] {
  return parseTriggers(source, offset, '@defer', DEFER_KEYWORDS);
}

/**
 * Parses the triggers of a block, separated by commas: the keywords it accepts, and `when` followed by an expression.
 *
 * @param source - The text between the parentheses.
 * @param offset - Where the text starts in the template.
 * @param block - The keyword of the block, named by the errors.
 * @param keywords - The triggers named by a keyword alone the block accepts.
 * @returns The triggers, in the order they are written.
 * @throws When there is no trigger, a trigger is unknown or declared twice, or the expression of `when` is not valid.
 */
function parseTriggers<Kind extends string>(source: string, offset: number, block: string, keywords: ReadonlySet<Kind>): Array<{ kind: Kind, span: Span } | Extract<DeferTrigger, { kind: 'when' }>> {
  const triggers = new Array<{ kind: Kind, span: Span } | Extract<DeferTrigger, { kind: 'when' }>>();
  const accepted = `${Array.from(keywords).join(', ')}, or when followed by an expression`;
  const parts = splitTopLevel(source);
  for (let i = 0; i < parts.length; i++) {
    const { text, start } = parts[i];
    const span = { start: offset + start, end: offset + start + text.length };
    if (!text) {
      throw new Error(`${block} needs a trigger: ${accepted}`, { cause: span });
    }

    const when = /^when\s+/.exec(text);
    if (!when && !keywords.has(text as Kind)) {
      throw new Error(`Unknown ${block} trigger "${text}": use ${accepted}`, { cause: span });
    }

    const trigger = when
      ? { kind: 'when' as const, expression: text.slice(when[0].length), expressionNode: validateExpression(text.slice(when[0].length), span.start + when[0].length).node, span }
      : { kind: text as Kind, span };
    if (triggers.some(({ kind }) => kind === trigger.kind)) {
      throw new Error(`The trigger "${trigger.kind}" is declared twice`, { cause: span });
    }

    triggers.push(trigger);
  }

  return triggers;
}

/**
 * Splits a text on the commas outside of parentheses, brackets, braces and string literals, trimming each part.
 *
 * @param source - The text.
 * @returns The parts, with where each one starts in the text.
 */
function splitTopLevel(source: string): Array<{ text: string, start: number }> {
  const parts = new Array<{ text: string, start: number }>();
  let depth = 0;
  let quote: string | undefined;
  let partStart = 0;
  const push = (end: number) => {
    const raw = source.slice(partStart, end);
    const leading = raw.length - raw.trimStart().length;
    parts.push({ text: raw.trim(), start: partStart + leading });
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === '\\') {
        i++;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    switch (char) {
      case '\'':
      case '"':
      case '`':
        quote = char;
        break;

      case '(':
      case '[':
      case '{':
        depth++;
        break;

      case ')':
      case ']':
      case '}':
        depth--;
        break;

      case ',':
        if (!depth) {
          push(i);
          partStart = i + 1;
        }
    }
  }

  push(source.length);
  return parts;
}
