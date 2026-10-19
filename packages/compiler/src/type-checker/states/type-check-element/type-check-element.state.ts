// states/type-check-element.state.ts
import type { Expression, Identifier } from 'typescript';
import { isIdentifier } from 'typescript';
import { resolveExpression } from '../../../generator/utils/generator/generator.utils';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { AttributeNode } from '../../../parser/types/nodes/attribute-node.type';
import type { ClassBindingNode } from '../../../parser/types/nodes/class-binding-node.type';
import type { ConditionalBindingBranchNode } from '../../../parser/types/nodes/conditional-binding-branch-node.type';
import type { ConditionalBindingNode } from '../../../parser/types/nodes/conditional-binding-node.type';
import type { DirectiveNode } from '../../../parser/types/nodes/directive-node.type';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { isStructuralElement } from '../../../parser/utils/scope-declarations/scope-declarations.utils';
import type { EventNode } from '../../../parser/types/nodes/event-node.type';
import type { IfBindingNode } from '../../../parser/types/nodes/if-binding-node.type';
import type { StructuralDirectiveNode } from '../../../parser/types/nodes/structural-directive-node.type';
import type { SwitchBindingNode } from '../../../parser/types/nodes/switch-binding-node.type';
import { ComponentEventMetadata, ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
import { getChildrenNamespace, getElementNamespace } from '../../../utils/element-namespace/element-namespace.utils';
import { getAccessorOwnerType } from '../../../utils/metadata/metadata.utils';
import type { ComponentOrDirectiveMetadata } from '../../../types/component-or-directive-metadata.type';
import { ComponentPropertyMetadata } from '../../models/component-property-metadata/component-property-metadata.model';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { Span } from '../../../types/span.type';
import { Line, LineMapping } from '../../types/generated-line.type';
import type { NativeEventType } from '../../types/native-event-type.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, type LinePart, mapped, mappedSegments, plain } from '../../utils/line-builder/line-builder.utils';
import { mappedExpression } from '../../utils/mapped-expression/mapped-expression.utils';
import { getEventMap } from '../../utils/namespace-types/namespace-types.utils';
import { getInstantiationSuffix, INSTANCE, typeCheckScope } from '../../utils/scope/scope.utils';

/**
 * Type-checks an element node: emits the type-check lines for its
 * attributes, class bindings, events, conditional bindings, directives and structural directives, then recurses into its children.
 *
 * Custom elements (tag names containing a dash) are checked against the
 * metadata of the component imported for their selector; native elements, and the custom elements of other
 * libraries matching the `customElements` patterns, only get their expressions and event handlers checked.
 *
 * The native events of the element are typed through the event map of its namespace (see `getElementNamespace`),
 * which its children inherit: the children of an `<svg>`, a `<math>` or a `<foreignObject>` element are type-checked in
 * a scope declaring their namespace.
 * A custom element of another library may dispatch events the map doesn't declare: their `$event` is `any`.
 *
 * The content of an element a structural directive is applied to is a scope of its own: a block of the type-check code
 * when it declares element refs.
 *
 * @param node - The `ElementNode` to type-check.
 * @param processNode - Callback used to type-check each child node.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If the tag is a custom element, or one of its directives, whose selector is not imported in the template,
 *   or a custom element both imported and matching the `customElements` patterns.
 */
export function typeCheckElement(node: ElementNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();
  const { tagName } = node;
  const namespace = getElementNamespace(tagName, context.namespace);
  const eventMap = getEventMap(namespace);
  let nativeEventType: NativeEventType = name => getNativeEventType(eventMap, name);

  if (isCustomElementTag(tagName)) {
    const metadata = context.getImportBySelector(tagName);
    const isForeign = context.isForeignElement(tagName);
    if (metadata && isForeign) {
      throw new Error(`${tagName} is both imported as a WebComponent and declared in customElements`, { cause: node.span });
    } else if (metadata) {
      lines.push(...typeCheckComponentBindings(node, metadata, nativeEventType, context));
    } else if (isForeign) {
      nativeEventType = name => getForeignEventType(eventMap, name);
      lines.push(...typeCheckNativeBindings(node, nativeEventType, context));
    } else {
      throw new Error(`${tagName} selector is not associated to any WebComponent imported in the template, nor declared in customElements`, { cause: node.span });
    }
  } else {
    lines.push(...typeCheckNativeBindings(node, nativeEventType, context));
  }

  lines.push(...typeCheckDirectives([...node.directives, ...node.structuralDirectives], tagName, nativeEventType, context));

  // The element is type-checked: the element ref naming its generic component is typed with the instantiation
  if (node.ref && context.getImportBySelector(tagName)?.typeParameters) {
    context.addInstantiation(node.span.start);
  }

  const childrenNamespace = getChildrenNamespace(tagName, namespace);
  const childrenContext = childrenNamespace === context.namespace ? context : new TypeCheckContext(context, childrenNamespace);
  const children = node.children;
  if (isStructuralElement(node)) {
    const { declarations, lines: content } = typeCheckScope(children, new TypeCheckContext(childrenContext), processNode);
    lines.push(...(declarations.length ? [plain('{'), ...indentLines(declarations.concat(content)), plain('}')] : content));
  } else {
    for (let i = 0; i < children.length; i++) {
      lines.push(...processNode(children[i], childrenContext))
    }
  }

  return lines;
}

/**
 * Type-checks the bindings of a custom element against its component metadata:
 * attributes, events and conditional bindings.
 *
 * Required properties must always be bound: directly on the element, or by a
 * conditional binding that binds them whatever branch is selected, since a
 * property bound inside a conditional binding is only set while its branch
 * is the selected one (see {@link getAlwaysBoundAttributes}).
 *
 * A generic component is instantiated with the type arguments the element declares (`<my-list(Row)>`), then with the
 * types inferred from the values bound to its properties (see {@link instantiateTypeParameters}).
 *
 * @param node - The custom element node.
 * @param declaredMetadata - Metadata of the component registered for the element's selector.
 * @param nativeEventType - Builds the type of `$event` for the native events bound on the element and in its directives.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If the element declares type arguments its component doesn't accept, a required property is missing, or is
 *   bound inside a conditional binding that may not bind it.
 */
function typeCheckComponentBindings(node: ElementNode, declaredMetadata: ComponentMetadata, nativeEventType: NativeEventType, context: TypeCheckContext): Line[] {
  assertTypeArguments(node.typeArguments, declaredMetadata, `<${node.tagName}>`);
  // The instantiation of a component named by an element ref is declared in the scope of the ref, which is typed with it
  const suffix = node.ref ? getInstantiationSuffix(node) : undefined;
  const { metadata, declarations } = instantiateTypeParameters(declaredMetadata, node.typeArguments, node.attributes, node.nameSpan, context, suffix);
  const requiredProperties = new Set(metadata.properties.entries().filter(([_, value]) => value.required).map(([key]) => key));
  const alwaysBoundAttributes = getAlwaysBoundAttributes(node.conditionalBindings);
  const lines = typeCheckComponentAttributes(node.attributes, metadata, context);

  /*
    Checked before the missing required properties, so that a required property bound
    inside a conditional binding that may not bind it gets the more specific error.
  */
  const conditionalBindingLines = typeCheckConditionalBindings(node.conditionalBindings, context, branch => {
    assertRequiredPropertiesAlwaysBound(branch.attributes, metadata, `<${node.tagName}>`, alwaysBoundAttributes);

    return [
      ...typeCheckComponentAttributes(branch.attributes, metadata, context),
      ...typeCheckClassBindings(branch.classBindings, context),
      ...typeCheckComponentEvents(branch.events, metadata, nativeEventType, context),
      ...typeCheckDirectives([...branch.directives, ...branch.structuralDirectives], node.tagName, nativeEventType, context)
    ];
  });

  for (let i = 0; i < node.attributes.length; i++) {
    const { name } = node.attributes[i];
    requiredProperties.delete(name);
  }

  for (const name of alwaysBoundAttributes) {
    requiredProperties.delete(name);
  }

  if (requiredProperties.size) {
    throw new Error(`${node.tagName} is missing the following required properties:\n ● ${Array.from(requiredProperties.values()).join('\n ● ')}`, { cause: node.span });
  }

  lines.push(...typeCheckClassBindings(node.classBindings, context));
  lines.push(...typeCheckComponentEvents(node.events, metadata, nativeEventType, context));
  lines.push(...conditionalBindingLines);

  if (!declarations) {
    return lines;
  }

  /*
    The instantiation of a generic component is declared around the checks, as the types of the bindings name it,
    or in the scope of the element ref naming the element, under names of its own
  */
  return suffix === undefined ? [plain('{'), ...indentLines([...declarations, ...lines]), plain('}')] : [...declarations, ...lines];
}

/**
 * Type-checks the directives and the structural directives applied to an element against their metadata.
 *
 * Every attribute declared in a directive must match one of its properties,
 * since a directive has no underlying element attribute to fall back to, and
 * every required property must always be bound: directly in the directive, or by
 * a conditional binding that binds it whatever branch is selected, since a
 * property bound inside a conditional binding is only set while its branch
 * is the selected one (see {@link getAlwaysBoundAttributes}). Values and events
 * are then checked like the ones of a component, except that an event not declared as an `@Event` of the
 * directive is a native event of the element it is applied to, since its listener is attached to the element.
 *
 * A structural directive is checked the same way, except that it declares neither events nor conditional bindings.
 *
 * @param directives - The directive and structural directive nodes applied to the element.
 * @param tagName - Tag name of the element, used in error messages.
 * @param nativeEventType - Builds the type of `$event` for the native events bound in the directives.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If a directive is not imported, binds an unknown property, misses a required property or binds it inside a conditional binding that may not bind it.
 */
function typeCheckDirectives(directives: (DirectiveNode | StructuralDirectiveNode)[], tagName: string, nativeEventType: NativeEventType, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < directives.length; i++) {
    const directive = directives[i];
    const { selector, attributes, span, type, typeArguments } = directive;
    const { events, conditionalBindings } = type === ASTNodeType.Directive ? directive : { events: [], conditionalBindings: [] };
    const owner = `${type === ASTNodeType.Directive ? '@@' : '*'}${selector}`;
    const declaredMetadata = context.getDirectiveBySelector(selector);
    if (!declaredMetadata) {
      throw new Error(`${owner} selector is not associated to any Directive imported in the template`, { cause: span });
    }

    assertTypeArguments(typeArguments, declaredMetadata, owner);
    const { metadata, declarations } = instantiateTypeParameters(declaredMetadata, typeArguments, attributes, directive.selectorSpan, context);
    assertDirectiveProperties(attributes, metadata, owner);
    const alwaysBoundAttributes = getAlwaysBoundAttributes(conditionalBindings);

    /*
      Checked before the missing required properties, so that a required property bound
      inside a conditional binding that may not bind it gets the more specific error.
    */
    const conditionalBindingLines = typeCheckConditionalBindings(conditionalBindings, context, branch => {
      assertDirectiveProperties(branch.attributes, metadata, owner);
      assertRequiredPropertiesAlwaysBound(branch.attributes, metadata, owner, alwaysBoundAttributes);

      return [
        ...typeCheckComponentAttributes(branch.attributes, metadata, context),
        ...typeCheckComponentEvents(branch.events, metadata, nativeEventType, context)
      ];
    });

    const requiredProperties = new Set(metadata.properties.entries().filter(([_, value]) => value.required).map(([key]) => key));
    for (let j = 0; j < attributes.length; j++) {
      requiredProperties.delete(attributes[j].name);
    }

    for (const name of alwaysBoundAttributes) {
      requiredProperties.delete(name);
    }

    if (requiredProperties.size) {
      throw new Error(`${owner} on <${tagName}> is missing the following required properties:\n ● ${Array.from(requiredProperties.values()).join('\n ● ')}`, { cause: span });
    }

    const directiveLines = [
      ...typeCheckComponentAttributes(attributes, metadata, context),
      ...typeCheckComponentEvents(events, metadata, nativeEventType, context),
      ...conditionalBindingLines
    ];

    // The type arguments the template passes are declared around the checks, as the types of the bindings name them
    if (declarations) {
      lines.push(plain('{'), ...indentLines([...declarations, ...directiveLines]), plain('}'));
    } else {
      lines.push(...directiveLines);
    }
  }

  return lines;
}

