import { slice } from '@xaendar/common';
import { ClassDeclaration, ClassElement, Decorator, Expression, getDecorators, getNameOfDeclaration, Identifier, isCallExpression, isClassDeclaration, isDecorator, isIdentifier, isObjectLiteralExpression, isPropertyAccessExpression, isPropertyAssignment, isPropertyDeclaration, isStringLiteral, isTypeReferenceNode, ModifierLike, NodeArray, PropertyAssignment, PropertyDeclaration, SourceFile, Statement, StringLiteral, SyntaxKind, TypeNode } from 'typescript';
import { ComponentEventMetadata, ComponentMetadata } from '../../types/component-metadata/component-metadata.type';
import { DirectiveMetadata } from '../../types/directive-metadata.type';
import { ClassDeclarationWithName, DirectiveDecorator, EventDecorator, PropertyDecorator, WebComponentDecorator } from '../../types/typescript-decorator-nodes.type';
import { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import { Span } from '../../types/span.type';

/**
 * Represents a component property with metadata from @Property decorator.
 */
class ComponentPropertyMetadataWishSpan extends ComponentPropertyMetadata {
  /**
   * Creates an instance of ComponentPropertyMetadataWishSpan.
   * @param span The span information for the property in the source file.
   * @param name The name of the property.
   * @param type The type of the property.
   * @param options Additional options for the property, such as whether it is required or has an alias.
   */
  constructor(public span: Span, name: string, type: string, options?: { required?: boolean, alias?: string }) {
    super(name, type, options);
  }
}

/**
 * Class decorators identifying the classes metadata are extracted from.
 */
type ClassDecoratorNode = WebComponentDecorator | DirectiveDecorator;

/**
 * Extracts component metadata from a source file by parsing decorators.
 * By default, it reads the source file and extracts metadata for the specified component class.
 *
 *
 * @param sourceFile - The source file declaring the components.
 * @returns The metadata of every component declared in the file, keyed by class name, or `undefined`
 *   if the `@WebComponent` decorator of a component doesn't declare a literal selector and template url.
 * @throws If two properties of a component resolve to the same name.
 */
export async function extractComponentsMetadataFromSourceFile(sourceFile: SourceFile): Promise<Map<string, ComponentMetadata> | undefined> {
  const metadatas = new Map<string, ComponentMetadata>();

  const declarations = getDecoratedClassDeclarations<WebComponentDecorator>(sourceFile, 'WebComponent');
  for (let i = 0; i < declarations.length; i++) {
    const { klass, decorator } = declarations[i];
    const { selector, styleUrl, templateUrl } = extractMetadaFromDecorator(decorator);
    if (!selector || !templateUrl) {
      return;
    }

    const className = klass.name.text;
    metadatas.set(className, {
      type: 'component',
      className,
      selector,
      styleUrl,
      templateUrl,
      ...extractBindingsMetadata(klass.members, sourceFile, 'component'),
      typescriptNodes: declarations[i]
    });
  }

  return metadatas;
}

/**
 * Extracts directive metadata from a source file by parsing decorators.
 *
 * @param sourceFile - The source file declaring the directives.
 * @returns The metadata of every directive declared in the file, keyed by class name, or `undefined`
 *   if the `@Directive` decorator of a directive doesn't declare a literal selector.
 * @throws If two properties of a directive resolve to the same name.
 */
export async function extractDirectivesMetadataFromSourceFile(sourceFile: SourceFile): Promise<Map<string, DirectiveMetadata> | undefined> {
  const metadatas = new Map<string, DirectiveMetadata>();

  const declarations = getDecoratedClassDeclarations<DirectiveDecorator>(sourceFile, 'Directive');
  for (let i = 0; i < declarations.length; i++) {
    const { klass, decorator } = declarations[i];
    const { selector } = extractMetadaFromDecorator(decorator);
    if (!selector) {
      return;
    }

    const className = klass.name.text;
    metadatas.set(className, {
      type: 'directive',
      className,
      selector,
      ...extractBindingsMetadata(klass.members, sourceFile, 'directive'),
      typescriptNodes: declarations[i]
    });
  }

  return metadatas;
}

/**
 * Extracts the metadata of the `@Property` and `@Event` accessors declared by a component or a directive.
 *
 * @param members - The members of the class declaring the accessors.
 * @param sourceFile - The source file declaring the class, used in the error messages.
 * @param kind - Whether the class is a component or a directive, used in the error messages.
 * @returns The properties, keyed by their alias or name, and the events, keyed by name.
 * @throws If two properties resolve to the same name.
 */
function extractBindingsMetadata(members: NodeArray<ClassElement>, sourceFile: SourceFile, kind: ComponentMetadata['type'] | DirectiveMetadata['type']): Pick<ComponentMetadata, 'properties' | 'events'> {
  const properties = new Map<string, ComponentPropertyMetadataWishSpan>();
  const events = new Map<string, ComponentEventMetadata>();

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (!isPropertyDeclaration(member)) {
      continue;
    }

    // Look for decorators in modifiers (TypeScript stores them there)
    const memberModifiers = member.modifiers ?? [];

    let required = false;
    const propDecorator = Array.from(memberModifiers).find((member): member is PropertyDecorator => {
      const result = isPropertyDecorator(member);
      required = !!result.required;
      return result.decorator
    });

    if (propDecorator) {
      const nameNode = getNameOfDeclaration(member);
      if (nameNode && isIdentifier(nameNode)) {
        const propName = nameNode.text;
        const metadata = extractPropertyMetadata(member, nameNode, propName, propDecorator, required);
        const actualPropName = metadata.alias ?? propName;
        const conflictingProperty = properties.get(actualPropName);
        if (!conflictingProperty) {
          properties.set(actualPropName, metadata);
        } else {
          const { start, end } = conflictingProperty.span;
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
          const { fileName, text } = sourceFile;
          throw `Failed to extract metadata from an imported ${kind} in the template - ${fileName}\n[Ln ${line + 1}, Col ${character + 1}] - A property identified by name ${actualPropName} was already defined\n ---> ${slice(text, start - character, end)}`;
        }
      }

      continue;
    }

    const eventDecorator = Array.from(memberModifiers).find(member => isEventDecorator(member));
    if (eventDecorator) {
      const nameNode = getNameOfDeclaration(member);
      const eventName = nameNode && isIdentifier(nameNode) ? nameNode.text : undefined;
      if (eventName) {
        events.set(eventName, extractEventMetadata(eventDecorator));
      }
    }
  }

  const mappedProperties = new Map<string, ComponentPropertyMetadata>();
  properties.entries().forEach(([propName, { name, type, required, alias, defaultValue }]) => mappedProperties.set(propName, new ComponentPropertyMetadata(name, type, { required, alias, defaultValue })));

  return {
    properties: mappedProperties,
    events
  };
}

