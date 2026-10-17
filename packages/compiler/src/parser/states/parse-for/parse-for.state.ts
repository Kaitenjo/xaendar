import { slice } from '@xaendar/common';
import { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { ForToken } from '../../../lexer/types/tokens/for-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode, MaybeASTNodeWithSpan } from '../../types/ast.type';
import { ForExpression } from '../../types/for-expression.type';
import { ASTNodeType } from '../../types/node.enum';
import { ForImplicitVariables } from '../../types/nodes/for-implicit-variables';
import type { Span } from '../../../types/span.type';
import { ForNode } from '../../types/nodes/for-node.type';
import { isIdentifier } from 'typescript';
import { getTemplateSpan, validateExpression } from '../../utils/expression-validator/expression-validator';
import { getForVariables } from '../../utils/for-variables/for-variables.utils';
import { isValidIdentifier } from '../../utils/identifier/identifier.utils';
import { parseBlockChildren } from '../parse-block-children/parse-block-children.state';

/**
 * Parses a `@for` directive, consuming the FOR token, the CONDITION token,
 * the BLOCK_OPEN token, and all child nodes until BLOCK_CLOSE.
 *
 * @param cursor - Parser cursor positioned at the FOR token.
 * @param parseNode - Parser function for recursive child parsing.
 * @param _token - The FOR token (consumed for position advancement).
 * @returns The parsed `ForNode`.
 */
export function parseForControlFlow(cursor: ParserCursor, parseNode: NoArgsFunction<ASTNode | undefined>, _token: ForToken): MaybeASTNodeWithSpan<ForNode> {
  // consume FOR
  cursor.advance();

  const conditionToken = cursor.peek();
  if (conditionToken.type !== TokenType.CONDITION) {
    throw `Expected CONDITION after FOR, got ${TokenType[conditionToken.type]}`;
  }
  const expression = parseForExpression(conditionToken.parts[0], cursor.findConditionSpan(conditionToken).start);

  // consume CONDITION and BLOCK_OPEN
  cursor.advance(2);

  const children = parseBlockChildren(cursor, parseNode);

  return { type: ASTNodeType.For, ...expression, children };
}

/**
 * A section of an `@for` expression, delimited by semicolons.
 */
type ForSection = {
  /**
   * The text of the section, without the `;` separators and the leading spaces.
   */
  text: string;
  /**
   * The offset of the section in the template.
   */
  offset: number;
};

/**
 * Parses the body of an `@for` block into a structured {@link ForExpression}.
 *
 * The expected format is:
 * ```
 * [item of ]iterable[; track expr][; alias = $implicit, ...]
 * ```
 *
 * The iterable is either an array or a number `n`, iterated as `0, 1, ..., n - 1`.
 * The `item of` part is optional: without it the loop declares no item alias and
 * only the implicit variables are available (e.g. `@for (10; track $index())`).
 * The `track` part is optional too: it defaults to the item alias or, when there
 * is none, to `$index` (or its alias).
 *
 * @param source - The raw string content of the `@for(...)` expression.
 * @param offset - The offset of `source` in the template, used for the spans of the expression parts.
 * @returns A {@link ForExpression} object.
 * @throws When `source` is not a valid `@for` expression.
 */
export function parseForExpression(source: string, offset = 0): ForExpression {
  const sections = splitForSections(source, offset);

  if (sections.length < 1) {
    throw '@for requires at least one of these forms: "item of items()" or "numberItems()".';
  }

  // ---- Section 1: "item of items" or "items" ----
  const { text: iterSection, offset: iterOffset } = trimSection(sections[0]);
  const ofIndex = iterSection.indexOf(' of ');

  let itemAlias: string | undefined;
  let itemAliasSpan: Span | undefined;
  let iterable: ForSection = { text: iterSection, offset: iterOffset };

  if (ofIndex !== -1) {
    itemAlias = slice(iterSection, 0, ofIndex).trim();
    itemAliasSpan = { start: iterOffset, end: iterOffset + itemAlias.length };
    iterable = trimSection({ text: slice(iterSection, ofIndex + 4), offset: iterOffset + ofIndex + 4 });

    if (!isValidIdentifier(itemAlias)) {
      throw `'${itemAlias}' is not a valid item alias.`;
    }
  }

  // Validate the iterable as a JS expression.
  const iterValidation = validateExpression(iterable.text, iterable.offset);

  // ---- Section 2 (optional): "i = $index, l = $last" ----
  // Parsed before the track section, whose fallback may depend on the `$index` alias.
  const implicitAliases = new Map<ForImplicitVariables, string>;
  const implicitAliasSpans = new Map<ForImplicitVariables, Span>;

  if (sections.length >= 3 && sections[2] !== undefined) {
    parseImplicitAliases(trimSection(sections[2]), implicitAliases, implicitAliasSpans);
  }

  // ---- Section 3 (optional): "track item.id" ----
  // Without it the loop tracks by the value of the item, or of the index when there is no item alias.
  const trackSection = sections[1] && trimSection(sections[1]);
  let trackSource = `${itemAlias ?? implicitAliases.get('$index') ?? '$index'}()`;
  // The default track expression is not written in the template, so it has no offset
  let trackOffset: number | undefined;

  if (trackSection?.text) {
    if (!trackSection.text.startsWith('track ')) {
      throw 'Second section of @for must start with "track".';
    }

    const track = trimSection({ text: slice(trackSection.text, 6), offset: trackSection.offset + 6 });
    trackSource = track.text;
    trackOffset = track.offset;
  }

  const trackValidation = validateExpression(trackSource, trackOffset);
  // The variables of the loop are signals: a key is the value of one of them, not the signal
  const trackNode = trackValidation.node;
  if (isIdentifier(trackNode) && getForVariables({ itemAlias, implicitAliases }).includes(trackNode.text)) {
    throw new Error(`The track expression of a @for reads the item and the implicit variables as signals: call it, e.g. track ${trackNode.text}()`, { cause: getTemplateSpan(trackNode) });
  }


  return {
    itemAlias,
    itemAliasSpan,
    iterableExpression: iterValidation.node,
    iterableSource: iterable.text,
    trackExpression: trackValidation.node,
    trackSource,
    implicitAliases,
    implicitAliasSpans
  };
}

/**
 * Parses the optional third section of an `@for` expression, which declares
 * aliases for implicit loop variables (e.g. `i = $index, l = $last, isEven = $even`).
 *
 * Valid entries are comma-separated pairs in the form `alias = $implicit`.
 *
 * @param section - The trimmed alias-declarations section (everything after the second `;`).
 * @param out - Map to populate with `implicit-variable → alias` entries.
 * @param spans - Map to populate with `implicit-variable → span of the alias` entries.
 * @throws When an entry is not a valid alias declaration.
 */
function parseImplicitAliases({ text, offset }: ForSection, out: Map<ForImplicitVariables, string>, spans: Map<ForImplicitVariables, Span>): void {
  const entries = text.split(',');
  const IMPLICIT_VARIABLES = new Set(['$index', '$last', '$first', '$even', '$odd']);
  let entryOffset = offset;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const { text: trimmed, offset: trimmedOffset } = trimSection({ text: entry, offset: entryOffset });
    // The next entry starts after the comma
    entryOffset += entry.length + 1;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      throw `Invalid alias declaration '${trimmed}'. Expected '$implicit = alias'.`;
    }

    const isImplicitVariable = (value: string): value is ForImplicitVariables => IMPLICIT_VARIABLES.has(value);

    const implicit = slice(trimmed, eqIndex + 1).trim();
    if (!isImplicitVariable(implicit)) {
      throw `'${implicit}' is not a known implicit variable. Known variables: ${[...IMPLICIT_VARIABLES].join(', ')}.`;
    }

    const alias = slice(trimmed, 0, eqIndex).trim();
    if (!isValidIdentifier(alias)) {
      throw `'${alias}' is not a valid alias identifier.`;
    }

    if (out.has(implicit)) {
      throw `'${implicit}' is already aliased in this @for expression.`;
    } else {
      out.set(implicit, alias);
      spans.set(implicit, { start: trimmedOffset, end: trimmedOffset + alias.length });
    }
  }
}

