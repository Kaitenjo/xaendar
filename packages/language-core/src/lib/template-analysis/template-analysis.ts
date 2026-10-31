import { type ASTNode, ASTNodeType, type ClassDeclarationWithName, type ComponentOrDirectiveMetadata, extractComponentMembers, type ImportNode, parseImportStatements, type SymbolImport, parseTemplate, TemplateError, typeCheckTemplateTolerant } from '@xaendar/compiler';
import { dirname, resolve } from 'node:path';
import { type CompilerOptions, createSourceFile, isClassDeclaration, type Program, ScriptTarget } from 'typescript';
import { getProjectLanguageService, type ProjectLanguageService, readDocument } from '../language-service/language-service';
import { TemplateMetadataCache } from '../template-metadata-cache/template-metadata-cache';
import { findTsConfigPath, loadTsConfig } from '../utils/compiler-options/compiler-options.utils';
import { NOT_IMPORTABLE } from '../utils/module-entries/module-entries.utils';
import { resolveModulePath } from '../utils/module-path/module-path.utils';
import { normalizeFileName, toPosixPath } from '../utils/path/path.utils';
import { createShim } from '../utils/shim/shim.utils';
import { getSymbolKind } from '../utils/symbol-kind/symbol-kind.utils';
import { readCustomElements } from '../utils/xaendar-config/xaendar-config.utils';
import type { TemplateImport } from '../types/template-import.type';
import type { ImportCandidate } from '../types/import-candidate.type';
import type { ExportCandidate } from '../types/export-candidate.type';
import type { TemplateAnalysis } from '../types/template-analysis.type';
import type { TemplateAnalysisResult } from '../types/template-analysis-result.type';

/**
 * The last successful analysis of each template, keyed by its normalized path.
 */
const lastAnalyses = new Map<string, TemplateAnalysis>();

/**
 * The metadata cache of each TypeScript project.
 */
const metadataCaches = new Map<ProjectLanguageService, TemplateMetadataCache>();

/**
 * Analyzes a template with a single compilation: parses it, resolves the components and directives it imports,
 * type-checks it, the tags matching the `customElements` patterns of the nearest `xaendar.json` checked like native
 * elements, and registers its shim in the LanguageService of its TypeScript project.
 *
 * @param templatePath - The path of the template.
 * @param source - The current source of the template, unsaved changes included.
 * @param components - The files of the components using the template, mapped to the names of their classes using it.
 * @returns The analysis, or the error preventing the template from being compiled together with the last successful analysis.
 */
export async function analyzeTemplate(templatePath: string, source: string, components: ReadonlyMap<string, readonly string[]>): Promise<TemplateAnalysisResult> {
  const key = normalizeFileName(templatePath);
  const result = await analyze(templatePath, source, components, 'typecheck');
  if (result.analysis) {
    lastAnalyses.set(key, result.analysis);
    return result;
  }

  return { analysis: lastAnalyses.get(key), error: result.error, ast: result.ast };
}

/**
 * Analyzes the version of a template a completion is asked on, closed at the offset of the completion (see
 * `getExpressionContext`): its shim is registered beside the one of the template, which keeps type-checking the
 * version being edited, and the analysis is not kept as the last successful one.
 *
 * @param templatePath - The path of the template.
 * @param source - The version of the template.
 * @param components - The files of the components using the template, mapped to the names of their classes using it.
 * @returns The analysis, `undefined` if the version cannot be compiled.
 */
export async function analyzeCompletionTemplate(templatePath: string, source: string, components: ReadonlyMap<string, readonly string[]>): Promise<TemplateAnalysis | undefined> {
  return (await analyze(templatePath, source, components, 'completion')).analysis;
}

/**
 * Analyzes a template with a single compilation (see {@link analyzeTemplate}), registering its shim under a name.
 *
 * @param templatePath - The path of the template.
 * @param source - The source of the template.
 * @param components - The files of the components using the template, mapped to the names of their classes using it.
 * @param shimName - The name of the shim (see `createShim`).
 * @returns The analysis, or the error preventing the template from being compiled.
 */
