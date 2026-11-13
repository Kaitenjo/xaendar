import { dropsLeadingNewline, escapeAttribute, escapeRawText, escapeText, isRawTextElement, isVoidElement } from '@xaendar/common';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { ElementNode } from '../../types/nodes/element-node.type';

/**
 * The attributes of a `<template>` declaring a shadow root, which only the parser of the browser reads, from the HTML
 * of the server.
 */
const SHADOW_ROOT_ATTRIBUTES = new Set(['shadowrootmode', 'shadowrootclonable', 'shadowrootdelegatesfocus', 'shadowrootserializable']);

/**
 * Ensures a standard `<template>` element, one declaring no template (`<template id="row">`), declares no shadow root:
 * only the parser of the browser reads the attributes declaring one, while the server writes the shadow roots of the
 * components.
 *
 * @param element - The `<template>` element.
 * @throws If the element declares a shadow root.
 */
export function assertStandardTemplate(element: Pick<ElementNode, 'attributes'>): void {
  const { attributes } = element;
  for (let i = 0; i < attributes.length; i++) {
    const { name, span } = attributes[i];
    if (SHADOW_ROOT_ATTRIBUTES.has(name)) {
      throw new Error(`A <template> cannot declare a shadow root with "${name}": the server writes the shadow root of each component`, { cause: span });
    }
  }
}

/**
 * Serializes the content of a standard `<template>` element as the HTML of its `content`: the code using the
 * template clones it, so the content is static HTML, elements with static attributes and texts, escaped as the server
 * escapes them. The client assigns it to the `innerHTML` of the element, and the server writes it as it is, so both
 * produce the same nodes.
 *
 * @param children - The children of the `<template>`.
 * @returns The HTML of the content, empty when it has no children.
 * @throws If a node of the content binds anything: an interpolation, an attribute bound to an expression, a class
 *   binding, an event, an element ref, a directive, a structural directive, a conditional binding, a block or the
 *   declaration of a template.
 */
export function serializeTemplateContent(children: readonly ASTNode[]): string {
  return serializeNodes(children, undefined);
}

/**
 * Serializes nodes of the content of a standard `<template>`.
 *
 * @param nodes - The nodes.
 * @param parentTag - The tag name of the element containing them, `undefined` at the top of the content.
 * @returns The HTML of the nodes.
 * @throws If a node binds anything (see {@link serializeTemplateContent}).
 */
function serializeNodes(nodes: readonly ASTNode[], parentTag: string | undefined): string {
  let html = '';
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.Text:
        html += parentTag && isRawTextElement(parentTag) ? escapeRawText(node.value, parentTag) : escapeText(node.value);
        break;

      case ASTNodeType.Element:
        html += serializeElement(node);
        break;

      default:
        throw new Error('The content of a <template> is static HTML, which the code using the template clones: it cannot interpolate values, render blocks or declare templates. Declare a template with <template name(…)> and render it with @render to bind values', { cause: node.span });
    }
  }

  return html;
}

/**
 * Serializes an element of the content of a standard `<template>`: its start tag with its static attributes, its
 * children and its end tag, unless it is a void element.
 *
 * @param element - The element.
 * @returns The HTML of the element.
 * @throws If the element, or a node inside it, binds anything (see {@link serializeTemplateContent}).
 */
function serializeElement(element: ElementNode): string {
  const { tagName, attributes } = element;
  const binding = element.ref ?? element.typeArguments?.[0] ?? element.classBindings[0] ?? element.styleBindings[0] ?? element.events[0] ?? element.conditionalBindings[0] ?? element.directives[0] ?? element.structuralDirectives[0] ?? attributes.find(({ value }) => typeof value !== 'string');
  if (binding) {
    throw new Error(`<${tagName}> is in the content of a <template>, static HTML which the code using the template clones: it takes only static attributes`, { cause: binding.span });
  }

  let html = `<${tagName}`;
  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes[i];
    html += ` ${name}="${escapeAttribute(value as string)}"`;
  }

  html += '>';
  if (isVoidElement(tagName)) {
    return html;
  }

  if (dropsLeadingNewline(tagName)) {
    html += '\n';
  }

  return `${html}${serializeNodes(element.children, tagName)}</${tagName}>`;
}
