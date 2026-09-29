import { slice } from '@xaendar/common';
import { ComponentOrDirectiveMetadata, Cursor, extractComponentsMetadataFromSourceFile, resolveTemplateSpan, TypeCheckResult } from '@xaendar/compiler';
import type MagicString from 'magic-string';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { ClassDeclaration, ClassStaticBlockDeclaration, createSourceFile, Diagnostic, forEachChild, isCallExpression, isClassDeclaration, isClassStaticBlockDeclaration, isExpressionStatement, isIdentifier, Node, ScriptTarget, SourceFile } from 'typescript';
import { RESOLVED_STYLE_MODULE_PREFIX, STYLE_MODULE_PREFIX } from '../../costants/style-module-prefix';
import { RESOLVED_TEMPLATE_MODULE_PREFIX, TEMPLATE_MODULE_PREFIX } from '../../costants/template-module-prefix';
import { getMetadata, getSelectorOwner, registerMetadata, registerSelectors } from '../../registry/metadata-registry/metadata-registry';
import type { SelectorOwner } from '../../types/selector-owner.type';
import type { TemplateModuleRequest } from '../../types/template-module-request.type';
import { resolvePosixPath, toPosixPath } from '../../utils/path/path.utils';

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
 * @returns The list of imported absolute paths, in posix format (may be empty).
 */
export function extractImportedComponentPaths(templateSource: string, templateDir: string): string[] {
  const importRegex = /@import\s*\{[^}]*\}\s*from\s*['"](.+?)['"]/g;
  const paths = new Array<string>();
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(templateSource)) !== null) {
    paths.push(resolvePosixPath(templateDir, match[1]));
  }

  return paths;
}

/**
 * Strips CSS block comments (`/* ... *\/`) from a stylesheet, used to detect
 * stylesheets that contain no actual rules.
 *
 * @param css - The raw stylesheet content.
 * @returns The stylesheet content without block comments.
 */
export function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Builds the import specifier of the module exporting the compiled render function of a template.
 *
 * The compiled code depends on the template and on which of the identifiers it references
 * are signal members of the component class, so both are encoded in the specifier: components
 * sharing the same template and signals import the very same module, which is therefore
 * compiled and bundled only once. Signals are sorted so their declaration order doesn't matter.
 *
 * The trailing `lang.js` query flag makes the id look like a JavaScript request to the
 * extension-based checks of the dev server (same convention used by Vue SFC sub-modules).
 *
 * @param templatePath - Absolute path of the template file.
 * @param signals - Signal members of the component class.
 * @returns The import specifier, resolved by the plugin `resolveId` hook.
 */
export function createTemplateModuleSpecifier(templatePath: string, signals: readonly string[]): string {
  const path = toPosixPath(templatePath);
  const encodedSignals = [...signals].sort().map(encodeURIComponent).join(',');
  return `${TEMPLATE_MODULE_PREFIX}${path}?signals=${encodedSignals}&lang.js`;
}

/**
 * Decodes the resolved id of a template module built from {@link createTemplateModuleSpecifier}.
 *
 * @param id - The resolved module id.
 * @returns The template path and signals encoded in the id, or `undefined` if `id`
 *   doesn't identify a template module.
 */
export function parseTemplateModuleId(id: string): TemplateModuleRequest | undefined {
  const queryIndex = id.lastIndexOf('?');
  if (!id.startsWith(RESOLVED_TEMPLATE_MODULE_PREFIX) || queryIndex === -1) {
    return undefined;
  }

  const signals = new URLSearchParams(slice(id, queryIndex + 1)).get('signals');
  return {
    templatePath: slice(id, RESOLVED_TEMPLATE_MODULE_PREFIX.length, queryIndex),
    signals: signals?.split(',') ?? []
  };
}

/**
 * Wraps the output of the template compiler into an ES module importing the runtime
 * helpers it relies on and exporting its `render` entry point. Every other generated
 * function stays private to the module, so it can't be overridden or removed at runtime.
 *
 * @param compiledFunctions - The raw output of the template compiler.
 * @returns The source code of the template module.
 */
export function generateTemplateModule(compiledFunctions: string): string {
  return [
    'import { _if, _switch, _for, _Context, _iterationVariables, _renderElement, _renderText, _renderLiteralText, _createElement, _createSVGElement, _createMATHMLElement, _setProperty, _setExpressionProperty, _setReactiveProperty, _removeAttribute } from \'@xaendar/core\';',
    '',
    compiledFunctions,
    '',
    'export { render };',
    ''
  ].join('\n');
}

