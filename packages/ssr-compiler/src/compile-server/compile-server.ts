import { ASTNodeType, parseTemplate, resolveTemplateImports, type ComponentMetadata, type ComponentOrDirectiveMetadata, type ImportNode } from '@xaendar/compiler';
import { ServerGenerator } from '../server-generator/server-generator/server-generator';
import type { ServerCompileOptions } from '../types/server-compile-options.type';

/**
 * Compiles a template into the code rendering it to HTML on the server: the functions writing its HTML into an output,
 * `render(out)` being the entry point, invoked with the component bound as `this`, preceded by the imports of the
 * runtime helpers of `@xaendar/core` and `@xaendar/ssr` and of the symbols the template imports.
 *
 * The template is parsed as `compile` parses it, and the symbols its `@import` statements import are resolved relative
 * to `templateDir`, when given, along with the components it imports rendering only in the browser. The type-check is
 * left to the code of the client, compiled from the same template.
 *
 * @param input - The source of the template.
 * @param options - The options of the compilation.
 * @returns The code.
 * @throws A `TemplateError` if the template cannot be parsed or its code cannot be generated.
 */
export async function compileServer(input: string, options: ServerCompileOptions): Promise<string> {
  const nodes = parseTemplate(input);
  const { templateDir, signals, shadowingMembers, customElements, cache, islands } = options;
  const importNodes = nodes.filter((node): node is ImportNode => node.type === ASTNodeType.Import);
  const imports = templateDir ? await resolveTemplateImports(importNodes, templateDir, cache) : undefined;

  return new ServerGenerator(input, nodes, cache).generate(signals, shadowingMembers, customElements, imports?.symbols, islands, imports?.metadatas.filter(isClientComponent));
}

/**
 * Tells whether what a template imports is a component rendering only in the browser.
 *
 * @param metadata - The metadata of the component or directive.
 * @returns `true` for a component declaring `ssr: { render: false }`.
 */
export function isClientComponent(metadata: ComponentOrDirectiveMetadata): metadata is ComponentMetadata {
  return metadata.type === 'component' && !!metadata.clientOnly;
}
