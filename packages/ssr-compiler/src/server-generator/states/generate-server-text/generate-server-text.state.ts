import { escapeRawText, escapeText, isRawTextElement } from '@xaendar/common';
import { ASTNodeType, resolveExpression, type GeneratorContext, type InterpolationNode, type TextNode } from '@xaendar/compiler';
import type { ServerParent } from '../../types/server-parent.type';
import type { ServerTransitionResult } from '../../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS } from '../../utils/server-code/server-code.utils';

/**
 * Generates the code writing a text or an interpolation: a text is escaped when the template is compiled, the value of
 * an interpolation when it is rendered, converted to a string as a text node converts it. The text of an element of the
 * HTML namespace whose content the parser does not decode, such as `<style>`, is written as it is.
 *
 * @param node - The text or the interpolation.
 * @param parent - Where the node is rendered.
 * @param _index - Unused position of the node.
 * @param generatorContext - The generator context of the node.
 * @returns The code of the node.
 */
export function generateServerText(node: TextNode | InterpolationNode, parent: ServerParent, _index: string, generatorContext: GeneratorContext): ServerTransitionResult {
  const rawTextTag = parent.tag && generatorContext.namespace === 'html' && isRawTextElement(parent.tag) ? parent.tag : undefined;
  if (node.type === ASTNodeType.Text) {
    return { pieces: [{ html: rawTextTag ? escapeRawText(node.value, rawTextTag) : escapeText(node.value) }] };
  }

  const { expression } = resolveExpression(node.expression, generatorContext, SERVER_RESOLVE_OPTIONS);
  return { pieces: [{ value: rawTextTag ? `_escapeRawText(${expression}, '${rawTextTag}')` : `_escapeText(${expression})` }] };
}
