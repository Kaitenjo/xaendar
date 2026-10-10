import { slice } from '@xaendar/common';
import { ClassDeclaration, CompilerOptions, Decorator, getDecorators, getNameOfDeclaration, Identifier, isCallExpression, isClassDeclaration, isDecorator, isIdentifier, isObjectLiteralExpression, isPropertyAccessExpression, isPropertyAssignment, isPropertyDeclaration, isStringLiteral, isTypeReferenceNode, ModifierLike, PropertyAssignment, PropertyDeclaration, SourceFile, Statement, StringLiteral, SyntaxKind } from 'typescript';
import { ComponentEventMetadata, ComponentMetadata } from '../../types/component-metadata/component-metadata.type';
import { DirectiveMetadata } from '../../types/directive-metadata.type';
import { ClassDeclarationWithName, DirectiveDecorator, EventDecorator, PropertyDecorator, WebComponentDecorator } from '../../types/typescript-decorator-nodes.type';
import { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import { Span } from '../../types/span.type';
import { resolveBaseClassOf } from '../resolve-declaration/resolve-declaration.utils';
import type { ResolvedClass } from '../resolve-declaration/types/resolved-class.type';

/**
 * Represents a component property with metadata from @Property decorator.
 */
class ComponentPropertyMetadataWishSpan extends ComponentPropertyMetadata {
  /**
   * Creates an instance of ComponentPropertyMetadataWishSpan.
   * @param span The span information for the property in the source file.
   * @param sourceFile The source file declaring the property: the class itself, or one of its base classes.
   * @param name The name of the property.
   * @param type The type of the property.
   * @param options Additional options for the property, such as whether it is required or has an alias.
   */
  constructor(public span: Span, public sourceFile: SourceFile, name: string, type: string, options?: { required?: boolean, alias?: string }) {
    super(name, type, options);
  }
}

/**
 * The `@Property` and `@Event` accessors of a class collected so far, own and inherited.
 */
type CollectedBindings = {
  /**
   * The properties, keyed by their alias or name.
   */
  readonly properties: Map<string, ComponentPropertyMetadataWishSpan>;
  /**
   * The events, keyed by name.
   */
  readonly events: Map<string, ComponentEventMetadata>;
};

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
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns The metadata of every component declared in the file, keyed by class name, or `undefined`
 *   if the `@WebComponent` decorator of a component doesn't declare a literal selector and template url.
 * @throws If two properties of a component resolve to the same name.
 */
export async function extractComponentsMetadataFromSourceFile(sourceFile: SourceFile, compilerOptions?: CompilerOptions): Promise<Map<string, ComponentMetadata> | undefined> {
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
      ...extractBindingsMetadata(klass, sourceFile, 'component', compilerOptions),
      typescriptNodes: declarations[i]
    });
  }

  return metadatas;
}

/**
 * Extracts directive metadata from a source file by parsing decorators.
 *
 * @param sourceFile - The source file declaring the directives.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns The metadata of every directive declared in the file, keyed by class name, or `undefined`
 *   if the `@Directive` decorator of a directive doesn't declare a literal selector.
 * @throws If two properties of a directive resolve to the same name.
 */
export async function extractDirectivesMetadataFromSourceFile(sourceFile: SourceFile, compilerOptions?: CompilerOptions): Promise<Map<string, DirectiveMetadata> | undefined> {
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
      ...extractBindingsMetadata(klass, sourceFile, 'directive', compilerOptions),
      typescriptNodes: declarations[i]
    });
  }

  return metadatas;
}

/**
 * Extracts the metadata of the `@Property` and `@Event` accessors of a component or a directive, inherited ones included.
 *
 * @param klass - The class declaring the accessors.
 * @param sourceFile - The source file declaring the class, used in the error messages and to reference the types of the accessors.
 * @param kind - Whether the class is a component or a directive, used in the error messages.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns The properties, keyed by their alias or name, and the events, keyed by name.
 * @throws If two properties resolve to the same name.
 */
