import type { Span } from '../../../types/span.type';
import type { HydrateTrigger } from '../../types/hydrate-trigger.type';
import { validateExpression } from '../expression-validator/expression-validator';

/**
 * The triggers named by a keyword alone.
 */
const KEYWORD_TRIGGERS: ReadonlySet<string> = new Set(['load', 'idle', 'visible', 'interaction', 'never']);

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
  const triggers = new Array<HydrateTrigger>();
  const parts = splitTopLevel(source);
  for (let i = 0; i < parts.length; i++) {
    const { text, start } = parts[i];
    const span = { start: offset + start, end: offset + start + text.length };
    if (!text) {
      throw new Error('@hydrate needs a trigger: load, idle, visible, interaction, never, or when followed by an expression', { cause: span });
    }

    const when = /^when\s+/.exec(text);
    const trigger: HydrateTrigger = when
      ? { kind: 'when', expression: text.slice(when[0].length), expressionNode: validateExpression(text.slice(when[0].length), span.start + when[0].length).node, span }
      : { kind: toKeywordTrigger(text, span), span };
    if (triggers.some(({ kind }) => kind === trigger.kind)) {
      throw new Error(`The trigger "${trigger.kind}" is declared twice`, { cause: span });
    }

    triggers.push(trigger);
  }

  const never = triggers.find(({ kind }) => kind === 'never');
  if (never && triggers.length > 1) {
    throw new Error('The trigger "never" stands alone: any other trigger would hydrate the content', { cause: never.span });
  }

  return triggers;
}

/**
 * Returns the trigger a keyword names.
 *
 * @param text - The keyword.
 * @param span - Where it is written.
 * @returns The kind of the trigger.
 * @throws When the keyword names no trigger.
 */
function toKeywordTrigger(text: string, span: Span): Exclude<HydrateTrigger['kind'], 'when'> {
  if (!KEYWORD_TRIGGERS.has(text)) {
    throw new Error(`Unknown @hydrate trigger "${text}": use load, idle, visible, interaction, never, or when followed by an expression`, { cause: span });
  }

  return text as Exclude<HydrateTrigger['kind'], 'when'>;
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
