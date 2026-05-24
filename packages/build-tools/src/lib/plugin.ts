import { compile } from '@xaendar/compiler';
import { basename, dirname, extname, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { COMPONENT_FILE_RE, STYLE_EXTENSION, TEMPLATE_EXTENSION } from './costants.js';
import { NodeCompilerHost } from './node-compiler-host.model.js';

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

  return {
    name: 'xaendar',
    transform(code, id) {
      if (!COMPONENT_FILE_RE.test(id)) {
        return null;
      }

      const templatePath = resolveTemplatePath(id);
      this.addWatchFile(templatePath);

      if (!host.fileExists(templatePath)) {
        this.warn(`Xaendar: could not find template at ${templatePath}`);
        return null;
      }

      const templateSource = host.readFile(templatePath);
      if (templateSource === undefined) {
        this.warn(`Xaendar: could not read template at ${templatePath}`);
        return null;
      }


      const stylePath = resolveStylePath(id);
      let cssContent = '';

      if (host.fileExists(stylePath)) {
        this.addWatchFile(stylePath);
        cssContent = host.readFile(stylePath) ?? '';
      }

      let compiledMethods!: string;
      const varName = getStyleVariableName(extractClassName(code));
      try {
        compiledMethods = compile(templateSource, varName);
      } catch (err) {
        this.error(`Xaendar: failed to compile template ${templatePath}:\n${String(err)}`);
      }

      let transformed!: string;
      try {
        transformed = fixDecoratorExport(injectRenderMethods(code, compiledMethods, varName, cssContent));
      } catch (err) {
        this.error(String(err));
      }

      return {
        code: transformed
      };
    },
  };
}

/**
 * Extracts the component name from the given file path by removing the directory
 * and file extension, and taking the first segment of the remaining base name.
 *
 * For example, given `src/components/app.xd.component.ts`, it will return `app`.
 * @param componentPath - The absolute path of the component file.
 * @returns The extracted component name.
 */
function extractComponentName(componentPath: string): string {
  const base = basename(componentPath, extname(componentPath));
  return base.split('.')[0]!;
}

/**
 * Resolves the absolute path of the template file associated with a given
 * component `.ts` file, following the convention:
 *
 * ```
 * app.xd.component.ts  →  app.xd.component.html
 * ```
 *
 * @param componentPath - Absolute path of the component TypeScript file.
 * @returns Absolute path of the associated template file.
 */
function resolveTemplatePath(componentPath: string): string {
  const dir = dirname(componentPath);
  const base = extractComponentName(componentPath);
  return resolve(dir, `${base}${TEMPLATE_EXTENSION}`);
}

/**
 * Resolves the absolute path of the style file associated with a given
 * component `.css` file, following the convention:
 *
 * ```
 * app.xd.component.ts  →  app.xd.component.css
 * ```
 *
 * @param componentPath - Absolute path of the component TypeScript file.
 * @returns Absolute path of the associated style file.
 */
function resolveStylePath(componentPath: string, ext = 'css'): string {
  const dir = dirname(componentPath);
  const base = extractComponentName(componentPath);
  return resolve(dir, `${base}${STYLE_EXTENSION(ext)}`);
}

/**
 * Injects the compiled render methods into the original component component code
 * by replacing the placeholder static block scaffolded by the CLI. The block
 * is guaranteed to be present added by the Babel plugin, so if it's not found
 * the function throws an error indicating a misconfiguration in the component
 * file. 
 * 
 * The compiled methods are inserted before the static block, which is
 * preserved to maintain the correct execution order: the methods must be
 * defined before the initializer function runs, as the latter may reference them
 * to register the component with the framework.
 *
 * @param compiledCode - The original TypeScript source of the component file.
 * @param compiledMethods - The raw output of the compiler, already
 *   formatted as class method bodies (no `function` keyword, no standalone
 *   context parameter).
 * @param varName - The variable name to use for the shared `CSSStyleSheet`
 *   declaration, if any CSS content is provided.
 * @param cssContent - The raw CSS content read from disk, to be injected as a
 *   shared `CSSStyleSheet` if not empty.
 * @returns The transformed TypeScript source with the placeholder replaced
 *   by the compiled methods.
 * @throws {Error} When the placeholder is not found in the source — this
 *   means the component file was not scaffolded correctly by the CLI.
 */
function injectRenderMethods(jsSource: string, compiledMethods: string, varName: string, cssContent: string): string {
  const styleSnippet = cssContent.trim().length ? buildStyleSnippet(varName, cssContent) : '';
 
  let result = jsSource;
 
  if (styleSnippet) {
    result = result.replace(/^(class\s+\w+\s+extends)/m, `${styleSnippet}$1`);
  }
 
  const lastStaticBlock = /static\s*\{\s*\n(\s*)(\w+)\(\);\s*\n\s*\}/;
 
  if (!lastStaticBlock.test(result)) {
    throw new Error('Xaendar: could not find the static initializer block in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.');
  }
 
  return result.replace(lastStaticBlock, (_, indent, initFn) => `${compiledMethods}\n  static {\n${indent}${initFn}();\n  }`);;
}

/**
 * Extracts the class name from the Babel-transpiled JS source.
 *
 * Babel always emits `class ClassName extends ...` so this is safe to match.
 * Used to generate a unique name for the per-class CSSStyleSheet variable
 * that must be declared outside the class body to guarantee it exists before
 * `connectedCallback` fires.
 *
 * @param jsSource - The Babel-transpiled JS source of the component.
 * @returns The class name, or `__Component` as a safe fallback.
 */
function extractClassName(jsSource: string): string {
  const match = jsSource.match(/class\s+(\w+)\s+extends/);
  return match?.[1] ?? '__Component';
}
 
/**
 * Escapes a CSS string so it can be safely embedded inside a JS template
 * literal (backtick string). Escapes backticks and `${` sequences that
 * would otherwise be interpreted as template literal syntax.
 *
 * @param css - Raw CSS content read from disk.
 * @returns The escaped CSS string.
 */
function escapeCssForTemplateLiteral(css: string): string {
  return css
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
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
  const escaped = escapeCssForTemplateLiteral(css);
  return [
    `const ${varName} = new CSSStyleSheet();`,
    `${varName}.replaceSync(\`${escaped}\`);`,
    '',
  ].join('\n');
}


function getStyleVariableName(className: string): string {
  return `__${className}_sheet`;
}

/**
 * esbuild bug workaround — quando transpila decorator stage 3 con export,
 * produce `export @Decorator class Foo {}` invece di
 * `@Decorator\nexport class Foo {}`.
 * Riordina i token per produrre sintassi valida.
 */
function fixDecoratorExport(code: string): string {
  return code.replace(/^export\s+(@\w+[\s\S]*?)\s+(class\s)/gm, '$1\nexport $2');
}