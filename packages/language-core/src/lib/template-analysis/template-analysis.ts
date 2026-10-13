import { type ASTNode, ASTNodeType, type ClassDeclarationWithName, type ComponentOrDirectiveMetadata, extractComponentMembers, type ImportNode, type ImportSpecifier, parseTemplate, TemplateError, type TypeCheckResult, typeCheckTemplate } from '@xaendar/compiler';
import { dirname } from 'node:path';
import { type CompilerOptions, createSourceFile, isClassDeclaration, type LanguageService, ScriptTarget } from 'typescript';
import { getProjectLanguageService, type ProjectLanguageService, readDocument } from '../language-service/language-service';
import { TemplateMetadataCache } from '../template-metadata-cache/template-metadata-cache';
import { findTsConfigPath, loadTsConfig } from '../utils/compiler-options/compiler-options.utils';
import { normalizeFileName, toPosixPath } from '../utils/path/path.utils';
import { createShim } from '../utils/shim/shim.utils';

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
 * The result of a successful analysis of a template (see {@link analyzeTemplate}).
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
  // TypeScript names the files of the program, the shim included, with forward slashes
  const componentFiles = new Map([...components].map(([fileName, classNames]) => [toPosixPath(fileName), classNames]));
  const templateDir = dirname(templatePath);
  const configPath = findTsConfigPath(templateDir);
  const { options, fileNames } = loadTsConfig(templateDir);
  const project = getProjectLanguageService(configPath);
  const languageService = project.getLanguageService(options, fileNames);
  const cache = metadataCaches.getOrInsertComputed(project, () => new TemplateMetadataCache(options));
  let ast: ASTNode[] | undefined;

  try {
    ast = parseTemplate(source);
    const { shadowingMembers, dependencies } = extractMembers(componentFiles, project, options);
    const imports = await resolveImports(ast, templateDir, cache);
    const metadatas = imports.map(({ metadata }) => metadata);
    const typeCheck = await typeCheckTemplate(source, ast, metadatas, shadowingMembers);
    const shim = createShim(componentFiles, typeCheck, project);

    const analysis: TemplateAnalysis = {
      templatePath,
      source,
      ast,
      imports,
      metadatas,
      typeCheck,
      shimPath: shim.path,
      bodyLineOffset: shim.bodyLineOffset,
      languageService,
      dependencies: new Set([...dependencies, ...metadatas.map(metadata => normalizeFileName(metadata.typescriptNodes.klass.getSourceFile().fileName))])
    };
    lastAnalyses.set(key, analysis);
    return { analysis, error: undefined, ast };
  } catch (error) {
    return { analysis: lastAnalyses.get(key), error: toError(error), ast };
  }
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
  metadataCaches.forEach(cache => cache.invalidate(fileName));
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

  components.forEach((classNames, fileName) => {
    project.registerRealFile(fileName);
    dependencies.add(normalizeFileName(fileName));

    const sourceFile = createSourceFile(fileName, readDocument(fileName) ?? '', ScriptTarget.Latest, true);
    const classes = sourceFile.statements.filter((statement): statement is ClassDeclarationWithName => isClassDeclaration(statement) && !!statement.name && classNames.includes(statement.name.text));
    for (let i = 0; i < classes.length; i++) {
      const members = extractComponentMembers(sourceFile, classes[i], compilerOptions);
      members.shadowingMembers.forEach(member => shadowingMembers.add(member));
      members.dependencies.forEach(dependency => dependencies.add(normalizeFileName(dependency)));
    }
  });

  return { shadowingMembers: [...shadowingMembers], dependencies: [...dependencies] };
}

/**
 * Resolves the components and directives imported by a template.
 *
 * @param ast - The top-level nodes of the template.
 * @param templateDir - The directory of the template, the `@import` paths are relative to.
 * @param cache - The metadata cache of the project.
 * @returns The imported components and directives.
 * @throws A `TemplateError` on the name of the first symbol that cannot be resolved.
 */
async function resolveImports(ast: readonly ASTNode[], templateDir: string, cache: TemplateMetadataCache): Promise<TemplateImport[]> {
  const imports = new Array<TemplateImport>();
  const importNodes = ast.filter((node): node is ImportNode => node.type === ASTNodeType.Import);

  for (const node of importNodes) {
    for (const specifier of node.specifiers.filter(({ imported }) => imported !== '*')) {
      try {
        const metadata = await cache.getOrInsert(specifier.imported === 'default' ? specifier.local : specifier.imported, [templateDir, node.path]);
        imports.push({ node, specifier, metadata });
      } catch (error) {
        const { message } = toError(error);
        throw new TemplateError(message, specifier.importedSpan, message);
      }
    }
  }

  return imports;
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