/**
 * Finds the named class declarations of a source file decorated with the given class decorator.
 *
 * @param sourceFile - TypeScript source file that contains the class declarations to inspect.
 * @param decoratorName - Name of the class decorator to look for (e.g. `WebComponent`).
 * @returns The matching class declarations, each with its decorator.
 */
function getDecoratedClassDeclarations<D extends ClassDecoratorNode>(sourceFile: SourceFile, decoratorName: D['expression']['expression']['text']): { klass: ClassDeclarationWithName, decorator: D }[] {
  const found = new Array<{ klass: ClassDeclarationWithName, decorator: D }>();
  const statements = sourceFile.statements;

  for (let i = 0; i < statements.length; i++) {
    const node = statements[i];
    if (classDeclarationHasName(node)) {
      const decorator = findClassDecorator<D>(node, decoratorName);
      if (decorator) {
        found.push({ klass: node, decorator });
      }
    }
  }

  return found;
}

/**
 * Tells whether a statement is a class declaration with a name.
 *
 * @param node - The statement to inspect.
 * @returns `true` if the statement declares a named class, `false` otherwise.
 */
function classDeclarationHasName(node: Statement): node is ClassDeclarationWithName {
  return isClassDeclaration(node) && !!node.name?.text;
}

/**
 * Finds the call decorator with the given name applied to a class declaration.
 *
 * Supports both direct usage (`@WebComponent(...)`) and namespaced usage (`@xaendar.WebComponent(...)`).
 *
 * @param classDecl - Class declaration whose decorators should be inspected.
 * @param decoratorName - Name of the decorator to look for.
 * @returns The matching decorator node, or `undefined` when the class is not decorated with it.
 */
function findClassDecorator<D extends ClassDecoratorNode>(classDecl: ClassDeclaration, decoratorName: D['expression']['expression']['text']): D | undefined {
  const decorators = getDecorators(classDecl);
  if (!decorators?.length) {
    return undefined;
  }

  let i = 0;
  let found: D | undefined;

  while (i < decorators.length && !found) {
    const decorator = decorators[i];
    if (!isCallExpression(decorator.expression)) {
      i++;
      continue;
    }

    const callExpression = decorator.expression;
    // supports a namespaced usage too, e.g. @xaendar.WebComponent(...)
    const callee = isPropertyAccessExpression(callExpression.expression) ? callExpression.expression.name : callExpression.expression;
    const isSearchedDecorator = (_decorator: Decorator): _decorator is D => isIdentifier(callee) && callee.text === decoratorName;

    if (isSearchedDecorator(decorator)) {
      found = decorator;
    }

    i++;
  }

  return found;
}

/**
 * Extracts the selector, template and style urls from @WebComponent or @Directive decorator arguments.
 * Directives only declare a selector.
 *
 * @example
 * @WebComponent({ selector: 'my-button', templateUrl: './my-button.xd.component.html' })
 *
 * @param decorator - The decorator node to read the arguments from.
 * @returns The literal values declared by the decorator, empty when missing or not literal.
 */
