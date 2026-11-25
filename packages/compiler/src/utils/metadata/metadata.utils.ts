import { slice } from '@xaendar/common';
import { acceptsShadowRoot, isValidCustomElementName, toModelChangeEvent } from '@xaendar/internals';
import { CallExpression, ClassDeclaration, CompilerOptions, Decorator, EntityName, Expression, forEachChild, getCombinedModifierFlags, getDecorators, getNameOfDeclaration, Identifier, isArrowFunction, isCallExpression, isClassDeclaration, isDecorator, isEnumDeclaration, isFunctionExpression, isIdentifier, isImportDeclaration, isInterfaceDeclaration, isMethodDeclaration, isNamedImports, isNamespaceImport, isObjectLiteralExpression, isPropertyAccessExpression, isPropertyAssignment, isPropertyDeclaration, isQualifiedName, isShorthandPropertyAssignment, isStringLiteral, isTypeAliasDeclaration, isTypeReferenceNode, ModifierFlags, ModifierLike, Node, ObjectLiteralElementLike, ObjectLiteralExpression, PropertyAssignment, PropertyDeclaration, SourceFile, Statement, StringLiteral, SyntaxKind, TypeNode } from 'typescript';
import { toStringLiteral } from '../../generator/utils/generator/generator.utils';
import { ComponentPropertyMetadataWithSpan } from '../../models/component-property-metadata-with-span/component-property-metadata-with-span.model';
import { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import type { ClassDecoratorNode } from '../../types/class-decorator-node.type';
import type { ClassTypeParameter } from '../../types/class-type-parameter.type';
import type { CollectedBindings } from '../../types/collected-bindings.type';
import type { ComponentDeclaration } from '../../types/component-declaration.type';
import type { ComponentEventMetadata } from '../../types/component-event-metadata.type';
import { ComponentMetadata } from '../../types/component-metadata.type';
import type { ComponentOrDirectiveMetadata } from '../../types/component-or-directive-metadata.type';
import { DirectiveMetadata } from '../../types/directive-metadata.type';
import type { HostDirectiveSource } from '../../types/host-directive-source.type';
import type { MemberDeclaration } from '../../types/member-declaration.type';
import type { ResolvedClass } from '../../types/resolved-class.type';
import type { ClassDeclarationWithName } from '../../types/typescript-decorator-nodes/class-declaration-with-name.type';
import type { DirectiveDecorator } from '../../types/typescript-decorator-nodes/directive-decorator.type';
import type { EventDecorator } from '../../types/typescript-decorator-nodes/event-decorator.type';
import type { PropertyDecorator } from '../../types/typescript-decorator-nodes/property-decorator.type';
import type { WebComponentDecorator } from '../../types/typescript-decorator-nodes/web-component-decorator.type';
import type { WebComponentError } from '../../types/web-component-error.type';
import { getNativeClassMembers, getNativeClassOfTag, HTML_ELEMENT } from '../dom-members/dom-members.utils';
import { addHostDirectiveBindings, checkHostDirectives, hasHostDirectives } from '../host-directives/host-directives.utils';
import { readLibraryClass } from '../package-libraries/package-libraries.utils';
import { DEFAULT_COMPILER_OPTIONS, getBaseClassExpression, getCoreImport, resolveBaseClassOf, resolveExportedClass, resolveModulePath } from '../resolve-declaration/resolve-declaration.utils';
import { toTypeCheckModuleSpecifier } from '../symbol-imports/symbol-imports.utils';

/**
 * Extracts component metadata from a source file by parsing decorators.
 * By default, it reads the source file and extracts metadata for the specified component class.
 *
 *
 * @param sourceFile - The source file declaring the components.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns The metadata of every component declared in the file, keyed by class name, or `undefined`
 *   if the `@WebComponent` decorator of a component doesn't declare a literal selector and template url (or tag it
 *   extends, for a customized built-in element, which may render no template).
 * @throws If two properties of a component resolve to the same name.
 */
export async function extractComponentsMetadataFromSourceFile(sourceFile: SourceFile, compilerOptions?: CompilerOptions): Promise<Map<string, ComponentMetadata> | undefined> {
  const metadatas = new Map<string, ComponentMetadata>();

  const declarations = getWebComponentDeclarations(sourceFile);
  for (let i = 0; i < declarations.length; i++) {
    const { klass, decorator } = declarations[i];
    const { selector, styleUrl, templateUrl, clientOnly, extends: extended } = extractMetadaFromDecorator(decorator);
    // Only a customized built-in element may render no template
    if (!selector || (!templateUrl && !extended)) {
      return;
    }

    const className = klass.name.text;
    const bindings = extractBindingsMetadata(klass, sourceFile, 'component', compilerOptions);
    addHostDirectiveBindings(bindings, collectHostDirectiveSources({ sourceFile, declaration: klass }, decorator, compilerOptions), compilerOptions, directive => extractHostDirectiveBindings(directive, compilerOptions));
    const metadata: ComponentMetadata = {
      type: 'component',
      className,
      modulePath: sourceFile.fileName,
      selector,
      styleUrl,
      ...bindings,
      typescriptNodes: declarations[i]
    };

    if (templateUrl) {
      metadata.templateUrl = templateUrl;
    }

    if (extended) {
      metadata.extends = extended;
    }

    const typeParameters = extractTypeParameters(klass);
    if (typeParameters) {
      metadata.typeParameters = typeParameters;
    }

    if (clientOnly) {
      metadata.clientOnly = clientOnly;
    }

    metadatas.set(className, metadata);
  }

  return metadatas;
}

/**
 * The attributes every HTML element reflects as properties of `HTMLElement`, the `aria-*` ones apart: an input of a
 * component with one of these names takes the binding of the template, which then no longer writes the attribute.
 */
const REFLECTED_ATTRIBUTES: ReadonlySet<string> = new Set(['id', 'title', 'hidden', 'lang', 'dir', 'tabindex', 'slot', 'inert', 'accesskey', 'autocapitalize', 'autofocus', 'draggable', 'spellcheck', 'translate', 'popover', 'nonce']);

/**
 * Finds the inputs of the components of a source file bound by the name of an attribute `HTMLElement` reflects (`id`,
 * `title`, `hidden`, `tabIndex`, `aria-label`, `ariaLabel`…), by their name or by their alias: a template binding that
 * name on the element of the component sets the input, so the native attribute is written from outside with `attr.`.
 * Only the inputs the class itself declares are reported, where they are declared.
 *
 * @param sourceFile - The source file declaring the components.
 * @returns A warning on the name or on the alias of each such input.
 */
export function findReflectedInputs(sourceFile: SourceFile): WebComponentError[] {
  const warnings = new Array<WebComponentError>();
  const declarations = getWebComponentDeclarations(sourceFile);
  for (let i = 0; i < declarations.length; i++) {
    const { klass } = declarations[i];
    const { members } = klass;
    for (let j = 0; j < members.length; j++) {
      const member = members[j];
      if (!isPropertyDeclaration(member) || !isIdentifier(member.name)) {
        continue;
      }

      const nameNode = member.name;

      let required = false;
      const decorator = member.modifiers?.find((modifier): modifier is PropertyDecorator => {
        const result = isPropertyDecorator(modifier);
        required = !!result.required;
        return result.decorator;
      });
      if (!decorator) {
        continue;
      }

      const alias = findAliasLiteral(decorator, required);
      const bound = alias?.text ?? nameNode.text;
      const attribute = toReflectedAttribute(bound);
      if (attribute) {
        reportAt(warnings, sourceFile, `The input "${bound}" of ${klass.name.text} has the name of an attribute every element reflects: ${bound}="…" on its element sets the input, so the native attribute is written with attr.${attribute}="…"`, alias ?? nameNode);
      }
    }
  }

  return warnings;
}

/**
 * Gives the attribute `HTMLElement` reflects a name an input is bound with stands for, compared without case: the
 * attribute itself, or the `aria-*` attribute of an ARIA property (`ariaLabel`).
 *
 * @param name - The name the input is bound with.
 * @returns The attribute, `undefined` when the name is not one of them.
 */
function toReflectedAttribute(name: string): string | undefined {
  const lowerCase = name.toLowerCase();
  if (REFLECTED_ATTRIBUTES.has(lowerCase) || lowerCase.startsWith('aria-')) {
    return lowerCase;
  }

  return /^aria[A-Z]/.test(name) ? `aria-${lowerCase.slice(4)}` : undefined;
}

/**
 * Records an error of a `@WebComponent`, spanning the node it is about.
 *
 * @param errors - The errors, filled.
 * @param sourceFile - The source file declaring the component.
 * @param message - The description of the error.
 * @param node - The node the error is about.
 */
function reportAt(errors: WebComponentError[], sourceFile: SourceFile, message: string, node: Node): void {
  errors.push({ message, span: { start: node.getStart(sourceFile), end: node.getEnd() } });
}

/**
 * Finds the `@WebComponent` declarations of a source file that the plugin cannot compile, as it reads them
 * from the source code: a component declared in a file not following the component convention, whose
 * `selector`, `extends`, `templateUrl` or `styleUrl` is not a string literal (`selector` is required, and so is
 * `templateUrl` without `extends`), whose `selector` is not a valid custom element name, or whose `ssr` cannot be read
 * (see {@link findSsrError}) or is declared in a project that does not render on the server. The build and the editor
 * report the same errors.
 *
 * A customized built-in element (`extends`) names the tag of a native element, renders a template only when the tag
 * accepts a shadow root, has a stylesheet only with a template, and extends `customElementOf` of the class of its tag
 * (`CustomElement` for a tag whose class is `HTMLElement`): a component extending `customElementOf` of another class
 * declares `extends` (see {@link findNativeClassError}).
 *
 * @param sourceFile - The source file declaring the components.
 * @param componentFile - Whether the file follows the component convention (`.xd.component.ts`).
 * @param ssr - Whether the project renders on the server: `false` rejects the `ssr` option, `undefined` when it is not known.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns One error per component or option that cannot be compiled, or `undefined` when there is none.
 */
export function findWebComponentErrors(sourceFile: SourceFile, componentFile: boolean, ssr?: boolean, compilerOptions: CompilerOptions = DEFAULT_COMPILER_OPTIONS): WebComponentError[] {
  const errors = new Array<WebComponentError>;

  const declarations = getWebComponentDeclarations(sourceFile);
  for (let i = 0; i < declarations.length; i++) {
    const { klass, decorator } = declarations[i];
    const className = klass.name.text;
    if (!componentFile) {
      reportAt(errors, sourceFile, `${className} must be declared in a file ending with .xd.component.ts`, klass.name);
      continue;
    }

    const options = decorator.expression.arguments[0];
    if (!options || !isObjectLiteralExpression(options)) {
      reportAt(errors, sourceFile, `The options of @WebComponent in ${className} must be an object literal`, options ?? decorator.expression.expression);
      continue;
    }

    let selector = false;
    let templateUrl: ObjectLiteralElementLike | undefined;
    let styleUrl: ObjectLiteralElementLike | undefined;
    let extendsOption: ObjectLiteralElementLike | undefined;
    // The tag the component extends, once it is known to be the one of a native element
    let extended: string | undefined;
    for (let j = 0; j < options.properties.length; j++) {
      const property = options.properties[j];
      if (!(isPropertyAssignment(property) || isShorthandPropertyAssignment(property)) || !isIdentifier(property.name)) {
        continue;
      }

      const name = property.name.text;
      if (name === 'ssr') {
        // Without the HTML of the server the option has nothing to act on, as the @hydrate and @client blocks
        const error = ssr === false ? `The ssr option of ${className} is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the option` : findSsrError(property, className);
        if (error) {
          reportAt(errors, sourceFile, error, property);
        }
        continue;
      }

      switch (name) {
        case 'selector':
          selector = true;
          break;
        case 'templateUrl':
          templateUrl = property;
          break;
        case 'styleUrl':
          styleUrl = property;
          break;
        case 'extends':
          extendsOption = property;
          break;
        default:
          continue;
      }

      // A shorthand property ({ selector }) reads a variable
      if (!isPropertyAssignment(property) || !isStringLiteral(property.initializer)) {
        reportAt(errors, sourceFile, `The ${name} option of ${className} must be a string literal`, isPropertyAssignment(property) ? property.initializer : property);
      } else if (name === 'selector' && !isValidCustomElementName(property.initializer.text)) {
        reportAt(errors, sourceFile, `Invalid custom element name "${property.initializer.text}" in component ${className}`, property.initializer);
      } else if (name === 'extends') {
        const error = findExtendsError(property.initializer.text, className);
        error ? reportAt(errors, sourceFile, error, property.initializer) : extended = property.initializer.text;
      }
    }

    if (!selector) {
      reportAt(errors, sourceFile, `The selector option of ${className} must be a string literal`, decorator.expression.expression);
    }

    // A customized built-in element may render no template, an autonomous one always renders one
    if (!templateUrl && !extendsOption) {
      reportAt(errors, sourceFile, `The templateUrl option of ${className} must be a string literal`, decorator.expression.expression);
    }

    if (extended && !acceptsShadowRoot(extended)) {
      reportShadowOptions(errors, sourceFile, className, extended, templateUrl, styleUrl);
    } else if (extendsOption && styleUrl && !templateUrl) {
      reportAt(errors, sourceFile, `The styleUrl option of ${className} styles its template, which it does not declare: add templateUrl, or remove styleUrl`, styleUrl);
    }

    if (!extendsOption || extended) {
      const error = findNativeClassError({ sourceFile, declaration: klass }, extended, compilerOptions);
      // ! is a safe assertion: a class extending nothing has no native class to disagree with
      if (error) {
        reportAt(errors, sourceFile, error, getBaseClassExpression(klass)!);
      }
    }
  }

  return errors;
}

/**
 * Tells why the `extends` option of a component does not name the tag of a native HTML element.
 *
 * @param tagName - The tag the option names.
 * @param className - The name of the class of the component, for the message.
 * @returns The error, `undefined` for the tag of a native element.
 */
function findExtendsError(tagName: string, className: string): string | undefined {
  if (isValidCustomElementName(tagName, false)) {
    return `The extends option of ${className} names <${tagName}>, a custom element: it names the tag of the native element ${className} extends, e.g. extends: 'button'`;
  }

  return getNativeClassOfTag(tagName) ? undefined : `The extends option of ${className} names <${tagName}>, which is not a native HTML element: it names the tag of the native element ${className} extends, e.g. extends: 'button'`;
}

/**
 * Reports the `templateUrl` and the `styleUrl` of a customized built-in element whose tag accepts no shadow root
 * (`button`, `input`, `li`…): it renders no template, and has nothing to style.
 *
 * @param errors - The errors, filled.
 * @param sourceFile - The source file declaring the component.
 * @param className - The name of the class of the component.
 * @param tagName - The tag it extends.
 * @param options - The `templateUrl` and the `styleUrl` options, the ones it declares.
 */
function reportShadowOptions(errors: WebComponentError[], sourceFile: SourceFile, className: string, tagName: string, ...options: Array<ObjectLiteralElementLike | undefined>): void {
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    if (option) {
      reportAt(errors, sourceFile, `<${tagName}> accepts no shadow root: ${className}, extending it, renders no template and has no stylesheet, its content being the one its tag holds. Remove ${option.name!.getText(sourceFile)}`, option);
    }
  }
}