/**
 * Ensures the type arguments a directive or an element declares fit the class of the directive or of the web component:
 * a class that is not generic accepts none, and a generic one at most as many as it has type parameters (see
 * {@link instantiateTypeParameters} for the omitted ones).
 *
 * @param typeArguments - The type arguments the directive or the element declares, if any.
 * @param metadata - Metadata of the directive or of the web component.
 * @param owner - The directive (`@@selector`), the structural directive (`*selector`) or the element (`<tag-name>`), used in error messages.
 * @throws If type arguments are declared and the class is not generic, or more than its type parameters are declared.
 */
function assertTypeArguments(typeArguments: DirectiveNode['typeArguments'], metadata: ComponentOrDirectiveMetadata, owner: string): void {
  if (!typeArguments) {
    return;
  }

  const cause = getTypeArgumentsSpan(typeArguments);
  if (!metadata.typeParameters) {
    throw new Error(`${owner} declares type arguments, but ${metadata.className} is not generic.`, { cause });
  }

  if (typeArguments.length > metadata.typeParameters.length) {
    throw new Error(`${owner} declares ${typeArguments.length} type arguments, but ${metadata.className} has ${metadata.typeParameters.length} type parameters (${metadata.typeParameters.map(({ name }) => name).join(', ')}).`, { cause });
  }
}

