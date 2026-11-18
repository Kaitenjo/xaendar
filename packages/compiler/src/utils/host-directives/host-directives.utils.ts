import { CompilerOptions, Expression, isArrayLiteralExpression, isIdentifier, isObjectLiteralExpression, isPropertyAssignment, isShorthandPropertyAssignment, isStringLiteralLike, Node, ObjectLiteralExpression } from 'typescript';
import { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import { ComponentMetadata } from '../../types/component-metadata.type';
import type { WebComponentDecorator } from '../../types/typescript-decorator-nodes/web-component-decorator.type';
import { resolveClassReference } from '../resolve-declaration/resolve-declaration.utils';
import type { Exposure } from '../../types/exposure.type';
import type { HostDirectiveDeclaration } from '../../types/host-directive-declaration.type';
import type { HostDirectiveSource } from '../../types/host-directive-source.type';
import type { ExtractBindings } from '../../types/extract-bindings.type';

/**
 * Adds to the metadata of a component the inputs and the events its host directives expose, the ones of its ancestors
 * first: they are bound from the templates using the component as if the component declared them, under the name they
 * are exposed with.
 *
 * A directive that can't be resolved, an input or an event it doesn't declare, and a name already used by an input or an
 * event of the component are skipped here: {@link checkHostDirectives} reports them.
 *
 * @param bindings - The properties and the events of the component, filled in place.
 * @param sources - The decorators declaring the host directives of the component, the ones of its ancestors first.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the directives are resolved.
 * @param extractBindings - Extracts the properties and the events of a directive.
 * @throws If two properties of a directive resolve to the same name.
 */
export function addHostDirectiveBindings({ properties, events }: Pick<ComponentMetadata, 'properties' | 'events'>, sources: readonly HostDirectiveSource[], compilerOptions: CompilerOptions | undefined, extractBindings: ExtractBindings): void {
  for (let i = 0; i < sources.length; i++) {
    const { sourceFile, decorator } = sources[i];
    const directives = readHostDirectives(decorator);
    if (!directives?.length) {
      continue;
    }

    for (let j = 0; j < directives.length; j++) {
      const { directive, properties: dirProperties, events: dirEvents } = directives[j];
      const resolved = dirProperties?.length || dirEvents?.length ? resolveClassReference(sourceFile, directive, compilerOptions) : undefined;
      const exposed = resolved && extractBindings(resolved);
      if (!exposed) {
        continue;
      }

      if (dirProperties?.length) {
        for (let k = 0; k < dirProperties.length; k++) {
          const { name, alias } = dirProperties[k];
          const property = exposed.properties.get(name);
          if (property && !properties.has(alias)) {
            properties.set(alias, new ComponentPropertyMetadata(property.name, property.type, {
              required: property.required,
              alias: alias === property.name ? undefined : alias,
              declaration: property.declaration,
              exposed: true
            }));
          }
        }
      }

      if (dirEvents?.length) {
        for (let k = 0; k < dirEvents.length; k++) {
          const { name, alias } = dirEvents[k];
          const event = exposed.events.get(name);
          if (event && !events.has(alias)) {
            events.set(alias, event);
          }
        }
      }
    }
  }
}

/**
 * Tells whether a `@WebComponent` decorator declares host directives.
 *
 * @param decorator - The decorator.
 * @returns `true` when it lists at least one in an array literal.
 */
export function hasHostDirectives(decorator: WebComponentDecorator): boolean {
  return !!readHostDirectives(decorator)?.length;
}

/**
 * Checks the host directives of a component, the ones of its ancestors included, as the runtime does when the class is
 * registered: the classes of the chain and their host directives are one, so a directive is declared once along the
 * chain, it declares the inputs and the events it exposes, an input is exposed with a name no input, no member of the
 * classes of the chain and no other exposed input has, since the component gets an accessor with that name, and an
 * event with a name no event of the component and no other exposed event has.
 *
 * @param sources - The decorators declaring the host directives of the component, the ones of its ancestors first.
 * @param component - The name of the class of the component, its properties and events (inherited ones included,
 *   exposed ones excluded) and the names of the members of its classes.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the directives are resolved.
 * @param extractBindings - Extracts the properties and the events of a directive.
 * @param report - Reports a problem: on the node of the exposure or of the directive when the component declares it,
 *   `undefined` when an ancestor does.
 * @throws If two properties of a directive resolve to the same name.
 */
export function checkHostDirectives(sources: readonly HostDirectiveSource[], component: Pick<ComponentMetadata, 'className' | 'properties' | 'events'> & { members: ReadonlySet<string> }, compilerOptions: CompilerOptions | undefined, extractBindings: ExtractBindings, report: (message: string, node: Node | undefined) => void): void {
  const { className, properties, events, members } = component;
  const declared = new Set<Node>();
  const inputs = new Set<string>();
  const outputs = new Set<string>();
  for (let i = 0; i < sources.length; i++) {
    const { sourceFile, decorator, own } = sources[i];
    const directives = readHostDirectives(decorator);
    if (!directives?.length) {
      continue;
    }

    for (let j = 0; j < directives.length; j++) {
      const { directive, properties: dirProperties, events: dirEvents } = directives[j];
      const resolved = resolveClassReference(sourceFile, directive, compilerOptions);
      if (!resolved) {
        continue;
      }

      const directiveName = resolved.declaration.name?.text;
      if (declared.has(resolved.declaration)) {
        report(`${className} declares the host directive ${directiveName} more than once`, own ? directive : undefined);
        continue;
      }

      declared.add(resolved.declaration);
      const exposed = dirProperties?.length || dirEvents?.length ? extractBindings(resolved) : undefined;
      if (!exposed) {
        continue;
      }

      if (dirProperties?.length) {
        for (let k = 0; k < dirProperties.length; k++) {
          const { name, alias, node } = dirProperties[k];
          const message = describeInputConflict(exposed.properties.has(name), name, alias, className, directiveName, properties.has(alias) || inputs.has(alias), members.has(alias));
          if (message) {
            report(message, own ? node : undefined);
          }

          inputs.add(alias);
        }
      }

      if (dirEvents?.length) {
        for (let k = 0; k < dirEvents.length; k++) {
          const { name, alias, node } = dirEvents[k];
          if (!exposed.events.has(name)) {
            report(`${directiveName} does not declare an event named "${name}"`, own ? node : undefined);
          } else if (events.has(alias) || outputs.has(alias)) {
            report(`${className} already has an event named "${alias}", which ${directiveName} cannot expose`, own ? node : undefined);
          }

          outputs.add(alias);
        }
      }
    }
  }
}

/**
 * Describes why an input of a host directive cannot be exposed, with the messages of the runtime.
 *
 * @param declared - Whether the directive declares the input.
 * @param name - The name of the input in the directive.
 * @param alias - The name it is exposed with.
 * @param className - The name of the class of the component.
 * @param directiveName - The name of the class of the directive.
 * @param input - Whether the component, or another host directive, already has an input with the name.
 * @param member - Whether a class of the chain of the component has a member with the name.
 * @returns The message, `undefined` when the input can be exposed.
 */
function describeInputConflict(declared: boolean, name: string, alias: string, className: string, directiveName: string | undefined, input: boolean, member: boolean): string | undefined {
  if (!declared) {
    return `${directiveName} does not declare an input named "${name}"`;
  }

  if (input) {
    return `${className} already has an input named "${alias}", which ${directiveName} cannot expose`;
  }

  return member ? `${className} already has a member named "${alias}", which ${directiveName} cannot expose as an input` : undefined;
}

/**
 * Reads the `hostDirectives` of a `@WebComponent` decorator: each one is the class of the directive, or an object literal
 * with its class (`directive`) and the properties and events it exposes.
 *
 * @param decorator - The `@WebComponent` decorator to read.
 * @returns The host directives, `undefined` when the decorator declares none as an array literal, or its options are not
 *   an object literal.
 */
function readHostDirectives(decorator: WebComponentDecorator): HostDirectiveDeclaration[] | undefined {
  const options = decorator.expression.arguments[0];
  const list = options && isObjectLiteralExpression(options) ? getOptionExpression(options, 'hostDirectives') : undefined;
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
      exposures.push({ name: element.text, alias: element.text, node: element });
    } else if (isObjectLiteralExpression(element)) {
      const name = getOptionExpression(element, 'name');
      const alias = getOptionExpression(element, 'alias');
      if (name && alias && isStringLiteralLike(name) && isStringLiteralLike(alias)) {
        exposures.push({ name: name.text, alias: alias.text, node: element });
      }
    }
  }

  return exposures;
}
