import type { RenderFunction } from '../../types/render-function.type';
import type { RenderDefinition } from '../../types/render-definition.type';

/**
 * Module-private registry mapping each component class to its rendering information.
 * Keeping it out of the class (and out of the module exports) prevents the render
 * function from being overridden or removed at runtime.
 */
const definitions = new WeakMap<object, RenderDefinition>();

/**
 * Registers the rendering information of a component class.
 * Invoked by the compiler-generated static block of every component.
 *
 * @param klass - The component class.
 * @param render - The render function of the template declared by `klass`.
 * @param styleSheet - The stylesheet declared by `klass`, if any.
 */
export function _defineRender(klass: object, render: RenderFunction, styleSheet?: CSSStyleSheet): void {
  definitions.set(klass, { render, styleSheet });
}

/**
 * Retrieves the rendering information registered for exactly `klass`.
 *
 * The prototype chain is intentionally not walked: a subclass may declare a
 * different template than its ancestors, so it never inherits their render function.
 *
 * @param klass - The component class.
 * @returns The registered rendering information, or `undefined` if none is registered.
 */
export function _getRender(klass: object): RenderDefinition | undefined {
  return definitions.get(klass);
}