/**
 * Returns the span of a list of type arguments, from the start of the first one to the end of the last one.
 *
 * @param typeArguments - The type arguments, at least one.
 * @returns The span covering them.
 */
function getTypeArgumentsSpan(typeArguments: NonNullable<DirectiveNode['typeArguments']>): Span {
  return { start: typeArguments[0].span.start, end: typeArguments[typeArguments.length - 1].span.end };
}

/**
 * The function inferring the type parameters of a generic directive from the values bound to its properties.
 */
const PROBE = '__probe';

/**
 * The result of the call to {@link PROBE}.
 */
const PROBED_VALUE = '__probed';

/**
 * The type of {@link PROBED_VALUE}: the tuple of the types inferred for the type parameters.
 */
const PROBED = '__Probed';

/**
 * Instantiates the type parameters of a generic component or directive, so that the types of its properties and events,
 * written in terms of its type parameters, resolve to the types of the template.
 *
 * As TypeScript does for a call, the type parameters are either all given or all inferred:
 * - when the template passes type arguments (`@@list<Row>(…)`, `<my-list(Row)>`), the class is instantiated with them
 *   only, each one written as is and mapped onto its span in the template (`List<Row>`): the type parameters left out
 *   take their default type, and TypeScript reports the ones without it. A type argument can name a type the template
 *   imports, even one named like the type parameter;
 * - otherwise, a type parameter gets the type TypeScript infers from the values bound to the properties, when it finds
 *   one: a call to a function declared with the same type parameters and the types of those properties infers them, as
 *   it does for a function. The call is not checked: the real checks of the bindings report its errors. A type parameter
 *   nothing is inferred for gets its default type, if it has one, or `any`.
 *
 * The type parameters are always read through the class instantiated with them, in a line mapped onto the type arguments
 * (or the selector of the directive, or the tag name of the element, when there are none), so that a type that doesn't
 * satisfy a constraint is reported there.
 *
 * The declarations of a generic component named by an element ref are written in the scope of the ref, which
 * is typed with the instantiation: their names end with a suffix telling them apart from the ones of the other elements
 * of the scope, and the instantiation is declared even when nothing is inferred.
 *
 * @param metadata - Metadata of the component or of the directive.
 * @param typeArguments - The type arguments the template passes, if any.
 * @param attributes - The attributes bound to the properties, whose values the type parameters are inferred from.
 * @param ownerSpan - Span of the selector of the directive, or of the tag name of the element.
 * @param context - Current type-check scope.
 * @param suffix - The suffix of the names of the declarations of a component named by an element ref (see
 *   `getInstantiationSuffix`), `undefined` when they are written around the checks of the bindings.
 * @returns The metadata to check the bindings against, and the lines to write before the checks, `undefined` when the
 *   type parameters are neither declared nor inferred, and the instantiation needs no name.
 */
