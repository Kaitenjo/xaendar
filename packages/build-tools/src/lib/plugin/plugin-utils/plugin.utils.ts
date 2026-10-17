import { slice } from '@xaendar/common';
import { ComponentOrDirectiveMetadata, Cursor, extractComponentsMetadataFromSourceFile, extractDirectivesMetadataFromSourceFile, type ImportedSymbol, isReactiveExport, resolveTemplateSpan, TypeCheckResult } from '@xaendar/compiler';
import { resolveModule, resolveModulePath } from '@xaendar/language-core';
import type MagicString from 'magic-string';
import { readFile } from 'node:fs/promises';
import { ClassLikeDeclaration, ClassStaticBlockDeclaration, CompilerOptions, createSourceFile, Diagnostic, Expression, forEachChild, isBinaryExpression, isCallExpression, isClassDeclaration, isClassExpression, isClassStaticBlockDeclaration, isExpressionStatement, isIdentifier, isParenthesizedExpression, isPropertyAccessExpression, Node, ScriptTarget, SourceFile, SyntaxKind } from 'typescript';
import { LANG_JS_FLAG, RESOLVED_STYLE_MODULE_PREFIX, STYLE_MODULE_PREFIX, STYLE_PATH_PARAM } from '../../costants/style-module-prefix';
import { RESOLVED_TEMPLATE_MODULE_PREFIX, TEMPLATE_MODULE_PREFIX } from '../../costants/template-module-prefix';
import { getMetadata, getSelectorKey, getSelectorOwner, registerMetadata, registerSelectors } from '../../registry/metadata-registry/metadata-registry';
import type { SelectorOwner } from '../../types/selector-owner.type';
import type { TemplateModuleRequest } from '../../types/template-module-request.type';
import { resolvePosixPath, toPosixPath } from '../../utils/path/path.utils';

/**
 * The declaration files, whose classes keep no decorator: a package compiled to JavaScript declares no component nor
 * directive a template can read the metadata of.
 */
const DECLARATION_FILE = /\.d\.[cm]?ts$/;

/**
 * TODO: This could be eliminated if we find a way to extract the metadata informations
 * from the AST after the compile function has been invoked.
 * Currently we watch the improted files BEFORE compile function has been called, making
 * this optimization impossible.
 * When a global cache of the import metadata will be implemented we can safely remove this
 *
 * Extracts the absolute paths of every module (of a component, a directive or any other symbol) imported via `@import { X }
 * from '...'` inside a DSL template, resolving them relative to the
 * template's own directory (paths in the template are relative to the
 * .html file, not to the component's .ts file), or as the TypeScript files of the project resolve the paths of the
 * aliases. The modules of the packages are left out: they change only when the packages are installed again.
 *
 * @param templateSource - The raw content of the `.xd.component.html` template.
 * @param templateDir - The directory containing the template file.
 * @param compilerOptions - Project compiler options, driving how the paths that are not relative are resolved.
 * @returns The list of imported absolute paths, in posix format (may be empty).
 */