/**
 * Tells why the class a component extends is not the one its `extends` option asks for: the class `customElementOf`
 * creates on the class of the tag, which is `CustomElement` for a tag whose class is `HTMLElement`, or `CustomElement`
 * for an autonomous custom element. The chain of the classes is followed up to `customElementOf(…)` or `CustomElement`.
 *
 * @param klass - The class of the component, with the file declaring it.
 * @param extended - The tag the component extends, `undefined` for an autonomous custom element.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns The error, `undefined` when the classes match, or when the chain cannot be read.
 */
function findNativeClassError(klass: ResolvedClass, extended: string | undefined, compilerOptions: CompilerOptions): string | undefined {
  const native = findNativeClass(klass, compilerOptions);
  if (!native) {
    return undefined;
  }

  const className = klass.declaration.name!.text;

  if (!extended) {
    return native === HTML_ELEMENT ? undefined : `${className} extends customElementOf(${native}): declare the tag of the native element it extends with the extends option of @WebComponent, e.g. extends: 'button'`;
  }

  const expected = getNativeClassOfTag(extended)!;
  if (native === expected) {
    return undefined;
  }

  const fix = expected === HTML_ELEMENT ? 'CustomElement' : `customElementOf(${expected})`;
  return `${className} extends <${extended}>, whose class is ${expected}, but its class extends ${native === HTML_ELEMENT ? 'CustomElement' : `customElementOf(${native})`}: extend ${fix}`;
}

