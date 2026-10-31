import { type ComponentOrDirectiveMetadata, getBindingContext, getExpressionContext, getImportContext, getImportInsertion, getImportPathContext, getKeywordContext, getSelectorContext, type KeywordContext, resolveShimPosition, type Span } from '@xaendar/compiler';
import { dirname } from 'node:path';
import { forEachChild, type Identifier, isClassDeclaration, isImportDeclaration, isNamespaceImport, isVariableStatement, type Node, ScriptElementKind, type Symbol, SymbolFlags } from 'typescript';
import { analyzeCompletionTemplate, resolveExportCandidates, resolveImportCandidates, resolveModuleExports, resolveModuleMetadatas, resolveTemplateImports } from '../template-analysis/template-analysis';
import type { TemplateAnalysis } from '../types/template-analysis.type';
import { listModuleEntries } from '../utils/module-entries/module-entries.utils';
import { toModulePath } from '../utils/module-path/module-path.utils';
import { normalizeFileName, resolvePosixPath } from '../utils/path/path.utils';
import { getSymbolKind } from '../utils/symbol-kind/symbol-kind.utils';
import type { TemplateCompletion } from '../types/template-completion.type';
import type { ShimPosition } from '../types/shim-position.type';

/**
 * The snippet writing the block of each keyword.
 */
const KEYWORD_SNIPPETS: Readonly<Record<KeywordContext['keywords'][number], string>> = {
  'if': '@if ($1) {\n\t$0\n}',
  'else': '@else {\n\t$0\n}',
  'else if': '@else if ($1) {\n\t$0\n}',
  'for': '@for (item of $1) {\n\t$0\n}',
  'switch': '@switch ($1) {\n\t@case ($2) {\n\t\t$0\n\t}\n}',
  'case': '@case ($1) {\n\t$0\n}',
  'default': '@default {\n\t$0\n}',
  'import': '@import { $2 } from \'$1\';',
  'render': '@render $1($0)',
  'let': '@let $1 = $0;'
};

/**
 * The keywords whose snippet starts on an expression or on the path of a module, which have completions of their own:
 * the completions are proposed there again once the snippet is inserted.
 */
const RETRIGGERING_KEYWORDS: ReadonlySet<KeywordContext['keywords'][number]> = new Set(['if', 'else if', 'for', 'switch', 'import']);

/**
 * The kinds of the symbols that are only types, which an expression cannot read.
 */
const TYPE_KINDS: ReadonlySet<TemplateCompletion['kind']> = new Set([ScriptElementKind.interfaceElement, ScriptElementKind.typeElement]);

/**
 * Asks TypeScript the completions at an offset of a template, through the position of the shim it is mapped onto:
 * the members of the component, of an object, the variables of the template in scope.
 *
 * @param analysis - The analysis of the template.
 * @param offset - The offset in the template.
 * @returns The completions, none if the offset is not in an expression.
 */
export function getTemplateCompletions(analysis: TemplateAnalysis, offset: number): TemplateCompletion[] {
  const shimPosition = findShimPosition(analysis, offset);
  if (!shimPosition) {
    return [];
  }

  const completions = analysis.languageService.getCompletionsAtPosition(analysis.shimPath, shimPosition.position, {});
  return completions?.entries.map(({ name, kind, sortText }) => ({ name, kind, sortText })) ?? [];
}

/**
 * Proposes the completions of an expression being written at an offset of a template, asking TypeScript about the
 * template closed at the offset (see `getExpressionContext`), so that they are proposed while it doesn't compile:
 * - on an identifier read from the component, in an interpolation (in the text or as the value of an attribute), in
 *   the arguments of the method of an event or in the condition of `@if`, `@else if`, `@for` or `@switch`: the variables of the template in scope (`$event` in the arguments), in
 *   the order they are declared, then the symbols the template imports together with the fields and then the methods
 *   of the classes of the component, then the ones inherited from `CustomElement`, then the ones inherited from the
 *   DOM, then the exports of the files of the project the template doesn't import yet, which add their `@import` to
 *   the template when chosen;
 * - on a variable of the template, or the beginning of `$event`: the variables of the template in scope;
 * - after the dot of an object: its members;
 * - on the name of the method an event calls: the methods of the component, in the same order, and the functions the
 *   template imports or could import.
 *
 * After the `(` of a call, which triggers the completions, nothing is proposed, except in the arguments of the
 * method of an event, where `$event` can be passed, and after the `(` opening a condition.
 *
 * @param templatePath - The path of the template.
 * @param source - The current source of the template.
 * @param offset - The offset in the template.
 * @param components - The files of the components using the template, mapped to the names of their classes using it.
 * @param triggerCharacter - The character whose typing triggered the completion, if any.
 * @returns The completions, none if the closed template doesn't compile either, `undefined` if the offset is not in an expression.
 */
