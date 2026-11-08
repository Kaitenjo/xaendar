import { ASTNodeType, parseTemplate, resolveTemplateImports, type ASTNode, type ConditionalBindingBranchNode, type ImportNode } from '@xaendar/compiler';
import { isClientComponent } from '../server-generator/utils/client-component/client-component.utils';
import type { ServerCompileOptions } from '../types/server-compile-options.type';

/**
 * Keeps, among the modules a template imports, the ones the server evaluates: every one of them, unless the template
 * holds a `@client` or a `@defer` block, or imports a component rendering only in the browser (`ssr: { render: false }`).
 * In that case they are the modules declaring a component or a directive the server renders, so that what only the
 * browser renders is not loaded on the server, where its module may find no `document`. The other modules are left to
 * the code of the template, which imports the symbols it reads.
 *
 * @param input - The source of the template.
 * @param dependencyPaths - The absolute paths of the modules the template imports.
 * @param options - The directory of the template and the cache resolving its imports.
 * @returns The paths of the modules the server evaluates.
 */
export async function getServerDependencies(input: string, dependencyPaths: readonly string[], options: Required<Pick<ServerCompileOptions, 'templateDir' | 'cache'>>): Promise<readonly string[]> {
  const nodes = parseTemplate(input);
  const importNodes = nodes.filter((node): node is ImportNode => node.type === ASTNodeType.Import);
  if (!importNodes.length) {
    return dependencyPaths;
  }

  const { metadatas } = await resolveTemplateImports(importNodes, options.templateDir, options.cache);
  const selectors = new Set<string>();
  if (!collectSelectors(nodes, selectors) && !metadatas.some(isClientComponent)) {
    return dependencyPaths;
  }

  const rendered = new Set<string>();
  for (let i = 0; i < metadatas.length; i++) {
    const metadata = metadatas[i];
    const { type, selector, modulePath, importPath = modulePath } = metadata;
    if (selectors.has(type === 'directive' ? `@@${selector}` : selector) && !isClientComponent(metadata)) {
      rendered.add(importPath);
    }
  }

  return dependencyPaths.filter(path => rendered.has(path));
}

/**
 * Collects what the server renders in a list of nodes: the tag names of the elements and the selectors of the
 * directives, written as they are applied (`@@selector`), so that the two never clash.
 *
 * @param nodes - The nodes.
 * @param selectors - The selectors, filled as they are found.
 * @returns `true` when the nodes hold a `@client` or a `@defer` block.
 */
function collectSelectors(nodes: readonly ASTNode[], selectors: Set<string>): boolean {
  let client = false;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.Element:
        selectors.add(node.tagName);
        collectBindingSelectors(node, selectors);
        client = collectSelectors(node.children, selectors) || client;
        break;

      case ASTNodeType.If:
      case ASTNodeType.ElseIf:
        client = collectSelectors(node.children, selectors) || client;
        if (node.alternate) {
          client = collectSelectors([node.alternate], selectors) || client;
        }
        break;

      case ASTNodeType.Else:
      case ASTNodeType.For:
      case ASTNodeType.Switch:
      case ASTNodeType.Case:
      case ASTNodeType.Template:
      case ASTNodeType.Hydrate:
        client = collectSelectors(node.children, selectors) || client;
        break;

      case ASTNodeType.Try:
        client = collectSelectors(node.children, selectors) || client;
        client = collectSelectors(node.catch.children, selectors) || client;
        break;

      // The server renders only the @placeholder of these blocks
      case ASTNodeType.Client:
      case ASTNodeType.Defer:
        client = true;
        if (node.placeholder) {
          collectSelectors(node.placeholder.children, selectors);
        }
        break;

      default:
        // Texts, interpolations, imports, @render and @let render nothing to load
        break;
    }
  }

  return client;
}

/**
 * Collects the selectors of the directives applied to an element or by a branch of a conditional binding.
 *
 * @param bindings - The bindings.
 * @param selectors - The selectors, filled as they are found.
 */
function collectBindingSelectors({ directives, structuralDirectives, conditionalBindings }: Pick<ConditionalBindingBranchNode, 'directives' | 'structuralDirectives' | 'conditionalBindings'>, selectors: Set<string>): void {
  for (let i = 0; i < directives.length; i++) {
    selectors.add(`@@${directives[i].selector}`);
  }

  for (let i = 0; i < structuralDirectives.length; i++) {
    selectors.add(`@@${structuralDirectives[i].selector}`);
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    for (let j = 0; j < branches.length; j++) {
      collectBindingSelectors(branches[j], selectors);
    }
  }
}