/**
 * Finds the native class a component extends, following the chain of its classes up to `customElementOf(…)` of
 * `@xaendar/core`, which gives it, or to `CustomElement`, which extends `HTMLElement`.
 *
 * @param klass - The class of the component, with the file declaring it.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns The name of the native class, `undefined` when the chain cannot be followed up to it.
 */
function findNativeClass(klass: ResolvedClass, compilerOptions: CompilerOptions | undefined): string | undefined {
  const visitedClasses = new Set<ClassDeclaration>();
  let current: ResolvedClass | undefined = klass;
  while (current && !visitedClasses.has(current.declaration)) {
    visitedClasses.add(current.declaration);
    const expression = getBaseClassExpression(current.declaration);
    const native = expression && readNativeClass(expression, current.sourceFile);
    if (native) {
      return native;
    }

    current = resolveBaseClassOf(current, compilerOptions);
  }

  return undefined;
}

/**
 * Reads the native class the `extends` clause of a class names directly: the argument of `customElementOf(…)` of
 * `@xaendar/core`, or `HTMLElement`, which `CustomElement` extends.
 *
 * @param expression - The expression of the `extends` clause.
 * @param sourceFile - The file of the class.
 * @returns The name of the native class, `undefined` when the clause names another class.
 */
function readNativeClass(expression: Expression, sourceFile: SourceFile): string | undefined {
  if (isIdentifier(expression)) {
    return expression.text === HTML_ELEMENT ? HTML_ELEMENT : undefined;
  }

  if (!isCustomElementOfCall(expression, sourceFile)) {
    return undefined;
  }

  const [base] = expression.arguments;
  return base && isIdentifier(base) ? base.text : undefined;
}

