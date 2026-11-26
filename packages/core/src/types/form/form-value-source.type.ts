import type { Signal } from '../../signals/types/signal.type';

/**
 * The signal a form-associated component gives its form the value of (see `CustomElement.setFormValue`): read to follow it,
 * written by the reset of the form and by the restoration of the browser. A `signal` or a model.
 */
export type FormValueSource<Value> = (() => Value) & Pick<Signal<Value>, 'set'>;