function instantiateTypeParameters<Metadata extends ComponentOrDirectiveMetadata>(metadata: Metadata, typeArguments: DirectiveNode['typeArguments'], attributes: AttributeNode[], ownerSpan: Span, context: TypeCheckContext, suffix?: string): { metadata: Metadata, declarations?: Line[] } {
  const { typeParameters } = metadata;
  if (!typeParameters) {
    return { metadata };
  }

  const { klass } = metadata.typescriptNodes;
  const sourceFile = klass.getSourceFile();
  const base = getAccessorOwnerType(klass, sourceFile, false);
  const generic = getAccessorOwnerType(klass, sourceFile, true);
  const instantiate = (names: string[]): string => (names.length ? `${base}<${names.join(', ')}>` : base);
  const instanceName = `${INSTANCE}${suffix ?? ''}`;
  const probedName = `${PROBED}${suffix ?? ''}`;

  if (typeArguments) {
    // Each type argument is written as is, mapped onto its own span, inside the instantiation mapped onto all of them
    let instance = `${base}<`;
    const segments = new Array<LineMapping>();
    for (let i = 0; i < typeArguments.length; i++) {
      const { text, span } = typeArguments[i];
      instance = `${instance}${i ? ', ' : ''}`;
      segments.push({ columnStart: instance.length, columnEnd: instance.length + text.length, original: span });
      instance = `${instance}${text}`;
    }

    const declaration = line(`type ${instanceName} = `, mappedSegments(`${instance}>`, getTypeArgumentsSpan(typeArguments), segments), ';');
    return { metadata: withOwnerType(metadata, generic, instanceName), declarations: [declaration] };
  }

  const probe = inferTypeParameters(metadata, base, attributes, context, suffix);
  const argumentsOf = (index: number): string => (probe ? `unknown extends ${probedName}[${index}] ? any : ${probedName}[${index}]` : 'any');

  // The parameters with a default type come last: the ones nothing gives a type to take it when the class is instantiated without them
  const firstDefault = typeParameters.findIndex(({ hasDefault }) => hasDefault);
  const given = new Array<string>();
  for (let i = 0; i < (firstDefault === -1 ? typeParameters.length : firstDefault); i++) {
    given.push(argumentsOf(i));
  }

  let instance = instantiate(given);
  if (!probe) {
    // An element ref is typed with the instantiation, even when nothing is inferred
    return suffix === undefined
      ? { metadata: withOwnerType(metadata, generic, instance) }
      : { metadata: withOwnerType(metadata, generic, instanceName), declarations: [plain(`type ${instanceName} = ${instance};`)] };
  }

  if (firstDefault !== -1) {
    const defaults = typeParameters.slice(firstDefault).map((_, offset) => firstDefault + offset);
    const inferred = instantiate([...given, ...defaults.map(argumentsOf)]);
    const none = `[${defaults.map(() => 'unknown').join(', ')}] extends [${defaults.map(index => `${probedName}[${index}]`).join(', ')}]`;
    instance = `${none} ? ${instance} : ${inferred}`;
  }

  return { metadata: withOwnerType(metadata, generic, instanceName), declarations: [...probe, line(`type ${instanceName} = `, mapped(instance, ownerSpan), ';')] };
}

/**
 * Writes the lines inferring the type parameters of a generic component or directive from the values bound to its properties: a
 * function declared with the same type parameters, whose parameters have the types of those properties, called with
 * the values, returns the inferred types. The function and its call are not checked (`@ts-ignore`): its type parameters
 * have no constraint, and a value that doesn't fit its property is reported by the real checks of the bindings.
 *
 * @param metadata - Metadata of the generic component or directive.
 * @param base - The type of the class, without type arguments.
 * @param attributes - The attributes bound to the properties.
 * @param context - Current type-check scope.
 * @param suffix - The suffix of the names of the declarations, if any (see {@link instantiateTypeParameters}).
 * @returns The lines declaring `Probed`, the tuple of the inferred types, `undefined` if no property bound can infer one.
 */
