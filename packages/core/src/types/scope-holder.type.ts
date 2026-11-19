import type { _Context } from './context.type';

/**
 * A cleanup holding a scope the runtime creates inside another one outside of its containers (see `_ScopeLayout`): the
 * branch of a conditional binding, whose bindings the scope selects at runtime, the scope of a component
 * `createComponent` creates. The scope holding it clears it, refreshes it and gives it its strategy as it does with the
 * scopes of its containers.
 *
 * N.B. Deliberate, to save memory: the run of a conditional binding is the holder itself, registered among the cleanups
 * of its scope, instead of a container the compiler would size for the branches nested in the branches, which the
 * conditional bindings `createComponent` builds at runtime have no layout for. Do not give it a container.
 */
export type ScopeHolder = {
  /**
   * The scope held.
   */
  readonly scope: _Context;
};
