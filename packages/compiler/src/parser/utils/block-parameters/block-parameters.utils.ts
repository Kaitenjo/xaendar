import { TokenType } from '../../../lexer/types/token-type.enum';
import type { Span } from '../../../types/span.type';
import type { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { parseDuration } from '../durations/durations.utils';
import { splitTopLevel } from '../../../lexer/utils/balanced-text/balanced-text.utils';

/**
 * The parameters of a `@placeholder`: the shortest time it is shown.
 */
export const PLACEHOLDER_PARAMETERS = ['minimum'] as const;

/**
 * The parameters of a `@loading`: the time the modules load for before it is shown, and the shortest time it is shown.
 */
export const LOADING_PARAMETERS = ['after', 'minimum'] as const;

/**
 * A parameter of a block: its name, followed by its value.
 */
const PARAMETER = /^([a-z]+)\s+/;

/**
 * Reads the parameters of a `@placeholder` or of a `@loading` following its keyword, when it has parentheses (see
 * {@link parseBlockParameters}).
 *
 * @param cursor - The parser cursor positioned on the keyword.
 * @param block - The keyword of the block, named by the errors.
 * @param names - The names of the parameters the block accepts.
 * @returns The durations, in milliseconds, by the name of the parameters declared, `undefined` without parentheses.
 * @throws When a parameter is unknown or declared twice, or its value is not a duration.
 */
export function readBlockParameters<TName extends string>(cursor: ParserCursor, block: string, names: readonly TName[]): Partial<Record<TName, number>> | undefined {
  const token = cursor.peek();
  if (token.type !== TokenType.CONDITION) {
    return undefined;
  }

  const parameters = parseBlockParameters(token.parts[0], cursor.findConditionSpan(token).start, block, names);
  // consume the parameters
  cursor.advance();
  return parameters;
}

/**
 * Parses the parameters of a `@placeholder` or of a `@loading`, written between their parentheses and separated by
 * commas: each one a name followed by a duration.
 *
 * @example
 * parseBlockParameters('after 100ms, minimum 1s', 10, '@loading', ['after', 'minimum']); // { after: 100, minimum: 1000 }
 *
 * @param source - The text between the parentheses.
 * @param offset - Where the text starts in the template.
 * @param block - The keyword of the block, named by the errors.
 * @param names - The names of the parameters the block accepts.
 * @returns The durations, in milliseconds, by the name of the parameters declared.
 * @throws When a parameter is unknown or declared twice, or its value is not a duration.
 */
export function parseBlockParameters<TName extends string>(source: string, offset: number, block: string, names: readonly TName[]): Partial<Record<TName, number>> {
  const parameters: Partial<Record<TName, number>> = {};
  const parts = splitTopLevel(source);
  for (let i = 0; i < parts.length; i++) {
    const { text, start } = parts[i];
    const span: Span = { start: offset + start, end: offset + start + text.length };
    const match = PARAMETER.exec(text);
    const name = match?.[1] as TName | undefined;
    if (!name || !names.includes(name)) {
      throw new Error(`Unknown parameter "${text}" of ${block}: use ${names.join(' or ')} followed by a duration, such as ${names[0]} 500ms`, { cause: span });
    }

    if (parameters[name] !== undefined) {
      throw new Error(`The parameter "${name}" of ${block} is declared twice`, { cause: span });
    }

    const valueStart = match![0].length;
    parameters[name] = parseDuration(text.slice(valueStart), { start: span.start + valueStart, end: span.end });
  }

  return parameters;
}
