// states/type-check-element.state.ts
import type { Expression } from 'typescript';
import { isIdentifier } from 'typescript';
import { resolveExpression } from '../../../generator/utils/generator/generator.utils';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { AttributeNode } from '../../../parser/types/nodes/attribute-node.type';
import type { ConditionalBindingBranchNode } from '../../../parser/types/nodes/conditional-binding-branch-node.type';
import type { ConditionalBindingNode } from '../../../parser/types/nodes/conditional-binding-node.type';
import type { DirectiveNode } from '../../../parser/types/nodes/directive-node.type';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import type { EventNode } from '../../../parser/types/nodes/event-node.type';
import type { IfBindingNode } from '../../../parser/types/nodes/if-binding-node.type';
import type { StructuralDirectiveNode } from '../../../parser/types/nodes/structural-directive-node.type';
import type { SwitchBindingNode } from '../../../parser/types/nodes/switch-binding-node.type';
import { ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
import type { ComponentOrDirectiveMetadata } from '../../../types/component-or-directive-metadata.type';
import type { DirectiveMetadata } from '../../../types/directive-metadata.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import type { ElementEventMap } from '../../types/element-event-map.type';
import type { Span } from '../../../types/span.type';
import { Line, LineMapping } from '../../types/generated-line.type';
import type { NativeEventType } from '../../types/native-event-type.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, type LinePart, mapped, mappedSegments, plain } from '../../utils/line-builder/line-builder.utils';
import { mappedExpression } from '../../utils/mapped-expression/mapped-expression.utils';

/**
 * Type-checks an element node: emits the type-check lines for its
 * attributes, events, conditional bindings, directives and structural directives, then recurses into its children.
 *
 * Custom elements (tag names containing a dash) are checked against the
 * metadata of the component imported for their selector; native elements, and the custom elements of other
 * libraries matching the `customElements` patterns, only get their expressions and event handlers checked.
 *
 * The native events of the element are typed through the event map of its namespace (see {@link getElementEventMap}),
 * which its children inherit: the children of an `<svg>` or a `<math>` element are type-checked in a scope declaring it.
 * A custom element of another library may dispatch events the map doesn't declare: their `$event` is `any`.
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
  const eventMap = getElementEventMap(tagName, context);
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

  const childrenEventMap = getChildrenEventMap(node.tagName, eventMap);
  const childrenContext = childrenEventMap === context.eventMap ? context : new TypeCheckContext(context, childrenEventMap);
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    lines.push(...processNode(children[i], childrenContext))
  }

  return lines;
}

/**
 * Returns the event map of an element, which depends on the namespace it is created in, exactly like the generated
 * render code does: an `<svg>` and a `<math>` element open the SVG and the MathML namespace, any other
 * element is created in the namespace of the scope it is declared in.
 *
 * @param tagName - Tag name of the element.
 * @param context - Current type-check scope.
 * @returns The event map typing the native events of the element.
 */
function getElementEventMap(tagName: string, context: TypeCheckContext): ElementEventMap {
  switch (tagName) {
    case 'svg':
      return 'SVGElementEventMap';
    case 'math':
      return 'MathMLElementEventMap';
    default:
      return context.eventMap;
  }
}

/**
 * Returns the event map of the children of an element, exactly like the generated render code creates them:
 * in the namespace of the element, except for the children of a `<foreignObject>`, which are HTML elements.
 *
 * @param tagName - Tag name of the element.
 * @param eventMap - Event map of the element.
 * @returns The event map typing the native events of the children of the element.
 */
function getChildrenEventMap(tagName: string, eventMap: ElementEventMap): ElementEventMap {
  switch (tagName) {
    case 'foreignObject':
      return 'HTMLElementEventMap';
    default:
      return eventMap;
  }
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
 * @param node - The custom element node.
 * @param metadata - Metadata of the component registered for the element's selector.
 * @param nativeEventType - Builds the type of `$event` for the native events bound on the element and in its directives.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If a required property is missing, or is bound inside a conditional binding that may not bind it.
 */
function typeCheckComponentBindings(node: ElementNode, metadata: ComponentMetadata, nativeEventType: NativeEventType, context: TypeCheckContext): Line[] {
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
      ...typeCheckComponentEvents(branch.events, metadata, nativeEventType, context),
      ...typeCheckDirectives([...branch.directives, ...branch.structuralDirectives], node.tagName, nativeEventType, context)
    ];
  });

  for (let i = 0; i < node.attributes.length; i++) {
    const { name } = node.attributes[i];
    requiredProperties.delete(name);
  }

  alwaysBoundAttributes.forEach(name => requiredProperties.delete(name));

  if (requiredProperties.size) {
    throw new Error(`${node.tagName} is missing the following required properties:\n ● ${Array.from(requiredProperties.values()).join('\n ● ')}`, { cause: node.span });
  }

  lines.push(...typeCheckComponentEvents(node.events, metadata, nativeEventType, context));
  lines.push(...conditionalBindingLines);

  return lines;
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
    const { selector, attributes, span, type } = directive;
    const { events, conditionalBindings } = type === ASTNodeType.Directive ? directive : { events: [], conditionalBindings: [] };
    const owner = `${type === ASTNodeType.Directive ? '@@' : '*'}${selector}`;
    const metadata = context.getDirectiveBySelector(selector);
    if (!metadata) {
      throw new Error(`${owner} selector is not associated to any Directive imported in the template`, { cause: span });
    }

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

    alwaysBoundAttributes.forEach(name => requiredProperties.delete(name));

    if (requiredProperties.size) {
      throw new Error(`${owner} on <${tagName}> is missing the following required properties:\n ● ${Array.from(requiredProperties.values()).join('\n ● ')}`, { cause: span });
    }

    lines.push(
      ...typeCheckComponentAttributes(attributes, metadata, context),
      ...typeCheckComponentEvents(events, metadata, nativeEventType, context),
      ...conditionalBindingLines
    );
  }

  return lines;
}

