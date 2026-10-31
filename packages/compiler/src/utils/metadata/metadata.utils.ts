import { slice } from '@xaendar/common';
import { ClassDeclaration, CompilerOptions, Decorator, EntityName, forEachChild, getDecorators, getNameOfDeclaration, Identifier, isArrowFunction, isCallExpression, isClassDeclaration, isDecorator, isEnumDeclaration, isFunctionExpression, isIdentifier, isImportDeclaration, isInterfaceDeclaration, isMethodDeclaration, isNamedImports, isNamespaceImport, isObjectLiteralExpression, isPropertyAccessExpression, isPropertyAssignment, isPropertyDeclaration, isQualifiedName, isShorthandPropertyAssignment, isStringLiteral, isTypeAliasDeclaration, isTypeReferenceNode, ModifierLike, Node, ObjectLiteralExpression, PropertyAssignment, PropertyDeclaration, SourceFile, Statement, StringLiteral, SyntaxKind, TypeNode } from 'typescript';
import { ComponentMetadata } from '../../types/component-metadata.type';
import type { ComponentEventMetadata } from '../../types/component-event-metadata.type';
import type { ClassTypeParameter } from '../../types/class-type-parameter.type';
import { DirectiveMetadata } from '../../types/directive-metadata.type';
import type { DirectiveDecorator } from '../../types/typescript-decorator-nodes/directive-decorator.type';
import type { EventDecorator } from '../../types/typescript-decorator-nodes/event-decorator.type';
import type { PropertyDecorator } from '../../types/typescript-decorator-nodes/property-decorator.type';
import type { WebComponentDecorator } from '../../types/typescript-decorator-nodes/web-component-decorator.type';
import type { ClassDeclarationWithName } from '../../types/typescript-decorator-nodes/class-declaration-with-name.type';
import { ComponentPropertyMetadataWithSpan } from '../../models/component-property-metadata-with-span/component-property-metadata-with-span.model';
import { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import type { MemberDeclaration } from '../../types/member-declaration.type';
import { Span } from '../../types/span.type';
import { addHostDirectiveBindings } from '../host-directives/host-directives.utils';
import { resolveBaseClassOf } from '../resolve-declaration/resolve-declaration.utils';
import type { ResolvedClass } from '../../types/resolved-class.type';
import type { CollectedBindings } from '../../types/collected-bindings.type';
import type { ClassDecoratorNode } from '../../types/class-decorator-node.type';

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
    const bindings = extractBindingsMetadata(klass, sourceFile, 'component', compilerOptions);
    addHostDirectiveBindings(bindings, decorator, sourceFile, compilerOptions, ({ declaration, sourceFile: directiveFile }) => classDeclarationHasName(declaration) ? extractBindingsMetadata(declaration, directiveFile, 'directive', compilerOptions) : undefined);
    const metadata: ComponentMetadata = {
      type: 'component',
      className,
      selector,
      styleUrl,
      templateUrl,
      ...bindings,
      typescriptNodes: declarations[i]
    };

    const typeParameters = extractTypeParameters(klass);
    if (typeParameters) {
      metadata.typeParameters = typeParameters;
    }

    metadatas.set(className, metadata);
  }

  return metadatas;
}

/**
 * Finds the `@WebComponent` declarations of a source file that the plugin cannot compile, as it reads them
 * from the source code: a component declared in a file not following the component convention, or whose
 * `selector`, `templateUrl` or `styleUrl` is not a string literal (`selector` and `templateUrl` are required).
 *
 * @param sourceFile - The source file declaring the components.
 * @param componentFile - Whether the file follows the component convention (`.xd.component.ts`).
 * @returns One message per component or option that cannot be compiled, or `undefined` when there is none.
 */