export function extractImportedComponentPaths(templateSource: string, templateDir: string, compilerOptions?: CompilerOptions): string[] {
  const importRegex = /@import\s*\{[^}]*\}\s*from\s*['"](.+?)['"]/g;
  const paths = new Array<string>();
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(templateSource)) !== null) {
    // The module of a symbol can be imported without its extension, like any TypeScript module
    const resolved = resolveModule(templateDir, match[1], compilerOptions);
    if (!resolved) {
      paths.push(resolvePosixPath(templateDir, match[1]));
    } else if (!resolved.external) {
      paths.push(resolved.fileName);
    }
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
 * The class members named like a global identifier change the compiled code as well, so they are
 * encoded too, sorted, only when there are any.
 *
 * The trailing `lang.js` query flag makes the id look like a JavaScript request to the
 * extension-based checks of the dev server (same convention used by Vue SFC sub-modules).
 *
 * @param templatePath - Absolute path of the template file.
 * @param signals - Signal members of the component class.
 * @param shadowingMembers - Members of the component class named like a global identifier.
 * @returns The import specifier, resolved by the plugin `resolveId` hook.
 */
export function createTemplateModuleSpecifier(templatePath: string, signals: readonly string[], shadowingMembers: readonly string[] = []): string {
  const path = toPosixPath(templatePath);
  const encode = (names: readonly string[]) => [...names].sort().map(encodeURIComponent).join(',');
  const shadowing = shadowingMembers.length ? `&shadowing=${encode(shadowingMembers)}` : '';
  return `${TEMPLATE_MODULE_PREFIX}${path}?signals=${encode(signals)}${shadowing}&lang.js`;
}

/**
 * Decodes the resolved id of a template module built from {@link createTemplateModuleSpecifier}.
 *
 * @param id - The resolved module id.
 * @returns The template path, signals and shadowing members encoded in the id, or `undefined` if `id`
 *   doesn't identify a template module.
 */
export function parseTemplateModuleId(id: string): TemplateModuleRequest | undefined {
  const queryIndex = id.lastIndexOf('?');
  if (!id.startsWith(RESOLVED_TEMPLATE_MODULE_PREFIX) || queryIndex === -1) {
    return undefined;
  }

  const query = new URLSearchParams(slice(id, queryIndex + 1));
  const signals = query.get('signals');
  const shadowingMembers = query.get('shadowing');
  return {
    templatePath: slice(id, RESOLVED_TEMPLATE_MODULE_PREFIX.length, queryIndex),
    // An empty list is encoded as `signals=`, which `split` would turn into `['']`
    signals: signals ? signals.split(',') : [],
    // Omitted from the id when there are none
    shadowingMembers: shadowingMembers ? shadowingMembers.split(',') : []
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
    'import { _if, _switch, _for, _Context, _iterationVariables, _renderElement, _renderText, _renderLiteralText, _createElement, _createSVGElement, _createMATHMLElement, _setProperty, _setExpressionProperty, _setReactiveProperty, _removeAttribute, _resetProperty, _template, _renderTemplate, _parameter, _let } from \'@xaendar/core\';',
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
 * The path is not percent-encoded, as in the template module specifier: the dev server decodes the
 * URL requested by the browser before looking its module up, so an encoded character (e.g. `%20`) would
 * resolve to a second module, never invalidated when the style file changes.
 *
 * @param stylePath - Absolute path of the style file.
 * @returns The import specifier, resolved by the plugin `resolveId` hook.
 */
export function createStyleModuleSpecifier(stylePath: string): string {
  const path = toPosixPath(stylePath);
  return `${STYLE_MODULE_PREFIX}${STYLE_PATH_PARAM}${path}${LANG_JS_FLAG}`;
}

/**
 * Decodes the resolved id of a style module built from {@link createStyleModuleSpecifier}.
 *
 * @param id - The resolved module id.
 * @returns The style path encoded in the id, or `undefined` if `id` doesn't identify a style module.
 */
export function parseStyleModuleId(id: string): string | undefined {
  const pathPrefix = `${RESOLVED_STYLE_MODULE_PREFIX}${STYLE_PATH_PARAM}`;
  if (!id.startsWith(pathPrefix) || !id.endsWith(LANG_JS_FLAG)) {
    return undefined;
  }

  // The path is taken as is, since it may contain characters with a meaning in a query (e.g. `&`)
  return slice(id, pathPrefix.length, -LANG_JS_FLAG.length);
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
 * @throws When no class named `className` is found, or none of them has the static block applying
 *   its decorators — meaning the babel decorators plugin didn't run before xaendarPlugin().
 */
export function injectTemplate(s: MagicString, sourceFile: SourceFile, moduleImports: Map<string, string>, className: string, templateModuleSpecifier: string, styleModuleSpecifier?: string): void {
  const classes = findClassesByName(sourceFile, className);
  if (!classes?.length) {
    throw `Could not find class "${className}" in the transpiled output.`;
  }

  // The registration must run before the decorators are applied, so it goes before the static block calling babel's `_applyDecs` helper
  const registrationBlock = findApplyDecoratorsStaticBlock(classes);
  if (!registrationBlock) {
    throw `Could not find the static block applying the decorators of class "${className}" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.`;
  }

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
 * @param compilerOptions Project compiler options, driving how the modules declaring its base classes are resolved.
 * @returns The metadata for the specified component or directive.
 * @throws {Error} If the file declaring the symbol can't be resolved, the symbol's metadata
 *   can't be found in it, or its selector is already used by another component or directive.
 */
export async function getMetadataOrExtract(classNameOrSelector: string, path?: string | string[], compilerOptions?: CompilerOptions): Promise<ComponentOrDirectiveMetadata> {
  // Posix paths, to match the owner file keys of the metadata registry (TS source file names)
  const resolvedPath = path && (Array.isArray(path) ? resolveModulePath(path[0], path[1], compilerOptions) : resolvePosixPath(path));
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

  metadata = await extractAndRegisterMetadata(className, filePath, compilerOptions);
  if (!metadata) {
    throw `Class "${classNameOrSelector}" was not found in the import from ${Array.isArray(path) ? path[1] : filePath}`;
  }

  return metadata;
}

/**
 * Base implementation for the getImport method of the plugin cache: resolves what an `@import` specifier of a template
 * imports, the metadata of the component or of the directive it names, or any other export of the module. A symbol of a
 * package keeps the path written in the `@import`, which the generated code imports it with: the bundler resolves it
 * like the imports of the application, to the same instance of the module. The declarations of a package declare no
 * component nor directive: their decorators are not part of them.
 * @param imported The name of the export (`'default'` for the default one, `'*'` for a namespace import).
 * @param local The name the template imports it as, which names a component or a directive exported as default.
 * @param baseDir The directory of the template.
 * @param path The path of the module, as written in the `@import`: relative to the template, an alias of the project
 *   or the name of a package.
 * @param compilerOptions Project compiler options, driving how the path and the modules the export is read through
 *   are resolved.
 * @returns The metadata of the component or of the directive, or the imported symbol, reactive when reading it can read
 *   a signal (a namespace always is, its members are not analyzed).
 * @throws {Error} If the module can't be resolved, or the metadata of the class it names can't be extracted.
 */
export async function getImportOrExtract(imported: string, local: string, baseDir: string, path: string, compilerOptions?: CompilerOptions): Promise<ComponentOrDirectiveMetadata | ImportedSymbol> {
  const resolved = resolveModule(baseDir, path, compilerOptions);
  if (!resolved) {
    throw new Error(`Unable to resolve module path "${path}" for "${local}".`);
  }

  const { fileName: modulePath, external } = resolved;
  if (imported !== '*' && !DECLARATION_FILE.test(modulePath)) {
    const className = imported === 'default' ? local : imported;
    const metadata = getMetadata(className, modulePath) ?? await extractAndRegisterMetadata(className, modulePath, compilerOptions);
    if (metadata) {
      return metadata;
    }
  }

  const symbol: ImportedSymbol = { type: 'symbol', modulePath, reactive: imported === '*' || isReactiveExport(modulePath, imported, compilerOptions) };
  if (external) {
    symbol.importPath = path;
  }

  return symbol;
}

/**
 * Extracts the metadata of a component or a directive from the file declaring it, and registers it, claiming its selector.
 *
 * @param className - The name of the class.
 * @param filePath - The path of the file declaring it.
 * @param compilerOptions - Project compiler options, driving how the modules declaring its base classes are resolved.
 * @returns The metadata, `undefined` if the file doesn't declare a component or a directive with that name.
 * @throws If the metadata can't be extracted, or the selector is already used by another component or directive.
 */
async function extractAndRegisterMetadata(className: string, filePath: string, compilerOptions?: CompilerOptions): Promise<ComponentOrDirectiveMetadata | undefined> {
  const sourceFile = createSourceFile(filePath, await readFile(filePath, 'utf-8'), ScriptTarget.Latest, true);
  const metadata = await extractClassMetadata(sourceFile, className, compilerOptions);
  if (!metadata) {
    return undefined;
  }

  const selectorConflict = await claimSelectors(metadata);
  if (selectorConflict) {
    throw selectorConflict;
  }

  // Definire un criterio per il quale si cacha oppure no, non possiamo cachare tutto, troppa memoria!!!
  registerMetadata(className, metadata);
  return metadata;
}

/**
 * Registers a component or a directive as the owner of its selector, unless it is already owned by another
 * one: a custom element name, or a directive selector, can be defined only once at runtime, so two components
 * (or two directives) sharing a selector would make the second definition throw.
 * Components and directives don't share selectors, since they are applied in different ways.
 *
 * An ownership may be stale while the dev server is running (e.g. a selector moved from a file to
 * another one transformed first), so a conflicting owner is checked against its file on disk and
 * replaced when it no longer declares the selector.
 *
 * @param metadata - The metadata of the component or directive claiming its selector.
 * @returns The error message describing the conflict, or `undefined` if the selector has been claimed.
 */
export async function claimSelectors(metadata: ComponentOrDirectiveMetadata): Promise<string | undefined> {
  const { className, selector, type } = metadata;
  const ownerFile = metadata.typescriptNodes.klass.getSourceFile().fileName;
  const kind = type === 'directive' ? 'Directive' : 'Component';

  if (!selector) {
    return `${kind} "${className}" - ${ownerFile} does not declare a selector.`;
  }

  const selectorKey = getSelectorKey(metadata);
  const owner = getSelectorOwner(selectorKey);
  const ownedByAnotherClass = owner && (owner.ownerFile !== ownerFile || owner.className !== className);
  if (ownedByAnotherClass && await isSelectorDeclaredBy(owner, selectorKey)) {
    return type === 'directive'
      ? `Selector "${selector}" of directive "${className}" - ${ownerFile} is already used by directive "${owner.className}" - ${owner.ownerFile}. Directive selectors must be unique.`
      : `Selector "${selector}" of component "${className}" - ${ownerFile} is already used by component "${owner.className}" - ${owner.ownerFile}. Custom element names must be unique.`;
  }

  // registerSelectors replaces a stale owner, releasing the selector from it
  registerSelectors(metadata, ownerFile);
  return undefined;
}

/**
 * Checks, reading its file from disk, whether a component or a directive still declares a selector.
 *
 * @param owner - The registered owner of the selector.
 * @param selectorKey - The registry key of the selector (see `getSelectorKey`).
 * @returns `false` if the owner file doesn't exist anymore, or the owner class doesn't declare the
 *   selector anymore; `true` otherwise, also when the metadata can't be extracted, to keep the ownership.
 */
async function isSelectorDeclaredBy({ ownerFile, className }: SelectorOwner, selectorKey: string): Promise<boolean> {
  let source: string;
  try {
    source = await readFile(ownerFile, 'utf-8');
  } catch {
    return false;
  }

  try {
    const metadata = await extractClassMetadata(createSourceFile(ownerFile, source, ScriptTarget.Latest, true), className);
    return !!metadata && getSelectorKey(metadata) === selectorKey;
  } catch {
    return true;
  }
}

/**
 * Extracts the metadata of a component or a directive declared in a source file.
 *
 * @param sourceFile - The source file declaring the class.
 * @param className - The name of the component or directive class.
 * @param compilerOptions - Project compiler options, driving how the modules declaring its base classes are resolved.
 * @returns The metadata of the class, or `undefined` if the file doesn't declare a component or a directive with that name.
 * @throws If the metadata of the class can't be extracted, e.g. two of its properties resolve to the same name.
 */
async function extractClassMetadata(sourceFile: SourceFile, className: string, compilerOptions?: CompilerOptions): Promise<ComponentOrDirectiveMetadata | undefined> {
  return (await extractComponentsMetadataFromSourceFile(sourceFile, compilerOptions))?.get(className) ?? (await extractDirectivesMetadataFromSourceFile(sourceFile, compilerOptions))?.get(className);
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
 * Finds every class named `name`, at any depth: babel keeps a decorated class as a declaration, but turns it
 * into a class expression nested in a wrapper class when it has static fields, which must be initialized
 * once the class decorators are applied:
 *
 * ```js
 * new class extends _identity {
 *   static [class Foo extends Base { static { … = _applyDecs(this, …); } }];
 *   field = 1; // the static field
 *   constructor() { super(_Foo), _initClass(); }
 * }();
 * ```
 *
 * @param node - The node to search in.
 * @param name - The name of the class.
 * @param found - The classes found so far, created by the first class found.
 * @returns The classes named `name`, in source order, or `undefined` if there's none.
 */
function findClassesByName(node: Node, name: string, found?: ClassLikeDeclaration[]): ClassLikeDeclaration[] | undefined {
  if ((isClassDeclaration(node) || isClassExpression(node)) && node.name?.text === name) {
    found ??= new Array<ClassLikeDeclaration>();
    found.push(node);
  }

  forEachChild(node, child => {
    found = findClassesByName(child, name, found);
  });
  return found;
}

/**
 * Finds the static block emitted by babel to apply the decorators of a class, in the first of `classes` having one.
 *
 * @param classes - The classes to search in.
 * @returns The static block applying the decorators, or `undefined` if none of the classes has one.
 */
function findApplyDecoratorsStaticBlock(classes: ClassLikeDeclaration[]): ClassStaticBlockDeclaration | undefined {
  for (let i = 0; i < classes.length; i++) {
    const block = classes[i].members.find(isApplyDecoratorsStaticBlock);
    if (block) {
      return block;
    }
  }

  return undefined;
}

/**
 * Checks whether `node` is the static block emitted by babel to apply the decorators of its own class: a block whose
 * only statement assigns the result of the `_applyDecs` helper (e.g. `_applyDecs2311`) called on `this`, either
 * directly (`({ e: […], c: […] } = _applyDecs(this, …))`, with member decorators) or through one of its properties
 * (`[_Foo, _initClass] = _applyDecs(this, …).c`). A call nested anywhere else, e.g. in a class declared inside the
 * block, does not count.
 *
 * @param node - The node to check.
 * @returns `true` if `node` is the static block applying the decorators.
 */
function isApplyDecoratorsStaticBlock(node: Node): node is ClassStaticBlockDeclaration {
  if (!isClassStaticBlockDeclaration(node) || node.body.statements.length !== 1) {
    return false;
  }

  const statement = node.body.statements[0];
  if (!isExpressionStatement(statement)) {
    return false;
  }

  const assignment = skipParentheses(statement.expression);
  if (!isBinaryExpression(assignment) || assignment.operatorToken.kind !== SyntaxKind.EqualsToken) {
    return false;
  }

  const call = isPropertyAccessExpression(assignment.right) ? assignment.right.expression : assignment.right;
  return isCallExpression(call)
    && isIdentifier(call.expression)
    && /^_applyDecs\w*$/.test(call.expression.text)
    && call.arguments[0]?.kind === SyntaxKind.ThisKeyword;
}

/**
 * Removes the parentheses wrapping an expression.
 *
 * @param expression - The expression, possibly parenthesized.
 * @returns The innermost expression.
 */
function skipParentheses(expression: Expression): Expression {
  while (isParenthesizedExpression(expression)) {
    expression = expression.expression;
  }

  return expression;
}