/**
 * Tells whether an expression calls `customElementOf` of `@xaendar/core`.
 *
 * @param expression - The expression.
 * @param sourceFile - The file of the expression.
 * @returns `true` for a call of `customElementOf`.
 */
function isCustomElementOfCall(expression: Expression, sourceFile: SourceFile): expression is CallExpression & { expression: Identifier } {
  return isCallExpression(expression) && isIdentifier(expression.expression) && getCoreImport(expression.expression, sourceFile) === 'customElementOf';
}

/**
 * Finds the host directives of the components of a source file that the runtime would reject when the class is
 * registered, the ones the components inherit included (see `checkHostDirectives`): a directive declared twice along
 * the chain of classes, an input or an event a directive does not declare, an input exposed with the name of an input or
 * of a member of the component or of another exposed input, an event exposed with the name of an event of the component
 * or of another exposed event. A problem of a declaration of the component is reported on it, one of an ancestor on the
 * name of the class. The build and the editor report the same errors.
 *
 * @param sourceFile - The source file declaring the components.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes and the
 *   directives are resolved.
 * @returns One error per problem found.
 */
export function findHostDirectiveErrors(sourceFile: SourceFile, compilerOptions?: CompilerOptions): WebComponentError[] {
  const errors = new Array<WebComponentError>();
  const declarations = getWebComponentDeclarations(sourceFile);
  for (let i = 0; i < declarations.length; i++) {
    const { klass, decorator } = declarations[i];
    const resolved: ResolvedClass = { sourceFile, declaration: klass };
    const sources = collectHostDirectiveSources(resolved, decorator, compilerOptions);
    if (!sources.some(source => hasHostDirectives(source.decorator))) {
      continue;
    }

    const component = Object.assign(extractBindingsMetadata(klass, sourceFile, 'component', compilerOptions), { className: klass.name.text, members: collectMemberNames(resolved, compilerOptions) });
    checkHostDirectives(sources, component, compilerOptions, directive => extractHostDirectiveBindings(directive, compilerOptions), (message, node) => reportAt(errors, sourceFile, message, node ?? klass.name));
  }

  return errors;
}

