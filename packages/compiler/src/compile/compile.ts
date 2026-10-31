import type { CompileOptions } from '../types/compile-options.type';
import { Generator } from '../generator/generator/generator';
import { Lexer } from '../lexer/lexer/lexer';
import { Parser } from '../parser/parser/parser';
import type { ASTNode } from '../parser/types/ast.type';
import { ASTNodeType } from '../parser/types/node.enum';
import { ImportNode } from '../parser/types/nodes/import-node.type';
import { TypeChecker } from '../type-checker/type-checker/type-checker';
import type { TypeCheckResult } from '../type-checker/types/type-checker-result.type';
import type { TypeCheckTolerantResult } from '../type-checker/types/type-checker-tolerant-result.type';
import type { CompilerCache } from '../types/compiler-cache.type';
import type { ComponentOrDirectiveMetadata } from '../types/component-or-directive-metadata.type';
import type { SymbolImport } from '../types/symbol-import.type';

/**
 * Compiles a template string into a Javascript render function body.
 *
 * Runs the three-stage pipeline:
 * 1. **Lexer** — tokenises the raw template text.
 * 2. **Parser** — transforms the token stream into an AST.
 * 3. **Render generator** — emits Javascript source lines from the AST.
 *
 * @param input - The raw HTML-like template source to compile.
 * @param options - The compilation options, selecting which outputs are produced.
 * @returns The compiled Javascript render functions, the type-check result, or both.
 */
export async function compile(input: string, options: Pick<CompileOptions, 'baseDir' | 'shadowingMembers' | 'reactiveMembers' | 'customElements' | 'cache'>): Promise<TypeCheckResult>
export async function compile(input: string, options: Omit<CompileOptions, 'baseDir'>): Promise<string>
export async function compile(input: string, options: CompileOptions): Promise<{ javascript: string; typescript: TypeCheckResult }>
export async function compile(input: string, options: CompileOptions): Promise<string | TypeCheckResult | { javascript: string; typescript: TypeCheckResult }> {
  const nodes = parseTemplate(input);

  const { baseDir, templateDir, signals, shadowingMembers = [], reactiveMembers = signals, customElements = [], cache } = options;
  const importNodes = nodes.filter((node): node is ImportNode => node.type === ASTNodeType.Import);
  if (baseDir && signals) {
    const { metadatas, symbols } = await resolveTemplateImports(importNodes, baseDir, cache);
    const [javascript, typescript] = await Promise.all([
      generateJavascriptCode(input, nodes, signals, shadowingMembers, customElements, cache, symbols),
      typeCheckTemplate(input, nodes, metadatas, shadowingMembers, customElements, symbols, reactiveMembers)
    ]);
    
    return {
      javascript,
      typescript
    }
  } else if (baseDir) {
    const { metadatas, symbols } = await resolveTemplateImports(importNodes, baseDir, cache);
    return await typeCheckTemplate(input, nodes, metadatas, shadowingMembers, customElements, symbols, reactiveMembers);
  } else {
    const symbols = templateDir ? (await resolveTemplateImports(importNodes, templateDir, cache)).symbols : undefined;
    // Safe assertion! Overloads permit baseDir and signals not to be nullable simultaneously
    return await generateJavascriptCode(input, nodes, signals!, shadowingMembers, customElements, cache, symbols);
  }
}
/**
 * Tokenises and parses a template into its AST, the first two stages of {@link compile}.
 *
 * @param input - The raw HTML-like template source.
 * @returns The top-level AST nodes of the template.
 * @throws A `TemplateError` if the template cannot be tokenised or parsed.
 */
export function parseTemplate(input: string): ASTNode[] {
  return new Parser(input, new Lexer(input).tokenize()).parse();
}

/**
 * Generates the Javascript render functions from the parsed AST nodes.
 * @param input - The raw HTML-like template source to compile.
 * @param nodes - The parsed AST nodes from the template.
 * @param signals - Array of signal names to be used in the generated render function.
 * @param shadowingMembers - Class members named like a global identifier, which they shadow in the template.
 * @param customElements - Patterns of the tag names of the custom elements of other libraries.
 * @param cache - The cache of the metadata of the components and directives.
 * @param symbols - The symbols the template imports from modules, if they are resolved.
 * @returns A string containing the compiled Javascript render functions.
 */
async function generateJavascriptCode(input: string, nodes: ASTNode[], signals: string[], shadowingMembers: readonly string[], customElements: readonly string[], cache: CompilerCache, symbols?: readonly SymbolImport[]): Promise<string> {
  return await new Generator(input, nodes, cache).generate(signals, shadowingMembers, customElements, symbols);
}

