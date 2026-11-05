import { _SSR_MARKERS } from '../../costants';
import type { TryBlock } from '../../types/try-block.type';
import { _Context } from '../context/context.util';
import { closeTryScope, openTryScope } from '../try-scope/try-scope.util';

/**
 * The detail of the marker of a `@try` whose content the server rendered.
 */
const CONTENT = '0';

/**
 * The detail of the marker of a `@try` whose `@catch` the server rendered.
 */
const CATCH = '1';

/**
 * Renders a `@try` block: its content, or, when the first render of the content throws, its `@catch`, with the error
 * thrown, as in JavaScript. The first render includes the code of the components the content creates: their
 * constructor, their `onInit`, their first render and their `afterRender`. What the content rendered before throwing is
 * disposed: its nodes are removed, its components with them, and its effects stopped. An update throwing afterwards, an
 * event handler and a promise are not caught, and an error of the `@catch` goes on to what holds the block. The `@catch`
 * stays until the block is rendered again, by the block holding it.
 *
 * In a page rendered on the server, the browser renders the content again from its own state: it adopts the nodes of
 * the content the server rendered, and when it throws, the rest of them is removed, with a warning, and the `@catch` is
 * created. The error of a `@catch` the server rendered does not reach the browser, which removes it and renders the
 * content from scratch, then the `@catch` when it throws again.
 *
 * @param parentNode - The parent HTML element the block is rendered into.
 * @param parentContext - The context owning the block.
 * @param referenceNode - The node to insert the block before, `null` to append it.
 * @param block - Renders the content and the `@catch`.
 * @throws The error of the `@catch`.
 */
export function _try(parentNode: HTMLElement, parentContext: _Context, referenceNode: Comment | null, block: TryBlock): void {
  const { nodeStrategy } = parentContext;
  const nodeBlock = nodeStrategy.block(parentContext, parentNode, referenceNode, 'try', _SSR_MARKERS.try);
  const replaced = nodeBlock.marker === CATCH;
  const strategy = replaced ? nodeStrategy.replace(parentNode, nodeBlock) : nodeStrategy.adopt(parentNode, nodeBlock, CONTENT);

  const holder = new _Context(parentContext);
  // Wrapped, so that `undefined` thrown can be told from no error
  let failure: { readonly error: unknown } | undefined;
  const scope = openTryScope();
  try {
    holder.addChild(block.content(parentNode, holder, nodeBlock.anchor, strategy));
  } catch (error) {
    failure = { error };
  } finally {
    closeTryScope(scope);
  }

  if (failure) {
    // In creation order, so that a component is removed, running its `onDestroy`, before its own contexts are disposed
    for (let i = 0; i < scope.contexts.length; i++) {
      scope.contexts[i].clear();
    }

    // What is left of the content the server rendered is removed, with a warning, and the @catch is created
    const fallback = replaced ? strategy : nodeStrategy.adopt(parentNode, nodeBlock, CATCH);
    holder.addChild(block.catch(parentNode, holder, nodeBlock.anchor, fallback, failure.error));
  }

  parentContext.addChild(holder);
  // `replace` has already moved past the block
  if (!replaced) {
    nodeStrategy.close(parentNode, nodeBlock);
  }
}