/**
 * Collects the `@WebComponent` decorators of a component and of its ancestors, which declare the host directives the
 * component has: the ones of the ancestors first, as the runtime applies them. Base classes that can't be resolved are
 * skipped, as their accessors are.
 *
 * @param klass - The class of the component, with the file declaring it.
 * @param decorator - Its `@WebComponent` decorator.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns The decorators, the one of the component last.
 */
function collectHostDirectiveSources(klass: ResolvedClass, decorator: WebComponentDecorator, compilerOptions: CompilerOptions | undefined): HostDirectiveSource[] {
  const sources = new Array<HostDirectiveSource>();
  addAncestorSources(klass, compilerOptions, new Set([klass.declaration]), sources);
  sources.push({ sourceFile: klass.sourceFile, decorator, own: true });
  return sources;
}

/**
 * Adds the `@WebComponent` decorators of the ancestors of a class, the farthest first.
 *
 * @param klass - The class, with the file declaring it.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @param visitedClasses - Classes already walked, to stop on circular inheritance.
 * @param sources - The decorators collected so far, filled in place.
 */
function addAncestorSources(klass: ResolvedClass, compilerOptions: CompilerOptions | undefined, visitedClasses: Set<ClassDeclaration>, sources: HostDirectiveSource[]): void {
  const base = resolveBaseClassOf(klass, compilerOptions);
  if (!base || visitedClasses.has(base.declaration)) {
    return;
  }

  visitedClasses.add(base.declaration);
  addAncestorSources(base, compilerOptions, visitedClasses, sources);
  const decorator = findClassDecorator<WebComponentDecorator>(base.declaration, 'WebComponent');
  if (decorator) {
    sources.push({ sourceFile: base.sourceFile, decorator, own: false });
  }
}

/**
 * Collects the names of the instance members of a class and of its ancestors that can be resolved: fields, accessors and
 * methods, which an accessor the runtime defines on the prototype for an exposed input would hide, or be hidden by.
 *
 * @param klass - The class, with the file declaring it.
 * @param compilerOptions - Project compiler options, driving how the modules declaring the base classes are resolved.
 * @returns The names.
 */
function collectMemberNames(klass: ResolvedClass, compilerOptions: CompilerOptions | undefined): Set<string> {
  const names = new Set<string>();
  const visitedClasses = new Set<ClassDeclaration>();
  let current: ResolvedClass | undefined = klass;
  while (current && !visitedClasses.has(current.declaration)) {
    visitedClasses.add(current.declaration);
    addOwnMemberNames(current.declaration, names);
    const base = resolveBaseClassOf(current, compilerOptions);
    if (!base) {
      addGlobalBaseMembers(current, names, compilerOptions);
    }

    current = base;
  }

  return names;
}

/**
 * Adds the names of the instance members a class declares itself: fields, accessors and methods.
 *
 * @param declaration - The class.
 * @param names - The names of the members, filled in place.
 */
function addOwnMemberNames({ members }: ClassDeclaration, names: Set<string>): void {
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const name = member.name;
    if (name && (isIdentifier(name) || isStringLiteral(name)) && !(getCombinedModifierFlags(member) & ModifierFlags.Static)) {
      names.add(name.text);
    }
  }
}

/**
 * Adds the members of the global class the last class of a chain extends, which no declaration of a class gives: the
 * ones of `HTMLElement` (`id`, `title`, `hidden`…), extended by `CustomElement`, or the ones of the class of the native
 * element `customElementOf(…)` extends (`HTMLButtonElement`: `disabled`, `value`…), along with the ones of
 * `CustomElement`, whose code the class it creates shares, so that an input exposed with their name is reported as the
 * runtime rejects it.
 *
 * @param klass - The last class of the chain that could be resolved, with the file declaring it.
 * @param names - The names of the members, filled in place.
 * @param compilerOptions - Project compiler options, driving how the module of `CustomElement` is resolved.
 */
function addGlobalBaseMembers({ sourceFile, declaration }: ResolvedClass, names: Set<string>, compilerOptions: CompilerOptions | undefined): void {
  const base = getBaseClassExpression(declaration);
  const native = base && readNativeClass(base, sourceFile);
  if (!native) {
    return;
  }

  for (const name of getNativeClassMembers(native)) {
    names.add(name);
  }

  const customElement = isCustomElementOfCall(base, sourceFile) ? resolveCustomElement(sourceFile, compilerOptions) : undefined;
  if (customElement) {
    addOwnMemberNames(customElement.declaration, names);
  }
}

