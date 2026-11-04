import type { ComponentMetadata } from '@xaendar/compiler';
import { isIdentifier, isObjectLiteralExpression, isPropertyAssignment, isStringLiteral } from 'typescript';
import type { ComponentStringOption } from '../../types/component-string-option.type';

/**
 * Finds the options of a `@WebComponent` decorator assigned a string literal.
 *
 * @example
 * // @WebComponent({ selector: 'x-a', templateUrl: TEMPLATE, styleUrl: './a.css' })
 * findStringOptions(decorator, ['templateUrl', 'styleUrl']); // [{ name: 'styleUrl', literal: './a.css' }]
 *
 * @param decorator - The decorator.
 * @param names - The names of the options.
 * @returns The options, in the order they are declared.
 */
export function findStringOptions(decorator: ComponentMetadata['typescriptNodes']['decorator'], names: readonly string[]): ComponentStringOption[] {
  const options = new Array<ComponentStringOption>();
  const { properties } = decorator.expression.arguments.find(isObjectLiteralExpression) ?? {};
  for (let i = 0; properties && i < properties.length; i++) {
    const property = properties[i];
    if (isPropertyAssignment(property) && isIdentifier(property.name) && names.includes(property.name.text) && isStringLiteral(property.initializer)) {
      options.push({ name: property.name.text, literal: property.initializer });
    }
  }

  return options;
}