function extractBindingsMetadata(klass: ClassDeclarationWithName, sourceFile: SourceFile, kind: ComponentMetadata['type'] | DirectiveMetadata['type'], compilerOptions: CompilerOptions | undefined): Pick<ComponentMetadata, 'properties' | 'events'> {
  // Inherited accessors are referenced through the class too: its type exposes them, even when the base class isn't exported
  const accessorOwner = getAccessorOwnerType(klass, sourceFile);
  const bindings: CollectedBindings = { properties: new Map(), events: new Map() };
  collectBindingsMetadata({ sourceFile, declaration: klass }, kind, accessorOwner, compilerOptions, new Set([klass]), bindings);

  const mappedProperties = new Map<string, ComponentPropertyMetadata>();
  bindings.properties.entries().forEach(([propName, { name, type, required, alias }]) => mappedProperties.set(propName, new ComponentPropertyMetadata(name, type, { required, alias })));

  return {
    properties: mappedProperties,
    events: bindings.events
  };
}

/**
 * Collects the `@Property` and `@Event` accessors of a class, walking its inheritance chain: the accessors of
 * the base classes first, so that an accessor declared again by a subclass overrides the inherited one.
 *
 * Base classes that can't be resolved are skipped, like those declared in `.d.ts` files, which carry no decorators.
 *
 * @param klass - The class to collect the accessors of, with the file declaring it.
 * @param kind - Whether the class is a component or a directive, used in the error messages.
 * @param accessorOwner - The type of the class the metadata are extracted for, as referenced from any file (see {@link getAccessorOwnerType}).
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @param visitedClasses - Classes already walked, to stop on circular inheritance.
 * @param bindings - The accessors collected so far, filled in place.
 * @throws If two properties resolve to the same name.
 */
function collectBindingsMetadata(klass: ResolvedClass, kind: ComponentMetadata['type'] | DirectiveMetadata['type'], accessorOwner: string, compilerOptions: CompilerOptions | undefined, visitedClasses: Set<ClassDeclaration>, bindings: CollectedBindings): void {
  const base = resolveBaseClassOf(klass, compilerOptions);
  if (base && !visitedClasses.has(base.declaration)) {
    visitedClasses.add(base.declaration);
    collectBindingsMetadata(base, kind, accessorOwner, compilerOptions, visitedClasses, bindings);
  }

  collectOwnBindingsMetadata(klass, kind, accessorOwner, bindings);
}

/**
 * Collects the `@Property` and `@Event` accessors declared by a class itself.
 *
 * @param klass - The class declaring the accessors, with the file declaring it.
 * @param kind - Whether the class is a component or a directive, used in the error messages.
 * @param accessorOwner - The type of the class the metadata are extracted for, as referenced from any file (see {@link getAccessorOwnerType}).
 * @param bindings - The accessors collected so far, filled in place.
 * @throws If two properties resolve to the same name.
 */
function collectOwnBindingsMetadata({ sourceFile, declaration }: ResolvedClass, kind: ComponentMetadata['type'] | DirectiveMetadata['type'], accessorOwner: string, { properties, events }: CollectedBindings): void {
  const members = declaration.members;

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
        // An accessor declared again overrides the inherited one, whatever their aliases
        const overridden = properties.entries().find(([, property]) => property.name === propName);
        if (overridden) {
          properties.delete(overridden[0]);
        }

        const metadata = extractPropertyMetadata(member, nameNode, propName, propDecorator, required, accessorOwner, sourceFile);
        const actualPropName = metadata.alias ?? propName;
        const conflictingProperty = properties.get(actualPropName);
        if (!conflictingProperty) {
          properties.set(actualPropName, metadata);
        } else {
          const { span: { start, end }, sourceFile: conflictingSourceFile } = conflictingProperty;
          const { line, character } = conflictingSourceFile.getLineAndCharacterOfPosition(start);
          const { fileName, text } = conflictingSourceFile;
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
        events.set(eventName, extractEventMetadata(member, eventName, accessorOwner));
      }
    }
  }
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
 *
 * @param property - The accessor decorated with `@Property`.
 * @param nameNode - The name of the accessor.
 * @param name - The text of the name of the accessor.
 * @param decorator - The `@Property` decorator of the accessor.
 * @param required - Whether the decorator is `@Property.required`.
 * @param accessorOwner - The type of the class the metadata are extracted for, which declares or inherits the accessor, as referenced from any file (see {@link getAccessorOwnerType}).
 * @param sourceFile - The source file declaring the accessor.
 * @returns The metadata of the property, with the span of its name or of its alias.
 */