async function analyze(templatePath: string, source: string, components: ReadonlyMap<string, readonly string[]>, shimName: string): Promise<TemplateAnalysisResult> {
  // TypeScript names the files of the program, the shim included, with forward slashes
  const componentFiles = new Map([...components].map(([fileName, classNames]) => [toPosixPath(fileName), classNames]));
  const templateDir = dirname(templatePath);
  const { options, fileNames, project, cache } = getProjectContext(templateDir);
  const languageService = project.getLanguageService(options, fileNames);
  let ast: ASTNode[] | undefined;

  try {
    ast = parseTemplate(source);
    const { shadowingMembers, reactiveMembers, dependencies } = extractMembers(componentFiles, project, options);
    const { imports, symbols, errors: importErrors } = await resolveImports(ast, templateDir, cache, options);
    const metadatas = imports.map(({ metadata }) => metadata);
    const { errors: typeCheckErrors, ...typeCheck } = await typeCheckTemplateTolerant(source, ast, metadatas, shadowingMembers, readCustomElements(templateDir), symbols, reactiveMembers);
    const shim = createShim(componentFiles, typeCheck, project, shimName);
    
    const analysis: TemplateAnalysis = {
      templatePath,
      source,
      ast,
      imports,
      metadatas,
      symbols,
      errors: [...importErrors, ...typeCheckErrors],
      typeCheck,
      shimPath: shim.path,
      bodyLineOffset: shim.bodyLineOffset,
      languageService,
      dependencies: new Set([...dependencies, ...metadatas.map(metadata => normalizeFileName(metadata.typescriptNodes.klass.getSourceFile().fileName)), ...symbols.map(({ modulePath }) => normalizeFileName(modulePath))])
    };
    return { analysis, error: undefined, ast };
  } catch (error) {
    return { analysis: undefined, error: toError(error), ast };
  }
}

/**
 * Resolves the components and directives imported by the current source of a template, read from its `@import`
 * statements, so that it works while the rest of the template cannot be parsed (e.g. while the user is typing).
 * The symbols that cannot be resolved, and the namespace imports, are ignored.
 *
 * @param templatePath - The path of the template.
 * @param source - The current source of the template.
 * @returns The metadata of the imported components and directives.
 */
export async function resolveTemplateImports(templatePath: string, source: string): Promise<ComponentOrDirectiveMetadata[]> {
  const templateDir = dirname(templatePath);
  const { cache } = getProjectContext(templateDir);
  const metadatas = new Array<ComponentOrDirectiveMetadata>();

  const statements = parseImportStatements(source);
  for (let i = 0; i < statements.length; i++) {
    const { path, specifiers } = statements[i];
    const symbols = specifiers.filter(({ imported }) => imported !== '*');
    for (let j = 0; j < symbols.length; j++) {
      const { imported, local } = symbols[j];
      try {
        metadatas.push(await cache.getOrInsert(imported === 'default' ? local : imported, [templateDir, path]));
      } catch {
        // A symbol that cannot be resolved has nothing to propose
      }
    }
  }

  return metadatas;
}

/**
 * Resolves the components and directives declared in a module a template imports from, the ones it could import.
 *
 * @param templatePath - The path of the template.
 * @param modulePath - The path of the module, as written in the `@import` statement.
 * @returns The metadata of the components and directives of the module, `undefined` if it cannot be resolved or read.
 */
export async function resolveModuleMetadatas(templatePath: string, modulePath: string): Promise<ComponentOrDirectiveMetadata[] | undefined> {
  const templateDir = dirname(templatePath);
  const { cache } = getProjectContext(templateDir);
  const metadatas = await cache.getModuleMetadatas(templateDir, modulePath);
  if (metadatas?.size) {
    return Array.from(metadatas.values());
  }
}

/**
 * Finds the components and directives a template could import: the ones declared in the files of its TypeScript
 * project, the component the template belongs to excluded.
 *
 * @param templatePath - The path of the template.
 * @returns The declarations with the file declaring each one, `undefined` if the project declares none.
 */
