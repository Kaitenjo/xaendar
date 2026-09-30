// states/type-check-element.state.ts
import { resolveExpression } from '../../../generator/utils/generator/generator.utils';
import type { AttributeNode } from '../../../parser/types/nodes/attribute-node.type';
import type { ConditionalBindingNode } from '../../../parser/types/nodes/conditional-binding-node.type';
import type { DirectiveNode } from '../../../parser/types/nodes/directive-node.type';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import type { EventNode } from '../../../parser/types/nodes/event-node.type';
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
 * Required properties must be bound directly on the element, since a
 * property bound inside a conditional binding is only set when its condition
 * holds.
 *
 * @param node - The custom element node.
 * @param metadata - Metadata of the component registered for the element's selector.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If a required property is missing, is bound inside a conditional binding, or an event is unknown.
 */
function typeCheckComponentBindings(node: ElementNode, metadata: ComponentMetadata, context: TypeCheckContext): Line[] {
  const requiredProperties = new Set(metadata.properties.entries().filter(([_, value]) => value.required).map(([key]) => key));
  const lines = typeCheckComponentAttributes(node.attributes, metadata, context);

  /*
    Checked before the missing required properties, so that a required property
    bound only inside a conditional binding gets the more specific error.
  */
  const conditionalBindingLines = typeCheckConditionalBindings(node.conditionalBindings, context, binding => {
    for (const { name, span } of binding.attributes) {
      if (metadata.properties.get(name)?.required) {
        throw new Error(`Required property "${name}" of <${node.tagName}> cannot be bound inside a conditional binding.`, { cause: span });
      }
    }

    return [
      ...typeCheckComponentAttributes(binding.attributes, metadata, context),
      ...typeCheckComponentEvents(binding.events, `<${node.tagName}>`, metadata, context),
      ...typeCheckDirectives(binding.directives, node.tagName, context)
    ];
  });

  for (let i = 0; i < node.attributes.length; i++) {
    const { name } = node.attributes[i];
    requiredProperties.delete(name);
  }

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
 * every required property must be bound directly in the directive, since a
 * property bound inside a conditional binding is only set when its condition
 * holds. Values and events are then checked exactly like the ones of a component.
 *
 * @param directives - The directive nodes applied to the element.
 * @param tagName - Tag name of the element, used in error messages.
 * @param context - Current type-check scope.
 * @returns The generated type-check lines.
 * @throws If a directive is not imported, binds an unknown property or event, misses a required property or binds it inside a conditional binding.
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

    /*
      Checked before the missing required properties, so that a required property
      bound only inside a conditional binding gets the more specific error.
    */
    const conditionalBindingLines = typeCheckConditionalBindings(conditionalBindings, context, binding => {
      assertDirectiveProperties(binding.attributes, metadata);

      for (const { name, span } of binding.attributes) {
        if (metadata.properties.get(name)?.required) {
          throw new Error(`Required property "${name}" of @@${selector} cannot be bound inside a conditional binding.`, { cause: span });
        }
      }

      return [
        ...typeCheckComponentAttributes(binding.attributes, metadata, context),
        ...typeCheckComponentEvents(binding.events, `@@${selector}`, metadata, context)
      ];
    });

    const requiredProperties = new Set(metadata.properties.entries().filter(([_, value]) => value.required).map(([key]) => key));
    for (let j = 0; j < attributes.length; j++) {
      requiredProperties.delete(attributes[j].name);
    }

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
    ...typeCheckConditionalBindings(node.conditionalBindings, context, binding => [
      ...typeCheckNativeAttributes(binding.attributes, context),
      ...typeCheckNativeEvents(binding.events, context),
      ...typeCheckDirectives(binding.directives, node.tagName, context)
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
 * Type-checks conditional bindings as real, nested TypeScript `if` blocks: the
 * condition is checked like an `@if` condition (and narrows inside the
 * block), while the bound attributes/events/directives are checked by `bindings`,
 * exactly as if they were declared directly on the element or on the directive.
 *
 * @param conditionalBindings - The conditional bindings to type-check.
 * @param context - Current type-check scope.
 * @param bindings - Emits the type-check lines for a single binding's attributes, events and directives.
 * @returns The generated type-check lines.
 */
function typeCheckConditionalBindings(conditionalBindings: ConditionalBindingNode[], context: TypeCheckContext, bindings: (binding: ConditionalBindingNode) => Line[]): Line[] {
  const lines = new Array<Line>();

  for (let i = 0; i < conditionalBindings.length; i++) {
    const binding = conditionalBindings[i];
    const condition = resolveExpression(binding.condition, context, { resolver: 'root' });

    lines.push(
      line('if (', mapped(condition.expression, binding.span), ') {'),
      ...indentLines([
        ...bindings(binding),
        ...typeCheckConditionalBindings(binding.conditionalBindings, context, bindings)
      ]),
      plain('}')
    );
  }

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