function extractPropertyMetadata(property: PropertyDeclaration, nameNode: Identifier, name: string, decorator: PropertyDecorator, required: boolean, accessorOwner: string, sourceFile: SourceFile): ComponentPropertyMetadataWishSpan {
  // Property decorators are always call expressions (`@Property(...)`, `@Property.required(...)`)
  const args = decorator.expression.arguments;
  /*
    In case of duplicate @Property names (alias and propName or alias and alias)
    We need to store the span where the propName is present, if an alias is declared
    these values will be overwritten
  */
  const metadata = new ComponentPropertyMetadataWishSpan({ start: nameNode.getStart(), end: nameNode.getEnd() }, sourceFile, name, extractBindingType(property, name, accessorOwner, false));
  metadata.required = required;

  if (args.length) {
    const options = required ? args[0] : args[1];
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
 *
 * @param event - The accessor decorated with `@Event`.
 * @param name - The name of the accessor.
 * @param accessorOwner - The type of the class the metadata are extracted for, which declares or inherits the accessor, as referenced from any file (see {@link getAccessorOwnerType}).
 * @returns The metadata of the event.
 */
function extractEventMetadata(event: PropertyDeclaration, name: string, accessorOwner: string): ComponentEventMetadata {
  return {
    type: extractBindingType(event, name, accessorOwner, true)
  };
}

/**
 * References the type of a class from any file, through an `import()` type of the file declaring it.
 *
 * @param klass - The class to reference.
 * @param sourceFile - The source file declaring the class.
 * @returns The type of the instances of the class, e.g. `import('/src/x.xd.component').XComponent`.
 */
function getAccessorOwnerType(klass: ClassDeclarationWithName, sourceFile: SourceFile): string {
  const modulePath = sourceFile.fileName.replaceAll('\\', '/').replace(/\.ts$/, '');
  return `import('${modulePath}').${klass.name.text}`;
}

/**
 * Builds the type of the value carried by a `@Property` or `@Event` accessor: the `T` of `InputSignal<T>` or `Output<T>`.
 *
 * The type is not copied as written: the templates binding the accessor are type-checked in other files, where the
 * names it uses (imported aliases, types local to its file) do not exist. It is referenced instead through the accessor
 * of its class, so that TypeScript resolves it in the scope of the file declaring it, however deep its type graph goes.
 *
 * @example
 * // @Property('ts') accessor lang!: InputSignal<CodeLang>;
 * ReturnType<import('/src/x.xd.component').XComponent['lang']>
 * // @Event() accessor picked!: Output<Item>;
 * (import('/src/x.xd.component').XComponent['picked'] extends import('@xaendar/core').Output<infer Value> ? Value : never)
 *
 * @param member - The decorated accessor.
 * @param name - The name of the accessor.
 * @param accessorOwner - The type of the class the metadata are extracted for, which declares or inherits the accessor, as referenced from any file (see {@link getAccessorOwnerType}).
 * @param event - Whether the accessor is an `@Event`.
 * @returns The type of the value, `any` for a property and `void` for an event when the accessor declares no type argument.
 */
function extractBindingType(member: PropertyDeclaration, name: string, accessorOwner: string, event: boolean): string {
  const defaultValue = event ? 'void' : 'any';
  const typeNode = member.type;
  if (!typeNode || !isTypeReferenceNode(typeNode) || !typeNode.typeArguments?.length) {
    return defaultValue;
  }

  const accessor = `${accessorOwner}['${name}']`;
  if (!event) {
    return `ReturnType<${accessor}>`;
  }

  // An explicit `Output<void>` emits no payload, like an `Output` without a type argument
  return typeNode.typeArguments[0].kind === SyntaxKind.VoidKeyword ? defaultValue : `(${accessor} extends import('@xaendar/core').Output<infer Value> ? Value : never)`;
}