export async function resolveImportCandidates(templatePath: string): Promise<ImportCandidate[] | undefined> {
  const { fileNames, cache } = getProjectContext(dirname(templatePath));
  const declarations = await cache.getDeclarations(fileNames);
  if (!declarations) {
    return undefined;
  }

  const templateKey = normalizeFileName(templatePath);
  const candidates = new Array<ImportCandidate>();
  for (const [fileName, metadatas] of declarations) {
    for (const metadata of metadatas.values()) {
      const isOwner = metadata.type === 'component' && normalizeFileName(resolve(dirname(fileName), metadata.templateUrl)) === templateKey;
      if (!isOwner) {
        candidates.push({ fileName, metadata });
      }
    }
  }

  return candidates.length ? candidates : undefined;
}

/**
 * Lists the exports of a module a template imports from, whatever they declare: components, directives, functions,
 * constants, enums, classes, types.
 *
 * @param templatePath - The path of the template.
 * @param modulePath - The path of the module, as written in the `@import` statement.
 * @returns The exports, `undefined` if the module cannot be resolved or is not in the program of the project.
 */
export function resolveModuleExports(templatePath: string, modulePath: string): ExportCandidate[] | undefined {
  const context = getProjectContext(dirname(templatePath));
  const fileName = resolveModulePath(dirname(templatePath), modulePath, context.options);
  return fileName ? listExports(getProgram(context), fileName) : undefined;
}

/**
 * Lists the exports of the files of the TypeScript project of a template, the ones it can import: the files that are
 * not modules to import (declarations, specs and tests) excluded.
 *
 * @param templatePath - The path of the template.
 * @returns The exports, `undefined` if the project exports nothing.
 */
export function resolveExportCandidates(templatePath: string): ExportCandidate[] | undefined {
  const context = getProjectContext(dirname(templatePath));
  const { fileNames } = context;
  const program = getProgram(context);
  let candidates: ExportCandidate[] | undefined;
  for (let i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i];
    const exported = NOT_IMPORTABLE.test(fileName) ? undefined : listExports(program, fileName);
    if (exported?.length) {
      candidates ??= new Array<ExportCandidate>();
      candidates.push(...exported);
    }
  }

  return candidates;
}

/**
 * Forgets the last successful analysis of a template, e.g. when it is closed.
 *
 * @param templatePath - The path of the template.
 */
export function removeTemplateAnalysis(templatePath: string): void {
  lastAnalyses.delete(normalizeFileName(templatePath));
}

/**
 * Discards the metadata extracted from a file by every project, e.g. when it changes.
 *
 * @param fileName - The path of the file.
 */
export function invalidateTemplateMetadata(fileName: string): void {
  for (const cache of metadataCaches.values()) {
    cache.invalidate(fileName);
  }
}

/**
 * Finds the TypeScript project of a template, with the options it is compiled with and the metadata cache of its components.
 *
 * @param templateDir - The directory of the template.
 * @returns The options and the files of the project, the project itself and its metadata cache.
 */
function getProjectContext(templateDir: string): { options: CompilerOptions, fileNames: string[], project: ProjectLanguageService, cache: TemplateMetadataCache } {
  const { options, fileNames } = loadTsConfig(templateDir);
  const project = getProjectLanguageService(findTsConfigPath(templateDir));
  const cache = metadataCaches.getOrInsertComputed(project, () => new TemplateMetadataCache(options));
  return { options, fileNames, project, cache };
}

/**
 * Returns the program of a TypeScript project.
 *
 * @param context - The project, its options and its files (see {@link getProjectContext}).
 * @returns The program.
 */
function getProgram({ options, fileNames, project }: ReturnType<typeof getProjectContext>): Program {
  return project.getLanguageService(options, fileNames).getProgram()!;
}

/**
 * Lists the exports of a file of a program.
 *
 * @param program - The program.
 * @param fileName - The path of the file.
 * @returns The exports, `undefined` if the file is not in the program or is not a module.
 */
function listExports(program: Program, fileName: string): ExportCandidate[] | undefined {
  const sourceFile = program.getSourceFile(fileName);
  const checker = program.getTypeChecker();
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  return moduleSymbol && checker.getExportsOfModule(moduleSymbol).map((symbol): ExportCandidate => ({ fileName, name: symbol.name, kind: getSymbolKind(checker, symbol) }));
}

