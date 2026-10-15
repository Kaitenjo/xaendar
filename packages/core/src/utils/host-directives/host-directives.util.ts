import type { Constructor } from '@xaendar/types';
import { INTERNAL_ALIAS_TO_ATTRIBUTE, INTERNAL_HOST_DIRECTIVES, SET_DIRECTIVE_ELEMENT, SET_DIRECTIVE_EVENTS } from '../../costants';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { Output } from '../../models/output/output';
import { isInputSignal } from '../../signals/input/input-instance.symbol';
import type { HostDirectiveMember } from '../../types/web-component/host-directive-member.type';
import type { HostDirectiveOptions } from '../../types/web-component/host-directive-options.type';
import type { HostDirectives } from '../../types/web-component/host-directives.type';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';

/**
 * A name an input or an event of a host directive is exposed with on its component.
 */
type Exposure = {
  /**
   * The name of the input or of the event in the directive.
   */
  name: string,
  /**
   * The name it is exposed with on the component.
   */
  alias: string
};

/**
 * Creates the host directives of a component, the ones its `@WebComponent` declares: each directive is instantiated
 * and applied to the component element, and its exposed inputs are made bindable on the element.
 *
 * @param element - The component the directives are applied to.
 * @returns The instances of the directives, keyed by the class of the directive, empty when the component declares none.
 * @throws When a directive is declared twice, when a directive does not declare an input or an event it exposes, or
 *   when an exposed input has the name of an input of the component or of another host directive.
 */
export function _createHostDirectives(element: CustomElement): HostDirectives {
  const directives = new Map<Constructor<CustomDirective>, CustomDirective>();
  const declarations = getWebComponentMetadata(element.constructor)?.[INTERNAL_HOST_DIRECTIVES];

  if (declarations?.length) {
    for (let i = 0; i < declarations.length; i++) {
      const declaration = declarations[i];
      const { directive: Directive, properties: inputs, events: outputs }: HostDirectiveOptions = typeof declaration === 'function' ? { directive: declaration } : declaration;
      if (directives.has(Directive)) {
        throw new Error(`${element.constructor.name} declares the host directive ${Directive.name} more than once`);
      }

      const directive = new Directive();
      directive[SET_DIRECTIVE_ELEMENT] = element;
      directive[SET_DIRECTIVE_EVENTS] = getExposedEvents(directive, outputs);
      exposeInputs(element, directive, inputs);
      directives.set(Directive, directive);
    }
  }

  return directives as unknown as HostDirectives;
}

/**
 * Gets the name a member of a host directive is exposed with: a member given by its name only is exposed with it.
 *
 * @param member - The member, see {@link HostDirectiveOptions}.
 * @returns The name in the directive and the name it is exposed with.
 */
function toExposure(member: HostDirectiveMember): Exposure {
  return typeof member === 'string' ? { name: member, alias: member } : member;
}

/**
 * Makes the inputs of a host directive bindable on the component element: the element gets a property named after each of
 * them, holding the input signal of the directive, which is what the template runtime binds the attributes of an element to.
 *
 * @param element - The component the directive is applied to.
 * @param directive - The host directive owning the inputs.
 * @param inputs - The inputs to expose, see {@link HostDirectiveOptions.properties}.
 * @throws When the directive does not declare an input it exposes, or when an input is exposed with the name of an input
 *   of the component or of another host directive.
 */
function exposeInputs(element: CustomElement, directive: CustomDirective, inputs: HostDirectiveMember[] | undefined): void {
  if (!inputs?.length) {
    return;
  }

  const aliasToAttribute = getWebComponentMetadata(directive.constructor)?.[INTERNAL_ALIAS_TO_ATTRIBUTE];
  const componentInputs = getWebComponentMetadata(element.constructor)?.[INTERNAL_ALIAS_TO_ATTRIBUTE];

  for (let i = 0; i < inputs.length; i++) {
    const { name, alias } = toExposure(inputs[i]);
    let property: unknown;
    const propertyName = aliasToAttribute?.[name];
    if (propertyName && propertyName in directive) {
      property = directive[propertyName];
    } else if (name in directive) {
      property = directive[name];
    }

    if (!isInputSignal(property)) {
      throw new Error(`${directive.constructor.name} does not declare an input named "${name}"`);
    }

    // The inputs of the component are not read: they are initialized after this runs
    if (componentInputs?.[alias] || Object.hasOwn(element, alias)) {
      throw new Error(`${element.constructor.name} already has an input named "${alias}", which ${directive.constructor.name} cannot expose`);
    }

    Object.defineProperty(element, alias, { configurable: true, value: property });
  }
}

/**
 * Collects the events of a host directive its component exposes.
 *
 * @param directive - The host directive dispatching the events.
 * @param outputs - The events to expose, see {@link HostDirectiveOptions.events}.
 * @returns A map from the name of the event the directive dispatches to the name it is dispatched with on the component.
 * @throws When the directive does not declare an event it exposes.
 */
function getExposedEvents(directive: CustomDirective, outputs: HostDirectiveMember[] | undefined): Map<string, string> {
  const events = new Map<string, string>();

  if (outputs?.length) {
    for (let i = 0; i < outputs.length; i++) {
      const { name, alias } = toExposure(outputs[i]);
      if (!(directive[name] instanceof Output)) {
        throw new Error(`${directive.constructor.name} does not declare an event named "${name}"`);
      }

      events.set(name, alias);
    }
  }

  return events;
}
