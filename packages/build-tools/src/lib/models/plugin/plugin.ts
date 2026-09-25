import { isValidCustomElementName, slice } from '@xaendar/common';
import { compile, ComponentOrDirectiveMetadata, Cursor, extractComponentsMetadataFromSourceFile, extractSignalMembers, resolveTemplateSpan, TypeCheckResult } from '@xaendar/compiler';
import { createShim, disposeLanguageService, getLanguageService, loadCompilerOptions, registerRealFile, removeRealFile, removeVirtualFile } from '@xaendar/language-core';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { ClassDeclaration, ClassStaticBlockDeclaration, createSourceFile, Diagnostic, forEachChild, isCallExpression, isClassDeclaration, isClassStaticBlockDeclaration, isExpressionStatement, isIdentifier, Node, ScriptKind, ScriptTarget, SourceFile } from 'typescript';
import type { Logger, Plugin } from 'vite';
import { COMPONENT_FILE_RE } from '../../costants/component-filename-regex';
import { clearImportRegistry, clearImportsForComponent, findComponentsForImport, registerImportMapping } from '../import-registry';
import { clearMetadataMappingsForFile, clearMetadataRegistry, getMetadataMapping, registerMetadataMapping } from '../metadata-registry';
import { NodeCompilerHost } from '../node-compiler-host/node-compiler-host.model';
import { clearTemplateRegistry, findComponentsForTemplate, registerTemplateMapping, removeAllMappingsForComponent, removeTemplateMapping } from '../template-registry';

/**
 * Vite plugin that compiles Xaendar DSL template files (`.xd.component.html`)
 * and injects the generated render methods into the associated component class.
 *
 * ## Dev mode
 *
 * Files are transformed on demand when the browser requests them. The plugin
 * registers the template as a watch file via `this.addWatchFile` so that
 * modifying the template invalidates the component module and triggers HMR.
 *
 * ## Production build
 *
 * The same `transform` hook runs for every component file during the esbuild
 * bundling phase. The output is handed to esbuild as TypeScript, which strips
 * the types and produces the final JavaScript bundle.
 *
 * @returns A Vite {@link Plugin} instance.
 *
 * @example
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { xaendarPlugin } from '@xaendar/build-tools';
 *
 * export default defineConfig({
 *   plugins: [xaendarPlugin()],
 * });
 */
