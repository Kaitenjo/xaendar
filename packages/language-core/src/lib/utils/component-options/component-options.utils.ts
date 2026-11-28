import type { ComponentMetadata } from '@xaendar/compiler';
import { isArrayLiteralExpression, isIdentifier, isObjectLiteralExpression, isPropertyAssignment, isStringLiteral } from 'typescript';
import type { ComponentStringOption } from '../../types/component-string-option.type';

/**
 * Finds the string literals the options of a `@WebComponent` decorator are assigned, one of them or an array of them
 * (`styleUrl: ['./base.css', './a.css']`), each listed with its option.
 *
 * @example
 * // @WebComponent({ selector: 'x-a', templateUrl: TEMPLATE, styleUrl: ['./base.css', './a.css'] })
 * findStringOptions(decorator, ['templateUrl', 'styleUrl']); // [{ name: 'styleUrl', literal: './base.css' }, { name: 'styleUrl', literal: './a.css' }]
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
    if (!isPropertyAssignment(property) || !isIdentifier(property.name) || !names.includes(property.name.text)) {
      continue;
    }

    const { initializer } = property;
    if (isStringLiteral(initializer)) {
      options.push({ name: property.name.text, literal: initializer });
    } else if (isArrayLiteralExpression(initializer)) {
      for (let j = 0; j < initializer.elements.length; j++) {
        const element = initializer.elements[j];
        if (isStringLiteral(element)) {
          options.push({ name: property.name.text, literal: element });
        }
      }
    }
  }

  return options;
}
