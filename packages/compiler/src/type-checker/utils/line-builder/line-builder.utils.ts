import { Span } from '../../../types/span.type.js';
import { Line, LineMapping } from '../../types/generated-line.type.js';

/**
 * A fragment of a line: a static string, or a text mapped onto the span of the template it comes from,
 * optionally together with finer mappings of its parts.
 */
export type LinePart = string | { text: string; span: Span; segments?: readonly LineMapping[] };

/**
 * Marks a text fragment as originating from a span in the template source.
 */
export function mapped(text: string, span: Span): LinePart {
  return { text, span };
}

/**
 * Marks a text fragment as originating from a span in the template source, together with the finer mappings
 * of its parts (e.g. the identifiers of an expression, see `resolveExpression`), whose columns are relative to
 * the start of the fragment. The whole fragment stays mapped onto `span`, as a fallback for the columns no
 * finer mapping covers.
 *
 * @param text - The text of the fragment.
 * @param span - The span of the template the whole fragment comes from.
 * @param segments - The finer mappings of the parts of the fragment.
 * @returns The mapped fragment.
 */
export function mappedSegments(text: string, span: Span, segments: readonly LineMapping[]): LinePart {
  return { text, span, segments };
}

/**
 * Composes a single line from static string parts and mapped parts.
 * Each mapping's column is computed from the length of text already
 * accumulated — no `indexOf`, no risk of matching the wrong occurrence
 * of a repeated substring.
 */
export function line(...parts: LinePart[]): Line {
  let text = '';
  const mappings = new Array<LineMapping>();

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (typeof part === 'string') {
      text = `${text}${part}`;
    } else {
      const columnStart = text.length;
      text = `${text}${part.text}`;
      mappings.push({ columnStart, columnEnd: text.length, original: part.span });

      const { segments } = part;
      if (segments?.length) {
        for (let j = 0; j < segments.length; j++) {
          const { columnStart: segmentStart, columnEnd: segmentEnd, original } = segments[j];
          mappings.push({ columnStart: columnStart + segmentStart, columnEnd: columnStart + segmentEnd, original });
        }
      }
    }
  }

  return mappings.length ? { text, mappings } : { text };
}

/**
 * Purely structural line with no source mappings (boilerplate).
 */
export function plain(text: string): Line {
  return { text };
}

export function indentLines(lines: Line[]): Line[] {
  return lines.map(line => ({
    text: ' '.repeat(2) + line.text,
    mappings: line.mappings?.map(mapping => ({
      ...mapping,
      columnStart: mapping.columnStart + 2,
      columnEnd: mapping.columnEnd + 2,
    })),
  }));
}
