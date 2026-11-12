import type { Binding } from './binding.type';
import type { Unlistener } from './unlistener.type';

/**
 * What a scope runs or disposes when it is cleared (see `CLEANUP`): a cleanup function, an object disposed with its
 * `dispose()`, as an effect, or a binding reading variables of the template, which the scope also runs again when one of
 * them changes (see `refresh`), and whose effect, if any, it disposes.
 */
export type Cleanup = Unlistener | Binding;
