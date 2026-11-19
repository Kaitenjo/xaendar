import type { Binding } from './binding.type';
import type { ScopeHolder } from './scope-holder.type';
import type { Unlistener } from './unlistener.type';

/**
 * What a scope runs or disposes when it is cleared (see `addCleanup`): a function or an object to dispose, a binding
 * reading variables of the template, which the scope runs again when it is refreshed with one of them, or a scope held
 * outside of its containers, which it clears and refreshes with itself.
 */
export type Cleanup = Unlistener | Binding | ScopeHolder;
