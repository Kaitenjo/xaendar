import { slice } from '@xaendar/common';
import { ComponentOrDirectiveMetadata, Cursor, extractComponentsMetadataFromSourceFile, resolveTemplateSpan, TypeCheckResult } from '@xaendar/compiler';
import type MagicString from 'magic-string';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ClassDeclaration, ClassStaticBlockDeclaration, createSourceFile, Diagnostic, forEachChild, isCallExpression, isClassDeclaration, isClassStaticBlockDeclaration, isExpressionStatement, isIdentifier, Node, ScriptTarget, SourceFile } from 'typescript';
import { getMetadata, registerMetadata } from '../../registry/metadata-registry/metadata-registry';

/**
 * TODO: This could be eliminated if we find a way to extract the metadata informations
 * from the AST after the compile function has been invoked.
 * Currently we watch the improted files BEFORE compile function has been called, making
 * this optimization impossible.
 * When a global cache of the import metadata will be implemented we can safely remove this
 *
 * Extracts the absolute paths of every component declared via `@import { X }
 * from '...'` inside a DSL template, resolving them relative to the
 * template's own directory (paths in the template are relative to the
 * .html file, not to the component's .ts file).
 *
 * @param templateSource - The raw content of the `.xd.component.html` template.
 * @param templateDir - The directory containing the template file.
 * @returns The list of imported absolute paths (may be empty).
 */
export function extractImportedComponentPaths(templateSource: string, templateDir: string): string[] {
  const importRegex = /@import\s*\{[^}]*\}\s*from\s*['"](.+?)['"]/g;
  const paths = new Array<string>();
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(templateSource)) !== null) {
    paths.push(resolve(templateDir, match[1]));
  }

  return paths;
}

/**
 * Strips CSS block comments (`/* ... *\/`) from a stylesheet, used to detect
 * stylesheets that contain no actual rules.
 */
export function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Injects a component's generated template code into the shared `MagicString`
 * wrapping the whole transpiled component file, applying the three required
 * mutations — template render methods, scoped CSS stylesheet, and missing
 * runtime imports — each in its own dedicated function.
 *
 * All offsets are resolved against `sourceFile`, which must be parsed once
 * from the file's ORIGINAL (pre-injection) text and reused across every
 * component declared in the file: `MagicString` edits are addressed by
 * position in that original string, so appending content at one offset never
 * invalidates another offset computed from the same unmodified source — this
 * is what lets every mutation, across every component in the file, compose
 * into a single accurate sourcemap instead of each edit invalidating the
 * next one's line/column bookkeeping.
 *
 * @param s - The `MagicString` wrapping the whole component file, shared
 *   across every component declared in it.
 * @param sourceFile - The AST of the file's ORIGINAL (pre-injection) source,
 *   shared across every component declared in it.
 * @param first - Indicates if this is the first component of the file being processed.
 * @param compiledMethods - The raw output of the template compiler.
 * @param className - The name of the target class in this file.
 * @param varName - Variable name for the shared `CSSStyleSheet`, if any CSS is provided.
 * @param cssContent - Raw CSS content to inject as a shared `CSSStyleSheet`, if not empty.
 * @throws When `className` isn't found, or its decorator finalizer static
 *   block isn't found — meaning the component file wasn't scaffolded
 *   correctly, or the babel decorators plugin didn't run before xaendarPlugin().
 */
export function injectFunctions(s: MagicString, sourceFile: SourceFile, first: boolean, compiledMethods: string, className: string, varName?: string, cssContent?: string): void {
  const classDecl = findClassDeclarationByName(sourceFile, className);

  if (!classDecl) {
    throw `Could not find class "${className}" in the transpiled output.`;
  }

  insertTemplateMethods(s, sourceFile, classDecl, compiledMethods);
  insertStyleSnippet(s, sourceFile, classDecl, varName, cssContent);
  if (first) {
    insertRequiredImports(s);
  }
}

/**
 * Formats a single TS diagnostic into a human-readable, single-line message
 * including its location in the generated shim.
 *
 * Note: the location currently points into the generated shim file, not
 * the original DSL template — remapping to template positions is not yet
 * implemented (see the module-level doc comment on `xaendarPlugin`).
 */
export function describeDiagnostic(templateSource: string, diagnostic: Diagnostic, bodyLineOffset: number, mappingTable: TypeCheckResult['mappingTable']): string {
  const message = typeof diagnostic.messageText === 'string' ? diagnostic.messageText : diagnostic.messageText.messageText;
  const cursor = new Cursor(templateSource);
  if (!diagnostic.file || diagnostic.start === undefined) {
    return message;
  }

  const shimPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  const bodyLine = shimPosition.line - bodyLineOffset;
  if (bodyLine < 0) {
    return message;
  }

  const templateSpan = resolveTemplateSpan(mappingTable, { line: bodyLine, character: shimPosition.character });
  if (!templateSpan) {
    return message;
  }

  const templatePosition = cursor.getPositionFromCharacterIndex(templateSpan.start);
  return `${templatePosition} - ${message}\n ---> ${slice(templateSource, templateSpan.start, templateSpan.end)}`;
}

