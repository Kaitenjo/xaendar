import { isValidCustomElementName } from '@xaendar/common';
import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import type { CompilerCache } from '../../../types/compiler-cache.type';
import type { CompilerContext } from '../../models/compiler-context/compiler-context.model';

/**
 * Finds the modules each `@hydrate` and each `@defer` of a template loads before rendering its content: the ones
 * declaring the components that only the content of these blocks renders, which the browser loads in chunks of their
 * own, when a trigger fires or, for a `@hydrate` in a page rendered in the browser, at once. A module declaring a
 * component the template renders anywhere else, the `@placeholder`, `@loading` and `@error` of a `@defer` included, is
 * loaded with the template. The components of a block inside another one are loaded by the inner one.
 *
 * The module of a component is the file declaring its class, read from its metadata: without the cache of the metadata,
 * the components are left to the imports of the template.
 *
 * @param nodes - The nodes of the template.
 * @param compilerContext - The root compiler context, holding the cache of the metadata and the patterns of the custom
 *   elements of other libraries.
 * @returns The paths of the modules, by `@hydrate` or `@defer` node, for the ones loading any, `undefined` when none does.
 */
export async function getDeferredModules(nodes: readonly ASTNode[], compilerContext: CompilerContext): Promise<Map<HydrateNode | DeferNode, string[]> | undefined> {
  const { cache } = compilerContext;
  const eager = new Set<string>();
  const deferred = new Map<HydrateNode | DeferNode, Set<string>>();
  collectTags(nodes, eager, deferred, compilerContext);
  if (!deferred.size) {
    return undefined;
  }

  const eagerModules = new Set<string>();
  for (const tag of eager) {
    const path = await getModule(tag, cache);
    if (path) {
      eagerModules.add(path);
    }
  }

  let modules: Map<HydrateNode | DeferNode, string[]> | undefined;
  for (const [node, tags] of deferred) {
    const paths = new Array<string>();
    for (const tag of tags) {
      const path = await getModule(tag, cache);
      if (path && !eagerModules.has(path) && !paths.includes(path)) {
        paths.push(path);
      }
    }

    if (paths.length) {
      (modules ??= new Map()).set(node, paths);
    }
  }

  return modules;
}

/**
 * Gets the module declaring a component: the file of its class, read from its metadata.
 *
 * @param tag - The tag name of the component.
 * @param cache - The cache of the metadata.
 * @returns The path of the module, `undefined` for the tag of a directive.
 */
async function getModule(tag: string, cache: CompilerCache): Promise<string | undefined> {
  const metadata = await cache.getOrInsert(tag);
  return metadata.type === 'component' ? metadata.typescriptNodes.klass.getSourceFile().fileName : undefined;
}

/**
 * Collects the tags of the components a list of nodes renders: into the set of the content of the `@hydrate` they are
 * in, or into the eager ones when they are in none.
 *
 * @param nodes - The nodes.
 * @param eager - The tags rendered outside of the content of every `@hydrate`.
 * @param deferred - The tags rendered by the content of each `@hydrate`, filled as the blocks are found.
 * @param compilerContext - The root compiler context.
 * @param current - The tags of the content of the `@hydrate` the nodes are in, if any.
 */
function collectTags(nodes: readonly ASTNode[], eager: Set<string>, deferred: Map<HydrateNode | DeferNode, Set<string>>, compilerContext: CompilerContext, current?: Set<string>): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.Element:
        if (isValidCustomElementName(node.tagName, false) && !compilerContext.isForeignElement(node.tagName)) {
          (current ?? eager).add(node.tagName);
        }
        collectTags(node.children, eager, deferred, compilerContext, current);
        break;

      case ASTNodeType.If:
      case ASTNodeType.ElseIf:
        collectTags(node.children, eager, deferred, compilerContext, current);
        if (node.alternate) {
          collectTags([node.alternate], eager, deferred, compilerContext, current);
        }
        break;

      // The content of a @try and its @catch are rendered with the template
      case ASTNodeType.Try:
        collectTags(node.children, eager, deferred, compilerContext, current);
        collectTags(node.catch.children, eager, deferred, compilerContext, current);
        break;

      case ASTNodeType.Hydrate: {
        const content = new Set<string>();
        deferred.set(node, content);
        collectTags(node.children, eager, deferred, compilerContext, content);
        break;
      }

      // The blocks following the content of a @defer render without waiting for its modules
      case ASTNodeType.Defer: {
        const content = new Set<string>();
        deferred.set(node, content);
        collectTags(node.children, eager, deferred, compilerContext, content);
        if (node.placeholder) {
          collectTags(node.placeholder.children, eager, deferred, compilerContext, current);
        }

        if (node.loading) {
          collectTags(node.loading.children, eager, deferred, compilerContext, current);
        }

        if (node.error) {
          collectTags(node.error.children, eager, deferred, compilerContext, current);
        }
        break;
      }

      case ASTNodeType.Else:
      case ASTNodeType.For:
      case ASTNodeType.Switch:
      case ASTNodeType.Case:
      case ASTNodeType.Template:
      // The browser renders only the content of a @client
      case ASTNodeType.Client:
        collectTags(node.children, eager, deferred, compilerContext, current);
        break;

      default:
        // Texts, interpolations, imports, @render and @let render no component
        break;
    }
  }
}