function inferTypeParameters(metadata: ComponentOrDirectiveMetadata, base: string, attributes: AttributeNode[], context: TypeCheckContext, suffix = ''): Line[] | undefined {
  const names = metadata.typeParameters!.map((_, index) => `P${index}`);
  const owner = `${base}<${names.join(', ')}>`;
  const parameters = new Array<string>();
  const values = new Array<LinePart>();

  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes[i];
    const property = metadata.properties.get(name);
    // The type of a property is the one of the value of its accessor only when it is read from it
    if (property?.type.startsWith('ReturnType<')) {
      parameters.push(`value${parameters.length}: ${owner}['${property.name}']`);
      if (values.length) {
        values.push(', ');
      }

      if (typeof value === 'object') {
        values.push('() => (', mappedExpression(value.expression, context, value.span), ')');
      } else {
        values.push('(): string => \'\'');
      }
    }
  }

  if (!parameters.length) {
    return undefined;
  }

  return [
    plain('// @ts-ignore'),
    plain(`function ${PROBE}${suffix}<${names.join(', ')}>(${parameters.join(', ')}): [${names.join(', ')}] { return null!; }`),
    plain('// @ts-ignore'),
    line(`const ${PROBED_VALUE}${suffix} = ${PROBE}${suffix}(`, ...values, ');'),
    plain(`type ${PROBED}${suffix} = typeof ${PROBED_VALUE}${suffix};`)
  ];
}

/**
 * Copies the metadata of a component or of a directive writing the types of its properties and events in terms of
 * another type of its class.
 *
 * @param metadata - Metadata of the component or of the directive.
 * @param from - The type of the class the types are written in terms of.
 * @param to - The type of the class to write them in terms of.
 * @returns The metadata, with `from` replaced by `to` in every type.
 */
function withOwnerType<Metadata extends ComponentOrDirectiveMetadata>(metadata: Metadata, from: string, to: string): Metadata {
  const properties = new Map<string, ComponentPropertyMetadata>();
  for (const [name, property] of metadata.properties) {
    properties.set(name, new ComponentPropertyMetadata(property.name, property.type.replaceAll(from, () => to), { required: property.required, alias: property.alias, declaration: property.declaration }));
  }

  const events = new Map<string, ComponentEventMetadata>();
  for (const [name, event] of metadata.events) {
    events.set(name, { ...event, type: event.type.replaceAll(from, () => to) });
  }

  return { ...metadata, properties, events };
}

/**
 * Ensures every attribute bound to a directive matches one of its properties.
 *
 * @param attributes - The attribute nodes bound to the directive.
 * @param metadata - Metadata of the directive the attributes are bound to.
 * @param owner - The directive (`@@selector`) or the structural directive (`*selector`) the attributes are bound to, used in error messages.
 * @throws If an attribute doesn't match any property of the directive.
 */
function assertDirectiveProperties(attributes: AttributeNode[], metadata: ComponentOrDirectiveMetadata, owner: string): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, span } = attributes[i];
    if (!metadata.properties.has(name)) {
      throw new Error(`Unknown property "${name}" on ${owner} (${metadata.className} has no @Property with this name).`, { cause: span });
    }
  }
}

/**
 * Ensures the required properties bound in a branch of a conditional binding are bound whatever branch
 * is selected: a required property the selected branch doesn't bind, or bound by a conditional binding
 * that may select no branch at all, would be left without a value.
 *
 * @param attributes - The attribute nodes bound in the branch.
 * @param metadata - Metadata of the component or directive the attributes are bound to.
 * @param owner - The element (`<tag-name>`) or the directive (`@@selector`) the attributes are bound to, used in error messages.
 * @param alwaysBoundAttributes - Names of the attributes the conditional bindings of the owner bind whatever branch is selected.
 * @throws If a required property is bound in the branch without being bound whatever branch is selected.
 */
function assertRequiredPropertiesAlwaysBound(attributes: AttributeNode[], metadata: ComponentOrDirectiveMetadata, owner: string, alwaysBoundAttributes: ReadonlySet<string>): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, span } = attributes[i];
    if (metadata.properties.get(name)?.required && !alwaysBoundAttributes.has(name)) {
      throw new Error(`Required property "${name}" of ${owner} must always be bound: bind it in every branch of its conditional binding, including an @else or @default one, or outside of it.`, { cause: span });
    }
  }
}

/**
 * Collects the names of the attributes a list of conditional bindings binds whatever branch is selected.
 *
 * A conditional binding always binds an attribute when it always selects a branch, i.e. it ends with an
 * `@else` or a `@default` branch, and each of its branches binds the attribute: directly, or through the
 * conditional bindings nested in the branch, which must in turn always bind it.
 *
 * @param conditionalBindings - The conditional bindings declared on an element, in a directive or in a branch.
 * @returns The names of the attributes bound whatever branch is selected.
 */
function getAlwaysBoundAttributes(conditionalBindings: ConditionalBindingNode[]): Set<string> {
  const alwaysBoundAttributes = new Set<string>();

  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];

    // Without an `@else` or a `@default` branch closing it, a conditional binding may select no branch at all
    if (branches.at(-1)?.condition !== null) {
      continue;
    }

    const [first, ...others] = branches.map(branch => new Set([
      ...branch.attributes.map(({ name }) => name),
      ...getAlwaysBoundAttributes(branch.conditionalBindings)
    ]));

    for (const name of first) {
      if (others.every(boundInBranch => boundInBranch.has(name))) {
        alwaysBoundAttributes.add(name);
      }
    }
  }

  return alwaysBoundAttributes;
}

