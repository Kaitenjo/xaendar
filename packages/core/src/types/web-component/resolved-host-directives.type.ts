import type { Dictionary } from '@xaendar/types';
import type { ExposedInput } from './exposed-input.type';
import type { ResolvedHostDirective } from './resolved-host-directive.type';

/**
 * The host directives of a component class, the ones of its ancestors included, resolved once for every instance of the
 * class (see `_resolveHostDirectives`).
 */
export type ResolvedHostDirectives = {
  /**
   * The host directives, in the order they are applied: the ones of the farthest ancestor first, then down to the class,
   * each class in the order it declares them.
   */
  readonly directives: readonly ResolvedHostDirective[],
  /**
   * The exposed inputs, by the name they are exposed with on the component: `null` when none is exposed.
   */
  readonly inputs: Readonly<Dictionary<string, ExposedInput>> | null
};