/**
 * Extracts the members of the classes of the components using a template that change how it is compiled, and
 * registers the files of the components in the project, so that their shim can import them.
 *
 * @param components - The files of the components, mapped to the names of their classes.
 * @param project - The language service of the project.
 * @param compilerOptions - The options of the project.
 * @returns The members named like a global identifier, the members that can read a signal, and the files read to resolve
 *   them, components included.
 */
function extractMembers(components: ReadonlyMap<string, readonly string[]>, project: ProjectLanguageService, compilerOptions: CompilerOptions): { shadowingMembers: string[], reactiveMembers: string[], dependencies: string[] } {
  const shadowingMembers = new Set<string>();
  const reactiveMembers = new Set<string>();
  const dependencies = new Set<string>();

  for (const [fileName, classNames] of components) {
    project.registerRealFile(fileName);
    dependencies.add(normalizeFileName(fileName));

    const sourceFile = createSourceFile(fileName, readDocument(fileName) ?? '', ScriptTarget.Latest, true);
    const classes = sourceFile.statements.filter((statement): statement is ClassDeclarationWithName => isClassDeclaration(statement) && !!statement.name && classNames.includes(statement.name.text));
    for (let i = 0; i < classes.length; i++) {
      const members = extractComponentMembers(sourceFile, classes[i], compilerOptions);
      for (let j = 0; j < members.shadowingMembers.length; j++) {
        shadowingMembers.add(members.shadowingMembers[j]);
      }

      for (let j = 0; j < members.reactiveMembers.length; j++) {
        reactiveMembers.add(members.reactiveMembers[j]);
      }

      for (let j = 0; j < members.dependencies.length; j++) {
        dependencies.add(normalizeFileName(members.dependencies[j]));
      }
    }
  }

  return { shadowingMembers: [...shadowingMembers], reactiveMembers: [...reactiveMembers], dependencies: [...dependencies] };
}

/**
 * Resolves what a template imports, going on after the specifiers it cannot resolve: the components and the directives,
 * and the other symbols, whose exports TypeScript checks through the type-check code.
 *
 * @param ast - The top-level nodes of the template.
 * @param templateDir - The directory of the template, the `@import` paths are relative to.
 * @param cache - The metadata cache of the project.
 * @param options - The options of the project, which drive how the paths that are not relative are resolved.
 * @returns The imported components and directives, the other imported symbols, and a `TemplateError` for each module
 *   that cannot be found (on its path) and for each specifier that cannot be resolved (on its name).
 */
async function resolveImports(ast: readonly ASTNode[], templateDir: string, cache: TemplateMetadataCache, options: CompilerOptions): Promise<{ imports: TemplateImport[], symbols: SymbolImport[], errors: TemplateError[] }> {
  const imports = new Array<TemplateImport>();
  const symbols = new Array<SymbolImport>();
  const errors = new Array<TemplateError>();
  const importNodes = ast.filter((node): node is ImportNode => node.type === ASTNodeType.Import);

  for (let i = 0; i < importNodes.length; i++) {
    const node = importNodes[i];
    if (!resolveModulePath(templateDir, node.path, options)) {
      const message = `Cannot find module "${node.path}"`;
      errors.push(new TemplateError(message, node.pathSpan, message));
      continue;
    }

    const { specifiers } = node;
    for (let j = 0; j < specifiers.length; j++) {
      const specifier = specifiers[j];
      try {
        const imported = await cache.getImport(specifier.imported, specifier.local, templateDir, node.path);
        if (imported.type === 'symbol') {
          symbols.push(Object.assign({}, specifier, imported));
        } else {
          imports.push({ node, specifier, metadata: imported });
        }
      } catch (error) {
        const { message } = toError(error);
        errors.push(new TemplateError(message, specifier.importedSpan, message));
      }
    }
  }

  return { imports, symbols, errors };
}

/**
 * Turns a thrown value into an `Error`: the compiler throws some of its errors as strings.
 *
 * @param error - The thrown value.
 * @returns The value itself if it is an `Error`, an `Error` with its text as message otherwise.
 */
function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
