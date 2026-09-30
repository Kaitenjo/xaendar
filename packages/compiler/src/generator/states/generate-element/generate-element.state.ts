import { indent, isValidCustomElementName } from '@xaendar/common';
import { AttributeNode } from '../../../parser/types/nodes/attribute-node.type';
import { ConditionalBindingNode } from '../../../parser/types/nodes/conditional-binding-node.type';
import { DirectiveNode } from '../../../parser/types/nodes/directive-node.type';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { EventNode } from '../../../parser/types/nodes/event-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import { getElementIdentifier, resolveExpression } from '../../utils/generator/generator.utils';

/**
 * Generates code for an HTML element node: creates the DOM element, sets attributes,
 * attaches event listeners, applies conditional bindings and directives, appends it to the parent,
 * and recursively processes children.
 *
 * The directives are passed to `_renderElement` only when the element declares any.
 *
 * @param node - The `ElementNode` to process.
 * @param index - Variable name to use for the created DOM element.
 * @param parentNode - Variable name of the parent DOM node to append to.
 * @param compilerContext - Current render scope context.
 * @returns Array of generated code lines.
 */
export async function generateElement(node: ElementNode, parentNode: string, index: string, compilerContext: CompilerContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType> {
  const tagName = node.tagName;
  const isCustomElement = isValidCustomElementName(tagName, false);
  const attributes = await mapAttributes(node.attributes, compilerContext, tagName);
  const events = mapEvents(node.events, compilerContext);
  const conditionalBindings = await mapConditionalBindings(node.conditionalBindings, compilerContext, tagName, isCustomElement);
  const directives = await mapDirectives(node.directives, compilerContext);
  const nodeName = getElementIdentifier(node, parentNode, index);
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  }

  /* 
    Remove the if would create an empty line in the generated code
    when the precode is empty, it avoids adding unnecessary blank line.
  */
  const precode = overrideCreateElement(tagName);
  if (precode) {
    retVal.code.push(precode);
  }

  retVal.code.push(`const ${nodeName} = _renderElement(${parentNode}, context, ${anchor}, '${tagName}',`);

  attributes.length
    ? retVal.code.push(
      ...indent([
        '[',
        ...indent(attributes),
        '],'
      ])
    )
    : retVal.code[retVal.code.length - 1] = `${retVal.code[retVal.code.length - 1]} [],`;

  events.length
    ? retVal.code.push(
      ...indent([
        '[',
        ...indent(events),
        '],'
      ]),
    )
    : retVal.code[retVal.code.length - 1] = `${retVal.code[retVal.code.length - 1]} [],`;

  conditionalBindings.length
    ? retVal.code.push(
      ...indent([
        '[',
        ...indent(conditionalBindings),
        '],'
      ]),
    )
    : retVal.code[retVal.code.length - 1] = `${retVal.code[retVal.code.length - 1]} [],`;

  directives.length
    ? retVal.code.push(
      ...indent([
        '[',
        ...indent(directives),
        ']'
      ]),
      ');'
    )
    : retVal.code[retVal.code.length - 1] = `${retVal.code[retVal.code.length - 1]} []);`;

  switch (tagName) {
    case 'svg':
    case 'math':
      retVal.code.push('context.createElement = _createElement;');
  }

  if (node.children.length) {
    retVal.functionsToProcess!.set(`${nodeName}Children`, {
      fn: {
        node,
        parentNode: nodeName,
        context: compilerContext,
        precode: overrideCreateElement(tagName)
      },
      args: [nodeName, 'parentContext', 'anchor']
    });
    retVal.code.push(`${nodeName}Children.call(this, ${nodeName}, context);`);
  }

  return retVal;
}

/**
 * Maps attribute nodes to their corresponding generated code lines.
 *
 * Attributes declared inside a conditional binding also get the `unbind` applied when the
 * condition turns false: a property of a custom element or of a directive is reset to its
 * default value, read from the metadata of its owner, any other attribute is removed.
 *
 * @param attributes - The attribute nodes to map onto the element or the directive.
 * @param compilerContext - Current render scope context, used to resolve identifier references.
 * @param owner - The tag name of the element, or the selector of the directive as applied in templates (`@@selector`), the attributes are bound to.
 * @param isCustomElement - Whether the owner is a custom element. Left `undefined` when the attributes are not declared inside a conditional binding.
 * @param isDirective - Whether the owner is a directive.
 * @returns Array of generated code strings, one per attribute.
 * @throws If the metadata of a directive property bound inside a conditional binding can't be resolved.
 */
