import { type ASTNode, ASTNodeType, type ClassDeclarationWithName, type ComponentOrDirectiveMetadata, extractComponentMembers, type ImportNode, type ImportSpecifier, parseImportStatements, type SymbolImport, parseTemplate, TemplateError, type TypeCheckResult, typeCheckTemplateTolerant } from '@xaendar/compiler';
import { dirname, resolve } from 'node:path';
import { type CompilerOptions, createSourceFile, isClassDeclaration, type LanguageService, type Program, type ScriptElementKind, ScriptTarget } from 'typescript';
import { getProjectLanguageService, type ProjectLanguageService, readDocument } from '../language-service/language-service';
import { TemplateMetadataCache } from '../template-metadata-cache/template-metadata-cache';
import { findTsConfigPath, loadTsConfig } from '../utils/compiler-options/compiler-options.utils';
import { NOT_IMPORTABLE } from '../utils/module-entries/module-entries.utils';
import { resolveModulePath } from '../utils/module-path/module-path.utils';
import { normalizeFileName, toPosixPath } from '../utils/path/path.utils';
import { createShim } from '../utils/shim/shim.utils';
import { getSymbolKind } from '../utils/symbol-kind/symbol-kind.utils';

/**
 * A symbol imported by a template through an `@import` statement.
 */
export type TemplateImport = {
  /**
   * The `@import` statement.
   */
  readonly node: ImportNode;
  /**
   * The specifier importing the symbol.
   */
  readonly specifier: ImportSpecifier;
  /**
   * The metadata of the imported component or directive.
   */
  readonly metadata: ComponentOrDirectiveMetadata;
};

/**
 * A component or directive a template could import.
 */
export type ImportCandidate = {
  /**
   * The path of the file declaring it.
   */
  readonly fileName: string;
  /**
   * Its metadata.
   */
  readonly metadata: ComponentOrDirectiveMetadata;
};

/**
 * An export of a module a template can import.
 */
export type ExportCandidate = {
  /**
   * The path of the file of the module.
   */
  readonly fileName: string;
  /**
   * The name the module exports it as, `default` for its default export.
   */
  readonly name: string;
  /**
   * What it declares (see `getSymbolKind`).
   */
  readonly kind: ScriptElementKind;
};

/**
 * The result of the analysis of a template that could be parsed (see {@link analyzeTemplate}), whose `errors`
 * may not be empty.
 */
export type TemplateAnalysis = {
  /**
   * The path of the template.
   */
  readonly templatePath: string;
  /**
   * The source of the template analyzed.
   */
  readonly source: string;
  /**
   * The top-level nodes of the template.
   */
  readonly ast: readonly ASTNode[];
  /**
   * The components and directives imported by the template.
   */
  readonly imports: readonly TemplateImport[];
  /**
   * The metadata of the components and directives imported by the template.
   */
  readonly metadatas: readonly ComponentOrDirectiveMetadata[];
  /**
   * The other symbols imported by the template: functions, constants, enums, classes, types, namespaces.
   */
  readonly symbols: readonly SymbolImport[];
  /**
   * The errors of the template that don't prevent the analysis: the modules and symbols of the `@import` statements
   * that cannot be resolved, and the nodes failing type-checking, which the type-check body leaves out. A
   * `TemplateError` when the error points to a part of the template.
   */
  readonly errors: readonly Error[];
  /**
   * The type-check body generated from the template, with the table mapping it to the template.
   */
  readonly typeCheck: TypeCheckResult;
  /**
   * The path of the shim wrapping the type-check body.
   */
  readonly shimPath: string;
  /**
   * The line of the shim the type-check body starts at.
   */
  readonly bodyLineOffset: number;
  /**
   * The LanguageService of the project the template belongs to, which sees the shim.
   */
  readonly languageService: LanguageService;
  /**
   * The paths of the files whose change may change the analysis: the files of the components using the template,
   * of the components and directives it imports, and of their base classes.
   */
  readonly dependencies: ReadonlySet<string>;
};

/**
 * The result of an analysis of a template, successful or not.
 */
export type TemplateAnalysisResult = {
  /**
   * The analysis of the template: the current one, or the last successful one when the template cannot be compiled
   * (e.g. while the user is typing), so that the navigation keeps working. `undefined` if the template never compiled.
   */
  readonly analysis: TemplateAnalysis | undefined;
  /**
   * The error preventing the template from being compiled, if any.
   */
  readonly error: Error | undefined;
  /**
   * The top-level nodes of the template when it could be parsed, even if it failed type-checking afterwards.
   */
  readonly ast: readonly ASTNode[] | undefined;
};

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
 * type-checks it and registers its shim in the LanguageService of its TypeScript project.
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
    const { shadowingMembers, dependencies } = extractMembers(componentFiles, project, options);
    const { imports, symbols, errors: importErrors } = await resolveImports(ast, templateDir, cache, options);
    const metadatas = imports.map(({ metadata }) => metadata);
    const { errors: typeCheckErrors, ...typeCheck } = await typeCheckTemplateTolerant(source, ast, metadatas, shadowingMembers, [], symbols);
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
 * @returns The members named like a global identifier, and the files read to resolve them, components included.
 */
function extractMembers(components: ReadonlyMap<string, readonly string[]>, project: ProjectLanguageService, compilerOptions: CompilerOptions): { shadowingMembers: string[], dependencies: string[] } {
  const shadowingMembers = new Set<string>();
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

      for (let j = 0; j < members.dependencies.length; j++) {
        dependencies.add(normalizeFileName(members.dependencies[j]));
      }
    }
  }

  return { shadowingMembers: [...shadowingMembers], dependencies: [...dependencies] };
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
