import { Span } from '../../../types/span.type.js';
import type { LineMapping } from '../../types/line-mapping.type.js';
import type { TemplatePosition } from '../../types/template-position.type.js';
import { TypeCheckResult } from '../../types/type-checker-result.type.js';

/**
 * Finds the narrowest mapping containing a {line, character} position in the generated shim (0-based, same
 * convention as `ts.getLineAndCharacterOfPosition`): an identifier of an expression rather than the whole
 * expression, when both contain the position.
 *
 * @param table - The mapping table of the shim.
 * @param position - The position in the shim body.
 * @returns The narrowest mapping containing the position, or `undefined` if none does.
 */
export function findTemplateMapping(table: TypeCheckResult['mappingTable'], position: TemplatePosition): LineMapping | undefined {
  const mappings = table.get(position.line);
  if (!mappings?.length) {
    return undefined;
  }

  let narrowest: LineMapping | undefined;

  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i];
    const contains = position.character >= mapping.columnStart && position.character < mapping.columnEnd;
    if (contains && (!narrowest || width(mapping) < width(narrowest))) {
      narrowest = mapping;
    }
  }

  return narrowest;
}

/**
 * Given a {line, character} position in the generated shim (0-based, same
 * convention as `ts.getLineAndCharacterOfPosition`), resolves the
 * corresponding span in the original template: the one of the narrowest mapping containing the position
 * (see {@link findTemplateMapping}), or of the closest mapping of the line when none contains it.
 *
 * Returns `undefined` if the line has no mapping at all (e.g. a purely
 * structural/boilerplate line: `function typeCheck() {`, `}`, the
 * unmapped part of `for (...) {`, etc.) — in that case it's best to fall
 * back to the nearest enclosing node, if tracked elsewhere, or to show the
 * "raw" error on the shim line itself.
 */
export function resolveTemplateSpan(table: TypeCheckResult['mappingTable'], position: TemplatePosition): Span | undefined {
  const mappings = table.get(position.line);
  if (mappings) {
    const narrowest = findTemplateMapping(table, position);
    if (narrowest) return narrowest.original;

    return mappings.reduce((closest, mapping) => {
      const dist = Math.min(Math.abs(position.character - mapping.columnStart), Math.abs(position.character - mapping.columnEnd));
      const closestDist = Math.min(Math.abs(position.character - closest.columnStart), Math.abs(position.character - closest.columnEnd));
      return dist < closestDist ? mapping : closest;
    }).original;
  }
}

/**
 * Converts an offset of the template into the {line, character} position of the shim body generated from it,
 * the inverse of {@link resolveTemplateSpan}.
 *
 * Only the mappings copying the template one to one, i.e. covering as many columns of the shim as characters
 * of the template (an identifier, a piece of an expression copied verbatim), can convert a single offset:
 * the narrowest one containing the offset is chosen. An offset at the end of a mapping is contained in it too,
 * so that a position right after an identifier (where the completion of a name is asked) is converted as well.
 *
 * @param table - The mapping table of the shim.
 * @param templateOffset - The offset in the template.
 * @returns The position in the shim body, or `undefined` if the offset is not in a mapped expression, such as static HTML text.
 */
export function resolveShimPosition(table: TypeCheckResult['mappingTable'], templateOffset: number): TemplatePosition | undefined {
  let found: { line: number, mapping: LineMapping } | undefined;

  for (const [line, mappings] of table) {
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      const { start, end } = mapping.original;
      const isOneToOne = width(mapping) === end - start;
      if (isOneToOne && templateOffset >= start && templateOffset <= end && (!found || isBetterShimMapping(mapping, found.mapping, templateOffset))) {
        found = { line, mapping };
      }
    }
  }

  return found && { line: found.line, character: found.mapping.columnStart + templateOffset - found.mapping.original.start };
}

/**
 * Tells whether a mapping containing an offset of the template is a better candidate than another one to convert it:
 * a mapping containing the offset strictly, i.e. not just ending at it, wins, then the narrowest one.
 *
 * @param mapping - The candidate mapping.
 * @param current - The best mapping found so far.
 * @param templateOffset - The offset to convert.
 * @returns `true` if `mapping` is the better candidate.
 */
function isBetterShimMapping(mapping: LineMapping, current: LineMapping, templateOffset: number): boolean {
  const strictly = templateOffset < mapping.original.end;
  const currentStrictly = templateOffset < current.original.end;
  return strictly !== currentStrictly ? strictly : width(mapping) < width(current);
}

/**
 * Returns the number of columns of the shim a mapping covers.
 *
 * @param mapping - The mapping.
 * @returns Its width.
 */
function width(mapping: LineMapping): number {
  return mapping.columnEnd - mapping.columnStart;
}
