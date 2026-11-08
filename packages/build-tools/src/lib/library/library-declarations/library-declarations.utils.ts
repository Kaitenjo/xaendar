import { mkdirSync, writeFileSync } from 'node:fs';
import { posix } from 'node:path';
import { type Bundle, createPrinter, isExportDeclaration, isImportDeclaration, isImportTypeNode, isLiteralTypeNode, isSourceFile, isStringLiteral, type Node, type Program, resolveModuleName, type SourceFile, sys, transform, type TransformationContext, type TransformerFactory, visitEachChild } from 'typescript';
import type { DeclarationsRewrite } from '../../types/declarations-rewrite.type';
import { toPosixPath } from '../../utils/path/path.utils';
import { formatTypeDiagnostics } from '../../utils/type-check/type-check.utils';

/**
 * The declaration files, which a library imports from the packages it depends on, or writes by hand.
 */
const DECLARATION_FILE = /\.d\.[cm]?ts$/;

/**
 * Emits the declarations of a library into the folder of its build (see `createLibraryProgram`), where they keep the
 * paths of its modules: the paths their imports and `import()` types lead to a module of the library through are
 * written relative to the declaration, with the extension of the JavaScript of the build (`./card/card.xd.component.js`),
 * so that neither the aliases of the `paths` of `tsconfig.json`, which an application does not have, nor a path without
 * extension, which `nodenext` does not resolve, reach the application. The declaration files of the library, written by
 * hand, which TypeScript does not emit, are written beside them, their paths rewritten the same way: the declarations
 * and the types of the manifest may read them.
 *
 * @param program - The program of the library.
 * @param base - The folder of the entry of the library.
 * @throws If the options lead TypeScript to files outside of the folder of the entry, or it cannot write the type of
 *   an export (a name another module does not export, a type of a package the library does not depend on).
 */
export function emitLibraryDeclarations(program: Program, base: string): void {
  const diagnostics = program.getOptionsDiagnostics().concat(program.getDeclarationDiagnostics());
  if (diagnostics.length) {
    throw new Error(formatTypeDiagnostics(diagnostics));
  }

  const rewrite: DeclarationsRewrite = { program, base, declarationFiles: new Set() };
  const sourceFiles = program.getSourceFiles();
  for (let i = 0; i < sourceFiles.length; i++) {
    const fileName = toPosixPath(sourceFiles[i].fileName);
    if (sourceFiles[i].isDeclarationFile && fileName.startsWith(`${base}/`)) {
      rewrite.declarationFiles.add(fileName);
    }
  }

  const transformer = createSpecifierTransformer(rewrite);
  const { diagnostics: emitted } = program.emit(undefined, undefined, undefined, true, { afterDeclarations: [transformer] });
  if (emitted.length) {
    throw new Error(formatTypeDiagnostics(emitted));
  }

  writeDeclarationFiles(rewrite, transformer);
}

/**
 * Creates the transformer of the declarations rewriting the paths that lead to the modules of the library.
 *
 * @param rewrite - What the rewriting reads and collects.
 * @returns The transformer.
 */
function createSpecifierTransformer(rewrite: DeclarationsRewrite): TransformerFactory<SourceFile | Bundle> {
  return context => node => (isSourceFile(node) ? rewriteSpecifiers(node, node.fileName, rewrite, context) as SourceFile : node);
}

/**
 * Writes the declaration files of the library into the folder of the build, at their path relative to the folder of the
 * entry, rewritten as the emitted ones: the ones they import in turn join the set, and are written by the same loop.
 *
 * @param rewrite - What the rewriting reads and collected.
 * @param transformer - The transformer rewriting the paths.
 */
function writeDeclarationFiles({ program, base, declarationFiles }: DeclarationsRewrite, transformer: TransformerFactory<SourceFile | Bundle>): void {
  const outDir = toPosixPath(program.getCompilerOptions().outDir!);
  const printer = createPrinter();
  for (const fileName of declarationFiles) {
    const result = transform(program.getSourceFile(fileName)!, [transformer]);
    const path = `${outDir}/${posix.relative(base, fileName)}`;
    mkdirSync(posix.dirname(path), { recursive: true });
    writeFileSync(path, printer.printFile(result.transformed[0] as SourceFile));
    result.dispose();
  }
}

/**
 * Rewrites the paths of the imports, of the re-exports and of the `import()` types of a node of a declaration file, and
 * of the nodes it holds, leading to a module of the library (see {@link toLibrarySpecifier}).
 *
 * @param node - The node.
 * @param fileName - The path of the source file the declarations are emitted for.
 * @param rewrite - What the rewriting reads and collects.
 * @param context - The context of the transformation.
 * @returns The node, rewritten.
 */
function rewriteSpecifiers(node: Node, fileName: string, rewrite: DeclarationsRewrite, context: TransformationContext): Node {
  const { factory } = context;
  if (isImportDeclaration(node) && isStringLiteral(node.moduleSpecifier)) {
    const specifier = toLibrarySpecifier(node.moduleSpecifier.text, fileName, rewrite);
    return specifier ? factory.updateImportDeclaration(node, node.modifiers, node.importClause, factory.createStringLiteral(specifier), node.attributes) : node;
  }

  if (isExportDeclaration(node) && node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
    const specifier = toLibrarySpecifier(node.moduleSpecifier.text, fileName, rewrite);
    return specifier ? factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, factory.createStringLiteral(specifier), node.attributes) : node;
  }

  let rewritten = node;
  if (isImportTypeNode(node) && isLiteralTypeNode(node.argument) && isStringLiteral(node.argument.literal)) {
    const specifier = toLibrarySpecifier(node.argument.literal.text, fileName, rewrite);
    if (specifier) {
      rewritten = factory.updateImportTypeNode(node, factory.createLiteralTypeNode(factory.createStringLiteral(specifier)), node.attributes, node.qualifier, node.typeArguments, node.isTypeOf);
    }
  }

  return visitEachChild(rewritten, child => rewriteSpecifiers(child, fileName, rewrite, context), context);
}

/**
 * Writes the path a declaration file of a library imports one of its modules by: relative to the declaration, with the
 * extension of the JavaScript of the build (`./legacy.js` for the declaration file `legacy.d.ts`, which joins the ones
 * to write).
 *
 * @param specifier - The path, as written in the source.
 * @param fileName - The path of the source file the declarations are emitted for.
 * @param rewrite - What the rewriting reads and collects.
 * @returns The path, `undefined` when it leads outside of the library (a package) or is written so already.
 */
function toLibrarySpecifier(specifier: string, fileName: string, { program, base, declarationFiles }: DeclarationsRewrite): string | undefined {
  const { resolvedModule } = resolveModuleName(specifier, fileName, program.getCompilerOptions(), sys);
  const target = resolvedModule && toPosixPath(resolvedModule.resolvedFileName);
  if (!target?.startsWith(`${base}/`)) {
    return undefined;
  }

  if (DECLARATION_FILE.test(target)) {
    declarationFiles.add(target);
  }

  const path = posix.relative(posix.dirname(toPosixPath(fileName)), target).replace(/(?:\.d)?\.([cm]?)tsx?$/, '.$1js');
  const relative = path.startsWith('.') ? path : `./${path}`;
  return relative === specifier ? undefined : relative;
}