/**
 * Base implementation for getOrInsert Method of the plugin cache.
 * @param name The name of the component or directive to retrieve metadata for.
 * @param path Optional path(s) to the source file(s) containing the component or directive.
 * @returns The metadata for the specified component or directive.
 */
export async function getMetadataOrExtract(name: string, path?: string | string[]): Promise<ComponentOrDirectiveMetadata> {
  const resolvedPath = path && (Array.isArray(path) ? resolveModulePath(path[0], path[1]) : resolve(path));
  let metadata = getMetadata(name, resolvedPath) ?? getMetadata(name);
  if (metadata) {
    return metadata;
  }

  if (!resolvedPath) {
    throw new Error(`Unable to resolve module path for "${name}".`);
  }

  const sourceFile = createSourceFile(resolvedPath, await readFile(resolvedPath, 'utf-8'), ScriptTarget.Latest, true);
  const metadatas = await extractComponentsMetadataFromSourceFile(sourceFile);
  metadata = metadatas?.get(name);
  if (!metadata) {
    throw new Error(`Metadata for symbol "${name}" not found.`);
  }

  // Definire un criterio per il quale si cacha oppure no, non possiamo cachare tutto, troppa memoria!!!
  registerMetadata(name, metadata);
  for (let i = 0; i < metadata.selectors.length; i++) {
    const selector = metadata.selectors[i];
    registerMetadata(selector, metadata);
  }
  return metadata;
}

/**
 * Resolves a module import path to an actual file system path.
 * Handles both relative paths (./button.component) and package paths (@scope/pkg).
 *
 * @param baseDir - The directory to resolve relative imports from
 * @param modulePath - The import module path
 * @returns The resolved file path, or undefined if not found
 */
export function resolveModulePath(baseDir: string, modulePath: string): string | undefined {
  // Handle relative imports
  if (modulePath.startsWith('.')) {
    const resolvedPath = resolve(baseDir, modulePath);

    // Try as-is (might already have extension)
    if (existsSync(resolvedPath)) {
      return resolvedPath;
    }

    // Try with .ts extension
    if (existsSync(`${resolvedPath}.ts`)) {
      return `${resolvedPath}.ts`;
    }

    // Try with /index.ts if directory
    if (existsSync(`${resolvedPath}/index.ts`)) {
      return `${resolvedPath}/index.ts`;
    }
  }

  // TODO: Handle package imports and tsconfig aliases
  return undefined;
}

function insertTemplateMethods(s: MagicString, sourceFile: SourceFile, classDecl: ClassDeclaration, compiledMethods: string): void {
  const placeholderBlock = classDecl.members.find(isDecoratorInitStaticBlock);

  if (!placeholderBlock) {
    throw `Could not find the static initializer block for class "${classDecl.name?.text}" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.`;
  }

  const blockStart = placeholderBlock.getStart(sourceFile);
  s.appendLeft(blockStart, `${compiledMethods}\n\n  `);
}

function insertStyleSnippet(s: MagicString, sourceFile: SourceFile, classDecl: ClassDeclaration, varName?: string, cssContent?: string): void {
  if (!cssContent?.trim().length) {
    return;
  }

  const styleSnippet = buildStyleSnippet(varName!, cssContent);
  const classStart = classDecl.getStart(sourceFile);

  s.appendLeft(classStart, styleSnippet);
}

function insertRequiredImports(s: MagicString): void {
  s.prepend(`import { _if, _switch, _for, _Context, _iterationVariables, _renderElement, _renderText, _renderLiteralText, _createElement, _createSVGElement, _createMATHMLElement, _setProperty, _setExpressionProperty, _setReactiveProperty, _removeAttribute } from '@xaendar/core';\n`);
}

function buildStyleSnippet(varName: string, css: string): string {
  const escaped = css.replace(/\\/g, '\\\\').replace(/`/g, '\`').replace(/\$\{/g, '\${');
  return [
    `const ${varName} = new CSSStyleSheet();`,
    `${varName}.replaceSync(\`${escaped}\`);`,
    '',
  ].join('\n');
}

function findClassDeclarationByName(sourceFile: SourceFile, name: string): ClassDeclaration | undefined {
  let found: ClassDeclaration | undefined;
  forEachChild(sourceFile, node => {
    if (!found && isClassDeclaration(node) && node.name?.text === name) {
      found = node;
    }
  });
  return found;
}

function isDecoratorInitStaticBlock(node: Node): node is ClassStaticBlockDeclaration {
  if (!isClassStaticBlockDeclaration(node)) {
    return false;
  }

  const statements = node.body.statements;
  if (statements.length !== 1) {
    return false;
  }

  const statement = statements[0];
  if (!isExpressionStatement(statement) || !isCallExpression(statement.expression)) {
    return false;
  }

  const { expression: callee, arguments: args } = statement.expression;
  return args.length === 0 && isIdentifier(callee) && /^_initClass\d*$/.test(callee.text);
}