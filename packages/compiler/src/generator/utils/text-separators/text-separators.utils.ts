import { isRawTextElement } from '@xaendar/common';
import type { ASTNode } from '../../../parser/types/ast.type';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { ElementNamespace } from '../../../types/element-namespace.type';

/**
 * The types of the nodes writing a text: a text, an interpolation, and a `@render`, whose content can start and end with
 * one.
 */
const WRITES_TEXT: ReadonlySet<ASTNodeType> = new Set([ASTNodeType.Text, ASTNodeType.Interpolation, ASTNodeType.Render]);

/**
 * The types of the nodes writing nothing where they are, which two texts around them follow each other across.
 */
const RENDERS_NOTHING: ReadonlySet<ASTNodeType> = new Set([ASTNodeType.Import, ASTNodeType.Template, ASTNodeType.Let]);

/**
 * Tells which of a list of sibling nodes the HTML rendered on the server separates from what precedes them with a
 * `<!---->`: each interpolation, so that the browser finds an empty one too, and a text, or a `@render`, following one
 * of them, which the parser would join into one text node. The server writes the separators, the browser adopts the
 * nodes around them: both generators read them from here, so that they agree.
 *
 * No node is separated where the parser reads the content of the element as text, where a comment would be text too:
 * the raw text elements of HTML, such as `<style>`, and the escapable ones, `<textarea>` and `<title>`.
 *
 * @param nodes - The sibling nodes.
 * @param parentTag - The tag name of the element they are rendered into, `undefined` for the root of a template or the
 *   content of a `<template>`.
 * @param namespace - The namespace of the nodes.
 * @returns For each node, whether a separator precedes it.
 */
export function getTextSeparators(nodes: readonly ASTNode[], parentTag: string | undefined, namespace: ElementNamespace): boolean[] {
  const separators = nodes.map(() => false);
  if (parentTag && namespace === 'html' && readsContentAsText(parentTag)) {
    return separators;
  }

  let followsText = false;
  for (let i = 0; i < nodes.length; i++) {
    const { type } = nodes[i];
    if (RENDERS_NOTHING.has(type)) {
      continue;
    }

    const writesText = WRITES_TEXT.has(type);
    separators[i] = type === ASTNodeType.Interpolation || (writesText && followsText);
    followsText = writesText;
  }

  return separators;
}

/**
 * Tells whether the parser reads the content of an element of the HTML namespace as text: the raw text elements, such
 * as `<style>`, and the escapable ones, `<textarea>` and `<title>`.
 *
 * @param tagName - The tag name of the element.
 * @returns `true` when the content of the element is text.
 */
function readsContentAsText(tagName: string): boolean {
  return isRawTextElement(tagName) || tagName === 'textarea' || tagName === 'title';
}