/**
 * Generates the type-checking result for the parsed AST nodes using the TypeChecker: the type-check stage of
 * {@link compile}, for callers resolving the metadata of the imported components and directives on their own.
 * @param input - The raw HTML-like template source to compile.
 * @param nodes - The parsed AST nodes from the template (see {@link parseTemplate}).
 * @param metadatas - Array of component and directive metadata extracted from the template.
 * @param shadowingMembers - Class members named like a global identifier, which they shadow in the template.
 * @param customElements - Patterns of the tag names of the custom elements of other libraries.
 * @param symbols - The symbols the template imports from modules, which are neither components nor directives.
 * @param reactiveMembers - Class members that can read a signal, telling whether a `@let` reading them is a signal.
 * @returns A promise that resolves to the type-checking result.
 * @throws A `TemplateError` if the template fails type-checking with an error pointing to a part of it.
 */
export async function typeCheckTemplate(input: string, nodes: ASTNode[], metadatas: ComponentOrDirectiveMetadata[], shadowingMembers: readonly string[] = [], customElements: readonly string[] = [], symbols: readonly SymbolImport[] = [], reactiveMembers: readonly string[] = []): Promise<TypeCheckResult> {
  return await new TypeChecker(input, nodes).generate(metadatas, shadowingMembers, customElements, symbols, reactiveMembers);
}

/**
 * Generates the type-checking result like {@link typeCheckTemplate}, but a node failing type-checking does not
 * stop it: its error is collected and the other nodes are checked too, e.g. to report every use of a selector
 * that is not imported, for the callers reporting the problems of a template, like the editor tooling.
 * @param input - The raw HTML-like template source to compile.
 * @param nodes - The parsed AST nodes from the template (see {@link parseTemplate}).
 * @param metadatas - Array of component and directive metadata extracted from the template.
 * @param shadowingMembers - Class members named like a global identifier, which they shadow in the template.
 * @param customElements - Patterns of the tag names of the custom elements of other libraries.
 * @param symbols - The symbols the template imports from modules, which are neither components nor directives.
 * @param reactiveMembers - Class members that can read a signal, telling whether a `@let` reading them is a signal.
 * @returns A promise that resolves to the type-checking result, with the errors of the nodes that failed.
 */
export async function typeCheckTemplateTolerant(input: string, nodes: ASTNode[], metadatas: ComponentOrDirectiveMetadata[], shadowingMembers: readonly string[] = [], customElements: readonly string[] = [], symbols: readonly SymbolImport[] = [], reactiveMembers: readonly string[] = []): Promise<TypeCheckTolerantResult> {
  return await new TypeChecker(input, nodes).generateTolerant(metadatas, shadowingMembers, customElements, symbols, reactiveMembers);
}

/**
 * Resolves what the `@import` statements of a template import: the metadata of the components and of the directives,
 * and the other symbols (functions, constants, enums, classes, types, namespaces). Exported for the generators of
 * other packages, which read the symbols the same way.
 * @param importNodes - The `@import` nodes of the template.
 * @param baseDir - Absolute path used to resolve relative import paths for `@import` nodes.
 * @param cache - The cache resolving the imports.
 * @returns The metadata of the components and directives, and the symbols, in the order they are imported.
 * @throws If a module can't be resolved.
 */
export async function resolveTemplateImports(importNodes: ImportNode[], baseDir: string, cache: CompilerCache): Promise<{ metadatas: ComponentOrDirectiveMetadata[], symbols: SymbolImport[] }> {
  const resolutions = new Array<Promise<SymbolImport | ComponentOrDirectiveMetadata>>();

  for (let i = 0; i < importNodes.length; i++) {
    const { specifiers, path } = importNodes[i];
    for (let j = 0; j < specifiers.length; j++) {
      const specifier = specifiers[j];
      resolutions.push(cache.getImport(specifier.imported, specifier.local, baseDir, path).then(imported => (imported.type === 'symbol' ? { ...specifier, ...imported } : imported)));
    }
  }

  const metadatas = new Array<ComponentOrDirectiveMetadata>();
  const symbols = new Array<SymbolImport>();
  const resolved = await Promise.all(resolutions);
  for (let i = 0; i < resolved.length; i++) {
    const imported = resolved[i];
    if (imported.type === 'symbol') {
      symbols.push(imported);
    } else {
      metadatas.push(imported);
    }
  }

  return { metadatas, symbols };
}
