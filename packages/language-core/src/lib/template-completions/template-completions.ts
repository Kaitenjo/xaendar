import { type ComponentOrDirectiveMetadata, getBindingContext, getImportContext, getImportInsertion, getImportPathContext, getSelectorContext, type ImportInsertion, resolveShimPosition, type Span } from '@xaendar/compiler';
import { dirname } from 'node:path';
import { type CompletionEntry, ScriptElementKind } from 'typescript';
import { resolveImportCandidates, resolveModuleMetadatas, resolveTemplateImports, type TemplateAnalysis } from '../template-analysis/template-analysis';
import { listModuleEntries } from '../utils/module-entries/module-entries.utils';
import { toModulePath } from '../utils/module-path/module-path.utils';
import { resolvePosixPath } from '../utils/path/path.utils';

/**
 * A completion proposed in a template.
 */
export type TemplateCompletion = Pick<CompletionEntry, 'name' | 'sortText'> & {
  /**
   * What the completion is: a kind of TypeScript, `event` for an event of a component or directive, `component` or
   * `directive` for the selector of an imported one, or the class of one that can be imported.
   */
  readonly kind: CompletionEntry['kind'] | 'event' | 'component' | 'directive';
  /**
   * A short text shown next to the completion, e.g. the selector of the component or directive it names.
   */
  readonly detail?: string;
  /**
   * The span of the template the completion replaces, `undefined` for the word at the offset.
   */
  readonly replacementSpan?: Span;
  /**
   * The changes to apply to the template together with the completion, e.g. the `@import` of the component it names.
   */
  readonly additionalEdits?: readonly ImportInsertion[];
};

/**
 * Asks TypeScript the completions at an offset of a template, through the position of the shim it is mapped onto:
 * the members of the component, of an object, the variables of the template in scope.
 *
 * @param analysis - The analysis of the template.
 * @param offset - The offset in the template.
 * @returns The completions, none if the offset is not in an expression.
 */
export function getTemplateCompletions({ typeCheck, languageService, shimPath, bodyLineOffset }: TemplateAnalysis, offset: number): TemplateCompletion[] {
  const shimPosition = resolveShimPosition(typeCheck.mappingTable, offset);
  const shimFile = languageService.getProgram()?.getSourceFile(shimPath);
  if (!shimPosition || !shimFile) {
    return [];
  }

  const position = shimFile.getPositionOfLineAndCharacter(shimPosition.line + bodyLineOffset, shimPosition.character);
  const completions = languageService.getCompletionsAtPosition(shimPath, position, {});
  return completions?.entries.map(({ name, kind, sortText }) => ({ name, kind, sortText })) ?? [];
}

/**
 * Proposes the bindings of a component or directive at an offset of a template where the name of an attribute or
 * event is being written, read from the source itself, so that they are proposed while the template doesn't compile:
 * - on the name of an attribute: the inputs of the component, or of the directive whose parentheses hold it, then
 *   its events, between parentheses;
 * - on the name of an event, after its `(`: the events.
 *
 * @param metadatas - The metadata of the components and directives imported by the template.
 * @param source - The current source of the template.
 * @param offset - The offset in the template.
 * @returns The completions, none on an element that is not an imported component, `undefined` if the offset is not
 *   on the name of an attribute or event.
 */
export function getTemplateBindingCompletions(metadatas: readonly ComponentOrDirectiveMetadata[], source: string, offset: number): TemplateCompletion[] | undefined {
  const context = getBindingContext(source, offset);
  if (!context) {
    return undefined;
  }

  const { kind, tagName, directive, span } = context;
  const owner = metadatas.find(metadata => directive === undefined
    ? metadata.type === 'component' && metadata.selector === tagName
    : metadata.type === 'directive' && metadata.selector === directive);
  if (!owner) {
    return [];
  }

  const events = [...owner.events.keys()].map((name): TemplateCompletion => ({ name: kind === 'event' ? name : `(${name})`, kind: 'event', sortText: '1', replacementSpan: span }));
  if (kind === 'event') {
    return events;
  }

  const properties = [...owner.properties.keys()].map((name): TemplateCompletion => ({ name, kind: ScriptElementKind.memberVariableElement, sortText: '0', replacementSpan: span }));
  return [...properties, ...events];
}

/**
 * Proposes the bindings of a component or directive like {@link getTemplateBindingCompletions}, reading the
 * components and directives from the `@import` statements of the current source instead of an analysis, so that they are
 * proposed while the template doesn't compile, and even if it never did.
 *
 * @param templatePath - The path of the template.
 * @param source - The current source of the template.
 * @param offset - The offset in the template.
 * @returns The completions, none on an element that is not an imported component, `undefined` if the offset is not
 *   on the name of an attribute or event.
 */
