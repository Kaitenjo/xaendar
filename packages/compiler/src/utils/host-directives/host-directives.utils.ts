import { CompilerOptions, Expression, isArrayLiteralExpression, isIdentifier, isObjectLiteralExpression, isPropertyAssignment, isShorthandPropertyAssignment, isStringLiteralLike, ObjectLiteralExpression, SourceFile } from 'typescript';
import { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import { ComponentMetadata } from '../../types/component-metadata.type';
import type { WebComponentDecorator } from '../../types/typescript-decorator-nodes/web-component-decorator.type';
import { resolveClassReference } from '../resolve-declaration/resolve-declaration.utils';
import type { Exposure } from '../../types/exposure.type';
import type { HostDirectiveDeclaration } from '../../types/host-directive-declaration.type';
import type { ExtractBindings } from '../../types/extract-bindings.type';

/**
 * Adds to the metadata of a component the inputs and the events its host directives expose: they are bound from the templates
 * using the component as if the component declared them, under the name they are exposed with.
 *
 * A directive that can't be resolved, an input or an event it doesn't declare, and a name already used by an input or an
 * event of the component are skipped: the component fails at runtime, when the element is created, the same way.
 *
 * @param bindings - The properties and the events of the component, filled in place.
 * @param decorator - The `@WebComponent` decorator of the component.
 * @param sourceFile - The source file declaring the component, which the directives are resolved from.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the directives are resolved.
 * @param extractBindings - Extracts the properties and the events of a directive.
 * @throws If two properties of a directive resolve to the same name.
 */
export function addHostDirectiveBindings({ properties, events }: Pick<ComponentMetadata, 'properties' | 'events'>, decorator: WebComponentDecorator, sourceFile: SourceFile, compilerOptions: CompilerOptions | undefined, extractBindings: ExtractBindings): void {
  const directives = readHostDirectives(decorator);
  if (!directives?.length) {
    return;
  }

  for (let i = 0; i < directives.length; i++) {
    const { directive, properties: dirProperties, events: dirEvents } = directives[i];
    const resolved = dirProperties?.length || dirEvents?.length ? resolveClassReference(sourceFile, directive, compilerOptions) : undefined;
    const exposed = resolved && extractBindings(resolved);
    if (!exposed) {
      continue;
    }

    if (dirProperties?.length) {
      for (let j = 0; j < dirProperties.length; j++) {
        const { name, alias } = dirProperties[j];
        const property = exposed.properties.get(name);
        if (property && !properties.has(alias)) {
          properties.set(alias, new ComponentPropertyMetadata(property.name, property.type, { 
            required: property.required, 
            alias: alias === property.name ? undefined : alias, 
            declaration: property.declaration 
          }));
        }
      }
    }

    if (dirEvents?.length) {
      for (let j = 0; j < dirEvents.length; j++) {
        const { name, alias } = dirEvents[j];
        const event = exposed.events.get(name);
        if (event && !events.has(alias)) {
          events.set(alias, event);
        }
      }
    }
  }
}

/**
 * Reads the `hostDirectives` of a `@WebComponent` decorator: each one is the class of the directive, or an object literal
 * with its class (`directive`) and the properties and events it exposes.
 *
 * @param decorator - The `@WebComponent` decorator to read.
 * @returns The host directives, `undefined` when the decorator declares none as an array literal.
 */
function readHostDirectives(decorator: WebComponentDecorator): HostDirectiveDeclaration[] | undefined {
  // A component with a literal selector declares its options as an object literal
  const list = getOptionExpression(decorator.expression.arguments[0] as ObjectLiteralExpression, 'hostDirectives');
  if (!list || !isArrayLiteralExpression(list)) {
    return;
  }

  const declarations = new Array<HostDirectiveDeclaration>();
  for (let i = 0; i < list.elements.length; i++) {
    const element = list.elements[i];
    if (!isObjectLiteralExpression(element)) {
      declarations.push({ directive: element });
      continue;
    }

    const directive = getOptionExpression(element, 'directive');
    if (directive) {
      declarations.push({ directive, properties: readExposures(getOptionExpression(element, 'properties')), events: readExposures(getOptionExpression(element, 'events')) });
    }
  }

  return declarations;
}

/**
 * Gets the expression a property of an object literal is set to.
 *
 * @param object - The object literal to read.
 * @param name - The name of the property.
 * @returns The initializer of the property, or the name itself for a shorthand one (`{ directive }`), `undefined` when the object has no such property.
 */
function getOptionExpression(object: ObjectLiteralExpression, name: string): Expression | undefined {
  for (let i = 0; i < object.properties.length; i++) {
    const property = object.properties[i];
    if (isPropertyAssignment(property) && isIdentifier(property.name) && property.name.text === name) {
      return property.initializer;
    }

    if (isShorthandPropertyAssignment(property) && property.name.text === name) {
      return property.name;
    }
  }
}

/**
 * Reads the properties or the events a host directive exposes: each element of the array literal is either a string
 * literal, the name exposed with its own name, or an object literal with the `name` and the `alias` as string literals.
 * Any other element is ignored.
 *
 * @param expression - The expression to read.
 * @returns The exposures, `undefined` when the expression is not an array literal.
 */
function readExposures(expression: Expression | undefined): Exposure[] | undefined {
  if (!expression || !isArrayLiteralExpression(expression)) {
    return;
  }

  const exposures = new Array<Exposure>();
  for (let i = 0; i < expression.elements.length; i++) {
    const element = expression.elements[i];
    if (isStringLiteralLike(element)) {
      exposures.push({ name: element.text, alias: element.text });
    } else if (isObjectLiteralExpression(element)) {
      const name = getOptionExpression(element, 'name');
      const alias = getOptionExpression(element, 'alias');
      if (name && alias && isStringLiteralLike(name) && isStringLiteralLike(alias)) {
        exposures.push({ name: name.text, alias: alias.text });
      }
    }
  }

  return exposures;
}
