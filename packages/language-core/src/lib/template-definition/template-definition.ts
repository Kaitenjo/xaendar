import { type ComponentOrDirectiveMetadata, type MemberDeclaration, resolveShimPosition, type Span } from '@xaendar/compiler';
import { dirname } from 'node:path';
import type { TemplateAnalysis } from '../template-analysis/template-analysis';
import { resolveModulePath } from '../utils/module-path/module-path.utils';
import { normalizeFileName } from '../utils/path/path.utils';
import { findInnermostSpan, toTemplateSpan } from '../utils/template-span/template-span.utils';
import { walkTemplate } from '../utils/template-walker/template-walker.utils';

/**
 * Where a symbol used in a template is defined: a span of a file, or of the template itself.
 */
export type TemplateDefinition = MemberDeclaration & {
  /**
   * The whole span the definition was requested from, when the part is longer than the word under the cursor,
   * e.g. a tag name with dashes or the path of an `@import`.
   */
  readonly origin?: Span;
};

/**
 * A part of a template whose definition is known without asking TypeScript, e.g. the tag name of a component.
 */
type DefinitionTarget = {
  /**
   * The span of the part in the template.
   */
  readonly span: Span;
  /**
   * The definitions of the part.
   */
  readonly definitions: readonly TemplateDefinition[];
};

/**
 * Finds the definitions of the symbol at an offset of a template:
 * - the name of a symbol imported by `@import`, the tag name of a component, the selector of a directive: the class;
 * - the path of an `@import`: the imported file;
 * - an attribute or an event bound to a component or directive: its `@Property` or `@Event` accessor, inherited ones included;
 * - an identifier of an expression or the handler of an event: what TypeScript finds in the shim, the variables
 *   declared by the template (e.g. the item of a `@for`) being reported in the template itself.
 *
 * @param analysis - The analysis of the template.
 * @param offset - The offset in the template.
 * @returns The definitions found, none if the offset is not on a symbol.
 */
export function getTemplateDefinition(analysis: TemplateAnalysis, offset: number): TemplateDefinition[] {
  const target = findInnermostSpan(collectTargets(analysis), offset);
  return target ? [...target.definitions] : getTypeScriptDefinitions(analysis, offset);
}

/**
 * Collects the parts of a template whose definition is known from the metadata of the components and directives it imports.
 *
 * @param analysis - The analysis of the template.
 * @returns The parts, with their definitions.
 */
function collectTargets({ ast, metadatas, imports, templatePath }: TemplateAnalysis): DefinitionTarget[] {
  const targets = new Array<DefinitionTarget>();
  const add = (span: Span | undefined, declaration: TemplateDefinition | undefined) => {
    if (span && declaration) {
      targets.push({ span, definitions: [{ ...declaration, origin: span }] });
    }
  };

  for (let i = 0; i < imports.length; i++) {
    const { specifier, metadata } = imports[i];
    add(specifier.importedSpan, getClassDefinition(metadata));
    add(specifier.localSpan, getClassDefinition(metadata));
  }

  walkTemplate(ast, metadatas, {
    importNode: node => add(node.pathSpan, getModuleDefinition(dirname(templatePath), node.path)),
    element: (node, component) => {
      add(node.nameSpan, component && getClassDefinition(component));
      add(node.closeNameSpan, component && getClassDefinition(component));
    },
    directive: (node, directive) => add(node.selectorSpan, directive && getClassDefinition(directive)),
    attribute: (node, owner) => add(node.nameSpan, owner?.properties.get(node.name)?.declaration),
    event: (node, owner) => add(node.nameSpan, owner?.events.get(node.name)?.declaration)
  });

  return targets;
}

/**
 * Returns where the class of a component or directive is defined.
 *
 * @param metadata - The metadata of the component or directive.
 * @returns The span of the name of the class in its file.
 */
function getClassDefinition({ typescriptNodes: { klass } }: ComponentOrDirectiveMetadata): TemplateDefinition {
  const sourceFile = klass.getSourceFile();
  return { fileName: sourceFile.fileName, span: { start: klass.name.getStart(sourceFile), end: klass.name.getEnd() } };
}

/**
 * Returns the file imported by an `@import` statement.
 *
 * @param templateDir - The directory of the template.
 * @param path - The path of the `@import`.
 * @returns The start of the imported file, `undefined` if it cannot be resolved.
 */
function getModuleDefinition(templateDir: string, path: string): TemplateDefinition | undefined {
  const fileName = resolveModulePath(templateDir, path);
  return fileName ? { fileName, span: { start: 0, end: 0 } } : undefined;
}

/**
 * Asks TypeScript the definitions of the identifier of the shim the offset of the template is mapped onto.
 *
 * @param analysis - The analysis of the template.
 * @param offset - The offset in the template.
 * @returns The definitions, those inside the shim converted into spans of the template.
 */
function getTypeScriptDefinitions({ typeCheck, languageService, shimPath, bodyLineOffset, templatePath }: TemplateAnalysis, offset: number): TemplateDefinition[] {
  const shimPosition = resolveShimPosition(typeCheck.mappingTable, offset);
  const shimFile = languageService.getProgram()?.getSourceFile(shimPath);
  if (!shimPosition || !shimFile) {
    return [];
  }

  const position = shimFile.getPositionOfLineAndCharacter(shimPosition.line + bodyLineOffset, shimPosition.character);
  const shimKey = normalizeFileName(shimPath);
  const definitions = new Array<TemplateDefinition>();

  const shimDefinitions = languageService.getDefinitionAtPosition(shimPath, position) ?? [];
  for (let i = 0; i < shimDefinitions.length; i++) {
    const { fileName, textSpan } = shimDefinitions[i];
    if (normalizeFileName(fileName) !== shimKey) {
      definitions.push({ fileName, span: { start: textSpan.start, end: textSpan.start + textSpan.length } });
    } else {
      // A variable declared by the template, e.g. the item of a `@for`: its declaration is mapped onto the template
      const span = toTemplateSpan(typeCheck, shimFile, bodyLineOffset, textSpan.start, textSpan.length);
      if (span) {
        definitions.push({ fileName: templatePath, span });
      }
    }
  }

  return definitions;
}
