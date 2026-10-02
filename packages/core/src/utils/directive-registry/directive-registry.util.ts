import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { StructuralDirective } from '../../models/structural-directive/structural-directive';

/**
 * Module-private registry mapping each directive selector to its class.
 * Directives are instantiated by the compiler-generated render code, which
 * only knows the selector used in the template (`@@selector`).
 */
const directives = new Map<string, Constructor<CustomDirective | StructuralDirective>>();

/**
 * Registers a directive class under its selector.
 * Invoked by the `@Directive` decorator.
 *
 * @param selector - The selector identifying the directive in templates.
 * @param klass - The directive class.
 * @throws When the selector is already used by another directive.
 */
export function _defineDirective(selector: string, klass: Constructor<CustomDirective | StructuralDirective>): void {
  const registered = directives.get(selector);
  if (registered) {
    throw new Error(`Selector "${selector}" is already used by directive ${registered.name}`);
  }

  directives.set(selector, klass);
}

/**
 * Retrieves the directive class registered for a selector.
 *
 * @param selector - The selector identifying the directive in templates.
 * @returns The registered directive class, or `undefined` if none is registered.
 */
export function _getDirective(selector: string): Constructor<CustomDirective | StructuralDirective> | undefined {
  return directives.get(selector);
}