export async function getTemplateExpressionCompletions(templatePath: string, source: string, offset: number, components: ReadonlyMap<string, readonly string[]>, triggerCharacter?: string): Promise<TemplateCompletion[] | undefined> {
  const context = getExpressionContext(source, offset);
  if (!context) {
    return undefined;
  }

  const { kind, span } = context;
  const analysis = triggerCharacter !== '(' || kind === 'argument' || kind === 'condition' || kind === 'render' ? await analyzeCompletionTemplate(templatePath, context.source, components) : undefined;
  // The identifier is not in the type-check body of an element failing type-checking, e.g. missing a required property
  const identifier = analysis && findShimPosition(analysis, span.start);
  if (!identifier) {
    return [];
  }

  const { shimFile: { text }, position } = identifier;
  const isMember = text[position - 1] === '.';
  // The completions replace the identifier written so far, `$` included, which is not part of a word of the editor
  const allCompletions = isMember ? getTemplateCompletions(analysis, offset).map((completion): TemplateCompletion => ({ ...completion, replacementSpan: span })) : [];
  if (isMember && !text.endsWith('root.', position)) {
    return allCompletions;
  }

  // The members of the component, sorted by the class declaring them: an event calls a method
  const origins = getMemberOrigins(analysis, identifier);
  const members = new Array<TemplateCompletion>();
  for (let i = 0; i < allCompletions.length; i++) {
    const completion = allCompletions[i];
    const isMethod = completion.kind === ScriptElementKind.memberFunctionElement;
    if (kind !== 'handler' || isMethod) {
      members.push({ ...completion, sortText: getMemberSortText(origins.get(completion.name)!, isMethod) });
    }
  }

  /*
    The symbols the template imports, with the members of its classes, then the ones of the project it could import:
    values only, the ones named like a member left out, since importing them would be an error
  */
  const symbols = isMember ? getImportedSymbolCompletions(analysis, identifier, span).concat(getExportCompletions(analysis, templatePath, source, components, span)) : [];
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const isValue = !TYPE_KINDS.has(symbol.kind);
    if (isValue && !origins.has(symbol.name) && (kind !== 'handler' || symbol.kind === ScriptElementKind.functionElement)) {
      members.push(symbol);
    }
  }

  if (kind === 'handler') {
    return members;
  }

  // The variables come first, in the order they are declared (e.g. the item of a `@for`, then its implicit variables)
  const variables = getTemplateNames(analysis, identifier);
  const names = new Set(variables);
  const proposed = variables.map((name, index): TemplateCompletion => ({ name, kind: ScriptElementKind.letElement, sortText: `0${String(index).padStart(3, '0')}`, replacementSpan: span }));
  for (let i = 0; i < members.length; i++) {
    if (!names.has(members[i].name)) {
      proposed.push(members[i]);
    }
  }

  return proposed;
}

/**
 * Proposes the blocks whose keyword is being written after a `@` at an offset of a template (see `getKeywordContext`),
 * as snippets writing the whole block, its condition and body to fill: the item of a `@for` is written as `item`, its
 * iterable is filled first. The completions are proposed again in a condition or in a path once the snippet is inserted.
 *
 * @param source - The current source of the template.
 * @param offset - The offset in the template.
 * @returns The completions, `undefined` if the offset is not on the keyword of a block.
 */
