import { type ASTNode, findTemplateMapping, type Span, TemplateError, type TypeCheckResult } from '@xaendar/compiler';
import type { SourceFile } from 'typescript';
import { walkTemplate } from '../template-walker/template-walker.utils';

/**
 * Converts a position of a shim into the span of the template it comes from: the exact characters when the
 * narrowest mapping containing the position copies the template one to one, the span of the whole mapping otherwise.
 *
 * @param typeCheck - The type-check body of the shim, with its mapping table.
 * @param shimFile - The source file of the shim.
 * @param bodyLineOffset - The line of the shim the type-check body starts at.
 * @param start - The position in the shim.
 * @param length - The number of characters starting at the position, e.g. the length of a diagnostic.
 * @returns The span of the template, or `undefined` if the position is not mapped onto the template.
 */
export function toTemplateSpan(typeCheck: TypeCheckResult, shimFile: SourceFile, bodyLineOffset: number, start: number, length: number): Span | undefined {
  const { line, character } = shimFile.getLineAndCharacterOfPosition(start);
  const mapping = findTemplateMapping(typeCheck.mappingTable, { line: line - bodyLineOffset, character });
  if (!mapping) {
    return undefined;
  }

  const { original, columnStart, columnEnd } = mapping;
  if (columnEnd - columnStart !== original.end - original.start) {
    return original;
  }

  const templateStart = original.start + character - columnStart;
  return { start: templateStart, end: Math.min(templateStart + length, original.end) };
}

/**
 * Returns the span an error of the compiler is best reported on: the name of the element, directive, attribute
 * or event whose whole span the error refers to (e.g. a missing required property is reported on the tag name,
 * not on the whole element), or the span of the error itself.
 *
 * @param error - The error.
 * @param ast - The top-level nodes of the template, when it could be parsed.
 * @returns The span of the error, the start of the template for an error without span.
 */
export function getErrorSpan(error: Error, ast: readonly ASTNode[] | undefined): Span {
  if (!(error instanceof TemplateError)) {
    return { start: 0, end: 0 };
  }

  const { span } = error;
  const named = new Array<{ span: Span, name: Span }>();

  if (ast?.length) {
    walkTemplate(ast, [], {
      element: node => {
        named.push({ span: node.span, name: node.nameSpan });
      },
      directive: node => {
        named.push({ span: node.span, name: node.selectorSpan });
      },
      attribute: node => {
        named.push({ span: node.span, name: node.nameSpan });
      },
      classBinding: node => {
        named.push({ span: node.span, name: node.nameSpan });
      },
      event: node => {
        named.push({ span: node.span, name: node.nameSpan });
      }
    });
  }

  return named.find(node => node.span.start === span.start && node.span.end === span.end)?.name ?? span;
}

/**
 * Returns the name of the innermost element containing an offset of the template, where an error that cannot
 * be located more precisely is reported.
 *
 * @param ast - The top-level nodes of the template.
 * @param offset - The offset.
 * @returns The span of the tag name of the innermost element containing the offset, if any.
 */
export function getEnclosingElementName(ast: readonly ASTNode[], offset: number): Span | undefined {
  const elements = new Array<{ span: Span, name: Span }>();
  walkTemplate(ast, [], {
    element: node => {
      elements.push({ span: node.span, name: node.nameSpan });
    }
  });

  return findInnermostSpan(elements, offset)?.name;
}

/**
 * Finds the innermost span, among the given ones, containing an offset of the template.
 *
 * @param spans - The spans.
 * @param offset - The offset.
 * @returns The narrowest span containing the offset, ends included, if any.
 */
export function findInnermostSpan<T extends { span: Span }>(spans: readonly T[], offset: number): T | undefined {
  let innermost: T | undefined;

  for (let i = 0; i < spans.length; i++) {
    const { span } = spans[i];
    if (offset >= span.start && offset <= span.end && (!innermost || span.end - span.start < innermost.span.end - innermost.span.start)) {
      innermost = spans[i];
    }
  }

  return innermost;
}
