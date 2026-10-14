import { type ComponentMetadata, extractComponentsMetadataFromSourceFile, type Span } from '@xaendar/compiler';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createSourceFile, isIdentifier, isObjectLiteralExpression, isPropertyAssignment, isStringLiteral, ScriptTarget, type StringLiteral } from 'typescript';
import type { TemplateDefinition } from '../template-definition/template-definition';
import { resolvePosixPath } from '../utils/path/path.utils';
import { findInnermostSpan } from '../utils/template-span/template-span.utils';

/**
 * A part of a `@WebComponent` decorator leading to the files of its component.
 */
type ComponentTarget = {
  /**
   * The span of the part in the component file.
   */
  readonly span: Span;
  /**
   * The urls, relative to the component file, of the files the part leads to.
   */
  readonly urls: ReadonlyArray<ComponentMetadata['styleUrl']>;
};

/**
 * Finds the files a `@WebComponent` decorator of a component file leads to:
 * - its name (`@` included): the template and, if declared, the style of the component;
 * - the value of its `templateUrl` or `styleUrl`: the template or the style.
 *
 * @param fileName - The path of the component file.
 * @param text - The text of the component file.
 * @param offset - The offset in the component file.
 * @returns The start of the files, those missing on disk excluded, none if the offset is not on one of those parts.
 */
export async function getComponentDefinition(fileName: string, text: string, offset: number): Promise<TemplateDefinition[]> {
  const components = await extractComponents(fileName, text);
  if (!components?.length) {
    return [];
  }

  const targets = components.flatMap(({ templateUrl, styleUrl, typescriptNodes: { decorator } }) => [
    { span: { start: decorator.getStart(), end: decorator.expression.expression.getEnd() }, urls: [templateUrl, styleUrl] },
    ...getUrlLiterals(decorator).map((literal): ComponentTarget => ({ span: { start: literal.getStart(), end: literal.getEnd() }, urls: [literal.text] }))
  ]);
  const target = findInnermostSpan(targets, offset);

  return target ? resolveUrls(fileName, target.urls).map(path => ({ fileName: path, span: { start: 0, end: 0 }, origin: target.span })) : [];
}

/**
 * Extracts the metadata of the components declared in a component file.
 *
 * @param fileName - The path of the component file.
 * @param text - The text of the component file.
 * @returns The metadata of the components, `undefined` if they cannot be extracted.
 */
async function extractComponents(fileName: string, text: string): Promise<ComponentMetadata[] | undefined> {
  try {
    const metadatas = await extractComponentsMetadataFromSourceFile(createSourceFile(fileName, text, ScriptTarget.Latest, true));
    if (metadatas?.size) {
      return Array.from(metadatas.values());
    }
  } catch {
    // The metadata of a component whose properties clash cannot be extracted
  }
}

/**
 * Returns the string literals assigned to the `templateUrl` and `styleUrl` of a `@WebComponent` decorator.
 *
 * @param decorator - The decorator.
 * @returns The literals, in the order they are declared.
 */
function getUrlLiterals(decorator: ComponentMetadata['typescriptNodes']['decorator']): StringLiteral[] {
  return decorator.expression.arguments
    .filter(isObjectLiteralExpression)
    .flatMap(({ properties }) => properties)
    .filter(isPropertyAssignment)
    .filter(property => isIdentifier(property.name) && ['templateUrl', 'styleUrl'].includes(property.name.text))
    .map(({ initializer }) => initializer)
    .filter(isStringLiteral);
}

/**
 * Resolves urls relative to a component file.
 *
 * @param fileName - The path of the component file.
 * @param urls - The urls, the missing ones undefined.
 * @returns The paths of the files, in posix format, those missing on disk excluded.
 */
function resolveUrls(fileName: string, urls: ReadonlyArray<ComponentMetadata['styleUrl']>): string[] {
  const componentDir = dirname(fileName);
  return urls
    .filter(url => url !== undefined)
    .map(url => resolvePosixPath(componentDir, url))
    .filter(path => existsSync(path));
}