export function getTemplateKeywordCompletions(source: string, offset: number): TemplateCompletion[] | undefined {
  const context = getKeywordContext(source, offset);
  return context?.keywords.map((keyword, index): TemplateCompletion => ({
    name: `@${keyword}`,
    kind: ScriptElementKind.keyword,
    sortText: String(index),
    replacementSpan: context.span,
    snippet: KEYWORD_SNIPPETS[keyword],
    retrigger: RETRIGGERING_KEYWORDS.has(keyword)
  }));
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
 * Proposes what a module exports where a symbol is being written between the braces of an `@import` statement, the
 * ones the statement already imports excluded: its components and directives first, with their selector, then its
 * other exports (functions, constants, enums, classes, types), the default one as `default as …`.
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
  const proposed = new Set(imported);
  const completions = new Array<TemplateCompletion>();
  const metadatas = await resolveModuleMetadatas(templatePath, path);
  if (metadatas?.length) {
    for (let i = 0; i < metadatas.length; i++) {
      const { className, type, selector } = metadatas[i];
      if (!proposed.has(className)) {
        completions.push({ name: className, kind: type, detail: selector, sortText: '0', replacementSpan: span });
      }

      proposed.add(className);
    }
  }

  const exported = resolveModuleExports(templatePath, path);
  if (exported?.length) {
    for (let i = 0; i < exported.length; i++) {
      const { name, kind } = exported[i];
      if (!proposed.has(name)) {
        // The default export needs a name to be imported as
        completions.push(name === 'default'
          ? { name, kind, sortText: '1', replacementSpan: span, snippet: 'default as $1' }
          : { name, kind, sortText: '1', replacementSpan: span });
      }
    }
  }

  return completions;
}

/**
 * Proposes what the path of the module of an `@import` statement can continue with where one of its segments is being
 * written: `./` and `../` for the first one, the modules and the directories of the directory written so far for the
 * next ones. Only relative paths are proposed: the names of the packages and the aliases of the project are written
 * by hand, then resolved as the TypeScript files of the project resolve them (see `resolveModule`).
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

/**
 * Converts an offset of a template into the position of the shim it is mapped onto.
 *
 * @param analysis - The analysis of the template.
 * @param offset - The offset in the template.
 * @returns The shim and the position, `undefined` if the offset is not in an expression or the shim is not in the program.
 */
function findShimPosition({ typeCheck, languageService, shimPath, bodyLineOffset }: TemplateAnalysis, offset: number): ShimPosition | undefined {
  const shimPosition = resolveShimPosition(typeCheck.mappingTable, offset);
  const shimFile = languageService.getProgram()?.getSourceFile(shimPath);
  if (shimPosition && shimFile) {
    return { shimFile, position: shimFile.getPositionOfLineAndCharacter(shimPosition.line + bodyLineOffset, shimPosition.character) };
  }
}

/**
 * Finds the names the template declares in scope at a position of its shim: the ones the type-check body declares (the
 * items of `@for` and their implicit variables, `$event`…), its internal ones (named with `$$` or `__` first) excluded.
 *
 * @param analysis - The analysis of the template.
 * @param shimPosition - The shim and the position in it.
 * @returns The names.
 */
function getTemplateNames({ languageService, bodyLineOffset }: TemplateAnalysis, { shimFile, position }: ShimPosition): string[] {
  const bodyStart = shimFile.getPositionOfLineAndCharacter(bodyLineOffset, 0);
  const isTemplateName = ({ name, valueDeclaration }: Symbol) => valueDeclaration?.getSourceFile() === shimFile && valueDeclaration.getStart() >= bodyStart && !/^(\$\$|__)/.test(name);
  return languageService.getProgram()!.getTypeChecker()
    .getSymbolsInScope(findNode(shimFile, position), SymbolFlags.Variable)
    .filter(isTemplateName)
    .map(({ name }) => name);
}

/**
 * Tells where each member of the components using a template is declared, in the order the members are proposed:
 * `0` for the classes of the components (their own base classes included), `1` for `CustomElement`, `2` for the DOM
 * (the default libraries of TypeScript).
 *
 * @param analysis - The analysis of the template.
 * @param shimPosition - The shim and a position in it, anywhere in the body.
 * @returns The origin of each member, keyed by its name.
 */
function getMemberOrigins({ languageService }: TemplateAnalysis, { shimFile }: ShimPosition): Map<string, number> {
  const program = languageService.getProgram()!;
  const checker = program.getTypeChecker();
  // The shim declares `root` as the components using the template
  const root = shimFile.statements.find(isVariableStatement)!.declarationList.declarations[0];
  const properties = checker.getPropertiesOfType(checker.getTypeAtLocation(root));
  const origins = new Map<string, number>();
  for (let i = 0; i < properties.length; i++) {
    const { name, valueDeclaration } = properties[i];
    const isDom = !valueDeclaration || program.isSourceFileDefaultLibrary(valueDeclaration.getSourceFile());
    const isCustomElement = !isDom && isClassDeclaration(valueDeclaration.parent) && valueDeclaration.parent.name?.text === 'CustomElement';
    origins.set(name, isDom ? 2 : isCustomElement ? 1 : 0);
  }

  return origins;
}