export async function getTemplateSourceBindingCompletions(templatePath: string, source: string, offset: number): Promise<TemplateCompletion[] | undefined> {
  // The imports are only resolved on the name of a binding
  if (!getBindingContext(source, offset)) {
    return undefined;
  }

  return getTemplateBindingCompletions(await resolveTemplateImports(templatePath, source), source, offset);
}

/**
 * Proposes the selectors of the components and directives where one is being written: the components after the `<` of
 * an opening tag, the directives after the `@@` or the `*` of a binding. The ones imported by the template come first,
 * read from the `@import` statements of the current source, so that they are proposed while the template doesn't
 * compile; then the ones of the project it doesn't import yet, which add their `@import` to the template when chosen.
 *
 * @param templatePath - The path of the template.
 * @param source - The current source of the template.
 * @param offset - The offset in the template.
 * @returns The completions, none when nothing is imported and the project declares nothing else, `undefined` if the
 *   offset is not on a selector.
 */
export async function getTemplateSelectorCompletions(templatePath: string, source: string, offset: number): Promise<TemplateCompletion[] | undefined> {
  const context = getSelectorContext(source, offset);
  if (!context) {
    return undefined;
  }

  const { kind, span } = context;
  const imported = await resolveTemplateImports(templatePath, source);
  const importedSelectors = new Set<string>();
  const completions = new Array<TemplateCompletion>();
  for (let i = 0; i < imported.length; i++) {
    const { type, selector } = imported[i];
    if (type === kind) {
      importedSelectors.add(selector);
      completions.push({ name: selector, kind, sortText: '0', replacementSpan: span });
    }
  }

  const candidates = await resolveImportCandidates(templatePath);
  if (candidates) {
    const templateDir = dirname(templatePath);
    for (let i = 0; i < candidates.length; i++) {
      const { fileName, metadata: { type, selector, className } } = candidates[i];
      if (type === kind && !importedSelectors.has(selector)) {
        const path = toModulePath(templateDir, fileName);
        completions.push({ name: selector, kind, detail: `${className} - ${path}`, sortText: '1', replacementSpan: span, additionalEdits: [getImportInsertion(source, path, className)] });
      }
    }
  }

  return completions;
}

/**
 * Proposes the components and directives a module declares where a symbol is being written between the braces of an
 * `@import` statement, the ones the statement already imports excluded.
 *
 * @param templatePath - The path of the template.
 * @param source - The current source of the template.
 * @param offset - The offset in the template.
 * @returns The completions, none if the module cannot be resolved, `undefined` if the offset is not on a symbol of an `@import`.
 */
export async function getTemplateImportCompletions(templatePath: string, source: string, offset: number): Promise<TemplateCompletion[] | undefined> {
  const context = getImportContext(source, offset);
  if (!context) {
    return undefined;
  }

  const { path, span, imported } = context;
  const metadatas = await resolveModuleMetadatas(templatePath, path);
  if (!metadatas?.length) {
    return [];
  }

  return metadatas
    .filter(({ className }) => !imported.includes(className))
    .map(({ className, type, selector }): TemplateCompletion => ({ name: className, kind: type, detail: selector, sortText: '0', replacementSpan: span }));
}

/**
 * Proposes what the path of the module of an `@import` statement can continue with where one of its segments is being
 * written: `./` and `../` for the first one, the modules and the directories of the directory written so far for the
 * next ones. Only relative paths are proposed: the others cannot be resolved (see `resolveModulePath`).
 *
 * @param templatePath - The path of the template.
 * @param source - The current source of the template.
 * @param offset - The offset in the template.
 * @returns The completions, `undefined` if the offset is not in the path of an `@import`.
 */
export function getTemplateImportPathCompletions(templatePath: string, source: string, offset: number): TemplateCompletion[] | undefined {
  const context = getImportPathContext(source, offset);
  if (!context) {
    return undefined;
  }

  const { directory, span } = context;
  if (directory === '') {
    return ['./', '../'].map((name): TemplateCompletion => ({ name, kind: ScriptElementKind.directory, sortText: '0', replacementSpan: span }));
  }

  if (!directory.startsWith('.')) {
    return [];
  }

  return listModuleEntries(resolvePosixPath(dirname(templatePath), directory)).map(({ name, isDirectory }): TemplateCompletion => ({
    name,
    kind: isDirectory ? ScriptElementKind.directory : ScriptElementKind.scriptElement,
    sortText: isDirectory ? '0' : '1',
    replacementSpan: span
  }));
}
