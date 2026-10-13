import type { CompileOptions } from '../compile-options.type';
import { Generator } from '../generator/generator/generator';
import { Lexer } from '../lexer/lexer/lexer';
import { Parser } from '../parser/parser/parser';
import type { ASTNode } from '../parser/types/ast.type';
import { ASTNodeType } from '../parser/types/node.enum';
import { ImportNode } from '../parser/types/nodes/import-node.type';
import { TypeChecker } from '../type-checker/type-checker/type-checker';
import type { TypeCheckResult } from '../type-checker/types/type-checker-result.type';
import type { CompilerCache } from '../types/compiler-cache.type';
import type { ComponentOrDirectiveMetadata } from '../types/component-or-directive-metadata.type';

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
export async function compile(input: string, options: Pick<CompileOptions, 'baseDir' | 'shadowingMembers' | 'customElements' | 'cache'>): Promise<TypeCheckResult>
export async function compile(input: string, options: Omit<CompileOptions, 'baseDir'>): Promise<string>
export async function compile(input: string, options: CompileOptions): Promise<{ javascript: string; typescript: TypeCheckResult }>
export async function compile(input: string, options: CompileOptions): Promise<string | TypeCheckResult | { javascript: string; typescript: TypeCheckResult }> {
  const nodes = parseTemplate(input);

  const { baseDir, signals, shadowingMembers = [], customElements = [], cache } = options;
  const importNodes = nodes.filter((node): node is ImportNode => node.type === ASTNodeType.Import);
  if (baseDir && signals) {
    const metadatas = await extractComponentMetadataReferredInTemplate(importNodes, baseDir, cache);
    const [javascript, typescript] = await Promise.all([
      generateJavascriptCode(input, nodes, signals, shadowingMembers, customElements, cache),
      typeCheckTemplate(input, nodes, metadatas, shadowingMembers, customElements)
    ]);
    
    return {
      javascript,
      typescript
    }
  } else if (baseDir) {
    const metadatas = await extractComponentMetadataReferredInTemplate(importNodes, baseDir, cache);
    return await typeCheckTemplate(input, nodes, metadatas, shadowingMembers, customElements);
  } else {
    // Safe assertion! Overloads permit baseDir and signals not to be nullable simultaneously
    return await generateJavascriptCode(input, nodes, signals!, shadowingMembers, customElements, cache);
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
 * @returns A string containing the compiled Javascript render functions.
 */
async function generateJavascriptCode(input: string, nodes: ASTNode[], signals: string[], shadowingMembers: readonly string[], customElements: readonly string[], cache: CompilerCache): Promise<string> {
  return await new Generator(input, nodes, cache).generate(signals, shadowingMembers, customElements);
}

/**
 * Generates the type-checking result for the parsed AST nodes using the TypeChecker: the type-check stage of
 * {@link compile}, for callers resolving the metadata of the imported components and directives on their own.
 * @param input - The raw HTML-like template source to compile.
 * @param nodes - The parsed AST nodes from the template (see {@link parseTemplate}).
 * @param metadatas - Array of component and directive metadata extracted from the template.
 * @param shadowingMembers - Class members named like a global identifier, which they shadow in the template.
 * @param customElements - Patterns of the tag names of the custom elements of other libraries.
 * @returns A promise that resolves to the type-checking result.
 * @throws A `TemplateError` if the template fails type-checking with an error pointing to a part of it.
 */
export async function typeCheckTemplate(input: string, nodes: ASTNode[], metadatas: ComponentOrDirectiveMetadata[], shadowingMembers: readonly string[] = [], customElements: readonly string[] = []): Promise<TypeCheckResult> {
  return await new TypeChecker(input, nodes).generate(metadatas, shadowingMembers, customElements);
}

/**
 * Extracts all component metadata referred in the template by analyzing the import nodes.
 * @param nodes - The parsed AST nodes from the template.
 * @param baseDir - Absolute path used to resolve relative import paths for `@import` nodes.
 * @param cache - Optional cache for storing previously computed type-checking results to improve performance.
 * @returns A promise that resolves when all component metadata referred in the template has been extracted.
 */
async function extractComponentMetadataReferredInTemplate(nodes: ASTNode[], baseDir: string, cache: CompilerCache): Promise<ComponentOrDirectiveMetadata[]> {
  const importNodes = nodes.filter((node): node is ImportNode => node.type === ASTNodeType.Import);
  const promises = new Array<Promise<ComponentOrDirectiveMetadata>>();

  for (let i = 0; i < importNodes.length; i++) {
    const { specifiers, path } = importNodes[i];
    for (let j = 0; j < specifiers.length; j++) {
      const { imported, local } = specifiers[j];
      if (imported !== '*') {
        const name = imported === 'default' ? local : imported;
        promises.push(cache.getOrInsert(name, [baseDir, path]));
      }
    }
  }

  return await Promise.all(promises);
}