/**
 * Resolves `CustomElement` of `@xaendar/core`, which exports `customElementOf` too, for a file.
 *
 * @param sourceFile - The file.
 * @param compilerOptions - Project compiler options, driving how the module is resolved.
 * @returns The class with the file declaring it, `undefined` when it cannot be resolved.
 */
function resolveCustomElement(sourceFile: SourceFile, compilerOptions = DEFAULT_COMPILER_OPTIONS): ResolvedClass | undefined {
  const path = resolveModulePath('@xaendar/core', sourceFile.fileName, compilerOptions);
  return path ? resolveExportedClass(path, 'CustomElement', compilerOptions) : undefined;
}

/**
 * Returns the components declared in a source file, with their `@WebComponent` decorator.
 *
 * @param sourceFile - The source file.
 * @returns The classes and their decorators, in the order they are declared.
 */
export function getWebComponentDeclarations(sourceFile: SourceFile): ComponentDeclaration[] {
  return getDecoratedClassDeclarations<WebComponentDecorator>(sourceFile, 'WebComponent');
}

/**
 * Describes a selector of a component or directive already used by another one: the same message for the build and for
 * the editor.
 *
 * @param metadata - The metadata of the component or directive claiming the selector.
 * @param owner - The class already using the selector, and the file declaring it.
 * @returns The message.
 */
export function describeSelectorConflict({ className, selector, type, modulePath }: ComponentOrDirectiveMetadata, owner: { className: string, ownerFile: string }): string {
  return type === 'directive'
    ? `Selector "${selector}" of directive "${className}" - ${modulePath} is already used by directive "${owner.className}" - ${owner.ownerFile}. Directive selectors must be unique.`
    : `Selector "${selector}" of component "${className}" - ${modulePath} is already used by component "${owner.className}" - ${owner.ownerFile}. Custom element names must be unique.`;
}

/**
 * Finds what makes the `ssr` option of a `@WebComponent` unreadable for the plugin, which has to know at compile time
 * whether a component renders only in the browser: `ssr` must be an object literal, `render` the literal `false` and,
 * next to it, `hydrate` a string literal, since the server writes it without the class of the component.
 *
 * @param property - The option.
 * @param className - The name of the component.
 * @returns The message, `undefined` when the option can be read.
 */
function findSsrError(property: ObjectLiteralElementLike, className: string): string | undefined {
  if (!isPropertyAssignment(property) || !isObjectLiteralExpression(property.initializer)) {
    return `The ssr option of ${className} must be an object literal`;
  }

  const { properties } = property.initializer;
  const render = properties.find(option => option.name?.getText() === 'render');
  if (!render) {
    return undefined;
  }

  if (!isPropertyAssignment(render) || render.initializer.kind !== SyntaxKind.FalseKeyword) {
    return `The ssr.render option of ${className} must be the literal false`;
  }

  const hydrate = properties.find(option => option.name?.getText() === 'hydrate');
  return hydrate && !(isPropertyAssignment(hydrate) && isStringLiteral(hydrate.initializer)) ? `The ssr.hydrate option of ${className} must be a string literal next to ssr.render` : undefined;
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
      modulePath: sourceFile.fileName,
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
 * Extracts the metadata of the `@Property`, `@Model` and `@Event` accessors of a component or a directive, inherited ones
 * included: a model is a property and an event, named after the property followed by `Change`, whose detail is its value.
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
  for (const [propName, { name, type, required, alias, declaration }] of bindings.properties.entries()) {
    mappedProperties.set(propName, new ComponentPropertyMetadata(name, type, { required, alias, declaration }));
  }

  return {
    properties: mappedProperties,
    events: bindings.events
  };
}

/**
 * Collects the `@Property`, `@Model` and `@Event` accessors of a class, walking its inheritance chain: the accessors of
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
 * Collects the `@Property`, `@Model` and `@Event` accessors declared by a class itself: a model adds its property and
 * its event of change, which share the declaration of the accessor.
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
    let model = false;
    const propDecorator = Array.from(memberModifiers).find((member): member is PropertyDecorator => {
      const result = isPropertyDecorator(member);
      required = !!result.required;
      model = !!result.model;
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
          // The event of change of an overridden model goes with it
          const change = toModelChangeEvent(overridden[0]);
          if (events.get(change)?.declaration === overridden[1].declaration) {
            events.delete(change);
          }
        }

        const metadata = extractPropertyMetadata(member, nameNode, propName, propDecorator, required, accessorOwner, sourceFile);
        const actualPropName = metadata.alias ?? propName;
        const conflictingProperty = properties.get(actualPropName);
        if (!conflictingProperty) {
          properties.set(actualPropName, metadata);
          if (model) {
            events.set(toModelChangeEvent(actualPropName), { type: metadata.type, declaration: metadata.declaration });
          }
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
 * Extracts the properties and the events of a directive a component declares among its host directives: from its
 * decorators, or, for a directive of a compiled library, whose declarations keep no decorator, from the manifest of its
 * package.
 *
 * @param directive - The class of the directive, with the file declaring it.
 * @param compilerOptions - Project compiler options, driving how the modules declaring its base classes are resolved.
 * @returns The properties and the events, `undefined` when the class has no name.
 * @throws If two properties of the directive resolve to the same name, or the manifest of its library can't be read.
 */
