import type { ServerRenderFunction } from '../../types/server-render-function.type';
import type { ServerRenderDefinition } from '../../types/server-render-definition.type';

/**
 * The definition registered for each component class, kept out of the class, as the one of the client.
 */
const definitions = new WeakMap<object, ServerRenderDefinition>();

/**
 * Registers what the server renders a component class with. Invoked by the static block the build adds to every
 * component in the modules evaluated on the server.
 *
 * @param klass - The component class.
 * @param render - The function rendering its template on the server.
 * @param css - The CSS of its stylesheet, if any.
 */
export function _defineServerRender(klass: object, render: ServerRenderFunction, css?: string): void {
  definitions.set(klass, { render, css });
}

/**
 * Retrieves what the server renders exactly `klass` with: as on the client, a subclass never inherits the template of
 * its ancestors.
 *
 * @param klass - The component class.
 * @returns The definition, `undefined` when none is registered.
 */
export function _getServerRender(klass: object): ServerRenderDefinition | undefined {
  return definitions.get(klass);
}