/**
 * Builds the import specifier of the module exporting the compiled stylesheet of a style file.
 *
 * The stylesheet only depends on the style file, so every component using it, in the same file
 * or in different ones, imports the very same module: the CSS is compiled and bundled only once,
 * and a single `CSSStyleSheet` is shared by all of them.
 *
 * @param stylePath - Absolute path of the style file.
 * @returns The import specifier, resolved by the plugin `resolveId` hook.
 */
export function createStyleModuleSpecifier(stylePath: string): string {
  const path = toPosixPath(stylePath);
  return `${STYLE_MODULE_PREFIX}path=${encodeURIComponent(path)}&lang.js`;
}

/**
 * Decodes the resolved id of a style module built from {@link createStyleModuleSpecifier}.
 *
 * @param id - The resolved module id.
 * @returns The style path encoded in the id, or `undefined` if `id` doesn't identify a style module.
 */
export function parseStyleModuleId(id: string): string | undefined {
  if (!id.startsWith(RESOLVED_STYLE_MODULE_PREFIX)) {
    return undefined;
  }

  return new URLSearchParams(slice(id, RESOLVED_STYLE_MODULE_PREFIX.length)).get('path') ?? undefined;
}

/**
 * Wraps the compiled CSS of a style file into an ES module exporting it as a `sheet` `CSSStyleSheet`.
 * A style file with no actual rules exports an `undefined` sheet, so no stylesheet is adopted.
 *
 * @param cssText - The compiled CSS.
 * @returns The source code of the style module.
 */
export function generateStyleModule(cssText: string | undefined): string {
  if (!cssText?.trim().length) {
    return 'export const sheet = undefined;\n';
  }

  return [
    'const sheet = new CSSStyleSheet();',
    `sheet.replaceSync(${JSON.stringify(cssText)});`,
    '',
    'export { sheet };',
    ''
  ].join('\n');
}

/**
 * Wires a component to its compiled template into the shared `MagicString`
 * wrapping the whole transpiled component file, applying the three required
 * mutations — template and style module imports, render function registration,
 * and missing runtime imports — each in its own dedicated function.
 *
 * Neither the render function nor the stylesheet is generated inline: they are
 * imported from the template module identified by `templateModuleSpecifier` and
 * from the style module identified by `styleModuleSpecifier`, each shared by every
 * component using the same template or style file, and registered via `_defineRender`
 * in a static block of the class. Components of the same file sharing the same
 * module share a single import of it too.
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
 * @param moduleImports - The template and style modules already imported in the file, keyed by
 *   module specifier and mapped to the local binding of their export. Must be created once per
 *   file, empty, and shared across every component declared in it: the component finding it
 *   empty is the first one of the file.
 * @param className - The name of the target class in this file.
 * @param templateModuleSpecifier - The import specifier of the compiled template module
 *   (see {@link createTemplateModuleSpecifier}).
 * @param styleModuleSpecifier - The import specifier of the compiled style module
 *   (see {@link createStyleModuleSpecifier}), if the component has a stylesheet.
 * @throws When `className` isn't found, or its decorator finalizer static
 *   block isn't found — meaning the component file wasn't scaffolded
 *   correctly, or the babel decorators plugin didn't run before xaendarPlugin().
 */
