import type { RenderDefinition } from '../../types/render-definition.type';
import type { RenderFunction } from '../../types/render-function.type';

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
 * @param styleSheets - The stylesheets `klass` adopts, in their order: the styles of the project, then the ones of its
 *   `styleUrl`, `undefined` for a file without rules, which are left out.
 */
export function _defineRender(klass: object, render: RenderFunction, styleSheets?: ReadonlyArray<CSSStyleSheet | undefined>): void {
  const adopted = styleSheets?.filter(isStyleSheet);
  definitions.set(klass, adopted?.length ? { render, styleSheets: adopted } : { render });
}

/**
 * Tells whether a stylesheet of a component is one, not the `undefined` of a file without rules.
 *
 * @param styleSheet - The stylesheet.
 * @returns `true` for a stylesheet.
 */
function isStyleSheet(styleSheet: CSSStyleSheet | undefined): styleSheet is CSSStyleSheet {
  return styleSheet !== undefined;
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
