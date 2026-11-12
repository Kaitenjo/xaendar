import { _bindEffect } from '../../signals/effect/effect';
import { COMPONENT } from '../../costants';
import type { _Context } from '../../types/context.type';
import type { TemplateExpression } from '../../types/template-expression.type';
import { getNodeStrategy } from '../context/context.util';

/**
 * Renders a text node holding the value of an expression, kept in sync with the signals and the variables of the
 * template it reads (see `_bindEffect`). The expression is a function of the module of the template, called with the
 * component and the context, which the binding keeps instead of a closure (see `TemplateExpression`).
 *
 * The node is got through the strategy of the context: created, or adopted from the HTML rendered on the server. Its
 * text is written only when it differs from the one the node holds: the first run of an adopted node writes nothing,
 * unless the browser computes another text than the server did. As `textContent` does, `null` and `undefined` are an
 * empty text.
 *
 * @param parentNode - The node to render the text into.
 * @param context - The current template execution scope.
 * @param value - The expression computing the value of the text.
 * @param referenceNode - The node to insert the text before, `null` to append it.
 * @param separated - Whether the server wrote `<!---->` before the text, as it does before each interpolation where the
 *   parser does not read the content of the element as text.
 * @param reads - The identifiers of the variables of the template the expression reads, omitted when it reads none.
 * @param slot - The slot of the node in the context, given by the compiler to a text at the top of the block of a scope:
 *   omitted for the others, which no scope tracks.
 */
export function _renderText(parentNode: HTMLElement, context: _Context, value: TemplateExpression<unknown>, referenceNode: Comment | null, separated = false, reads?: readonly number[], slot?: number): void {
  const node = getNodeStrategy(context).text(context, parentNode, referenceNode, '', separated, slot);
  _bindEffect(context, updateText, node, value, context, reads);
}

/**
 * Writes the value of the expression of a text into its node, when it differs from the text the node holds: the
 * callback of the binding of {@link _renderText}, shared by every text.
 *
 * @param node - The text node.
 * @param expression - The expression computing the value of the text.
 * @param context - The context the text is rendered in, which the expression reads.
 */
function updateText(node: Text, expression: TemplateExpression<unknown>, context: _Context): void {
  const value = expression.call(context[COMPONENT], context);
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
 * @param slot - The slot of the node in the context, given by the compiler to a text at the top of the block of a scope:
 *   omitted for the others, which no scope tracks.
 */
export function _renderLiteralText(parentNode: HTMLElement, context: _Context, text: string, referenceNode: Comment | null, separated = false, slot?: number): void {
  const node = getNodeStrategy(context).text(context, parentNode, referenceNode, text, separated, slot);
  if (node.data !== text) {
    node.data = text;
  }
}
