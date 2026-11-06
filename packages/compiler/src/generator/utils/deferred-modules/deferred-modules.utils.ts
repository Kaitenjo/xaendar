import { isValidCustomElementName } from '@xaendar/common';
import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import type { ContextCache } from '../../../types/context-cache.type';
import type { GeneratorContext } from '../../context/context';

/**
 * Finds the modules each `@hydrate` and each `@defer` of a template loads before rendering its content: the ones
 * declaring the components that only the content of these blocks renders, which the browser loads in chunks of their
 * own, when a trigger fires or, for a `@hydrate` in a page rendered in the browser, at once. A module declaring a
 * component the template renders anywhere else, the `@placeholder`, `@loading` and `@error` of a `@defer` included, is
 * loaded with the template. The components of a block inside another one are loaded by the inner one.
 *
 * The module of a component is the file declaring its class, read from its metadata.
 *
 * @param nodes - The nodes of the template.
 * @param generatorContext - The root generator context, holding the cache of the metadata and the patterns of the custom
 *   elements of other libraries.
 * @returns The paths of the modules, by `@hydrate` or `@defer` node, for the ones loading any, `undefined` when none does.
 */
export async function getDeferredModules(nodes: readonly ASTNode[], generatorContext: GeneratorContext): Promise<Map<HydrateNode | DeferNode, string[]> | undefined> {
  const { cache } = generatorContext;
  const eager = new Set<string>();
  const deferred = new Map<HydrateNode | DeferNode, Set<string>>();
  collectTags(nodes, eager, deferred, generatorContext);
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

  const modules = new Map<HydrateNode | DeferNode, string[]>();
  for (const [node, tags] of deferred) {
    const paths = new Array<string>();
    for (const tag of tags) {
      const path = await getModule(tag, cache);
      if (path && !eagerModules.has(path) && !paths.includes(path)) {
        paths.push(path);
      }
    }

    if (paths.length) {
      modules.set(node, paths);
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
async function getModule(tag: string, cache: ContextCache): Promise<string | undefined> {
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
 * @param generatorContext - The root generator context.
 * @param current - The tags of the content of the `@hydrate` the nodes are in, if any.
 */
function collectTags(nodes: readonly ASTNode[], eager: Set<string>, deferred: Map<HydrateNode | DeferNode, Set<string>>, generatorContext: GeneratorContext, current?: Set<string>): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.Element:
        if (isValidCustomElementName(node.tagName, false) && !generatorContext.isForeignElement(node.tagName)) {
          (current ?? eager).add(node.tagName);
        }
        collectTags(node.children, eager, deferred, generatorContext, current);
        break;

      case ASTNodeType.If:
      case ASTNodeType.ElseIf:
        collectTags(node.children, eager, deferred, generatorContext, current);
        if (node.alternate) {
          collectTags([node.alternate], eager, deferred, generatorContext, current);
        }
        break;

      // The content of a @try and its @catch are rendered with the template
      case ASTNodeType.Try:
        collectTags(node.children, eager, deferred, generatorContext, current);
        collectTags(node.catch.children, eager, deferred, generatorContext, current);
        break;

      case ASTNodeType.Hydrate: {
        const content = new Set<string>();
        deferred.set(node, content);
        collectTags(node.children, eager, deferred, generatorContext, content);
        break;
      }

      // The blocks following the content of a @defer render without waiting for its modules
      case ASTNodeType.Defer: {
        const content = new Set<string>();
        deferred.set(node, content);
        collectTags(node.children, eager, deferred, generatorContext, content);
        if (node.placeholder) {
          collectTags(node.placeholder.children, eager, deferred, generatorContext, current);
        }

        if (node.loading) {
          collectTags(node.loading.children, eager, deferred, generatorContext, current);
        }

        if (node.error) {
          collectTags(node.error.children, eager, deferred, generatorContext, current);
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
        collectTags(node.children, eager, deferred, generatorContext, current);
        break;

      default:
        // Texts, interpolations, imports, @render and @let render no component
        break;
    }
  }
}
