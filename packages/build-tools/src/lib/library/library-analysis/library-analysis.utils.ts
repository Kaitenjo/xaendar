import { type ComponentOrDirectiveMetadata, extractComponentsMetadataFromSourceFile, extractDirectivesMetadataFromSourceFile } from '@xaendar/compiler';
import { loadTsConfig } from '@xaendar/language-core';
import { posix } from 'node:path';
import { createProgram, createSourceFile, isClassDeclaration, type Program, ScriptTarget, SymbolFlags, type TypeChecker } from 'typescript';
import type { LibraryAnalysis } from '../../types/library-analysis.type';
import type { WorkspaceLibrary } from '../../types/workspace-library.type';
import { toPosixPath } from '../../utils/path/path.utils';

/**
 * What a file declaring a component or a directive contains: the decorator, whose presence tells it from the files that
 * can be skipped without parsing them.
 */
const DECLARATION_DECORATOR = /@(?:WebComponent|Directive)\s*\(/;

/**
 * Creates the TypeScript program of a library: the files of the `tsconfig.json` of its folder, with its options,
 * emitting only the declarations of its sources into the folder of its build, where they keep their paths relative to
 * the folder of the entry, as the modules of the build do.
 *
 * @param library - The library.
 * @param outDir - The folder of the build.
 * @returns The program.
 */
export function createLibraryProgram(library: WorkspaceLibrary, outDir: string): Program {
  const { options, fileNames } = loadTsConfig(library.root);
  return createProgram(fileNames, Object.assign({}, options, {
    noEmit: false,
    declaration: true,
    emitDeclarationOnly: true,
    declarationMap: false,
    sourceMap: false,
    rootDir: posix.dirname(library.entry),
    outDir
  }));
}

/**
 * Reads what the build of a library needs of its sources: the modules declaring its components and directives, each one
 * an entry of the build named after its path relative to the folder of the entry (`card/card.xd.component`), every
 * selector they define, and what the entry exports, with the modules of the exported components and directives, which
 * the package exports by paths of their own.
 *
 * @param library - The library.
 * @param program - The program of the library (see {@link createLibraryProgram}).
 * @returns The analysis.
 * @throws If a module declares a component or a directive outside of the folder of the entry, or two of them define the
 *   same selector.
 */
export async function analyzeLibrary(library: WorkspaceLibrary, program: Program): Promise<LibraryAnalysis> {
  const base = posix.dirname(library.entry);
  const entry = toEntryName(base, library.entry);
  const entries: Record<string, string> = { [entry]: library.entry };
  const modules = new Map<string, string>();
  const metadatas = new Map<string, ComponentOrDirectiveMetadata>();
  const selectors = new Array<string>();
  const fileNames = program.getRootFileNames();
  for (let i = 0; i < fileNames.length; i++) {
    const fileName = toPosixPath(fileNames[i]);
    const declared = await extractDeclarations(program, fileName);
    if (!declared?.size) {
      continue;
    }

    if (!fileName.startsWith(`${base}/`)) {
      throw new Error(`${fileName} declares a component or a directive outside of ${base}, the folder of the entry of ${library.name}.`);
    }

    const name = toEntryName(base, fileName);
    entries[name] = fileName;
    modules.set(fileName, name);
    for (const metadata of declared.values()) {
      const selector = metadata.type === 'directive' ? `@@${metadata.selector}` : metadata.selector;
      if (selectors.includes(selector)) {
        throw new Error(`The selector "${metadata.selector}" of ${metadata.className} is declared twice in ${library.name}.`);
      }

      selectors.push(selector);
      metadatas.set(`${name}#${metadata.className}`, metadata);
    }
  }

  const exports = collectExports(program, entry, entries, modules, metadatas);
  const declarations = new Map<string, ComponentOrDirectiveMetadata>();
  const paths = Object.values(exports);
  for (let i = 0; i < paths.length; i++) {
    const keys = Object.values(paths[i]);
    for (let j = 0; j < keys.length; j++) {
      declarations.set(keys[j], metadatas.get(keys[j])!);
    }
  }

  return { base, entry, entries, modules, exports, declarations, selectors };
}

/**
 * Names a module in the build of a library: its path relative to the folder of the entry, without extension.
 *
 * @param base - The folder of the entry.
 * @param fileName - The path of the module.
 * @returns The name.
 */
function toEntryName(base: string, fileName: string): string {
  return fileName.slice(base.length + 1).replace(/\.[cm]?tsx?$/, '');
}

/**
 * Extracts the metadata of the components and of the directives a file of a library declares.
 *
 * @param program - The program of the library.
 * @param fileName - The path of the file.
 * @returns The metadata, keyed by class name, `undefined` when the file has no decorator of either.
 */
async function extractDeclarations(program: Program, fileName: string): Promise<Map<string, ComponentOrDirectiveMetadata> | undefined> {
  const text = program.getSourceFile(fileName)?.text;
  if (!text || !DECLARATION_DECORATOR.test(text)) {
    return undefined;
  }

  const sourceFile = createSourceFile(fileName, text, ScriptTarget.Latest, true);
  const options = program.getCompilerOptions();
  const declarations = new Map<string, ComponentOrDirectiveMetadata>(await extractComponentsMetadataFromSourceFile(sourceFile, options));
  const directives = await extractDirectivesMetadataFromSourceFile(sourceFile, options);
  if (directives?.size) {
    for (const [className, directive] of directives) {
      declarations.set(className, directive);
    }
  }

  return declarations;
}

/**
 * Collects what the paths of the `exports` of the package of a library export: the components and directives its entry
 * exports, by `.`, and, by the path of each module declaring one of them (`./card/card.xd.component`), the ones that
 * module exports.
 *
 * @param program - The program of the library.
 * @param entry - The name of the entry.
 * @param entries - The entries of the build, by name.
 * @param modules - The modules declaring a component or a directive, mapped to their name.
 * @param metadatas - Every component and directive, by the key of its declaration.
 * @returns The exports, by path.
 */
function collectExports(program: Program, entry: string, entries: Readonly<Record<string, string>>, modules: ReadonlyMap<string, string>, metadatas: ReadonlyMap<string, ComponentOrDirectiveMetadata>): Record<string, Record<string, string>> {
  const checker = program.getTypeChecker();
  const exported = readExportedDeclarations(program, checker, entries[entry], modules, metadatas);
  const exports: Record<string, Record<string, string>> = { '.': exported };
  const keys = Object.values(exported);
  for (let i = 0; i < keys.length; i++) {
    const name = keys[i].slice(0, keys[i].indexOf('#'));
    exports[`./${name}`] ??= readExportedDeclarations(program, checker, entries[name], modules, metadatas);
  }

  return exports;
}

/**
 * Reads the components and directives a module of a library exports, through re-exports too.
 *
 * @param program - The program of the library.
 * @param checker - The type checker of the program.
 * @param fileName - The path of the module.
 * @param modules - The modules declaring a component or a directive, mapped to their name.
 * @param metadatas - Every component and directive, by the key of its declaration.
 * @returns The key of the declaration of each one, by the name the module exports it as.
 */
function readExportedDeclarations(program: Program, checker: TypeChecker, fileName: string, modules: ReadonlyMap<string, string>, metadatas: ReadonlyMap<string, ComponentOrDirectiveMetadata>): Record<string, string> {
  const exported: Record<string, string> = {};
  const sourceFile = program.getSourceFile(fileName);
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    return exported;
  }

  const symbols = checker.getExportsOfModule(moduleSymbol);
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const target = symbol.flags & SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const declaration = target.declarations?.find(isClassDeclaration);
    const module = declaration && modules.get(toPosixPath(declaration.getSourceFile().fileName));
    const key = module && declaration.name && `${module}#${declaration.name.text}`;
    if (key && metadatas.has(key)) {
      exported[symbol.name] = key;
    }
  }

  return exported;
}
