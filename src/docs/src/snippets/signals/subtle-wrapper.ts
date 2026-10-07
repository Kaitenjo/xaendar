import { signal } from '@xaendar/core/signals';

const count = signal(0);
count instanceof Signal.State;            // false: signal() returns a function wrapping a State
Signal.subtle.introspectSinks(count);     // ✗ throws

const raw = new Signal.State(0);
Signal.subtle.introspectSinks(raw);       // ✓ works with the TC39 objects
