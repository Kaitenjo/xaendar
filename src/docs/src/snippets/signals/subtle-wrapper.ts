import { signal } from '@xaendar/core/signals';

/**
 * A signal: a function wrapping a State, not a State itself.
 */
const count = signal(0);
count instanceof Signal.State;            // false
Signal.subtle.introspectSinks(count);     // ✗ throws

/**
 * An object of the TC39 proposal.
 */
const raw = new Signal.State(0);
Signal.subtle.introspectSinks(raw);       // ✓ works with the TC39 objects