/**
 * Type-checks attributes bound to component or directive properties, checking each value
 * `satisfies` the property's declared type. Expression values are checked
 * against the resolved expression, literal values as a `string`. Attributes
 * that don't match a property are ignored.
 *
 * A property is an input, so it always needs a value: the form without one (`<my-el label>`), which is only valid
 * for the attributes of a native element, is rejected.
 *
 * @param attributes - The attribute nodes to type-check.
 * @param metadata - Metadata of the component or directive the attributes are bound to.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines, one block per bound property.
 * @throws If a property is bound without a value.
 */
function typeCheckComponentAttributes(attributes: AttributeNode[], metadata: ComponentOrDirectiveMetadata, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < attributes.length; i++) {
    const { name, value, span, bare } = attributes[i];
    const property = metadata.properties.get(name);
    if (property) {
      if (bare) {
        throw new Error(`Property "${name}" needs a value: write ${name}="…" or ${name}="{ expression }". An attribute without a value is only valid on a native element.`, { cause: span });
      }

      lines.push(
        plain('{'),
        ...indentLines(typeof value === 'object'
          // `satisfies` and the type are mapped onto the binding, as TypeScript reports a value that doesn't satisfy the type on `satisfies`
          ? [line('(', mappedExpression(value.expression, context, value.span), ') ', mapped(`satisfies ${property.type}`, span), ';')]
          : [plain('let x!: string;'), line(mapped(`x satisfies ${property.type};`, span))]
        ),
        plain('}')
      );
    }
  }

  return lines;
}

/**
 * Type-checks event bindings against the component's or directive's `@Event`s, typing `$event` as
 * `CustomEvent<payload type>`, or `CustomEvent<null>` for an event without payload (see {@link typeCheckEvent}).
 * An event not declared as an `@Event` is a native event of the element the component is, or the directive is
 * applied to, since its listener is attached to the element: `$event` is typed through `nativeEventType`, so an
 * event name the element doesn't dispatch, such as a misspelled `@Event`, is reported by TypeScript. The name is
 * checked even when the handler is not passed `$event`.
 *
 * @param events - The event nodes to type-check.
 * @param metadata - Metadata of the component or directive emitting the events.
 * @param nativeEventType - Builds the type of `$event` for the native events of the element.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines, one call per event, wrapped in a block when it declares `$event`.
 */
function typeCheckComponentEvents(events: EventNode[], metadata: ComponentOrDirectiveMetadata, nativeEventType: NativeEventType, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < events.length; i++) {
    const { name, nameSpan, parameters, span } = events[i];
    const event = metadata.events.get(name);

    if (event) {
      // An event without payload is emitted without detail, which the CustomEvent sets to null
      lines.push(...typeCheckEvent(events[i], `CustomEvent<${event.type === 'void' ? 'null' : event.type}>`, context));
    } else {
      const eventType = nativeEventType(name);
      passesEvent(parameters) 
        ? lines.push(...typeCheckEvent(events[i], eventType, context))
        : lines.push(line(mappedEventName(`null! satisfies ${eventType};`, span, name, nameSpan)), ...typeCheckEvent(events[i], eventType, context));
    }
  }

  return lines;
}

/**
 * Type-checks the bindings of a native element, or of a custom element of another library: attributes, events and
 * conditional bindings.
 *
 * @param node - The element node.
 * @param nativeEventType - Builds the type of `$event` for the native events of the element and of the directives applied to it.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If the element declares type arguments: only a web component imported in the template has a class to pass them to.
 */
function typeCheckNativeBindings(node: ElementNode, nativeEventType: NativeEventType, context: TypeCheckContext): Line[] {
  if (node.typeArguments) {
    throw new Error(`<${node.tagName}> declares type arguments, but only a WebComponent imported in the template can declare them.`, { cause: getTypeArgumentsSpan(node.typeArguments) });
  }

  return [
    ...typeCheckNativeAttributes(node.attributes, context),
    ...typeCheckClassBindings(node.classBindings, context),
    ...typeCheckNativeEvents(node.events, nativeEventType, context),
    ...typeCheckConditionalBindings(node.conditionalBindings, context, branch => [
      ...typeCheckNativeAttributes(branch.attributes, context),
      ...typeCheckClassBindings(branch.classBindings, context),
      ...typeCheckNativeEvents(branch.events, nativeEventType, context),
      ...typeCheckDirectives([...branch.directives, ...branch.structuralDirectives], node.tagName, nativeEventType, context)
    ])
  ];
}

/**
 * Type-checks the expression attributes of a native element by emitting each
 * resolved expression as a statement. Literal attributes are skipped.
 *
 * @param attributes - The attribute nodes to type-check.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines, one per expression attribute.
 */
function typeCheckNativeAttributes(attributes: AttributeNode[], context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < attributes.length; i++) {
    const { value } = attributes[i];
    if (typeof value !== 'string') {
      lines.push(line(mappedExpression(value.expression, context, value.span, ';')));
    }
  };

  return lines;
}

/**
 * Type-checks the classes toggled on an element, native or not, by emitting each expression as a statement:
 * a value of any type toggles the class, by whether it is truthy.
 *
 * @param classBindings - The class binding nodes to type-check.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines, one per class binding.
 */