export function findWebComponentErrors(sourceFile: SourceFile, componentFile: boolean): string[] | undefined {
  let errors: string[] | undefined;

  const declarations = getDecoratedClassDeclarations<WebComponentDecorator>(sourceFile, 'WebComponent');
  for (let i = 0; i < declarations.length; i++) {
    const { klass, decorator } = declarations[i];
    const className = klass.name.text;
    if (!componentFile) {
      (errors ??= []).push(`${className} must be declared in a file ending with .xd.component.ts`);
      continue;
    }

    const options = decorator.expression.arguments[0];
    if (!options || !isObjectLiteralExpression(options)) {
      (errors ??= []).push(`The options of @WebComponent in ${className} must be an object literal`);
      continue;
    }

    let selector = false;
    let templateUrl = false;
    for (let j = 0; j < options.properties.length; j++) {
      const property = options.properties[j];
      if (!(isPropertyAssignment(property) || isShorthandPropertyAssignment(property)) || !isIdentifier(property.name)) {
        continue;
      }

      const name = property.name.text;
      switch (name) {
        case 'selector':
          selector = true;
          break;
        case 'templateUrl':
          templateUrl = true;
          break;
        case 'styleUrl':
          break;
        default:
          continue;
      }

      // A shorthand property ({ selector }) reads a variable
      if (!isPropertyAssignment(property) || !isStringLiteral(property.initializer)) {
        (errors ??= []).push(`The ${name} option of ${className} must be a string literal`);
      }
    }

    if (!selector) {
      (errors ??= []).push(`The selector option of ${className} must be a string literal`);
    }
    if (!templateUrl) {
      (errors ??= []).push(`The templateUrl option of ${className} must be a string literal`);
    }
  }

  return errors;
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
    const metadata: DirectiveMetadata = {
      type: 'directive',
      className,
      selector,
      ...extractBindingsMetadata(klass, sourceFile, 'directive', compilerOptions),
      typescriptNodes: declarations[i]
    };
    const typeParameters = extractTypeParameters(klass);
    if (typeParameters) {
      metadata.typeParameters = typeParameters;
    }

    metadatas.set(className, metadata);
  }

  return metadatas;
}

/**
 * Extracts the type parameters of the class of a component or of a directive.
 *
 * @param klass - The class declaration.
 * @returns The name of each type parameter and whether it has a default type, `undefined` when the class is not generic.
 */
