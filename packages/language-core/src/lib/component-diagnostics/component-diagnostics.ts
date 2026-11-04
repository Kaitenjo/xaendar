import { type ComponentMetadata, describeSelectorConflict, findWebComponentErrors, getWebComponentDeclarations, type WebComponentError } from '@xaendar/compiler';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createSourceFile, ScriptTarget, type SourceFile, type StringLiteral } from 'typescript';
import { resolveDeclarations } from '../template-analysis/template-analysis';
import { findStringOptions } from '../utils/component-options/component-options.utils';
import { normalizeFileName, resolvePosixPath } from '../utils/path/path.utils';

/**
 * Collects the problems of the `@WebComponent` decorators of a component file, the ones the build reports, on their
 * position: the options it cannot read (see `findWebComponentErrors`), a `templateUrl` or a `styleUrl` leading to a
 * missing file, and a selector declared by another component of the TypeScript project of the file, which the build
 * finds only among the components it reaches.
 *
 * @param fileName - The path of the component file.
 * @param text - The current text of the component file, unsaved changes included.
 * @returns The problems found.
 */
export async function getComponentDiagnostics(fileName: string, text: string): Promise<WebComponentError[]> {
  const sourceFile = createSourceFile(fileName, text, ScriptTarget.Latest, true);
  const diagnostics = findMissingFiles(sourceFile);

  const errors = findWebComponentErrors(sourceFile, true);
  if (errors.length) {
    diagnostics.push(...errors);
  }

  // The project is read only for a file declaring a component
  const conflicts = getWebComponentDeclarations(sourceFile).length ? await findSelectorConflicts(fileName) : undefined;
  if (conflicts?.length) {
    diagnostics.push(...conflicts);
  }

  return diagnostics;
}

/**
 * Finds the `templateUrl` and `styleUrl` of the components of a file leading to a missing file.
 *
 * @param sourceFile - The component file.
 * @returns A problem on the value of each option.
 */
function findMissingFiles(sourceFile: SourceFile): WebComponentError[] {
  const diagnostics = new Array<WebComponentError>();
  const componentDir = dirname(sourceFile.fileName);
  const declarations = getWebComponentDeclarations(sourceFile);
  for (let i = 0; i < declarations.length; i++) {
    const options = findStringOptions(declarations[i].decorator, ['templateUrl', 'styleUrl']);
    for (let j = 0; j < options.length; j++) {
      const { name, literal } = options[j];
      const path = resolvePosixPath(componentDir, literal.text);
      if (!existsSync(path)) {
        diagnostics.push({ message: `Could not find ${name === 'templateUrl' ? 'template' : 'style'} at ${path}`, span: toSpan(literal) });
      }
    }
  }

  return diagnostics;
}

/**
 * Finds the selectors of the components of a file that another component of its TypeScript project declares too.
 *
 * @param fileName - The path of the component file.
 * @returns A problem on the selector of each component, `undefined` if the project declares no component.
 */
async function findSelectorConflicts(fileName: string): Promise<WebComponentError[] | undefined> {
  const declarations = await resolveDeclarations(fileName);
  if (!declarations?.size) {
    return undefined;
  }

  const components = new Array<ComponentMetadata>();
  for (const metadatas of declarations.values()) {
    for (const metadata of metadatas.values()) {
      if (metadata.type === 'component') {
        components.push(metadata);
      }
    }
  }

  const key = normalizeFileName(fileName);
  const conflicts = new Array<WebComponentError>();
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const other = normalizeFileName(getOwnerFile(component)) === key ? components.find(({ selector }, index) => selector === component.selector && index !== i) : undefined;
    if (other) {
      const [{ literal }] = findStringOptions(component.typescriptNodes.decorator, ['selector']);
      conflicts.push({ message: describeSelectorConflict(component, { className: other.className, ownerFile: getOwnerFile(other) }), span: toSpan(literal) });
    }
  }

  return conflicts;
}

/**
 * Returns the file declaring a component.
 *
 * @param component - The metadata of the component.
 * @returns The path of the file.
 */
function getOwnerFile({ typescriptNodes: { klass } }: ComponentMetadata): string {
  return klass.getSourceFile().fileName;
}

/**
 * Returns the span of a string literal, quotes included.
 *
 * @param literal - The string literal.
 * @returns The span.
 */
function toSpan(literal: StringLiteral): WebComponentError['span'] {
  return { start: literal.getStart(), end: literal.getEnd() };
}