/**
 * Trims a section of an `@for` expression, moving its offset past the leading whitespace.
 *
 * @param section - The section to trim.
 * @returns The trimmed section.
 */
function trimSection({ text, offset }: ForSection): ForSection {
  const trimmedStart = text.trimStart();
  return { text: trimmedStart.trimEnd(), offset: offset + text.length - trimmedStart.length };
}

/**
 * Splits the raw `@for(...)` body into its semicolon-delimited sections,
 * respecting nested brackets and string literals so that semicolons inside
 * them are never treated as section separators.
 *
 * Example input:  `"item of items; track item.id; i = $index"`
 * Example output: `["item of items", "track item.id", "i = $index"]`, each with its offset
 *
 * @param source - The raw content of the `@for(...)` expression.
 * @param offset - The offset of `source` in the template.
 * @returns An array of sections (without the `;` separators and the leading spaces), each with its offset in the template.
 */
function splitForSections(source: string, offset: number): ForSection[] {
  const sections = new Array<ForSection>;
  let current = '';
  let currentStart = 0;
  let depth = 0;
  let inString: '"' | "'" | '`' | null | undefined;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (!current && char === ' ') {
      continue;
    }

    if (!current) {
      currentStart = i;
    }

    if (inString) {
      current = `${current}${char}`;
      if (char === inString && source[i - 1] !== '\\') {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      current = `${current}${char}`;
      continue;
    }

    // Brackets — do not split inside nested bracket pairs.
    if (char === '(' || char === '[' || char === '{') {
      depth++;
      current = `${current}${char}`;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth--;
      current = `${current}${char}`;
      continue;
    }

    // Section separator — only split when not inside brackets or strings.
    if (char === ';' && depth === 0) {
      sections.push({ text: current, offset: offset + currentStart });
      current = '';
      continue;
    }

    current = `${current}${char}`;
  }

  // Push the last section even when it has no trailing `;`.
  if (current.trim().length) {
    sections.push({ text: current, offset: offset + currentStart });
  }

  return sections;
}