function extractTypeParameters(klass: ClassDeclarationWithName): ClassTypeParameter[] | undefined {
  if (!klass.typeParameters?.length) {
    return undefined;
  }

  return klass.typeParameters.map(({ name, default: defaultType }) => ({ name: name.text, hasDefault: !!defaultType }));
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
  const accessorOwner = getAccessorOwnerType(klass, sourceFile, true);
  const bindings: CollectedBindings = { properties: new Map(), events: new Map() };
  collectBindingsMetadata({ sourceFile, declaration: klass }, kind, accessorOwner, compilerOptions, new Set([klass]), bindings);

  const mappedProperties = new Map<string, ComponentPropertyMetadata>();
  for (const [propName, { name, type, required, alias, declaration }] of bindings.properties.entries()) {
    mappedProperties.set(propName, new ComponentPropertyMetadata(name, type, { required, alias, declaration }));
  }

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
    const memberModifiers = member.modifiers;
    if (!memberModifiers?.length) {
      continue;
    }

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
      if (nameNode && isIdentifier(nameNode)) {
        const eventName = nameNode.text;
        events.set(eventName, extractEventMetadata(member, eventName, accessorOwner, toMemberDeclaration(nameNode, sourceFile)));
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
 * \@WebComponent({ selector: 'my-button', templateUrl: './my-button.xd.component.html' })
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
function extractPropertyMetadata(property: PropertyDeclaration, nameNode: Identifier, name: string, decorator: PropertyDecorator, required: boolean, accessorOwner: string, sourceFile: SourceFile): ComponentPropertyMetadataWithSpan {
  // Property decorators are always call expressions (`@Property(...)`, `@Property.required(...)`)
  const args = decorator.expression.arguments;
  /*
    In case of duplicate @Property names (alias and propName or alias and alias)
    We need to store the span where the propName is present, if an alias is declared
    these values will be overwritten
  */
  const metadata = new ComponentPropertyMetadataWithSpan({ start: nameNode.getStart(), end: nameNode.getEnd() }, sourceFile, name, extractBindingType(property, name, accessorOwner, false));
  metadata.required = required;
  metadata.declaration = toMemberDeclaration(nameNode, sourceFile);

  if (args.length) {
    const options = required ? args[0] : args[1];
    const incomingType = options && isObjectLiteralExpression(options) ? findTransformIncomingType(decorator, options) : undefined;
    if (incomingType) {
      metadata.type = qualifyType(incomingType, sourceFile);
    }

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
 * Finds the type a property with a `transform` accepts from outside: the one the template must bind.
 *
 * It is, in order, the second type argument of the decorator (`@Property<InputSignal<number>, string>`), the annotation of
 * the parameter of the `transform`, or nothing, so that the type of the value of the signal is used.
 *
 * @param decorator - The `@Property` decorator.
 * @param options - The options object literal of the decorator.
 * @returns The type node of the incoming value, `undefined` if the property has no `transform` or no type is declared for it.
 */
function findTransformIncomingType(decorator: PropertyDecorator, options: ObjectLiteralExpression): TypeNode | undefined {
  const transform = options.properties.find(property => (isPropertyAssignment(property) || isMethodDeclaration(property)) && isIdentifier(property.name) && property.name.text === 'transform');
  if (!transform) {
    return undefined;
  }

  const typeArgument = decorator.expression.typeArguments?.[1];
  if (typeArgument) {
    return typeArgument;
  }

  const callback = isPropertyAssignment(transform) ? transform.initializer : transform;
  return isArrowFunction(callback) || isFunctionExpression(callback) || isMethodDeclaration(callback) ? callback.parameters[0]?.type : undefined;
}

/**
 * Writes a type as a template can reference it from another file: the names it uses, imported or declared in the file of
 * the property, become `import()` types of the module declaring them.
 *
 * @example
 * // import { Tag } from './tag.type'; transform: (tags: Tag[]) => ...
 * Tag[] -> import('/src/tag.type').Tag[]
 *
 * @param type - The type node, in `sourceFile`.
 * @param sourceFile - The source file declaring the property.
 * @returns The text of the type. Names found neither in the imports nor in the declarations of the file (globals, type parameters) stay as written.
 */
function qualifyType(type: TypeNode, sourceFile: SourceFile): string {
  const start = type.getStart(sourceFile);
  const replacements = new Array<{ start: number, end: number, text: string }>();
  const visit = (node: Node): void => {
    if (isTypeReferenceNode(node)) {
      let name: EntityName = node.typeName;
      while (isQualifiedName(name)) {
        name = name.left;
      }

      const qualifier = findTypeQualifier(name.text, sourceFile);
      if (qualifier) {
        // A reference through a namespace import (`ns.Tag`) only needs the namespace replaced
        const isNamespace = name !== node.typeName;
        replacements.push({ start: name.getStart(sourceFile) - start, end: name.getEnd() - start, text: isNamespace && qualifier.namespace ? `import('${qualifier.module}')` : `import('${qualifier.module}').${qualifier.name}` });
      }
    }
    forEachChild(node, visit);
  };
  visit(type);

  let text = type.getText(sourceFile);
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start: from, end, text: replacement } = replacements[i];
    text = `${text.slice(0, from)}${replacement}${text.slice(end)}`;
  }

  return text;
}

/**
 * Finds the module declaring a type name used in a file: the one it is imported from, or the file itself.
 *
 * @param name - The name used by the type.
 * @param sourceFile - The file using the name.
 * @returns The module, the name it exports and whether the name is a namespace import, `undefined` if the name is not declared in the file.
 */
function findTypeQualifier(name: string, sourceFile: SourceFile): { module: string, name: string, namespace: boolean } | undefined {
  const statements = sourceFile.statements;
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (isImportDeclaration(statement) && isStringLiteral(statement.moduleSpecifier)) {
      const module = resolveModuleSpecifier(statement.moduleSpecifier.text, sourceFile.fileName);
      const clause = statement.importClause;
      if (clause?.name?.text === name) {
        return { module, name: 'default', namespace: false };
      }

      const bindings = clause?.namedBindings;
      if (bindings && isNamespaceImport(bindings) && bindings.name.text === name) {
        return { module, name, namespace: true };
      }

      if (bindings && isNamedImports(bindings)) {
        const element = bindings.elements.find(({ name: localName }) => localName.text === name);
        if (element) {
          return { module, name: (element.propertyName ?? element.name).text, namespace: false };
        }
      }
    } else if ((isInterfaceDeclaration(statement) || isTypeAliasDeclaration(statement) || isClassDeclaration(statement) || isEnumDeclaration(statement)) && statement.name?.text === name) {
      return { module: sourceFile.fileName.replaceAll('\\', '/').replace(/\.ts$/, ''), name, namespace: false };
    }
  }

  return undefined;
}

/**
 * Resolves the specifier of an import, as written in a file, to the path to reference the module from any other file.
 *
 * @param specifier - The module specifier: a relative path, a package or an alias, the latter two left untouched.
 * @param fileName - The file containing the import.
 * @returns The absolute path of the module, without extension, for a relative specifier.
 */
function resolveModuleSpecifier(specifier: string, fileName: string): string {
  if (!specifier.startsWith('.')) {
    return specifier;
  }

  const segments = fileName.replaceAll('\\', '/').split('/');
  segments.pop();
  const parts = specifier.split('/');
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '..') {
      segments.pop();
    } else if (part !== '.') {
      segments.push(part);
    }
  }

  return segments.join('/').replace(/\.ts$/, '');
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
 * @param declaration - Where the accessor is declared.
 * @returns The metadata of the event.
 */
