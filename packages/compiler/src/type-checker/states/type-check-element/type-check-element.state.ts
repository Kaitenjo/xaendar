// states/type-check-element.state.ts
import { resolveExpression } from '../../../generator/utils/generator/generator.utils';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { AttributeNode } from '../../../parser/types/nodes/attribute-node.type';
import type { ConditionalBindingBranchNode } from '../../../parser/types/nodes/conditional-binding-branch-node.type';
import type { ConditionalBindingNode } from '../../../parser/types/nodes/conditional-binding-node.type';
import type { DirectiveNode } from '../../../parser/types/nodes/directive-node.type';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import type { EventNode } from '../../../parser/types/nodes/event-node.type';
import type { IfBindingNode } from '../../../parser/types/nodes/if-binding-node.type';
import type { SwitchBindingNode } from '../../../parser/types/nodes/switch-binding-node.type';
import { ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
import type { ComponentOrDirectiveMetadata } from '../../../types/component-or-directive-metadata.type';
import type { DirectiveMetadata } from '../../../types/directive-metadata.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { Line } from '../../types/generated-line.type';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { indentLines, line, mapped, plain } from '../../utils/line-builder/line-builder.utils';

/**
 * Type-checks an element node: emits the type-check lines for its
 * attributes, events, conditional bindings and directives, then recurses into its children.
 *
 * Custom elements (tag names containing a dash) are checked against the
 * metadata of the component imported for their selector; native elements
 * only get their expressions and event handlers checked.
 *
 * @param node - The `ElementNode` to type-check.
 * @param processNode - Callback used to type-check each child node.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If the tag is a custom element, or one of its directives, whose selector is not imported in the template.
 */
export function typeCheckElement(node: ElementNode, processNode: ProcessNode, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  if (isCustomElementTag(node.tagName)) {
    const metadata = context.getImportBySelector(node.tagName);
    if (!metadata) {
      throw new Error(`${node.tagName} selector is not associated to any WebComponent imported in the template`, { cause: node.span });
    }

    lines.push(...typeCheckComponentBindings(node, metadata, context));
  } else {
    lines.push(...typeCheckNativeBindings(node, context));
  }

  lines.push(...typeCheckDirectives(node.directives, node.tagName, context));

  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    lines.push(...processNode(children[i], context))
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
 * @param node - The custom element node.
 * @param metadata - Metadata of the component registered for the element's selector.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If a required property is missing, is bound inside a conditional binding that may not bind it, or an event is unknown.
 */
function typeCheckComponentBindings(node: ElementNode, metadata: ComponentMetadata, context: TypeCheckContext): Line[] {
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
      ...typeCheckComponentEvents(branch.events, `<${node.tagName}>`, metadata, context),
      ...typeCheckDirectives(branch.directives, node.tagName, context)
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

  lines.push(...typeCheckComponentEvents(node.events, `<${node.tagName}>`, metadata, context));
  lines.push(...conditionalBindingLines);

  return lines;
}

/**
 * Type-checks the directives applied to an element against their metadata.
 *
 * Every attribute declared in a directive must match one of its properties,
 * since a directive has no underlying element attribute to fall back to, and
 * every required property must always be bound: directly in the directive, or by
 * a conditional binding that binds it whatever branch is selected, since a
 * property bound inside a conditional binding is only set while its branch
 * is the selected one (see {@link getAlwaysBoundAttributes}). Values and events
 * are then checked exactly like the ones of a component.
 *
 * @param directives - The directive nodes applied to the element.
 * @param tagName - Tag name of the element, used in error messages.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If a directive is not imported, binds an unknown property or event, misses a required property or binds it inside a conditional binding that may not bind it.
 */
function typeCheckDirectives(directives: DirectiveNode[], tagName: string, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < directives.length; i++) {
    const { selector, attributes, events, conditionalBindings, span } = directives[i];
    const metadata = context.getDirectiveBySelector(selector);
    if (!metadata) {
      throw new Error(`@@${selector} selector is not associated to any Directive imported in the template`, { cause: span });
    }

    assertDirectiveProperties(attributes, metadata);
    const alwaysBoundAttributes = getAlwaysBoundAttributes(conditionalBindings);

    /*
      Checked before the missing required properties, so that a required property bound
      inside a conditional binding that may not bind it gets the more specific error.
    */
    const conditionalBindingLines = typeCheckConditionalBindings(conditionalBindings, context, branch => {
      assertDirectiveProperties(branch.attributes, metadata);
      assertRequiredPropertiesAlwaysBound(branch.attributes, metadata, `@@${selector}`, alwaysBoundAttributes);

      return [
        ...typeCheckComponentAttributes(branch.attributes, metadata, context),
        ...typeCheckComponentEvents(branch.events, `@@${selector}`, metadata, context)
      ];
    });

    const requiredProperties = new Set(metadata.properties.entries().filter(([_, value]) => value.required).map(([key]) => key));
    for (let j = 0; j < attributes.length; j++) {
      requiredProperties.delete(attributes[j].name);
    }

    alwaysBoundAttributes.forEach(name => requiredProperties.delete(name));

    if (requiredProperties.size) {
      throw new Error(`@@${selector} on <${tagName}> is missing the following required properties:\n ● ${Array.from(requiredProperties.values()).join('\n ● ')}`, { cause: span });
    }

    lines.push(
      ...typeCheckComponentAttributes(attributes, metadata, context),
      ...typeCheckComponentEvents(events, `@@${selector}`, metadata, context),
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
 * @throws If an attribute doesn't match any property of the directive.
 */
function assertDirectiveProperties(attributes: AttributeNode[], metadata: DirectiveMetadata): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, span } = attributes[i];
    if (!metadata.properties.has(name)) {
      throw new Error(`Unknown property "${name}" on @@${metadata.selector} (${metadata.className} has no @Property with this name).`, { cause: span });
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
          ? [line('(', mapped(resolveExpression(value.expression, context, { resolver: 'root' }).expression, value.span), `) satisfies ${property.type};`)]
          : [plain('let x!: string;'), line(mapped(`x satisfies ${property.type};`, attributes[i].span))]
        ),
        plain('}')
      );
    }
  }

  return lines;
}

