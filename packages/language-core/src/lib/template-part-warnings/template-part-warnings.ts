import { type ASTNode, type AttributeNode, type ComponentMetadata, type ComponentOrDirectiveMetadata, type ConditionalBindingNode, parseExportParts, walkTemplate } from '@xaendar/compiler';
import type { TemplateWarning } from '../types/template-warning.type';
import { getComponentParts } from '../utils/component-parts/component-parts.utils';

/**
 * Finds the names of the static `exportparts` of the components a template renders that are not parts of the component:
 * `exportparts` forwards the parts of the component holding the element, and a name it does not expose forwards
 * nothing, which no CSS rule then styles. The components whose parts are not known, or open (see `ComponentParts`), are
 * left out: a name could be a part the compiler cannot read.
 *
 * @param ast - The top-level nodes of the template.
 * @param metadatas - The metadata of the components and directives the template imports.
 * @param read - Reads a file, as `getComponentParts` does.
 * @returns A warning on each name, in the order of the template.
 */
export function getExportPartsWarnings(ast: readonly ASTNode[], metadatas: readonly ComponentOrDirectiveMetadata[], read?: (fileName: string) => string | undefined): TemplateWarning[] {
  const warnings = new Array<TemplateWarning>();
  walkTemplate(ast, metadatas, {
    element: (node, component) => {
      const attributes = component && collectExportParts(node.attributes, node.conditionalBindings);
      if (!attributes?.length) {
        return;
      }

      const parts = getComponentParts(component!, read);
      if (!parts || parts.open) {
        return;
      }

      for (let i = 0; i < attributes.length; i++) {
        const { value, valueSpan } = attributes[i];
        const entries = parseExportParts(value as string, valueSpan!.start);
        for (let j = 0; j < entries.length; j++) {
          const { inner, innerSpan } = entries[j];
          if (!parts.names.includes(inner)) {
            warnings.push({ span: innerSpan, message: describeMissingPart(inner, component!, parts.names) });
          }
        }
      }
    }
  });

  return warnings;
}

/**
 * Gives the static `exportparts` of an element, the ones of the branches of its conditional bindings included.
 *
 * @param attributes - The attributes of the element, or of a branch.
 * @param conditionalBindings - Its conditional bindings.
 * @param found - Collects the attributes.
 * @returns The attributes.
 */
function collectExportParts(attributes: readonly AttributeNode[], conditionalBindings: readonly ConditionalBindingNode[], found = new Array<AttributeNode>()): AttributeNode[] {
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    if (attribute.name === 'exportparts' && attribute.valueSpan) {
      found.push(attribute);
    }
  }

  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    for (let j = 0; j < branches.length; j++) {
      collectExportParts(branches[j].attributes, branches[j].conditionalBindings, found);
    }
  }

  return found;
}

/**
 * Tells that a name of `exportparts` is not a part of a component, naming the ones it exposes.
 *
 * @param name - The name.
 * @param component - The component.
 * @param names - Its parts.
 * @returns The message.
 */
function describeMissingPart(name: string, { selector, extends: extended }: ComponentMetadata, names: readonly string[]): string {
  const tag = extended ? `<${extended} is="${selector}">` : `<${selector}>`;
  return `'${name}' is not a part of ${tag}, which exposes ${names.length ? names.join(', ') : 'no part'}: exportparts forwards only the parts the component exposes.`;
}