function extractHostDirectiveBindings({ declaration, sourceFile }: ResolvedClass, compilerOptions: CompilerOptions | undefined): Pick<ComponentMetadata, 'properties' | 'events'> | undefined {
  if (!classDeclarationHasName(declaration)) {
    return undefined;
  }

  return readLibraryClass(sourceFile.fileName, declaration.name.text) ?? extractBindingsMetadata(declaration, sourceFile, 'directive', compilerOptions);
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
function extractMetadaFromDecorator(decorator: ClassDecoratorNode): Pick<ComponentMetadata, 'selector' | 'templateUrl' | 'styleUrl' | 'clientOnly' | 'extends'> {
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
          case 'extends':
            retVal.extends = isStringLiteral(prop.initializer) ? prop.initializer.text : undefined;
            break;
          case 'ssr':
            retVal.clientOnly = extractClientOnly(prop.initializer);
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
 * Reads whether the `ssr` option of a `@WebComponent` renders the component only in the browser.
 *
 * @param ssr - The value of the option.
 * @returns The trigger next to `render: false`, if any, `undefined` when the server renders the component.
 */
function extractClientOnly(ssr: Expression): ComponentMetadata['clientOnly'] {
  if (!isObjectLiteralExpression(ssr)) {
    return undefined;
  }

  let render = false;
  let hydrate: string | undefined;
  for (let i = 0; i < ssr.properties.length; i++) {
    const option = ssr.properties[i];
    if (isPropertyAssignment(option)) {
      switch (option.name.getText()) {
        case 'render':
          render = option.initializer.kind === SyntaxKind.FalseKeyword;
          break;
        case 'hydrate':
          hydrate = isStringLiteral(option.initializer) ? option.initializer.text : undefined;
          break;
      }
    }
  }

  if (!render) {
    return undefined;
  }

  return hydrate ? { hydrate } : {};
}

/**
 * Checks if a modifier is a decorator declaring an input: `@Property`, `@Property.required`, `@Model` or `@Model.required`.
 *
 * @param modifier - The modifier of the accessor.
 * @returns Whether the modifier is one of them, whether it declares a required input and whether it declares a model.
 */
function isPropertyDecorator(modifier: ModifierLike): { decorator: boolean, required?: true, model?: true } {
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

  // @Property(... or @Model(...
  if (isIdentifier(subExpr) && isInputDecoratorName(subExpr.text)) {
    return toInputDecorator(subExpr.text, false);
  }

  // @Property.required(... or @Model.required(...
  if (isPropertyAccessExpression(subExpr) && isIdentifier(subExpr.expression) && isInputDecoratorName(subExpr.expression.text) && subExpr.name.text === 'required') {
    return toInputDecorator(subExpr.expression.text, true);
  }

  return {
    decorator: false
  }
}

/**
 * Tells whether a name is the one of a decorator declaring an input.
 *
 * @param name - The name the decorator is called with.
 * @returns `true` for `Property` and `Model`.
 */
function isInputDecoratorName(name: string): name is PropertyDecorator['expression']['expression']['text'] {
  return name === 'Property' || name === 'Model';
}

/**
 * Describes a decorator declaring an input (see {@link isPropertyDecorator}).
 *
 * @param name - The name of the decorator.
 * @param required - Whether it is the `required` variant.
 * @returns The description.
 */
function toInputDecorator(name: PropertyDecorator['expression']['expression']['text'], required: boolean): { decorator: true, required?: true, model?: true } {
  const result: { decorator: true, required?: true, model?: true } = { decorator: true };
  if (required) {
    result.required = true;
  }

  if (name === 'Model') {
    result.model = true;
  }

  return result;
}

/**
 * Finds the alias the options of a decorator declaring an input give the input, written as a string literal.
 *
 * @param decorator - The `@Property` or `@Model` decorator.
 * @param required - Whether the decorator is `@Property.required` or `@Model.required`, whose options are its first
 *   argument instead of the second.
 * @returns The literal of the alias, `undefined` when the input declares none.
 */
function findAliasLiteral(decorator: PropertyDecorator, required: boolean): StringLiteral | undefined {
  const args = decorator.expression.arguments;
  const options = required ? args[0] : args[1];
  if (!options || !isObjectLiteralExpression(options)) {
    return undefined;
  }

  const alias = options.properties.find((prop): prop is Omit<PropertyAssignment, 'initializer'> & { initializer: StringLiteral } => isPropertyAssignment(prop) && isIdentifier(prop.name) && prop.name.text === 'alias' && isStringLiteral(prop.initializer));
  return alias?.initializer;
}

/**
 * Extracts property metadata from a @Property, @Property.required, @Model or @Model.required decorator.
 *
 * @param property - The accessor decorated with `@Property` or `@Model`.
 * @param nameNode - The name of the accessor.
 * @param name - The text of the name of the accessor.
 * @param decorator - The `@Property` or `@Model` decorator of the accessor.
 * @param required - Whether the decorator is `@Property.required` or `@Model.required`.
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
    const incomingType = options && isObjectLiteralExpression(options) ? findTransformIncomingType(property, options) : undefined;
    if (incomingType) {
      metadata.type = qualifyType(incomingType, sourceFile);
    }

    const initializer = findAliasLiteral(decorator, required);
    if (initializer) {
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
 * It is, in order, the second type argument of the type of the accessor (`InputSignal<number, string>`), which `@Property`
 * requires when the `transform` takes another type, the annotation of the parameter of the `transform`, or nothing, so
 * that the type of the value of the signal is used.
 *
 * @param property - The accessor decorated with `@Property`.
 * @param options - The options object literal of the decorator.
 * @returns The type node of the incoming value, `undefined` if the property has no `transform` or no type is declared for it.
 */
function findTransformIncomingType(property: PropertyDeclaration, options: ObjectLiteralExpression): TypeNode | undefined {
  const transform = options.properties.find(property => (isPropertyAssignment(property) || isMethodDeclaration(property)) && isIdentifier(property.name) && property.name.text === 'transform');
  if (!transform) {
    return undefined;
  }

  const typeArgument = property.type && isTypeReferenceNode(property.type) ? property.type.typeArguments?.[1] : undefined;
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
  collectTypeReplacements(type, sourceFile, start, replacements);

  let text = type.getText(sourceFile);
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start: from, end, text: replacement } = replacements[i];
    text = `${text.slice(0, from)}${replacement}${text.slice(end)}`;
  }

  return text;
}

