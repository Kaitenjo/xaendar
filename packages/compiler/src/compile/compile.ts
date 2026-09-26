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
 * @param cssVariableName - Optional name of the CSS variable to inject
 *   into the generated `adoptedStyleSheets` assignment.
 * @returns A string containing the compiled Javascript render method body.
 */
export async function compile(input: string, options: Pick<CompileOptions, 'baseDir' | 'cache'>): Promise<TypeCheckResult>
export async function compile(input: string, options: Omit<CompileOptions, 'baseDir'>): Promise<string>
export async function compile(input: string, options: CompileOptions): Promise<{ javascript: string; typescript: TypeCheckResult }>
export async function compile(input: string, options: CompileOptions): Promise<string | TypeCheckResult | { javascript: string; typescript: TypeCheckResult }> {
  const tokens = new Lexer(input).tokenize();
  const nodes = new Parser(input, tokens).parse();

  const { baseDir, cssVariableName, signals, cache } = options;
  const importNodes = nodes.filter((node): node is ImportNode => node.type === ASTNodeType.Import);
  if (baseDir && signals) {
    const metadatas = await extractComponentMetadataReferredInTemplate(importNodes, baseDir, cache);
    const [javascript, typescript] = await Promise.all([
      generateJavascriptCode(input, nodes, cssVariableName, signals, cache),
      generateTypecheckResult(input, nodes, metadatas)
    ]);
    
    return {
      javascript,
      typescript
    }
  } else if (baseDir) {
    const metadatas = await extractComponentMetadataReferredInTemplate(importNodes, baseDir, cache);
    return await generateTypecheckResult(input, nodes, metadatas);
  } else {
    // Safe assertion! Override permit only cssVariableName and signals not nullable simultaneously
    return await generateJavascriptCode(input, nodes, cssVariableName, signals!, cache);
  }
}
/**
 * Generates the Javascript render method body from the parsed AST nodes.
 * @param input - The raw HTML-like template source to compile.
 * @param nodes - The parsed AST nodes from the template.
 * @param cssVariableName - Optional name of the CSS variable to inject into the generated `adoptedStyleSheets` assignment.
 * @param signals - Array of signal names to be used in the generated render function.
 * @returns A string containing the compiled Javascript render method body.
 */
async function generateJavascriptCode(input: string, nodes: ASTNode[], cssVariableName: string | undefined, signals: string[], cache: CompilerCache): Promise<string> {
  return await new Generator(input, nodes, cache).generate(cssVariableName, signals);
}

/**
 * Generates the type-checking result for the parsed AST nodes using the TypeChecker.
 * @param input - The raw HTML-like template source to compile.
 * @param nodes - The parsed AST nodes from the template.
 * @param metadatas - Array of component and directive metadata extracted from the template.
 * @param cache - Optional cache for storing previously computed type-checking results to improve performance.
 * @returns A promise that resolves to the type-checking result.
 */
async function generateTypecheckResult(input: string, nodes: ASTNode[], metadatas: ComponentOrDirectiveMetadata[]): Promise<TypeCheckResult> {
  return await new TypeChecker(input, nodes).generate(metadatas);
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