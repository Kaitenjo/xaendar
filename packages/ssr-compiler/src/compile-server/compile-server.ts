import { ASTNodeType, parseTemplate, resolveTemplateImports, type ImportNode } from '@xaendar/compiler';
import { ServerGenerator } from '../server-generator/server-generator/server-generator';
import type { ServerCompileOptions } from '../types/server-compile-options.type';

/**
 * Compiles a template into the code rendering it to HTML on the server: the functions writing its HTML into an output,
 * `render(out)` being the entry point, invoked with the component bound as `this`, preceded by the imports of the
 * runtime helpers of `@xaendar/core` and `@xaendar/ssr` and of the symbols the template imports.
 *
 * The template is parsed as `compile` parses it, and the symbols its `@import` statements import are resolved relative
 * to `templateDir`, when given. The type-check is left to the code of the client, compiled from the same template.
 *
 * @param input - The source of the template.
 * @param options - The options of the compilation.
 * @returns The code.
 * @throws A `TemplateError` if the template cannot be parsed or its code cannot be generated.
 */
export async function compileServer(input: string, options: ServerCompileOptions): Promise<string> {
  const nodes = parseTemplate(input);
  const { templateDir, signals, shadowingMembers, customElements, cache } = options;
  const importNodes = nodes.filter((node): node is ImportNode => node.type === ASTNodeType.Import);
  const symbols = templateDir ? (await resolveTemplateImports(importNodes, templateDir, cache)).symbols : undefined;

  return new ServerGenerator(input, nodes).generate(signals, shadowingMembers, customElements, symbols);
}