/**
 * Type-checks event bindings against the component's or directive's `@Event`s, emitting a
 * call to the handler on `root` with its resolved arguments. When the event
 * carries a payload, `$event` is declared as `CustomEvent<payload type>`.
 *
 * @param events - The event nodes to type-check.
 * @param owner - The element (`<tag-name>`) or the directive (`@@selector`) the events are bound to, used in error messages.
 * @param metadata - Metadata of the component or directive emitting the events.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines, one block per event.
 * @throws If an event is not declared by the component or directive.
 */
function typeCheckComponentEvents(events: EventNode[], owner: string, metadata: ComponentOrDirectiveMetadata, context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < events.length; i++) {
    const { name, handler, parameters } = events[i];
    const event = metadata.events.get(name)
    if (!event) {
      throw new Error(`Unknown event "${name}" on ${owner} (${metadata.className} has no @Event with this name).`, { cause: events[i].span });
    }

    const eventContext = new TypeCheckContext(context);
    eventContext.addUnresolvableIdentifier('$event');

    const args = parameters
      .map(parameter => resolveExpression(parameter, eventContext, { resolver: 'root' }).expression)
      .join(', ');

    lines.push(plain('{'));

    if (event.type !== 'void') {
      lines.push(...indentLines([plain(`let $event!: CustomEvent<${event.type}>;`)]));
    }

    /*
      NOTA: mappiamo l'intera chiamata sullo span del binding evento
      (`events[i].span`, l'intero `(click)="handler($event)"`), non sui
      singoli parametri — se in futuro serve granularità sul singolo
      argomento, servirebbe uno span per parametro dal parser.
    */
    lines.push(...indentLines([line(mapped(`root.${handler}(${args});`, events[i].span))]));
    lines.push(plain('}'));
  };

  return lines;
}

/**
 * Type-checks the bindings of a native element: attributes, events and
 * conditional bindings.
 *
 * @param node - The native element node.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 */
function typeCheckNativeBindings(node: ElementNode, context: TypeCheckContext): Line[] {
  return [
    ...typeCheckNativeAttributes(node.attributes, context),
    ...typeCheckNativeEvents(node.events, context),
    ...typeCheckConditionalBindings(node.conditionalBindings, context, branch => [
      ...typeCheckNativeAttributes(branch.attributes, context),
      ...typeCheckNativeEvents(branch.events, context),
      ...typeCheckDirectives(branch.directives, node.tagName, context)
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
      lines.push(line(mapped(`${resolveExpression(value.expression, context, { resolver: 'root' }).expression};`, value.span)));
    }
  };

  return lines;
}

/**
 * Type-checks the event bindings of a native element by emitting a call to
 * the handler on `root` with its resolved arguments.
 *
 * @param events - The event nodes to type-check.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines, one per event.
 */
function typeCheckNativeEvents(events: EventNode[], context: TypeCheckContext): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < events.length; i++) {
    const { handler, parameters } = events[i];
    const eventContext = new TypeCheckContext(context);
    eventContext.addUnresolvableIdentifier('$event');

    const args = parameters
      .map(parameter => resolveExpression(parameter, eventContext, { resolver: 'root' }).expression)
      .join(', ');

    lines.push(line(mapped(`root.${handler}(${args});`, events[i].span)));
  };

  return lines;
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
        ? line(i ? 'else if (' : 'if (', mapped(resolveExpression(condition, context, { resolver: 'root' }).expression, span), ') {')
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
  const { expression } = resolveExpression(node.expression, context, { resolver: 'root' });
  const lines = [line('switch (', mapped(expression, node.span), ') {')];

  const { branches } = node;
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    const labels = branch.condition?.map(condition => plain(`case ${condition}:`)) ?? [plain('default:')];

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
 * Tells whether a tag name identifies a custom element, i.e. it starts with
 * a lowercase letter and contains at least one dash.
 *
 * @param tagName - The tag name to classify.
 * @returns `true` if the tag name is a custom element name, `false` otherwise.
 */
export function isCustomElementTag(tagName: string): boolean {
  return /^[a-z][a-z0-9._\-]*-[a-z0-9._\-]*$/.test(tagName);
}