function extractEventMetadata(event: PropertyDeclaration, name: string, accessorOwner: string, declaration: MemberDeclaration): ComponentEventMetadata {
  return {
    type: extractBindingType(event, name, accessorOwner, true),
    declaration
  };
}

/**
 * Describes where a member is declared, from the node of its name.
 *
 * @param nameNode - The name of the member.
 * @param sourceFile - The source file declaring the member.
 * @returns The file and the span of the name.
 */
function toMemberDeclaration(nameNode: Identifier, sourceFile: SourceFile): MemberDeclaration {
  return { fileName: sourceFile.fileName, span: { start: nameNode.getStart(sourceFile), end: nameNode.getEnd() } };
}

/**
 * References the type of a class from any file, through an `import()` type of the file declaring it.
 *
 * @param klass - The class to reference.
 * @param sourceFile - The source file declaring the class.
 * @param withTypeParameters - Whether a generic class is referenced with its own type parameters as type arguments, which the
 *   type-check of the templates instantiates with the types they give them (see `typeParameters` of `ComponentMetadata`).
 * @returns The type of the instances of the class, e.g. `import('/src/x.xd.component').XComponent`, or
 *   `import('/src/list.directive').List<Item>` for a generic class whose type parameters are referenced.
 */
export function getAccessorOwnerType(klass: ClassDeclarationWithName, sourceFile: SourceFile, withTypeParameters: boolean): string {
  const modulePath = sourceFile.fileName.replaceAll('\\', '/').replace(/\.ts$/, '');
  const owner = `import('${modulePath}').${klass.name.text}`;
  return withTypeParameters && klass.typeParameters?.length ? `${owner}<${klass.typeParameters.map(({ name }) => name.text).join(', ')}>` : owner;
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