function extractMetadaFromDecorator(decorator: ClassDecoratorNode): Pick<ComponentMetadata, 'selector' | 'templateUrl' | 'styleUrl'> {
  const retVal: ReturnType<typeof extractMetadaFromDecorator> = {
    selector: '',
    templateUrl: '',
    styleUrl: undefined,
  };

  try {
    const args = decorator.expression.arguments;
    if (args.length === 0) {
      return retVal;
    }

    const arg = args[0];
    // Expect an object literal: { selector: '...' }
    if (!arg || !isObjectLiteralExpression(arg)) {
      return retVal;
    }

    for (let i = 0; i < arg.properties.length; i++) {
      const prop = arg.properties[i];
      if (isPropertyAssignment(prop) && isIdentifier(prop.name)) {
        switch (prop.name.text) {
          case 'selector':
            retVal.selector = isStringLiteral(prop.initializer) ? prop.initializer.text : '';
            break;
          case 'templateUrl':
            retVal.templateUrl = isStringLiteral(prop.initializer) ? prop.initializer.text : '';
            break;
          case 'styleUrl':
            retVal.styleUrl = isStringLiteral(prop.initializer) ? prop.initializer.text : undefined;
            break;
        }
      }
    }

    return retVal;
  } catch {
    return retVal;
  }
}

/**
 * Checks if a modifier is a @Property decorator.
 */
function isPropertyDecorator(modifier: ModifierLike): { decorator: boolean, required?: true } {
  if (!isDecorator(modifier)) {
    return {
      decorator: false
    }
  }

  const expr = modifier.expression;
  if (!isCallExpression(expr)) {
    return {
      decorator: false
    }
  }

  const subExpr = expr.expression

  // @Property(...
  if (isIdentifier(subExpr) && subExpr.text === 'Property') {
    return {
      decorator: true,
    }
  }

  // @Property.required(...
  if (isPropertyAccessExpression(subExpr) && isIdentifier(subExpr.expression) && subExpr.expression.text === 'Property' && subExpr.name.text === 'required') {
    return {
      decorator: true,
      required: true
    }
  }

  return {
    decorator: false
  }
}

/**
 * Extracts property metadata from @Property or @Property.required decorator.
 */
function extractPropertyMetadata(property: PropertyDeclaration, nameNode: Identifier, name: string, decorator: PropertyDecorator, required: boolean): ComponentPropertyMetadataWishSpan {
  // Property decorators are always call expressions (`@Property(...)`, `@Property.required(...)`)
  const args = decorator.expression.arguments;
  /*
    In case of duplicate @Property names (alias and propName or alias and alias)
    We need to store the span where the propName is present, if an alias is declared
    these values will be overwritten
  */
  const metadata = new ComponentPropertyMetadataWishSpan({ start: nameNode.getStart(), end: nameNode.getEnd() }, name, extractGenericArgument(property.type));
  metadata.required = required;

  let options: Expression;

  if (!required) {
    metadata.defaultValue = args[0]?.getText();
    options = args[1];
  } else {
    options = args[0];
  }

  if (args.length) {
    const aliasNode = options && isObjectLiteralExpression(options) && options?.properties?.find((prop): prop is Omit<PropertyAssignment, 'initializer'> & { initializer: StringLiteral } => isPropertyAssignment(prop) && isIdentifier(prop.name) && prop.name.text === 'alias' && isStringLiteral(prop.initializer));
    if (aliasNode) {
      const initializer = aliasNode.initializer;
      metadata.alias = initializer.text;
      metadata.span = {
        start: initializer.getStart(),
        end: initializer.getEnd()
      };
    }
  }

  return metadata
}

/**
 * Checks if a modifier is an @Event decorator.
 */
function isEventDecorator(modifier: ModifierLike): modifier is EventDecorator {
  if (modifier.kind !== SyntaxKind.Decorator) {
    return false;
  }

  const expr = isCallExpression(modifier.expression) ? modifier.expression.expression : modifier.expression;
  return isIdentifier(expr) && expr.text === 'Event';
}

/**
 * Extracts event metadata from @Event decorator.
 */
function extractEventMetadata(decorator: EventDecorator): ComponentEventMetadata {
  // Event decorators are always applied to property declarations
  return {
    type: extractGenericArgument(decorator.parent.type, true)
  };
}

/**
 * Given a TypeNode like Output<boolean>, returns "boolean".
 * If there's no generic argument, returns "void".
 */
function extractGenericArgument(typeNode: TypeNode | undefined, event = false): string {
  const defaultValue = event ? 'void' : 'any';

  /*
    If no type has been provided we assume it's 
    - Void for Events
    - any for Properties
  */
  if (!typeNode || !isTypeReferenceNode(typeNode)) {
    return defaultValue;
  }

  // No generics
  const typeArgs = typeNode.typeArguments;
  if (!typeArgs || typeArgs.length === 0) {
    return defaultValue;
  }

  return typeArgs[0].getText();
}