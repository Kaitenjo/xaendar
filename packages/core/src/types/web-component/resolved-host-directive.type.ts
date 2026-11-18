import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';

/**
 * A host directive of a component class, resolved once for every instance of the class (see `_resolveHostDirectives`).
 */
export type ResolvedHostDirective = {
  /**
   * The class of the directive.
   */
  readonly directive: Constructor<CustomDirective>,
  /**
   * The events of the directive the component exposes, from the name the directive dispatches to the name it is
   * dispatched with on the component, shared by every instance: empty when the component exposes none.
   */
  readonly events: ReadonlyMap<string, string>
};
