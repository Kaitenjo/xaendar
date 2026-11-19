import type { AbstractConstructor, Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { StructuralDirective } from '../../models/structural-directive/structural-directive';
import { _getDirective } from '../directive-registry/directive-registry.util';

/**
 * Retrieves the directive class registered for a selector, or takes the class given in its place, ensuring it is of the expected kind.
 *
 * @param selector - The selector identifying the directive in templates, or the class of the directive, applied without a selector by `createComponent`.
 * @param kind - The base class the directive is expected to extend.
 * @returns The directive class registered for the selector, or the given class.
 * @throws When no directive is registered for the selector, or when the directive does not extend `kind`.
 */
export function _resolveDirective<T extends CustomDirective | StructuralDirective>(selector: string | Constructor<CustomDirective | StructuralDirective>, kind: AbstractConstructor<T>): Constructor<T> {
  const isSelector = typeof selector === 'string';
  const Directive = isSelector ? _getDirective(selector) : selector;
  if (!Directive) {
    throw new Error(`No directive registered for selector "${selector}"`);
  }

  const isDirectiveKind = (Directive: Constructor<CustomDirective | StructuralDirective>): Directive is Constructor<T> => Directive.prototype instanceof kind;
  if (!isDirectiveKind(Directive)) {
    throw new Error(isSelector
      ? `Directive ${Directive.name} registered for selector "${selector}" is not a ${kind.name}`
      : `Directive ${Directive.name} is not a ${kind.name}`);
  }

  return Directive;
}