function typeCheckClassBindings(classBindings: ClassBindingNode[], context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < classBindings.length; i++) {
    const { value } = classBindings[i];
    lines.push(line(mappedExpression(value.expression, context, value.span, ';')));
  }

  return lines;
}

/**
 * Type-checks the event bindings of a native element, typing `$event` through the
 * event map of the element (see {@link typeCheckEvent}), e.g. `HTMLElementEventMap['click']`.
 *
 * @param events - The event nodes to type-check.
 * @param nativeEventType - Builds the type of `$event` for the native events of the element.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines, one call per event, wrapped in a block when it declares `$event`.
 */
function typeCheckNativeEvents(events: EventNode[], nativeEventType: NativeEventType, context: TypeCheckContext): Line[] {
  return events.flatMap(event => typeCheckEvent(event, nativeEventType(event.name), context));
}

/**
 * Type-checks an event binding by emitting a call to the handler on `root`, or as written for a handler the template
 * imports, with its resolved arguments.
 * When the handler is passed `$event`, the call is wrapped in a block declaring `$event` with the type
 * of the event, so that the following events can declare it again.
 *
 * @param event - The event node to type-check.
 * @param eventType - The type of `$event`.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines: the call, wrapped in a block when it declares `$event`.
 */
function typeCheckEvent({ name, nameSpan, handler, handlerSpan, parameters, span }: EventNode, eventType: string, context: TypeCheckContext): Line[] {
  const eventContext = new TypeCheckContext(context);
  eventContext.addUnresolvableIdentifier('$event');
  for (let i = 0; i < parameters.length; i++) {
    // The beginning of `$event` is left as written, not read from the component, so that TypeScript proposes `$event`
    const parameter = parameters[i];
    if (isEventBeginning(parameter) && parameter.text !== '$event') {
      eventContext.addUnresolvableIdentifier(parameter.text);
    }
  }

  /*
    The whole call is mapped onto the span of the event binding (the whole `(click)="handler($event)"`),
    the handler onto its name and each argument finely, like any other expression.
  */
  /*
    A handler on a variable of the template (`item.set()`, `dialog.showModal()`) or one the template imports (`track()`,
    `analytics.track()`) is called as written, as the generated code does, any other one as a method on the component
  */
  const head = handler.split(/\?\.|[.[]/)[0];
  const receiver = context.hasUnresolvableIdentifier(head) || context.getImportedIdentifier(head) ? '' : 'root.';
  const callee = `${receiver}${handler}(`;
  const segments: LineMapping[] = [{ columnStart: receiver.length, columnEnd: receiver.length + handler.length, original: handlerSpan }];
  let call = callee;

  for (let i = 0; i < parameters.length; i++) {
    const separator = i ? ', ' : '';
    const argumentSegments = new Array<LineMapping>();
    const argument = resolveExpression(parameters[i], eventContext, { resolver: 'root' }, argumentSegments).expression;
    const column = call.length + separator.length;

    for (let j = 0; j < argumentSegments.length; j++) {
      const { columnStart, columnEnd, original } = argumentSegments[j];
      segments.push({ columnStart: column + columnStart, columnEnd: column + columnEnd, original });
    }

    call = `${call}${separator}${argument}`;
  }

  const callLine = line(mappedSegments(`${call});`, span, segments));

  return passesEvent(parameters)
    ? [
      plain('{'),
      ...indentLines([
        line(mappedEventName(`let $event!: ${eventType};`, span, name, nameSpan)),
        callLine
      ]),
      plain('}')
    ]
    : [callLine];
}

/**
 * Maps a text typing an event by its name (e.g. `let $event!: HTMLElementEventMap['click'];`) onto the span of the
 * event binding, and the name quoted in it onto the name of the event, where TypeScript reports an unknown event.
 *
 * @param text - The text typing the event.
 * @param span - The span of the event binding.
 * @param name - The name of the event.
 * @param nameSpan - The span of the name of the event.
 * @returns The mapped fragment.
 */
function mappedEventName(text: string, span: Span, name: string, nameSpan: Span): LinePart {
  const nameColumn = text.indexOf(`'${name}'`) + 1;
  return mappedSegments(text, span, nameColumn ? [{ columnStart: nameColumn, columnEnd: nameColumn + name.length, original: nameSpan }] : []);
}

/**
 * Tells whether an event binding passes `$event` to its handler.
 *
 * `$event` can only be passed as a whole parameter: a parameter merely referencing it, like `$event.target`,
 * doesn't count, so `$event` is left undeclared and TypeScript reports it.
 *
 * The beginning of `$event` being written (`$`, `$ev`…) counts too, so that `$event` is declared, and TypeScript
 * proposes it: the incomplete name itself is reported by TypeScript, as it is not declared.
 *
 * @param parameters - The parameters of the event binding.
 * @returns `true` if one of the parameters is `$event`, or its beginning, `false` otherwise.
 */
function passesEvent(parameters: Expression[]): boolean {
  return parameters.some(isEventBeginning);
}

/**
 * Tells whether an expression is `$event`, or the beginning of it being written (`$`, `$ev`…).
 *
 * @param expression - The expression.
 * @returns `true` if the expression is an identifier `$event` starts with.
 */
function isEventBeginning(expression: Expression): expression is Identifier {
  return isIdentifier(expression) && expression.text.startsWith('$') && '$event'.startsWith(expression.text);
}

/**
 * Type-checks conditional bindings as real, nested TypeScript control flow, exactly like the `@if`
 * and `@switch` blocks declared in the template content: an `@if` chain becomes an `if` / `else if` / `else`
 * chain and a `@switch` a `switch` statement. Conditions and expressions are therefore checked (and narrow
 * inside their block), while the bound attributes/events/directives of each branch are checked by `bindings`,
 * exactly as if they were declared directly on the element or on the directive.
 *
 * @param conditionalBindings - The conditional bindings to type-check.
 * @param context - Current type-check scope.
 * @param bindings - Emits the type-check lines for the attributes, events and directives of a single branch.
 * @returns The generated type-check lines.
 */
function typeCheckConditionalBindings(conditionalBindings: ConditionalBindingNode[], context: TypeCheckContext, bindings: (branch: ConditionalBindingBranchNode) => Line[]): Line[] {
  const lines = new Array<Line>();
  // The bindings of a branch are followed by the conditional bindings nested in it
  const typeCheckBranch = (branch: ConditionalBindingBranchNode): Line[] => indentLines([
    ...bindings(branch),
    ...typeCheckConditionalBindings(branch.conditionalBindings, context, bindings)
  ]);

  for (let i = 0; i < conditionalBindings.length; i++) {
    const conditionalBinding = conditionalBindings[i];
    lines.push(...(conditionalBinding.type === ASTNodeType.SwitchBinding
      ? typeCheckSwitchBinding(conditionalBinding, context, typeCheckBranch)
      : typeCheckIfBinding(conditionalBinding, context, typeCheckBranch)
    ));
  }

  return lines;
}

/**
 * Type-checks an `@if` conditional binding as a real TypeScript `if` / `else if` / `else` chain,
 * which gives each branch the negated narrowing of every condition preceding it.
 *
 * @param node - The `@if` conditional binding to type-check.
 * @param context - Current type-check scope.
 * @param typeCheckBranch - Emits the type-check lines for the content of a branch.
 * @returns The generated type-check lines.
 */
function typeCheckIfBinding(node: IfBindingNode, context: TypeCheckContext, typeCheckBranch: (branch: ConditionalBindingBranchNode) => Line[]): Line[] {
  const lines = new Array<Line>();
  const { branches } = node;

  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const { condition, span } = branch;

    lines.push(
      // Only the first branch opens the chain, only the `@else` one has no condition
      condition
        ? line(i ? 'else if (' : 'if (', mappedExpression(condition, context, span), ') {')
        : plain('else {'),
      ...typeCheckBranch(branch),
      plain('}')
    );
  }

  return lines;
}

