import type { Signal } from '@xaendar/core/signals';

/**
 * The signal whose value a form-associated component gives its form (see `FormFieldDirective.setValue`): read to
 * follow it, written by the reset of the form and by the restoration of the browser. A `signal` or a model.
 */
export type FormValueSource<Value> = (() => Value) & Pick<Signal<Value>, 'set'>;