/**
 * Proposes the symbols a template imports, read from the declarations importing them in the type-check code (see
 * `typeCheckImport`), with the kind of what they declare.
 *
 * @param analysis - The analysis of the template.
 * @param shimPosition - The shim and a position in it, anywhere in the body.
 * @param span - The span of the identifier being written, which the completions replace.
 * @returns The completions, sorted with the members of the classes of the component.
 */
function getImportedSymbolCompletions({ languageService, bodyLineOffset }: TemplateAnalysis, { shimFile }: ShimPosition, span: Span): TemplateCompletion[] {
  const checker = languageService.getProgram()!.getTypeChecker();
  const completions = new Array<TemplateCompletion>();
  const add = (name: Identifier) => {
    const symbol = checker.getSymbolAtLocation(name);
    // The modules the types of the bindings are read through are imported under names starting with `__`
    if (symbol && !name.text.startsWith('__')) {
      completions.push({ name: name.text, kind: getSymbolKind(checker, symbol), sortText: '1', replacementSpan: span });
    }
  };

  for (let i = 0; i < shimFile.statements.length; i++) {
    const statement = shimFile.statements[i];
    const namedBindings = isImportDeclaration(statement) && shimFile.getLineAndCharacterOfPosition(statement.getStart(shimFile)).line >= bodyLineOffset ? statement.importClause?.namedBindings : undefined;
    if (namedBindings && isNamespaceImport(namedBindings)) {
      add(namedBindings.name);
    } else if (namedBindings) {
      for (let j = 0; j < namedBindings.elements.length; j++) {
        add(namedBindings.elements[j].name);
      }
    }
  }

  return completions;
}

/**
 * Proposes the exports of the files of the project a template doesn't import yet, which add their `@import` to the
 * template when chosen: the default exports, which need a name, and the files of the components using the template excluded.
 *
 * @param analysis - The analysis of the template.
 * @param templatePath - The path of the template.
 * @param source - The current source of the template, which the `@import` is added to.
 * @param components - The files of the components using the template.
 * @param span - The span of the identifier being written, which the completions replace.
 * @returns The completions, sorted after every other one.
 */
function getExportCompletions({ symbols, imports }: TemplateAnalysis, templatePath: string, source: string, components: ReadonlyMap<string, readonly string[]>, span: Span): TemplateCompletion[] {
  const candidates = resolveExportCandidates(templatePath);
  if (!candidates) {
    return [];
  }

  // The names the template declares, and the exports it imports already, under any name or through a namespace
  const declared = new Set(symbols.map(({ local }) => local).concat(imports.map(({ specifier }) => specifier.local)));
  const imported = new Set(symbols.map(({ modulePath, imported: name }) => `${normalizeFileName(modulePath)}#${name}`));
  const owners = new Set(Array.from(components.keys(), normalizeFileName));
  const templateDir = dirname(templatePath);
  const completions = new Array<TemplateCompletion>();
  for (let i = 0; i < candidates.length; i++) {
    const { fileName, name, kind } = candidates[i];
    const key = normalizeFileName(fileName);
    const isImported = imported.has(`${key}#${name}`) || imported.has(`${key}#*`);
    if (name !== 'default' && !declared.has(name) && !isImported && !owners.has(key)) {
      const path = toModulePath(templateDir, fileName);
      completions.push({ name, kind, detail: path, sortText: '9', replacementSpan: span, additionalEdits: [getImportInsertion(source, path, name)] });
    }
  }

  return completions;
}

/**
 * Returns the sort text of a member of the components using a template: the members of the classes of the components
 * first, then the ones of `CustomElement`, then the ones of the DOM, fields before methods for each of them, all of
 * them after the variables of the template (sorted from `0000`).
 *
 * @param origin - Where the member is declared (see {@link getMemberOrigins}).
 * @param isMethod - Whether the member is a method.
 * @returns The sort text, from `1` to `6`.
 */
function getMemberSortText(origin: number, isMethod: boolean): string {
  return String(origin * 2 + (isMethod ? 1 : 0) + 1);
}

/**
 * Finds the innermost node containing a position, its end included.
 *
 * @param node - The node to search in.
 * @param position - The position.
 * @returns The innermost node containing the position, `node` itself if none of its children does.
 */
function findNode(node: Node, position: number): Node {
  return forEachChild(node, child => (child.getStart() <= position && position <= child.getEnd() ? findNode(child, position) : undefined)) ?? node;
}
