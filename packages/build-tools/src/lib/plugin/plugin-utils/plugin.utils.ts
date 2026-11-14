import { slice } from '@xaendar/common';
import { type CompilerHost, ComponentOrDirectiveMetadata, type ContextCache, Cursor, describeSelectorConflict, describeVariableCall, extractComponentsMetadataFromSourceFile, extractDirectivesMetadataFromSourceFile, findEventCheck, type ImportedSymbol, type ImportNode, isReactiveExport, type LibraryComponentMetadata, type LibraryDirectiveMetadata, readLibraryMetadata, resolveExportedClass, resolveTemplateSpan, type Span, TypeCheckResult } from '@xaendar/compiler';
import { resolveModule, resolveModulePath, type TemplateWarning } from '@xaendar/language-core';
import type MagicString from 'magic-string';
import { readFile } from 'node:fs/promises';
import { ClassLikeDeclaration, ClassStaticBlockDeclaration, CompilerOptions, createSourceFile, Diagnostic, Expression, forEachChild, isBinaryExpression, isCallExpression, isClassDeclaration, isClassExpression, isClassStaticBlockDeclaration, isExpressionStatement, isIdentifier, isParenthesizedExpression, isPropertyAccessExpression, Node, ScriptTarget, SourceFile, SyntaxKind } from 'typescript';
import { LANG_JS_FLAG, RESOLVED_STYLE_MODULE_PREFIX, STYLE_MODULE_PREFIX, STYLE_PATH_PARAM } from '../../costants/style-module-prefix';
import { RESOLVED_TEMPLATE_MODULE_PREFIX, TEMPLATE_MODULE_PREFIX } from '../../costants/template-module-prefix';
import { getLibrarySelectorOwner, getMetadata, getSelectorKey, getSelectorOwner, registerMetadata, registerSelectors } from '../../registry/metadata-registry/metadata-registry';
import type { SelectorOwner } from '../../types/selector-owner.type';
import type { TemplateModuleRequest } from '../../types/template-module-request.type';
import type { TemplateModules } from '../../types/template-modules.type';
import { resolvePosixPath, toPosixPath } from '../../utils/path/path.utils';
import type { RenderRegistration } from '../../types/render-registration.type';

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
 * from '...'` inside a DSL template, `@import lazy` included, resolving them relative to the
 * template's own directory (paths in the template are relative to the
 * .html file, not to the component's .ts file), or as the TypeScript files of the project resolve the paths of the
 * aliases. The modules of the packages are left out: they change only when the packages are installed again.
 * A barrel is the module the path leads to: the files it re-exports are found by {@link resolveTemplateModules}.
 *
 * @param templateSource - The raw content of the `.xd.component.html` template.
 * @param templateDir - The directory containing the template file.
 * @param compilerOptions - Project compiler options, driving how the paths that are not relative are resolved.
 * @returns The list of imported absolute paths, in posix format (may be empty).
 */
export function extractImportedComponentPaths(templateSource: string, templateDir: string, compilerOptions?: CompilerOptions): string[] {
  const importRegex = /@import(?:\s+lazy)?\s*\{[^}]*\}\s*from\s*['"](.+?)['"]/g;
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
 * The modules the template imports with `@import` are imported first, for their side effects: a component or
 * a directive defines itself when its module is evaluated, so loading the template loads what it renders, and
 * only that. The bundler can then split the output along the templates, each chunk pulling in its own dependencies.
 * The modules the compiled code imports dynamically, the ones of the components only the content of a `@hydrate`
 * renders, are left out: the bundler puts them in chunks of their own, loaded when a trigger fires.
 *
 * @param compiledFunctions - The raw output of the template compiler.
 * @param dependencyPaths - The absolute paths of the modules imported by the template.
 * @returns The source code of the template module.
 */
export function generateTemplateModule(compiledFunctions: string, dependencyPaths: readonly string[] = []): string {
  const lines = new Array<string>();
  const deferred = getDynamicImports(compiledFunctions);
  for (let i = 0; i < dependencyPaths.length; i++) {
    if (!deferred?.has(dependencyPaths[i])) {
      lines.push(`import ${JSON.stringify(dependencyPaths[i])};`);
    }
  }

  lines.push(
    'import { _if, _switch, _for, _hydrate, _client, _try, _defer, _scope, _read, _set, _declare, _iterationVariables, _renderElement, _renderText, _renderLiteralText, _setProperty, _setExpressionProperty, _setReactiveProperty, _setInput, _setExpressionInput, _setReactiveInput, _removeAttribute, _resetProperty, _setStyling, _setExpressionStyling, _setReactiveStyling, _removeStyling, _isKey, _renderTemplate, _templateRef, _parameter, _let, _updateText, _runIf, _runFor, _runRender, _runLet, _runConditionalBinding } from \'@xaendar/core\';',
    '',
    compiledFunctions,
    '',
    'export { render };',
    ''
  );

  return lines.join('\n');
}

/**
 * Generates the module of static components for the browser: only the modules of the components they render, so that
 * the interactive ones among them are loaded.
 *
 * @param renderedModules - The absolute paths of the modules of the components they render.
 * @returns The source code of the module.
 */
export function generateStaticModule(renderedModules: readonly string[]): string {
  return `${renderedModules.map(path => `import ${JSON.stringify(path)};`).concat('export {};').join('\n')}\n`;
}

/**
 * Finds the modules the code compiled for the browser imports dynamically: the ones a `@hydrate` loads, written by the
 * compiler as `import("<path>")`.
 *
 * @param compiledFunctions - The output of the template compiler.
 * @returns The paths of the modules, `undefined` when there is none.
 */
function getDynamicImports(compiledFunctions: string): Set<string> | undefined {
  let paths: Set<string> | undefined;
  const importRegex = /\bimport\(("(?:[^"\\]|\\.)*")\)/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(compiledFunctions)) !== null) {
    (paths ??= new Set()).add(JSON.parse(match[1]));
  }

  return paths;
}

/**
 * Wraps the output of the server compiler, which imports the runtime helpers it relies on, into the ES module exporting
 * its `render` entry point, as {@link generateTemplateModule} does for the browser: the modules the template imports are
 * imported first, so that the components it renders are defined on the server too.
 *
 * @param compiledFunctions - The output of the server compiler.
 * @param dependencyPaths - The absolute paths of the modules imported by the template.
 * @returns The source code of the template module.
 */
export function generateServerTemplateModule(compiledFunctions: string, dependencyPaths: readonly string[] = []): string {
  // Filled by index: a push would append after the slots allocated, which join as empty lines
  const end = dependencyPaths.length;
  const lines = new Array<string>(end + 4);
  for (let i = 0; i < end; i++) {
    lines[i] = `import ${JSON.stringify(dependencyPaths[i])};`;
  }

  lines[end] = compiledFunctions;
  lines[end + 1] = '';
  lines[end + 2] = 'export { render };';
  lines[end + 3] = '';
  return lines.join('\n');
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
 * Wraps the compiled CSS of a style file into the ES module evaluated on the server, exporting its text as `css`: the
 * server writes it in a `<style>` of the shadow root of the component. A style file with no actual rules exports an
 * `undefined` text, so no `<style>` is written.
 *
 * @param cssText - The compiled CSS.
 * @returns The source code of the style module.
 */
export function generateServerStyleModule(cssText: string | undefined): string {
  return `export const css = ${cssText?.trim().length ? JSON.stringify(cssText) : 'undefined'};\n`;
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
 * @param code - The `MagicString` wrapping the whole component file, shared
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
 * @param server - Whether the file is evaluated on the server: its modules then export the code rendering the
 *   template into HTML and the text of the stylesheet, registered via `_defineServerRender` of `@xaendar/ssr`.
 * @throws When no class named `className` is found, or none of them has the static block applying
 *   its decorators — meaning the babel decorators plugin didn't run before xaendarPlugin().
 */
export function injectTemplate(code: MagicString, sourceFile: SourceFile, moduleImports: Map<string, string>, className: string, templateModuleSpecifier: string, registration: RenderRegistration, styleModuleSpecifier?: string): void {
  const classes = findClassesByName(sourceFile, className);
  if (!classes?.length) {
    throw `Could not find class "${className}" in the transpiled output.`;
  }

  // The registration must run before the decorators are applied, so it goes before the static block calling babel's `_applyDecs` helper
  const registrationBlock = findApplyDecoratorsStaticBlock(classes);
  if (!registrationBlock) {
    throw `Could not find the static block applying the decorators of class "${className}" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.`;
  }

  const { define, module, styleExport } = registration;
  const first = moduleImports.size === 0;
  const renderName = insertModuleImport(code, moduleImports, 'render', `__${className}_render`, templateModuleSpecifier);
  const styleName = styleModuleSpecifier && insertModuleImport(code, moduleImports, styleExport, `__${className}_${styleExport}`, styleModuleSpecifier);
  insertRenderRegistration(code, sourceFile, registrationBlock, define, renderName, styleName);
  if (first) {
    insertRequiredImports(code, define, module);
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
 * @param typeCheck - The type-check code of the template: the mapping from shim positions to template spans, and the
 *   calls of the variables of the template, whose error is told as such (see `describeVariableCall`).
 * @returns The diagnostic message, prefixed with its template position and followed by the
 *   offending template snippet when the diagnostic can be mapped back to the template.
 */
export function describeDiagnostic(templateSource: string, diagnostic: Diagnostic, bodyLineOffset: number, typeCheck: Pick<TypeCheckResult, 'mappingTable' | 'variableCalls'>): string {
  let message = typeof diagnostic.messageText === 'string' ? diagnostic.messageText : diagnostic.messageText.messageText;
  const templateSpan = locateDiagnostic(diagnostic, bodyLineOffset, typeCheck.mappingTable);
  if (!templateSpan) {
    return message;
  }

  message = describeVariableCall(typeCheck, templateSpan, diagnostic.code) ?? message;
  const templatePosition = new Cursor(templateSource).getPositionFromCharacterIndex(templateSpan.start);
  return `${templatePosition} - ${message}\n ---> ${slice(templateSource, templateSpan.start, templateSpan.end)}`;
}

/**
 * Describes a TS diagnostic reported on the shim of a template as a warning, when it rejects the name of an event the
 * element does not declare (see `findEventCheck`): the binding hears it when it bubbles up to the element, so it does
 * not fail the compilation.
 *
 * @param templateSource - The raw content of the template the shim was generated from.
 * @param diagnostic - The TS diagnostic reported on the shim.
 * @param bodyLineOffset - The line of the shim where the template body starts.
 * @param typeCheck - The type-check code of the template: the mapping from shim positions to template spans, and the
 *   checks of the names of its events.
 * @returns The warning, prefixed with its template position and followed by the name of the event, `undefined` when the
 *   diagnostic is not the one of the name of an event.
 */
export function describeEventCheckDiagnostic(templateSource: string, diagnostic: Diagnostic, bodyLineOffset: number, typeCheck: Pick<TypeCheckResult, 'mappingTable' | 'eventChecks'>): string | undefined {
  const templateSpan = typeCheck.eventChecks && locateDiagnostic(diagnostic, bodyLineOffset, typeCheck.mappingTable);
  const check = templateSpan && findEventCheck(typeCheck, templateSpan, diagnostic.code);
  return check ? describeTemplateWarning(templateSource, { span: check.nameSpan, message: check.message }) : undefined;
}

/**
 * Locates a TS diagnostic reported on the shim of a template in the template.
 *
 * @param diagnostic - The TS diagnostic reported on the shim.
 * @param bodyLineOffset - The line of the shim where the template body starts.
 * @param mappingTable - The mapping from shim positions to template spans.
 * @returns The span of the template, `undefined` when the diagnostic falls outside of the mapped lines.
 */
function locateDiagnostic(diagnostic: Diagnostic, bodyLineOffset: number, mappingTable: TypeCheckResult['mappingTable']): Span | undefined {
  if (!diagnostic.file || diagnostic.start === undefined) {
    return undefined;
  }

  const shimPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  const bodyLine = shimPosition.line - bodyLineOffset;
  return bodyLine < 0 ? undefined : resolveTemplateSpan(mappingTable, { line: bodyLine, character: shimPosition.character });
}

/**
 * Describes a warning of a template.
 *
 * @param templateSource - The raw content of the template.
 * @param warning - The warning.
 * @returns The message of the warning, prefixed with its template position and followed by the template snippet.
 */
export function describeTemplateWarning(templateSource: string, { span, message }: TemplateWarning): string {
  return `${new Cursor(templateSource).getPositionFromCharacterIndex(span.start)} - ${message}\n ---> ${slice(templateSource, span.start, span.end)}`;
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
 * imports, the metadata of the component or of the directive it names, or any other export of the module. A component
 * or a directive the module re-exports (a barrel) is read from the file declaring it. A symbol of a
 * package keeps the path written in the `@import`, which the generated code imports it with: the bundler resolves it
 * like the imports of the application, to the same instance of the module. The declarations of a package keep no
 * decorator: the components and the directives of a compiled library are read from the manifest of its package, and
 * registered like the ones of the project.
 * @param imported The name of the export (`'default'` for the default one, `'*'` for a namespace import).
 * @param local The name the template imports it as, which names a component or a directive exported as default.
 * @param baseDir The directory of the template.
 * @param path The path of the module, as written in the `@import`: relative to the template, an alias of the project
 *   or the name of a package.
 * @param compilerOptions Project compiler options, driving how the path and the modules the export is read through
 *   are resolved.
 * @returns The metadata of the component or of the directive, or the imported symbol, reactive when reading it can read
 *   a signal (a namespace always is, its members are not analyzed).
 * @throws {Error} If the module can't be resolved, the metadata of the class it names can't be extracted, the manifest
 *   of its library can't be read, or its selector is already used by another component or directive.
 */
export async function getImportOrExtract(imported: string, local: string, baseDir: string, path: string, compilerOptions?: CompilerOptions): Promise<ComponentOrDirectiveMetadata | ImportedSymbol> {
  const resolved = resolveModule(baseDir, path, compilerOptions);
  if (!resolved) {
    throw new Error(`Unable to resolve module path "${path}" for "${local}".`);
  }

  const { fileName: modulePath, external } = resolved;
  const library = imported === '*' ? undefined : readLibraryMetadata(modulePath, imported);
  if (library) {
    return await registerLibraryMetadata(library);
  }

  if (imported !== '*' && !DECLARATION_FILE.test(modulePath)) {
    const className = imported === 'default' ? local : imported;
    const metadata = getMetadata(className, modulePath) ?? await extractAndRegisterMetadata(className, modulePath, compilerOptions);
    if (metadata) {
      return metadata;
    }

    const reExported = await extractReExportedMetadata(modulePath, imported, className, compilerOptions);
    if (reExported) {
      return reExported;
    }
  }

  const symbol: ImportedSymbol = { type: 'symbol', modulePath, reactive: imported === '*' || isReactiveExport(modulePath, imported, compilerOptions) };
  if (external) {
    symbol.importPath = path;
  }

  return symbol;
}

/**
 * Resolves the modules a template imports, from its `@import` statements (see {@link TemplateModules}): the module of a
 * component or of a directive is the file declaring its class, also when the template imports it through a barrel, so
 * that loading the template loads only what it renders, or, for one of a compiled library, the path of its package
 * leading to its module, not watched; the module of any other symbol is the one the `@import` leads to. The modules of
 * the other symbols of the packages are left out, as their declarations have no code to import, and so are the files
 * that do not exist.
 *
 * @param importNodes - The `@import` nodes of the template.
 * @param templateDir - The directory of the template, the paths of the `@import`s are relative to.
 * @param cache - The cache resolving the imports.
 * @param host - Tells whether a file exists.
 * @returns The modules the module of the template imports, and the ones it depends on.
 * @throws If a module can't be resolved, or the metadata of a class it declares can't be extracted.
 */
export async function resolveTemplateModules(importNodes: readonly ImportNode[], templateDir: string, cache: Pick<ContextCache, 'getImport'>, host: Pick<CompilerHost, 'fileExists'>): Promise<TemplateModules> {
  const imported = new Set<string>();
  const watched = new Set<string>();
  for (let i = 0; i < importNodes.length; i++) {
    const { specifiers, path, lazy } = importNodes[i];
    for (let j = 0; j < specifiers.length; j++) {
      const resolved = await cache.getImport(specifiers[j].imported, specifiers[j].local, templateDir, path);
      // A package changes only when it is installed again
      const library = resolved.type !== 'symbol' && resolved.importPath !== undefined;
      const module = resolved.type === 'symbol' ? getSymbolModule(resolved, host) : resolved.importPath ?? resolved.modulePath;
      if (module) {
        if (!library) {
          watched.add(module);
        }

        if (!lazy) {
          imported.add(module);
        }
      }
    }
  }

  return { imported: [...imported], watched: [...watched] };
}

/**
 * Returns the module a template imports a symbol from, when it is a file of the project: the declarations of a package
 * have no code to import, and its code changes only when it is installed again.
 *
 * @param symbol - The imported symbol.
 * @param host - Tells whether a file exists.
 * @returns The path of the module, `undefined` for a package or a file that does not exist.
 */
function getSymbolModule({ modulePath, importPath }: ImportedSymbol, host: Pick<CompilerHost, 'fileExists'>): string | undefined {
  return importPath === undefined && !DECLARATION_FILE.test(modulePath) && host.fileExists(modulePath) ? modulePath : undefined;
}

/**
 * Extracts the metadata of the component or of the directive a module exports through a re-export (a barrel: `export *
 * from './card'`, `export { Card as Tile } from './card'`) from the file declaring it, and registers it (see
 * {@link extractAndRegisterMetadata}).
 *
 * @param modulePath - The path of the module.
 * @param exportedName - The name the module exports the class as, `'default'` for the default export.
 * @param triedClassName - The name of the class already looked for in the module itself, not looked for again.
 * @param compilerOptions - Project compiler options, driving how the re-exported modules are resolved.
 * @returns The metadata, `undefined` if the module exports no component nor directive under that name.
 * @throws If the metadata can't be extracted, or the selector is already used by another component or directive.
 */
async function extractReExportedMetadata(modulePath: string, exportedName: string, triedClassName: string, compilerOptions?: CompilerOptions): Promise<ComponentOrDirectiveMetadata | undefined> {
  const exported = resolveExportedClass(modulePath, exportedName, compilerOptions);
  const className = exported?.declaration.name?.text;
  const declaringPath = exported?.sourceFile.fileName;
  if (!className || !declaringPath || DECLARATION_FILE.test(declaringPath) || (declaringPath === modulePath && className === triedClassName)) {
    return undefined;
  }

  return getMetadata(className, declaringPath) ?? await extractAndRegisterMetadata(className, declaringPath, compilerOptions);
}

/**
 * Registers the metadata of a component or of a directive of a compiled library the first time a template imports it,
 * claiming its selector, so that the generator finds it by its selector like the ones of the project.
 *
 * @param metadata - The metadata, read from the manifest of its package.
 * @returns The metadata.
 * @throws If its selector is already used by another component or directive.
 */
async function registerLibraryMetadata(metadata: LibraryComponentMetadata | LibraryDirectiveMetadata): Promise<ComponentOrDirectiveMetadata> {
  if (getMetadata(metadata.className, metadata.modulePath) !== metadata) {
    const selectorConflict = await claimSelectors(metadata);
    if (selectorConflict) {
      throw selectorConflict;
    }

    registerMetadata(metadata.className, metadata);
  }

  return metadata;
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
  const { className, selector, type, modulePath: ownerFile } = metadata;
  const kind = type === 'directive' ? 'Directive' : 'Component';

  if (!selector) {
    return `${kind} "${className}" - ${ownerFile} does not declare a selector.`;
  }

  const selectorKey = getSelectorKey(metadata);
  const library = getLibrarySelectorOwner(selectorKey);
  if (library !== undefined && !('library' in metadata && metadata.library.name === library)) {
    return describeLibrarySelectorConflict(metadata, library);
  }

  const owner = getSelectorOwner(selectorKey);
  const ownedByAnotherClass = owner && (owner.ownerFile !== ownerFile || owner.className !== className);
  if (ownedByAnotherClass && await isSelectorDeclaredBy(owner, selectorKey)) {
    return describeSelectorConflict(metadata, owner);
  }

  // registerSelectors replaces a stale owner, releasing the selector from it
  registerSelectors(metadata, ownerFile);
  return undefined;
}

/**
 * Describes a selector of a component or of a directive that a compiled library defines already.
 *
 * @param metadata - The metadata of the component or of the directive claiming the selector.
 * @param library - The name of the package of the library.
 * @returns The error message.
 */
function describeLibrarySelectorConflict({ className, selector, type, modulePath }: ComponentOrDirectiveMetadata, library: string): string {
  return type === 'directive'
    ? `Selector "${selector}" of directive "${className}" - ${modulePath} is already used by a directive of ${library}. Directive selectors must be unique.`
    : `Selector "${selector}" of component "${className}" - ${modulePath} is already used by a component of ${library}. Custom element names must be unique.`;
}

/**
 * Checks, reading its file from disk, whether a component or a directive still declares a selector. One of a compiled
 * library always does: its package changes only when it is installed again.
 *
 * @param owner - The registered owner of the selector.
 * @param selectorKey - The registry key of the selector (see `getSelectorKey`).
 * @returns `false` if the owner file doesn't exist anymore, or the owner class doesn't declare the
 *   selector anymore; `true` otherwise, also when the metadata can't be extracted, to keep the ownership.
 */
async function isSelectorDeclaredBy({ ownerFile, className }: SelectorOwner, selectorKey: string): Promise<boolean> {
  if (DECLARATION_FILE.test(ownerFile)) {
    return true;
  }

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
 * Inserts the static block registering the render function and the stylesheet of the component, right before
 * `registrationBlock`.
 *
 * @param s - The `MagicString` wrapping the whole component file.
 * @param sourceFile - The AST of the file's ORIGINAL (pre-injection) source.
 * @param registrationBlock - The static block the registration is inserted before.
 * @param define - The runtime function registering them, `_defineRender` or `_defineServerRender`.
 * @param renderName - The local binding of the render function.
 * @param styleName - The local binding of the stylesheet, if the component has one.
 */
function insertRenderRegistration(s: MagicString, sourceFile: SourceFile, registrationBlock: ClassStaticBlockDeclaration, define: string, renderName: string, styleName?: string): void {
  const args = `this, ${renderName}${styleName ? `, ${styleName}` : ''}`;

  s.appendLeft(registrationBlock.getStart(sourceFile), `static { ${define}(${args}); }\n\n  `);
}

/**
 * Imports the runtime function registering the render function, once per file.
 *
 * @param s - The `MagicString` wrapping the whole component file.
 * @param define - The runtime function.
 * @param module - The package exporting it.
 */
function insertRequiredImports(s: MagicString, define: string, module: string): void {
  s.prepend(`import { ${define} } from '${module}';\n`);
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