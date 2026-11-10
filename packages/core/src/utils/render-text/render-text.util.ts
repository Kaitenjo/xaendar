import { NoArgsFunction } from '@xaendar/types';
import { _bindEffect } from '../../signals/effect/effect';
import { _Context } from '../context/context.util';

/**
 * Renders a reactive text node, kept in sync with the signals its expression reads.
 *
 * The node is got through the strategy of the context: created, or adopted from the HTML rendered on the server. Its
 * text is written by an effect, only when it differs from the one the node holds: the first run of an adopted node
 * writes nothing, unless the browser computes another text than the server did. As `textContent` does, `null` and
 * `undefined` are an empty text.
 *
 * @param parentNode - The node to render the text into.
 * @param context - The current template execution scope.
 * @param textFn - Returns the value of the text.
 * @param referenceNode - The node to insert the text before, `null` to append it.
 * @param separated - Whether the server wrote `<!---->` before the text, as it does before each interpolation where the
 *   parser does not read the content of the element as text.
 */
export function _renderText(parentNode: HTMLElement, context: _Context, textFn: NoArgsFunction<unknown>, referenceNode: Comment | null, separated = false): void {
  const node = context.nodeStrategy.text(context, parentNode, referenceNode, '', separated);
  _bindEffect(context, updateText, node, textFn);
}

/**
 * Writes the value of the expression of a reactive text into its node, when it differs from the text the node holds:
 * the callback of the effect of {@link _renderText}, shared by every text.
 *
 * @param node - The text node.
 * @param textFn - Returns the value of the text.
 */
function updateText(node: Text, textFn: NoArgsFunction<unknown>): void {
  const value = textFn();
  const text = value === null || value === undefined ? '' : `${value}`;
  if (node.data !== text) {
    node.data = text;
  }
}

/**
 * Renders a static (non-reactive) text node with a literal string value.
 *
 * The node is got through the strategy of the context: created, or adopted from the HTML rendered on the server. An
 * adopted node gets the literal only when it holds another text, e.g. other line endings, which the parser normalizes.
 * The node is removed when the context is destroyed.
 *
 * @param parentNode - The node to render the text into.
 * @param context - The current template execution scope.
 * @param text - The literal string to render as text content.
 * @param referenceNode - The node to insert the text before, `null` to append it.
 * @param separated - Whether the server wrote `<!---->` before the text, as it does before a text following another one.
 */
export function _renderLiteralText(parentNode: HTMLElement, context: _Context, text: string, referenceNode: Comment | null, separated = false): void {
  const node = context.nodeStrategy.text(context, parentNode, referenceNode, text, separated);
  if (node.data !== text) {
    node.data = text;
  }
}