export function xaendarPlugin(): Plugin {
  const host = new NodeCompilerHost;
  const compilerOptions = loadCompilerOptions(import.meta.url);
  let logger: Logger | undefined;

  const logError = (error: unknown, prefix: string): void => {
    const stack = error instanceof Error ? error.stack : '';
    const redMessage = `\x1b[31m\rXaendar: ${prefix} - ${error} ${stack?.slice(stack.indexOf('\n    at'))}\x1b[0m\n`;
    (logger ?? console).error(redMessage.replace(/^Error:\s*/, ''))
  };

  return {
    name: 'xaendar',
    async transform(code, id) {
      if (!COMPONENT_FILE_RE.test(id)) {
        return code;
      }

      const tsSource = createSourceFile(id, await readFile(id, 'utf8'), ScriptTarget.Latest, true);
      const metadatas = await extractComponentsMetadataFromSourceFile(tsSource);
      if (!metadatas?.size) {
        /*
          The file match a xendar component file but no component metadata could be extracted.
          We can safely return the original code as no operation should be performed
        */
        return code;
      }

      // clear stale keys from a prior edit (e.g. a renamed className/selector) before re-registering
      clearMetadataMappingsForFile(id);

      let first = true;
      for (const [className, metadata] of metadatas.entries()) {
        // TODO className is not unique, we can't use it as a key for the metadata cache
        registerMetadataMapping(className, metadata);

        const { selectors, styleUrl, templateUrl } = metadata;
        for (let i = 0; i < selectors.length; i++) {
          const selector = selectors[i];
          if (!isValidCustomElementName(selector)) {
            logError('', `Invalid custom element name "${selector}" in component ${id}`);
            return null;
          }
        }

        // qui non stiamo gestendo la possibiltia di avere piu di un componente per file
        // controllo debole su regex, sarebbe otimale estender
        const folder = dirname(id);
        const templatePath = resolve(folder, templateUrl);
        if (!templatePath || !host.fileExists(templatePath)) {
          this.warn(`Could not find template at ${templatePath}`);
          return null;
        }

        this.addWatchFile(templatePath);
        registerTemplateMapping(templatePath, id);
        // ! is a safe assertion because we check if the fileExists before reading it
        const templateSource = host.readFile(templatePath)!;

        clearImportsForComponent(id);
        for (const importedPath of extractImportedComponentPaths(templateSource, dirname(templatePath))) {
          if (host.fileExists(importedPath)) {
            this.addWatchFile(importedPath);
            registerImportMapping(importedPath, id);
          }
        }

        let cssContent: string | undefined;
        if (styleUrl) {
          const stylePath = resolve(folder, styleUrl);
          if (host.fileExists(stylePath)) {
            this.addWatchFile(stylePath);
            const rawCss = host.readFile(stylePath);
            cssContent = rawCss && stripCssComments(rawCss).trim();
          }
        }

        let compiledMethods: string | undefined;
        let typecheckBody: TypeCheckResult | undefined;
        const varName = cssContent ? `__${className}_sheet` : undefined;

        try {
          // Todo Create a dedicated cache to store signal values metadata otherwise this will be done every time file is saved
          const signals = extractSignalMembers(tsSource, metadata.typescriptNodes.klass);
          const result = await compile(templateSource, {
            baseDir: dirname(templatePath),
            cssVariableName: varName,
            signals,
            cache: {
              getOrInsert: getMetadataOrExtract,
              set: registerMetadataMapping
            }
          });
          compiledMethods = result.javascript;
          typecheckBody = result.typescript;
        } catch (err) {
          logError(err, `Failed to compile template - ${templatePath}`);
          return null;
        }

        try {
          code = injectFunctions(code, first, compiledMethods, className, varName, cssContent);
          first = false;
        } catch (err) {
          logError(err, `Failed to inject functions into component - ${id}`);
          return null;
        }

        registerRealFile(id);

        const shim = createShim(new Map([[id, [className]]]), typecheckBody);
        const languageService = getLanguageService(compilerOptions);
        const diagnostics = languageService.getSemanticDiagnostics(shim.path);

        for (let i = 0; i < diagnostics.length; i++) {
          logError('', `Failed to compile template - ${templatePath}\n${describeDiagnostic(templateSource, diagnostics[i], shim.bodyLineOffset, typecheckBody.mappingTable)}`);
        }

        // After logging every diagnostics we have to return null to raise an error
        if (diagnostics.length) {
          return null;
        }
      }

      return {
        code: fixDecoratorExport(code)
      };
    },
    watchChange(id, change) {
      if (change.event === 'delete') {
        if (COMPONENT_FILE_RE.test(id)) {
          removeVirtualFile(`${id}.__typecheck__.ts`);
          removeRealFile(id);
          removeAllMappingsForComponent(id);
          clearMetadataMappingsForFile(id);

          const components = findComponentsForImport(id);
          for (const componentId of components) {
            removeVirtualFile(`${componentId}.__typecheck__.ts`);
            logError('', `Component "${id}" was deleted but is still imported by "${componentId}". Update its @import statement.`);
          }
          clearImportsForComponent(id);
        } else if (id.endsWith('.xd.component.html')) {
          const componentIds = findComponentsForTemplate(id);
          if (componentIds) {
            for (const componentId of componentIds) {
              removeVirtualFile(`${componentId}.__typecheck__.ts`);
            }
            removeTemplateMapping(id);
          }
        }
      }
    },
    configureServer(server) {
      logger = server.config?.logger;

      server.httpServer?.on('close', () => {
        clearTemplateRegistry();
        clearImportRegistry();
        clearMetadataRegistry();
        disposeLanguageService();
        logger = undefined;
      });
    },
  };
}

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
function extractImportedComponentPaths(templateSource: string, templateDir: string): string[] {
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
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Compiles and injects a component's generated template code end-to-end:
 * parses the transpiled source once, then applies the three required
 * mutations — template render methods, scoped CSS stylesheet, and missing
 * runtime imports — each in its own dedicated function.
 *
 * Mutation order matters and must not be changed carelessly: template
 * methods are inserted first (at `blockStart`, the deepest position in the
 * class body), then the style snippet (at `classStart`, before the class
 * declaration). Both offsets are computed once from the ORIGINAL,
 * unmodified `sourceFile` — this stays valid across both edits only because
 * `classStart < blockStart`, so inserting text at `blockStart` never shifts
 * the still-unused `classStart` offset. Required imports are inserted last,
 * via textual regex scanning of the file's current top rather than AST
 * positions, so it's insensitive to any offset shifting caused by the two
 * prior edits.
 *
 * @param jsSource - The transpiled JS source of the component file (post
 *   oxc + the stage-3 decorators babel plugin), before xaendar injection.
 * @param first - Indicates if this is the first component of the file being processed.
 * @param compiledMethods - The raw output of the template compiler.
 * @param className - The name of the target class in this file.
 * @param varName - Variable name for the shared `CSSStyleSheet`, if any CSS is provided.
 * @param cssContent - Raw CSS content to inject as a shared `CSSStyleSheet`, if not empty.
 * @returns The fully transformed source.
 * @throws When `className` isn't found, or its decorator finalizer static
 *   block isn't found — meaning the component file wasn't scaffolded
 *   correctly, or the babel decorators plugin didn't run before xaendarPlugin().
 */
function injectFunctions(jsSource: string, first: boolean, compiledMethods: string, className: string, varName?: string, cssContent?: string): string {
  const sourceFile = createSourceFile('component.js', jsSource, ScriptTarget.Latest, true, ScriptKind.JS);
  const classDecl = findClassDeclarationByName(sourceFile, className);

  if (!classDecl) {
    throw `Could not find class "${className}" in the transpiled output.`;
  }

  let result = insertTemplateMethods(jsSource, sourceFile, classDecl, compiledMethods);
  result = insertStyleSnippet(result, sourceFile, classDecl, varName, cssContent);
  if (first) {
    result = insertRequiredImports(result);
  }

  return result;
}

/**
 * Inserts the compiled template render methods right before the target
 * class's decorator finalizer static block (`static { _initClass(); }`),
 * scoped to `classDecl` rather than "the first static block in the file",
 * since a single compiled file can contain more than one class.
 *
 * @throws When the finalizer static block isn't found on `classDecl`.
 */
function insertTemplateMethods(jsSource: string, sourceFile: SourceFile, classDecl: ClassDeclaration, compiledMethods: string): string {
  const placeholderBlock = classDecl.members.find(isDecoratorInitStaticBlock);

  if (!placeholderBlock) {
    throw `Could not find the static initializer block for class "${classDecl.name?.text}" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.`;
  }

  const blockStart = placeholderBlock.getStart(sourceFile);
  return `${jsSource.slice(0, blockStart)}${compiledMethods}\n\n  ${jsSource.slice(blockStart)}`;
}

/**
 * Inserts the shared `CSSStyleSheet` declaration snippet right before the
 * target class's declaration, scoped to `classDecl` rather than "the first
 * `class ... extends` in the file", so each class in a multi-component file
 * gets its own stylesheet in the right place. No-op if no CSS was provided.
 */
function insertStyleSnippet(jsSource: string, sourceFile: SourceFile, classDecl: ClassDeclaration, varName?: string, cssContent?: string): string {
  if (!cssContent?.trim().length) {
    return jsSource;
  }

  const styleSnippet = buildStyleSnippet(varName!, cssContent);
  const classStart = classDecl.getStart(sourceFile);

  return `${jsSource.slice(0, classStart)}${styleSnippet}${jsSource.slice(classStart)}`;
}

/**
 * Ensures every runtime helper the generated template code depends on
 * (`_renderElement`, `Context`, `_if`, etc.) is imported from
 * `@xaendar/core`, adding any missing ones as new import statements
 * prepended to the file. Operates via textual regex scanning of existing
 * imports rather than AST positions, so it's safe to run after prior
 * AST-position-based edits regardless of how much they shifted offsets.
 */
function insertRequiredImports(jsSource: string): string {
  return `import { _if, _switch, _for, _Context, _iterationVariables, _renderElement, _renderText, _renderLiteralText, _createElement, _createSVGElement, _createMATHMLElement, _setProperty, _setExpressionProperty, _setReactiveProperty, _removeAttribute } from '@xaendar/core';\n${jsSource}`;
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

/**
 * Builds the JS snippet that declares and populates the shared
 * `CSSStyleSheet` for the component class.
 *
 * The variable is declared outside the class body so it is fully
 * initialised before Babel's first `static {}` block runs — which is
 * where `customElements.define()` is called and may immediately trigger
 * `connectedCallback` if the element is already in the DOM.
 *
 * @param varName - The variable name for the shared `CSSStyleSheet`.
 * @param css - Raw CSS content to embed.
 * @returns A JS snippet string ending with a newline.
 */
function buildStyleSnippet(varName: string, css: string): string {
  const escaped = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  return [
    `const ${varName} = new CSSStyleSheet();`,
    `${varName}.replaceSync(\`${escaped}\`);`,
    '',
  ].join('\n');
}

/**
 * Workaround for an esbuild bug where stage-3 decorators combined with
 * `export` are emitted as `export @Decorator class Foo {}` instead of the
 * valid form `@Decorator\nexport class Foo {}`.
 *
 * Reorders the tokens so that the decorator always precedes the `export`
 * keyword, producing syntactically valid output.
 *
 * @param code - The transpiled source code to fix.
 * @returns The source code with corrected decorator/export ordering.
 */
function fixDecoratorExport(code: string): string {
  return code.replace(/^export\s+(@\w+[\s\S]*?)\s+(class\s)/gm, '$1\nexport $2');
}

/**
 * Formats a single TS diagnostic into a human-readable, single-line message
 * including its location in the generated shim.
 *
 * Note: the location currently points into the generated shim file, not
 * the original DSL template — remapping to template positions is not yet
 * implemented (see the module-level doc comment on `xaendarPlugin`).
 */
function describeDiagnostic(templateSource: string, diagnostic: Diagnostic, bodyLineOffset: number, mappingTable: TypeCheckResult['mappingTable']): string {
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
async function getMetadataOrExtract(name: string, path?: string | string[]): Promise<ComponentOrDirectiveMetadata> {
  let metadata = getMetadataMapping(name);
  if (metadata) {
    return metadata;
  }
  
  const resolvedPath = path && (Array.isArray(path) ? resolveModulePath(path[0], path[1]) : resolve(path));
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
  registerMetadataMapping(name, metadata);
  for (let i = 0; i < metadata.selectors.length; i++) {
    const selector = metadata.selectors[i];
    registerMetadataMapping(selector, metadata);
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
