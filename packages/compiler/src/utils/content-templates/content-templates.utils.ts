import { ASTNodeType } from '../../parser/types/node.enum';
import type { ElementNode } from '../../parser/types/nodes/element-node.type';
import { isStructuralElement } from '../../parser/utils/scope-declarations/scope-declarations.utils';
import type { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { toStringLiteral } from '../../generator/utils/generator/generator.utils';
import { toObjectLiteral } from '../../generator/utils/module-code/module-code.utils';

/**
 * Describes the templates passed as content to a component: the `<template name(…)>` written among the children of
 * its element, each one by its name and the template, as the scope rendering the element reads it (the constant of the
 * module describing it in the browser, the function writing it on the server). The runtime passes them to the
 * component before connecting it (`_setContentTemplates`), which reads them with `@Query.contentTemplate`. The scope
 * rendering the element declares them, since an element opens no scope.
 *
 * @example
 * // <my-list><template row(item: Item)>…</template></my-list>
 * mapContentTemplates(node, context); // ["{ name: 'row', template: template_row_9$template }"]
 *
 * @param element - The element of the component.
 * @param context - The context of the scope rendering the element.
 * @returns The code of the descriptors, one per template, in the order they are written.
 * @throws If a structural directive is applied to the element: its content is a scope of its own, created with it.
 */
export function mapContentTemplates(element: ElementNode, context: CompilerContext): string[] {
  const descriptors = new Array<string>();
  const { children } = element;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === ASTNodeType.Template) {
      const { name } = child.declaration;
      if (isStructuralElement(element)) {
        throw new Error(`<${element.tagName}> cannot receive the template "${name}" as content: a structural directive is applied to it, whose content is a scope of its own. Apply the directive to an element wrapping it`, { cause: child.declaration.nameSpan });
      }

      descriptors.push(toObjectLiteral([`name: ${toStringLiteral(name)}`, `template: ${context.readIdentifier(name)}`]));
    }
  }

  return descriptors;
}