async function mapAttributes(attributes: AttributeNode[], compilerContext: CompilerContext, owner: string, isCustomElement?: boolean, isDirective = false): Promise<string[]> {
  const mappedAttributes = new Array<string>(); 
  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes[i];
    const retval = [
      '{',
      indent(`name: '${name}',`)
    ];

    if (typeof value === 'string') {
      retval.push(
        ...indent([
          `value: '${value}',`,
          'setter: _setProperty',
        ])
      );
    } else {
      const { expression, reactive } = resolveExpression(value.expression, compilerContext);
      retval.push(
        ...indent([
          `value: () => ${expression}, `,
          `setter: ${reactive ? '_setReactiveProperty' : '_setExpressionProperty'}`,
        ])
      );
    }

    const extra = new Array<string>();
    if (isCustomElement !== undefined) {
      // Native elements have no metadata: their attributes are always removed
      const metadata = isCustomElement || isDirective ? await compilerContext.cache?.getOrInsert(owner) : undefined;
      const propertyMetadata = metadata?.properties.get(name);
      if (propertyMetadata) {
        /*
          Teorically this control should not be necessary due to the typechecker checking
          if a conditional binding has a required attribute or not. Required attributes cannot be used with conditional bindings
          If typechecker is not correctly working this if prevents to generate code for required attributes
        */
        if (!propertyMetadata.required) {
          retval[retval.length - 1] = `${retval[retval.length - 1]},`;
          extra.push('unbind: _setExpressionProperty,', `defaultValue: ${propertyMetadata.defaultValue}`);
        }
      } else if (isDirective) {
        /*
          A directive has no underlying attribute to fall back to: every attribute bound to it
          is one of its properties, so its metadata must always be available.

          Unlike components, a non-recognized property cannot be applied as an attribute on the DOM element itself.
        */
        throw new Error(`Unable to resolve the metadata of property "${name}" of ${owner}`, { cause: attributes[i].span });
      } else {
        retval[retval.length - 1] = `${retval[retval.length - 1]},`;
        extra.push('unbind: _removeAttribute');
      }
    }

    retval.push(
      ...indent(extra),
      '},'
    );

    mappedAttributes.push(...retval);
  }

  return mappedAttributes;
}

/**
 * Generates code that attaches event listeners to a DOM element.
 *
 * For each event node an `addEventListener` call is emitted, binding the event
 * to the component instance handler and exposing the native event as `$event`.
 *
 * @param events - The event nodes to bind to the element.
 * @param compilerContext - Current render scope context, used to resolve identifier references.
 * @returns Array of generated code lines, one per event listener.
 */
function mapEvents(events: EventNode[], compilerContext: CompilerContext): string[] {
  compilerContext.addUnresolvableIdentifier('$event');

  const mappedEvents = events.map(event => {
    let parsedEventParameter = false;
    const parameters = event.parameters.map(parameter => {
      const resolvedParameter = resolveExpression(parameter, compilerContext).expression;
      if (!parsedEventParameter && resolvedParameter === '$event') {
        parsedEventParameter = true;
        return `($event) => ${resolvedParameter},`
      } else {
        return `() => ${resolvedParameter},`
      }
    });

    const eventCode = [
      '{',
      ...indent([
        `name: '${event.name}',`,
        `handler: '${event.handler}',`,
        'parameters: ['])
    ]

    if (parameters.length) {
      eventCode.push(
        ...indent([
          ...indent(parameters),
          ']'
        ]),
        '},'
      );
    } else {
      eventCode[eventCode.length - 1] = `${eventCode[eventCode.length - 1]}]`;
      eventCode.push('},');
    }

    return eventCode;
  }).flat();

  compilerContext.removeUnresolvabledIdentifier('$event');
  return mappedEvents;
}

/**
 * Maps conditional binding nodes to the descriptors `_renderElement` applies while their condition holds:
 * the condition, the attributes, the events, the nested conditional bindings and, for a conditional binding
 * declared on an element, the directives.
 *
 * Conditional bindings without any binding are skipped.
 *
 * @param conditionalBindings - The conditional binding nodes to map.
 * @param compilerContext - Current render scope context, used to resolve identifier references.
 * @param owner - The tag name of the element, or the selector of the directive as applied in templates (`@@selector`), the conditional bindings are declared in.
 * @param isCustomElement - Whether the owner is a custom element.
 * @param isDirective - Whether the owner is a directive.
 * @returns Array of generated code lines, one descriptor per conditional binding.
 */