/**
 * Type-checks a `@switch` conditional binding as a real TypeScript `switch` statement, which validates
 * each `@case` value against the type of the expression and narrows the expression inside each branch.
 *
 * The `@case`s sharing a branch are emitted as stacked `case` labels sharing the same body.
 *
 * @param node - The `@switch` conditional binding to type-check.
 * @param context - Current type-check scope.
 * @param typeCheckBranch - Emits the type-check lines for the content of a branch.
 * @returns The generated type-check lines.
 */
function typeCheckSwitchBinding(node: SwitchBindingNode, context: TypeCheckContext, typeCheckBranch: (branch: ConditionalBindingBranchNode) => Line[]): Line[] {
  const lines = [line('switch (', mappedExpression(node.expression, context, node.span), ') {')];

  const { branches } = node;
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const labels = branch.condition?.map((condition, index) => line('case ', mapped(condition, branch.conditionSpans[index]), ':')) ?? [plain('default:')];

    lines.push(...indentLines([
      ...labels,
      ...typeCheckBranch(branch),
      ...indentLines([plain('break;')])
    ]));
  }

  lines.push(plain('}'));

  return lines;
}

/**
 * Returns the type of `$event` for a native event, indexing the event map of the element by the event name
 * (e.g. `HTMLElementEventMap['click']`), so an event name the map doesn't declare is reported by TypeScript.
 *
 * @param eventMap - Event map of the element the event is bound to.
 * @param name - Name of the native event.
 * @returns The indexed access type typing `$event`.
 */
function getNativeEventType(eventMap: string, name: string): string {
  return `${eventMap}['${name}']`
}

/**
 * Returns the type of `$event` for an event of a custom element of another library: the type the event map of
 * the element declares for the event name, or `any` for an event the map doesn't declare, since the element
 * may dispatch events of its own. The type is inferred instead of indexed, since TypeScript checks an indexed access
 * even in the branch of a conditional type that excludes it.
 *
 * @param eventMap - Event map of the element the event is bound to.
 * @param name - Name of the event.
 * @returns The conditional type typing `$event`.
 */
function getForeignEventType(eventMap: string, name: string): string {
  return `(${eventMap} extends { '${name}': infer Event } ? Event : any)`;
}

/**
 * Tells whether a tag name identifies a custom element, i.e. it starts with
 * a lowercase letter and contains at least one dash.
 *
 * @param tagName - The tag name to classify.
 * @returns `true` if the tag name is a custom element name, `false` otherwise.
 */
export function isCustomElementTag(tagName: string): boolean {
  return /^[a-z][a-z0-9._\-]*-[a-z0-9._\-]*$/.test(tagName);
}