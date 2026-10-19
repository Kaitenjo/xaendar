import { CustomElement } from '@xaendar/core';
import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';

/**
 * Module-private registry mapping each element to the custom directives a template applies to it (`@@selector`), in
 * the order they are applied. The host directives of a component are not here: the component holds them.
 */
const applied = new WeakMap<Element, CustomDirective[]>();

/**
 * Registers a custom directive a template applies to an element, so that the queries looking for its class find it.
 *
 * @param element - The element the directive is applied to.
 * @param directive - The directive.
 */
export function _addAppliedDirective(element: Element, directive: CustomDirective): void {
  const directives = applied.get(element);
  directives?.push(directive) || applied.set(element, [directive]);
}

/**
 * Unregisters a custom directive once it is disposed.
 *
 * @param element - The element the directive is applied to.
 * @param directive - The directive.
 */
export function _removeAppliedDirective(element: Element, directive: CustomDirective): void {
  const directives = applied.get(element)!;
  directives.splice(directives.indexOf(directive), 1);
}

/**
 * Finds the custom directives of a class applied to an element: its host directives first, when the element is a
 * component, then the ones its template applies, in order.
 *
 * @param element - The element.
 * @param Directive - The class of the directives, whose subclasses match too.
 * @returns The directives, `undefined` when none is applied.
 */
export function _getAppliedDirectives<Directive extends CustomDirective>(element: Element, Directive: Constructor<Directive>): Directive[] | undefined {
  const retVal = new Array<Directive>;
  const isDirective = (directive: CustomDirective): directive is Directive => directive instanceof Directive;
  const add = (directive: CustomDirective) => {
    if (isDirective(directive)) {
      retVal.push(directive);
    }
  };

  const hostDirectives = element instanceof CustomElement ? element.hostDirectives : undefined;
  if (hostDirectives?.size) {
    for (const directive of hostDirectives.values()) {
      add(directive);
    }
  }

  const directives = applied.get(element);
  if (directives?.length) {
    for (let i = 0; i < directives.length; i++) {
      add(directives[i]);
    }
  }

  return retVal.length === 0 ? undefined : retVal;
}