export function injectTemplate(s: MagicString, sourceFile: SourceFile, moduleImports: Map<string, string>, className: string, templateModuleSpecifier: string, styleModuleSpecifier?: string): void {
  const classDecl = findClassDeclarationByName(sourceFile, className);
  if (!classDecl) {
    throw `Could not find class "${className}" in the transpiled output.`;
  }

  const placeholderBlock = classDecl.members.find(isDecoratorInitStaticBlock);
  if (!placeholderBlock) {
    throw `Could not find the static initializer block for class "${className}" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.`;
  }

  /*
    The registration must run before the decorators are applied, so it goes before the static block
    calling babel's `_applyDecs` helper (falling back to the finalizer block when there's none).
  */
  const registrationBlock = classDecl.members.find(isApplyDecoratorsStaticBlock) ?? placeholderBlock;
  const first = moduleImports.size === 0;
  const renderName = insertModuleImport(s, moduleImports, 'render', `__${className}_render`, templateModuleSpecifier);
  const styleSheetName = styleModuleSpecifier && insertModuleImport(s, moduleImports, 'sheet', `__${className}_sheet`, styleModuleSpecifier);
  insertRenderRegistration(s, sourceFile, registrationBlock, renderName, styleSheetName);
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
 *
 * @param templateSource - The raw content of the template the shim was generated from.
 * @param diagnostic - The TS diagnostic reported on the shim.
 * @param bodyLineOffset - The line of the shim where the template body starts.
 * @param mappingTable - The mapping from shim positions to template spans.
 * @returns The diagnostic message, prefixed with its template position and followed by the
 *   offending template snippet when the diagnostic can be mapped back to the template.
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
 * @param classNameOrSelector The name of the component or directive to retrieve metadata for.
 * @param path Optional path(s) to the source file(s) containing the component or directive.
 * @returns The metadata for the specified component or directive.
 * @throws {Error} If the file declaring the symbol can't be resolved, the symbol's metadata
 *   can't be found in it, or its selector is already used by another component.
 */
export async function getMetadataOrExtract(classNameOrSelector: string, path?: string | string[]): Promise<ComponentOrDirectiveMetadata> {
  // Posix paths, to match the owner file keys of the metadata registry (TS source file names)
  const resolvedPath = path && (Array.isArray(path) ? resolveModulePath(path[0], path[1]) : resolvePosixPath(path));
  let metadata = getMetadata(classNameOrSelector, resolvedPath) ?? getMetadata(classNameOrSelector);
  if (metadata) {
    return metadata;
  }

  // The metadata of a selector reclaimed by the idle sweep is extracted again from the file owning it
  const owner = getSelectorOwner(classNameOrSelector);
  const className = owner?.className ?? classNameOrSelector;
  const filePath = resolvedPath ?? owner?.ownerFile;
  if (!filePath) {
    throw new Error(`Unable to resolve module path for "${classNameOrSelector}".`);
  }

  const sourceFile = createSourceFile(filePath, await readFile(filePath, 'utf-8'), ScriptTarget.Latest, true);
  const metadatas = await extractComponentsMetadataFromSourceFile(sourceFile);
  metadata = metadatas?.get(className);
  if (!metadata) {
    throw new Error(`Metadata for symbol "${classNameOrSelector}" not found.`);
  }

  const selectorConflict = await claimSelectors(metadata);
  if (selectorConflict) {
    throw new Error(selectorConflict);
  }

  // Definire un criterio per il quale si cacha oppure no, non possiamo cachare tutto, troppa memoria!!!
  registerMetadata(className, metadata);
  return metadata;
}

/**
 * Registers a component as the owner of its selector, unless it is already owned by another
 * component: a custom element name can be defined only once at runtime, so two components
 * sharing a selector would make the second definition throw.
 *
 * An ownership may be stale while the dev server is running (e.g. a selector moved from a file to
 * another one transformed first), so a conflicting owner is checked against its file on disk and
 * replaced when it no longer declares the selector.
 *
 * @param metadata - The metadata of the component claiming its selector.
 * @returns The error message describing the conflict, or `undefined` if the selector has been claimed.
 */
export async function claimSelectors(metadata: ComponentOrDirectiveMetadata): Promise<string | undefined> {
  const { className, selector } = metadata;
  const ownerFile = metadata.typescriptNodes.klass.getSourceFile().fileName;

  if (!selector) {
    return `Component "${className}" - ${ownerFile} does not declare a selector.`;
  }

  const owner = getSelectorOwner(selector);
  const ownedByAnotherComponent = owner && (owner.ownerFile !== ownerFile || owner.className !== className);
  if (ownedByAnotherComponent && await isSelectorDeclaredBy(owner, selector)) {
    return `Selector "${selector}" of component "${className}" - ${ownerFile} is already used by component "${owner.className}" - ${owner.ownerFile}. Custom element names must be unique.`;
  }

  // registerSelectors replaces a stale owner, releasing the selector from it
  registerSelectors(metadata, ownerFile);
  return undefined;
}

/**
 * Resolves a module import path to an actual file system path.
 * Handles both relative paths (./button.component) and package paths (@scope/pkg).
 *
 * @param baseDir - The directory to resolve relative imports from
 * @param modulePath - The import module path
 * @returns The resolved file path, in posix format, or undefined if not found
 */
export function resolveModulePath(baseDir: string, modulePath: string): string | undefined {
  // Handle relative imports
  if (modulePath.startsWith('.')) {
    const resolvedPath = resolvePosixPath(baseDir, modulePath);

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

/**
 * Checks, reading its file from disk, whether a component still declares a selector.
 *
 * @param owner - The registered owner of the selector.
 * @param selector - The custom element selector.
 * @returns `false` if the owner file doesn't exist anymore, or the owner class doesn't declare the
 *   selector anymore; `true` otherwise, also when the metadata can't be extracted, to keep the ownership.
 */
async function isSelectorDeclaredBy({ ownerFile, className }: SelectorOwner, selector: string): Promise<boolean> {
  let source: string;
  try {
    source = await readFile(ownerFile, 'utf-8');
  } catch {
    return false;
  }

  try {
    const metadatas = await extractComponentsMetadataFromSourceFile(createSourceFile(ownerFile, source, ScriptTarget.Latest, true));
    return metadatas?.get(className)?.selector === selector;
  } catch {
    return true;
  }
}

/**
 * Imports `exportName` from the module identified by `specifier` as `localName`, unless another
 * component of the file sharing the same module has already imported it.
 *
 * @param s - The `MagicString` wrapping the whole component file.
 * @param moduleImports - The modules already imported in the file (see {@link injectTemplate}).
 * @param exportName - The name of the export to import.
 * @param localName - The local binding to import the export as, if not already imported.
 * @param specifier - The import specifier of the module.
 * @returns The local binding of the imported export.
 */
function insertModuleImport(s: MagicString, moduleImports: Map<string, string>, exportName: string, localName: string, specifier: string): string {
  const importedName = moduleImports.get(specifier);
  if (importedName) {
    return importedName;
  }

  moduleImports.set(specifier, localName);
  s.prepend(`import { ${exportName} as ${localName} } from ${JSON.stringify(specifier)};\n`);
  return localName;
}

/**
 * Inserts the static block registering the render function and the stylesheet of the component
 * via `_defineRender`, right before `registrationBlock`.
 *
 * @param s - The `MagicString` wrapping the whole component file.
 * @param sourceFile - The AST of the file's ORIGINAL (pre-injection) source.
 * @param registrationBlock - The static block the registration is inserted before.
 * @param renderName - The local binding of the render function.
 * @param styleSheetName - The local binding of the stylesheet, if the component has one.
 */
function insertRenderRegistration(s: MagicString, sourceFile: SourceFile, registrationBlock: ClassStaticBlockDeclaration, renderName: string, styleSheetName?: string): void {
  const args = `this, ${renderName}${styleSheetName ? `, ${styleSheetName}` : ''}`;

  s.appendLeft(registrationBlock.getStart(sourceFile), `static { _defineRender(${args}); }\n\n  `);
}

/**
 * Imports the runtime helpers needed by the injected code, once per file.
 *
 * @param s - The `MagicString` wrapping the whole component file.
 */
function insertRequiredImports(s: MagicString): void {
  s.prepend('import { _defineRender } from \'@xaendar/core\';\n');
}

/**
 * Finds a top-level class declaration by name.
 *
 * @param sourceFile - The AST to search in.
 * @param name - The name of the class.
 * @returns The first class declaration named `name`, or `undefined` if there's none.
 */
function findClassDeclarationByName(sourceFile: SourceFile, name: string): ClassDeclaration | undefined {
  let found: ClassDeclaration | undefined;
  forEachChild(sourceFile, node => {
    if (!found && isClassDeclaration(node) && node.name?.text === name) {
      found = node;
    }
  });
  return found;
}

/**
 * Checks whether `node` is the static block emitted by babel to finalize the decorated class,
 * i.e. a static block containing only an argument-less call to `_initClass` (e.g. `_initClass2()`).
 *
 * @param node - The node to check.
 * @returns `true` if `node` is the decorator finalizer static block.
 */
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

/**
 * Checks whether `node` is the static block emitted by babel to apply the class decorators,
 * i.e. a static block containing a call to the `_applyDecs` helper (e.g. `_applyDecs2311`).
 *
 * @param node - The node to check.
 * @returns `true` if `node` is the static block applying the decorators.
 */
function isApplyDecoratorsStaticBlock(node: Node): node is ClassStaticBlockDeclaration {
  return isClassStaticBlockDeclaration(node) && containsApplyDecoratorsCall(node);
}

/**
 * Checks whether `node`, or any of its descendants, is a call to babel's `_applyDecs` helper.
 *
 * @param node - The node to search in.
 * @returns `true` if a call to the `_applyDecs` helper is found.
 */
function containsApplyDecoratorsCall(node: Node): boolean {
  if (isCallExpression(node) && isIdentifier(node.expression) && /^_applyDecs\w*$/.test(node.expression.text)) {
    return true;
  }

  return forEachChild(node, containsApplyDecoratorsCall) ?? false;
}