/**
 * Collects the replacements of the names a node of a type, and the nodes it holds, use by the `import()` types of the
 * modules declaring them (see `qualifyType`).
 *
 * @param node - The node.
 * @param sourceFile - The source file declaring the property.
 * @param start - Where the type starts in the source file.
 * @param replacements - The replacements, filled with their ranges in the text of the type.
 */
function collectTypeReplacements(node: Node, sourceFile: SourceFile, start: number, replacements: Array<{ start: number, end: number, text: string }>): void {
  if (isTypeReferenceNode(node)) {
    let name: EntityName = node.typeName;
    while (isQualifiedName(name)) {
      name = name.left;
    }

    const qualifier = findTypeQualifier(name.text, sourceFile);
    if (qualifier) {
      // A reference through a namespace import (`ns.Tag`) only needs the namespace replaced
      const isNamespace = name !== node.typeName;
      replacements.push({ start: name.getStart(sourceFile) - start, end: name.getEnd() - start, text: isNamespace && qualifier.namespace ? `import(${toStringLiteral(qualifier.module)})` : `import(${toStringLiteral(qualifier.module)}).${qualifier.name}` });
    }
  }

  forEachChild(node, child => collectTypeReplacements(child, sourceFile, start, replacements));
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
 * References the type of a class from any file, through an `import()` type of the file declaring it, a generic class with
 * its own type parameters as type arguments, which the type-check of the templates instantiates with the types they give
 * them (see `typeParameters` of `ComponentMetadata`).
 *
 * @param klass - The class to reference.
 * @param sourceFile - The source file declaring the class.
 * @returns The type of the instances of the class, e.g. `import('/src/x.xd.component').XComponent`, or
 *   `import('/src/list.directive').List<Item>` for a generic class.
 */
function getAccessorOwnerType(klass: ClassDeclarationWithName, sourceFile: SourceFile): string {
  return toOwnerType(sourceFile.fileName, klass.name.text, klass.typeParameters?.map(({ name }) => name.text));
}

/**
 * References the type of the class of a component or of a directive from any file, as {@link getAccessorOwnerType} does
 * while its metadata are extracted: through an `import()` type of the module declaring it.
 *
 * @param metadata - The metadata of the component or of the directive.
 * @param withTypeParameters - Whether a generic class is referenced with its own type parameters as type arguments.
 * @returns The type of the instances of the class, e.g. `import('/src/x.xd.component').XComponent`, or
 *   `import('/src/list.directive').List<Item>` for a generic class whose type parameters are referenced.
 */
export function getOwnerType({ modulePath, className, typeParameters }: Pick<ComponentOrDirectiveMetadata, 'modulePath' | 'className' | 'typeParameters'>, withTypeParameters: boolean): string {
  return toOwnerType(modulePath, className, withTypeParameters ? typeParameters?.map(({ name }) => name) : undefined);
}

/**
 * Writes the `import()` type of a class, its module referenced without the TypeScript extension.
 *
 * @param modulePath - The path of the file declaring the class.
 * @param className - The name of the class.
 * @param typeParameters - The names of the type parameters to reference the class with, if any.
 * @returns The type, e.g. `import('/src/list.directive').List<Item>`.
 */
function toOwnerType(modulePath: string, className: string, typeParameters: readonly string[] | undefined): string {
  const owner = `import(${toStringLiteral(toTypeCheckModuleSpecifier({ modulePath: modulePath.replaceAll('\\', '/') }))}).${className}`;
  return typeParameters?.length ? `${owner}<${typeParameters.join(', ')}>` : owner;
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