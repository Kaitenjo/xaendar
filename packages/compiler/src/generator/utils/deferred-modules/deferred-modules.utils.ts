import { isValidCustomElementName } from '@xaendar/common';
import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import type { ContextCache } from '../../../types/context-cache.type';
import type { GeneratorContext } from '../../context/context';

/**
 * Finds the modules each `@hydrate` and each `@defer` of a template loads before rendering its content: the ones
 * declaring the components, and the custom or structural directives, that only the content of these blocks renders,
 * which the browser loads in chunks of their own, when a trigger fires or, for a `@hydrate` in a page rendered in the
 * browser, at once. A module declaring a component or a directive the template renders anywhere else, the
 * `@placeholder`, `@loading` and `@error` of a `@defer` included, is loaded with the template. The components and the
 * directives of a block inside another one are loaded by the inner one. A directive is registered by its module, and
 * found by its selector when an element applying it is rendered, which happens once the module is loaded.
 *
 * The module of a component or of a directive is the file declaring its class, read from its metadata.
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

  return modules.size ? modules : undefined;
}

/**
 * Gets the module declaring a component or a directive: the file of its class, read from its metadata.
 *
 * @param key - The tag name of the component, or the selector of the directive after `@@`, as the cache names it.
 * @param cache - The cache of the metadata.
 * @returns The path of the module, `undefined` when the metadata is not of the kind the key names.
 */
async function getModule(key: string, cache: ContextCache): Promise<string | undefined> {
  const metadata = await cache.getOrInsert(key);
  return metadata.type === (key.startsWith('@@') ? 'directive' : 'component') ? metadata.typescriptNodes.klass.getSourceFile().fileName : undefined;
}

/**
 * Collects the tags of the components a list of nodes renders, and the selectors of the custom and structural
 * directives its elements apply, after `@@` as the cache names them: into the set of the content of the `@hydrate` or
 * of the `@defer` they are in, or into the eager ones when they are in none.
 *
 * @param nodes - The nodes.
 * @param eager - The tags and the selectors rendered outside of the content of every block.
 * @param deferred - The tags and the selectors rendered by the content of each block, filled as the blocks are found.
 * @param generatorContext - The root generator context.
 * @param current - The tags and the selectors of the content of the block the nodes are in, if any.
 */
function collectTags(nodes: readonly ASTNode[], eager: Set<string>, deferred: Map<HydrateNode | DeferNode, Set<string>>, generatorContext: GeneratorContext, current?: Set<string>): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.Element: {
        const keys = current ?? eager;
        if (isValidCustomElementName(node.tagName, false) && !generatorContext.isForeignElement(node.tagName)) {
          keys.add(node.tagName);
        }

        for (let j = 0; j < node.directives.length; j++) {
          keys.add(`@@${node.directives[j].selector}`);
        }

        for (let j = 0; j < node.structuralDirectives.length; j++) {
          keys.add(`@@${node.structuralDirectives[j].selector}`);
        }

        collectTags(node.children, eager, deferred, generatorContext, current);
        break;
      }

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
