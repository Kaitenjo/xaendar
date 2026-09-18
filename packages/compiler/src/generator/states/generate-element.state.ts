import { indent, isValidCustomElementName } from '@xaendar/common';
import { AttributeNode } from '../../parser/types/nodes/attribute-node.type';
import { DynamicBindingNode } from '../../parser/types/nodes/dynamic-binding-node.type';
import { ElementNode } from '../../parser/types/nodes/element-node.type';
import { EventNode } from '../../parser/types/nodes/event-node.type';
import { CompilerContext } from '../models/compiler-context.model';
import { GeneratorTransitionFunctionReturnType } from '../types/generator-transition-function-return-type.type';
import { getElementIdentifier, resolveExpression } from '../utils/generator.utils';

/**
 * Generates code for an HTML element node: creates the DOM element, sets attributes,
 * attaches event listeners, appends it to the parent, and recursively processes children.
 *
 * @param node - The `ElementNode` to process.
 * @param index - Variable name to use for the created DOM element.
 * @param parentNode - Variable name of the parent DOM node to append to.
 * @param compilerContext - Current render scope context.
 * @returns Array of generated code lines.
 */
export function generateElement(node: ElementNode, parentNode: string, index: string, compilerContext: CompilerContext, anchor: string | null): GeneratorTransitionFunctionReturnType {
  const tagName = node.tagName;
  const isCustomElement = isValidCustomElementName(tagName, false);
  const attributes = mapAttributes(node.attributes, compilerContext);
  const events = mapEvents(node.events, compilerContext);
  const dynamicBindings = mapDynamicBindings(node.dynamicBindings, compilerContext, isCustomElement);
  const nodeName = getElementIdentifier(node, parentNode, index);
  const retVal: GeneratorTransitionFunctionReturnType = {
    code: [],
    functionsToProcess: new Map()
  }

  retVal.code.push(getPrecode(tagName));
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

  dynamicBindings.length
    ? retVal.code.push(
      ...indent([
        '[',
        ...indent(dynamicBindings),
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
        precode: getPrecode(tagName)
      },
      args: [nodeName, 'parentContext']
    });
    retVal.code.push(`this.${nodeName}Children(${nodeName}, context);`);
  }

  return retVal;
}

/**
 * Maps attribute nodes to their corresponding generated code lines.
 *
 * @param attributes - The attribute nodes to map onto the element.
 * @param compilerContext - Current render scope context, used to resolve identifier references.
 * @returns Array of generated code strings, one per attribute.
 */
function mapAttributes(attributes: AttributeNode[], compilerContext: CompilerContext, isCustomElement?: boolean): string[] {
  return attributes.map(({ name, value }) => {
    const retval = [
      '{',
      indent(`name: '${name}',`)
    ];

    if (typeof value === 'string') {
      retval.push(
        ...indent([
          `value: () => '${value}',`,
          'setter: _bindProperty',
        ])
      );
    } else {
      const { expression, reactive } = resolveExpression(value.expression, compilerContext);
      retval.push(
        ...indent([
          `value: () => ${expression}, `,
          `setter: ${reactive ? '_bindReactiveProperty' : '_bindProperty'}`,
        ])
      );
    }

    const extra = new Array<string>();
    const metadata = compilerContext.getPropertyMetadata(name);
    if (isCustomElement !== undefined && !isCustomElement) {
      if (metadata) {
        /*
          Teorically this control should not be necessary due to the typechecker checking
          if a dynamic binding has a required attribute or not. Required attributes cannot be used with dynamic bindings
          If typechecker is not correctly working this if prevents to generate code for required attributes
        */
        if (!metadata.required) {
          retval[retval.length - 1] = `${retval[retval.length - 1]},`;
          extra.push('unbind: _setAttribute', `defaultValue: ${metadata.defaultValue}`);
        }
      } else {
        retval[retval.length - 1] = `${retval[retval.length - 1]},`;
        extra.push('unbind: _removeAttribute');
      }
    }

    retval.push(
      ...indent(extra),
      '},'
    );

    return retval;
  }).flat();
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

  compilerContext.removeIdentifier('$event');
  return mappedEvents;
}

function mapDynamicBindings(dynamicBindings: DynamicBindingNode[], compilerContext: CompilerContext, isCustomElement: boolean = false): string[] {
  return dynamicBindings.flatMap(({ condition, attributes, events, dynamicBindings }) => {
    if (!attributes.length && !events.length && !dynamicBindings.length) {
      return [];
    }

    const { expression } = resolveExpression(condition, compilerContext);
    const mappedAttributes = mapAttributes(attributes, compilerContext, isCustomElement);
    const mappedEvents = mapEvents(events, compilerContext);
    const mappedDynamicBindings = mapDynamicBindings(dynamicBindings, compilerContext, isCustomElement);

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

    dynamicBindings.length
      ? retVal.push(
        ...indent([
          'dynamicBindings: [',
          ...indent(mappedDynamicBindings),
          '],'
        ])
      )
      : retVal.push(
        ...indent([
          'dynamicBindings: []'
        ])
      );

    retVal.push('}');
    return retVal;
  });
}

function getPrecode(tagName: string): string {
  switch (tagName) {
    case 'svg':
      return 'context.createElement = _createSVGElement;';
    case 'math':
      return 'context.createElement = _createMATHMLElement;';
    default:
      return '';
  }
}