/**
 * Ensures every attribute bound to a directive matches one of its properties.
 *
 * @param attributes - The attribute nodes bound to the directive.
 * @param metadata - Metadata of the directive the attributes are bound to.
 * @param owner - The directive (`@@selector`) or the structural directive (`*selector`) the attributes are bound to, used in error messages.
 * @throws If an attribute doesn't match any property of the directive.
 */
function assertDirectiveProperties(attributes: AttributeNode[], metadata: DirectiveMetadata, owner: string): void {
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

    first.forEach(name => {
      if (others.every(boundInBranch => boundInBranch.has(name))) {
        alwaysBoundAttributes.add(name);
      }
    });
  }

  return alwaysBoundAttributes;
}

/**
 * Type-checks attributes bound to component or directive properties, checking each value
 * `satisfies` the property's declared type. Expression values are checked
 * against the resolved expression, literal values as a `string`. Attributes
 * that don't match a property are ignored.
 *
 * @param attributes - The attribute nodes to type-check.
 * @param metadata - Metadata of the component or directive the attributes are bound to.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines, one block per bound property.
 */
function typeCheckComponentAttributes(attributes: AttributeNode[], metadata: ComponentOrDirectiveMetadata, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes[i];
    const property = metadata.properties.get(name);
    if (property) {
      lines.push(
        plain('{'),
        ...indentLines(typeof value === 'object'
          ? [line('(', mappedExpression(value.expression, context, value.span), `) satisfies ${property.type};`)]
          : [plain('let x!: string;'), line(mapped(`x satisfies ${property.type};`, attributes[i].span))]
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
 */
function typeCheckNativeBindings(node: ElementNode, nativeEventType: NativeEventType, context: TypeCheckContext): Line[] {
  return [
    ...typeCheckNativeAttributes(node.attributes, context),
    ...typeCheckNativeEvents(node.events, nativeEventType, context),
    ...typeCheckConditionalBindings(node.conditionalBindings, context, branch => [
      ...typeCheckNativeAttributes(branch.attributes, context),
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
 * Type-checks an event binding by emitting a call to the handler on `root` with its resolved arguments.
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

  /*
    The whole call is mapped onto the span of the event binding (the whole `(click)="handler($event)"`),
    the handler onto its name and each argument finely, like any other expression.
  */
  const callee = `root.${handler}(`;
  const segments: LineMapping[] = [{ columnStart: 5, columnEnd: 5 + handler.length, original: handlerSpan }];
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
 * @param parameters - The parameters of the event binding.
 * @returns `true` if one of the parameters is `$event`, `false` otherwise.
 */
function passesEvent(parameters: Expression[]): boolean {
  return parameters.some(parameter => isIdentifier(parameter) && parameter.text === '$event');
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