async function mapConditionalBindings(conditionalBindings: ConditionalBindingNode[], compilerContext: CompilerContext, owner: string, isCustomElement: boolean = false, isDirective = false): Promise<string[]> {
  const mappedConditionalBindings = new Array<string>();

  for (let i = 0; i < conditionalBindings.length; i++) {
    const { condition, attributes, events, conditionalBindings: nestedConditionalBindings, directives } = conditionalBindings[i];
    if (!attributes.length && !events.length && !nestedConditionalBindings.length && !directives.length) {
      continue;
    }

    const { expression } = resolveExpression(condition, compilerContext);
    const mappedAttributes = await mapAttributes(attributes, compilerContext, owner, isCustomElement, isDirective);
    const mappedEvents = mapEvents(events, compilerContext);
    const mappedNestedConditionalBindings = await mapConditionalBindings(nestedConditionalBindings, compilerContext, owner, isCustomElement, isDirective);

    const retVal = [
      '{',
      ...indent([
        `condition: () => ${expression},`
      ])
    ];

    attributes.length
      ? retVal.push(
        ...indent([
          'attributes: [',
          ...indent(mappedAttributes),
          '],'
        ])
      )
      : retVal.push(
        ...indent([
          'attributes: [],'
        ])
      );

    events.length
      ? retVal.push(
        ...indent([
          'events: [',
          ...indent(mappedEvents),
          '],'
        ])
      )
      : retVal.push(
        ...indent([
          'events: [],'
        ])
      );

    mappedNestedConditionalBindings.length
      ? retVal.push(
        ...indent([
          'conditionalBindings: [',
          ...indent(mappedNestedConditionalBindings),
          '],'
        ])
      )
      : retVal.push(
        ...indent([
          'conditionalBindings: [],'
        ])
      );

    // A conditional binding declared inside a directive cannot apply other directives
    if (!isDirective) {
      const mappedDirectives = await mapDirectives(directives, compilerContext);
      mappedDirectives.length
        ? retVal.push(
          ...indent([
            'directives: [',
            ...indent(mappedDirectives),
            '],'
          ])
        )
        : retVal.push(
          ...indent([
            'directives: [],'
          ])
        );
    }

    retVal.push('},');
    mappedConditionalBindings.push(...retVal);
  };

  return mappedConditionalBindings;
}

/**
 * Maps directive nodes to the descriptors `_renderElement` applies to the element:
 * the directive selector, its properties, its events and its conditional bindings.
 *
 * Properties bound directly in the directive are never unbound, since they live as long
 * as the directive, so the directive metadata is only needed by its conditional bindings.
 *
 * @param directives - The directive nodes applied to the element.
 * @param compilerContext - Current render scope context, used to resolve identifier references.
 * @returns Array of generated code lines, one descriptor per directive.
 */
async function mapDirectives(directives: DirectiveNode[], compilerContext: CompilerContext): Promise<string[]> {
  const mappedDirectives = new Array<string>();

  for (let i = 0; i < directives.length; i++) {
    const { selector, attributes, events, conditionalBindings } = directives[i];
    const mappedAttributes = await mapAttributes(attributes, compilerContext, selector);
    const mappedEvents = mapEvents(events, compilerContext);
    const mappedConditionalBindings = await mapConditionalBindings(conditionalBindings, compilerContext, `@@${selector}`, false, true);

    const retVal = [
      '{',
      ...indent([
        `selector: '${selector}',`
      ])
    ];

    attributes.length
      ? retVal.push(
        ...indent([
          'attributes: [',
          ...indent(mappedAttributes),
          '],'
        ])
      )
      : retVal.push(
        ...indent([
          'attributes: [],'
        ])
      );

    events.length
      ? retVal.push(
        ...indent([
          'events: [',
          ...indent(mappedEvents),
          '],'
        ])
      )
      : retVal.push(
        ...indent([
          'events: [],'
        ])
      );

    mappedConditionalBindings.length
      ? retVal.push(
        ...indent([
          'conditionalBindings: [',
          ...indent(mappedConditionalBindings),
          ']'
        ])
      )
      : retVal.push(
        ...indent([
          'conditionalBindings: []'
        ])
      );

    retVal.push('},');
    mappedDirectives.push(...retVal);
  }

  return mappedDirectives;
}

function overrideCreateElement(tagName: string): string {
  switch (tagName) {
    case 'svg':
      return 'context.createElement = _createSVGElement;';
    case 'math':
      return 'context.createElement = _createMATHMLElement;';
    default:
      return '';
  }
}